from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from app.models import Invitation, UserLedger, InvitationStatus, UserRole
from app.schemas.invitation import InvitationCreate
from app.core.config.settings import settings

def create_invitation(db: Session, invitation: InvitationCreate, inviter_id: int):
    """创建邀请"""
    # 设置过期时间为配置的时间
    expires_at = datetime.utcnow() + timedelta(hours=settings.invitation_expire_hours)
    
    db_invitation = Invitation(
        ledger_id=invitation.ledger_id,
        inviter_id=inviter_id,
        invitee_email=invitation.invitee_email,
        role=invitation.role,
        expires_at=expires_at
    )
    db.add(db_invitation)
    db.commit()
    db.refresh(db_invitation)
    return db_invitation

def get_invitation(db: Session, invitation_id: int):
    """获取邀请信息"""
    return db.query(Invitation).filter(Invitation.id == invitation_id).first()

def get_ledger_invitations(db: Session, ledger_id: int):
    """获取账本的所有邀请"""
    return db.query(Invitation).filter(Invitation.ledger_id == ledger_id).all()

def get_user_pending_invitations(db: Session, user_email: str):
    """获取用户待处理的邀请"""
    return db.query(Invitation).filter(
        Invitation.invitee_email == user_email,
        Invitation.status == InvitationStatus.PENDING,
        Invitation.expires_at > datetime.utcnow()
    ).all()

def accept_invitation(db: Session, invitation_id: int, user_id: int):
    """接受邀请"""
    invitation = db.query(Invitation).filter(Invitation.id == invitation_id).first()
    if not invitation:
        return False
    
    # 检查邀请是否过期
    if invitation.expires_at < datetime.utcnow():
        invitation.status = InvitationStatus.EXPIRED
        db.commit()
        return False
    
    # 检查用户是否已经在账本中
    existing_membership = db.query(UserLedger).filter(
        UserLedger.user_id == user_id,
        UserLedger.ledger_id == invitation.ledger_id
    ).first()
    
    if existing_membership:
        # 如果已存在，更新状态为活跃
        existing_membership.status = "active"
        existing_membership.role = invitation.role
    else:
        # 创建新的用户账本关联
        user_ledger = UserLedger(
            user_id=user_id,
            ledger_id=invitation.ledger_id,
            role=invitation.role
        )
        db.add(user_ledger)
    
    # 更新邀请状态
    invitation.status = InvitationStatus.ACCEPTED
    invitation.accepted_at = datetime.utcnow()
    db.commit()
    return True

def reject_invitation(db: Session, invitation_id: int):
    """拒绝邀请"""
    invitation = db.query(Invitation).filter(Invitation.id == invitation_id).first()
    if invitation:
        invitation.status = InvitationStatus.REJECTED
        db.commit()
        return True
    return False

def cancel_invitation(db: Session, invitation_id: int, inviter_id: int):
    """取消邀请（只有邀请人可以取消）"""
    invitation = db.query(Invitation).filter(
        Invitation.id == invitation_id,
        Invitation.inviter_id == inviter_id,
        Invitation.status == InvitationStatus.PENDING
    ).first()
    if invitation:
        db.delete(invitation)
        db.commit()
        return True
    return False

def expire_invitations(db: Session):
    """过期过期的邀请"""
    expired_invitations = db.query(Invitation).filter(
        Invitation.status == InvitationStatus.PENDING,
        Invitation.expires_at < datetime.utcnow()
    ).all()
    
    for invitation in expired_invitations:
        invitation.status = InvitationStatus.EXPIRED
    
    db.commit()
    return len(expired_invitations) 