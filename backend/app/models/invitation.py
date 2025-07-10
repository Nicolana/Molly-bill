from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
import datetime
from app.db.database import Base
from app.models.enums import UserRole, InvitationStatus

class Invitation(Base):
    __tablename__ = "invitations"
    id = Column(Integer, primary_key=True, index=True)
    ledger_id = Column(Integer, ForeignKey("ledgers.id"), nullable=False)
    inviter_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # 邀请人
    invitee_email = Column(String, nullable=False)  # 被邀请人邮箱
    role = Column(Enum(UserRole), default=UserRole.MEMBER)  # 邀请的角色
    status = Column(Enum(InvitationStatus), default=InvitationStatus.PENDING)
    expires_at = Column(DateTime, nullable=False)  # 过期时间
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    accepted_at = Column(DateTime, nullable=True)  # 接受时间
    
    # 关系
    ledger = relationship("Ledger", back_populates="invitations")
    inviter = relationship("User", back_populates="sent_invitations", foreign_keys=[inviter_id]) 