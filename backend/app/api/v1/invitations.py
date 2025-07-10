from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

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
    # 检查管理员权限
    if not check_user_ledger_admin(db, current_user.id, invitation.ledger_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足"
        )
    
    # 检查被邀请用户是否存在
    invitee = get_user_by_email(db, invitation.invitee_email)
    if not invitee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="被邀请用户不存在"
        )
    
    # 检查用户是否已在账本中
    if check_user_ledger_access(db, invitee.id, invitation.ledger_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户已在账本中"
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
    
    return get_ledger_invitations(db, ledger_id)

@router.get("/pending", response_model=List[InvitationResponse])
def get_my_pending_invitations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取我的待处理邀请"""
    return get_user_pending_invitations(db, current_user.email)

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