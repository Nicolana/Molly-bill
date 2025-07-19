from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship, mapped_column
import datetime
from app.db.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, nullable=True)  # 用户名
    hashed_password = Column(String, nullable=False)
    avatar = Column(String, nullable=True)  # 头像URL
    current_ledger_id = Column(Integer, ForeignKey("ledgers.id"), nullable=True)  # 当前选中的账本ID
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # 关系
    bills = relationship("Bill", back_populates="owner")
    chat_messages = relationship("ChatMessage", back_populates="user")
    user_ledgers = relationship("UserLedger", back_populates="user")
    sent_invitations = relationship("Invitation", back_populates="inviter", foreign_keys="Invitation.inviter_id")
    current_ledger = relationship("Ledger", foreign_keys=[current_ledger_id])
    created_budgets = relationship("Budget", back_populates="creator") 
