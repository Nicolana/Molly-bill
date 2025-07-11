from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import re

from app.db.database import get_db
from app.models import User, Invitation, InvitationStatus, UserRole
from app.schemas.invitation import InvitationCreate, InvitationResponse
from app.core.security.auth import get_current_user
from app.crud.invitation import (
    create_invitation, get_invitation, get_ledger_invitations,
    get_user_pending_invitations, accept_invitation, reject_invitation,
    cancel_invitation
)
from app.crud.ledger import check_user_ledger_admin, check_user_ledger_access
from app.crud.user import get_user_by_email

router = APIRouter()

@router.post("/", response_model=InvitationResponse)
def create_new_invitation(
    invitation: InvitationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """创建邀请（仅管理员）"""
    # 验证邮箱格式
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, invitation.invitee_email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="邮箱格式不正确"
        )
    
    # 检查管理员权限
    if not check_user_ledger_admin(db, current_user.id, invitation.ledger_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足"
        )
    
    # 检查是否邀请自己
    if invitation.invitee_email == current_user.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不能邀请自己"
        )
    
    # 检查被邀请用户是否存在
    invitee = get_user_by_email(db, invitation.invitee_email)
    if not invitee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="被邀请用户不存在，用户需要先注册账号"
        )
    
    # 检查用户是否已在账本中
    if check_user_ledger_access(db, invitee.id, invitation.ledger_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户已在账本中"
        )
    
    # 检查是否已有待处理的邀请
    existing_invitation = db.query(Invitation).filter(
        Invitation.ledger_id == invitation.ledger_id,
        Invitation.invitee_email == invitation.invitee_email,
        Invitation.status == InvitationStatus.PENDING
    ).first()
    
    if existing_invitation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该用户已有待处理的邀请"
        )
    
    return create_invitation(db=db, invitation=invitation, inviter_id=current_user.id)

@router.get("/ledger/{ledger_id}", response_model=List[InvitationResponse])
def get_ledger_invitations_list(
    ledger_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取账本邀请列表（仅管理员）"""
    # 检查管理员权限
    if not check_user_ledger_admin(db, current_user.id, ledger_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足"
        )
    
    invitations = get_ledger_invitations(db, ledger_id)
    
    # 为每个邀请添加邀请人信息
    result = []
    for invitation in invitations:
        invitation_dict = {
            "id": invitation.id,
            "ledger_id": invitation.ledger_id,
            "inviter_id": invitation.inviter_id,
            "invitee_email": invitation.invitee_email,
            "role": invitation.role,
            "status": invitation.status,
            "expires_at": invitation.expires_at,
            "created_at": invitation.created_at,
            "accepted_at": invitation.accepted_at,
            "inviter": {
                "id": invitation.inviter.id,
                "email": invitation.inviter.email,
                "username": invitation.inviter.username
            } if invitation.inviter else None
        }
        result.append(invitation_dict)
    
    return result

@router.get("/pending", response_model=List[InvitationResponse])
def get_my_pending_invitations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取我的待处理邀请"""
    invitations = get_user_pending_invitations(db, current_user.email)
    
    # 为每个邀请添加邀请人和账本信息
    result = []
    for invitation in invitations:
        invitation_dict = {
            "id": invitation.id,
            "ledger_id": invitation.ledger_id,
            "inviter_id": invitation.inviter_id,
            "invitee_email": invitation.invitee_email,
            "role": invitation.role,
            "status": invitation.status,
            "expires_at": invitation.expires_at,
            "created_at": invitation.created_at,
            "accepted_at": invitation.accepted_at,
            "inviter": {
                "id": invitation.inviter.id,
                "email": invitation.inviter.email,
                "username": invitation.inviter.username
            } if invitation.inviter else None,
            "ledger": {
                "id": invitation.ledger.id,
                "name": invitation.ledger.name,
                "description": invitation.ledger.description
            } if invitation.ledger else None
        }
        result.append(invitation_dict)
    
    return result

@router.post("/{invitation_id}/accept")
def accept_invitation_endpoint(
    invitation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """接受邀请"""
    if accept_invitation(db, invitation_id, current_user.id):
        return {"message": "邀请已接受"}
    
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="无法接受邀请"
    )

@router.post("/{invitation_id}/reject")
def reject_invitation_endpoint(
    invitation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """拒绝邀请"""
    if reject_invitation(db, invitation_id):
        return {"message": "邀请已拒绝"}
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="邀请不存在"
    )

@router.delete("/{invitation_id}")
def cancel_invitation_endpoint(
    invitation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """取消邀请（仅邀请人）"""
    if cancel_invitation(db, invitation_id, current_user.id):
        return {"message": "邀请已取消"}
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="邀请不存在或无法取消"
    ) 