from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, Enum
from sqlalchemy.orm import relationship
from app.db.database import Base
import datetime
from enum import Enum as PyEnum

class BillType(str, PyEnum):
    EXPENSE = "expense"  # 支出
    INCOME = "income"    # 收入

class UserRole(str, PyEnum):
    ADMIN = "admin"      # 管理员
    MEMBER = "member"    # 普通成员

class InvitationStatus(str, PyEnum):
    PENDING = "pending"      # 待接受
    ACCEPTED = "accepted"    # 已接受
    REJECTED = "rejected"    # 已拒绝
    EXPIRED = "expired"      # 已过期

class LedgerStatus(str, PyEnum):
    ACTIVE = "active"        # 活跃
    DELETED = "deleted"      # 已删除（回收站）

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, nullable=True)  # 用户名
    hashed_password = Column(String, nullable=False)
    avatar = Column(String, nullable=True)  # 头像URL
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # 关系
    bills = relationship("Bill", back_populates="owner")
    chat_messages = relationship("ChatMessage", back_populates="user")
    user_ledgers = relationship("UserLedger", back_populates="user")
    sent_invitations = relationship("Invitation", back_populates="inviter", foreign_keys="Invitation.inviter_id")

class Ledger(Base):
    __tablename__ = "ledgers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # 账本名称
    description = Column(Text, nullable=True)  # 账本描述
    currency = Column(String, default="CNY")  # 货币单位
    timezone = Column(String, default="Asia/Shanghai")  # 时区
    status = Column(Enum(LedgerStatus), default=LedgerStatus.ACTIVE)  # 账本状态
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)  # 删除时间（用于回收站）
    
    # 关系
    user_ledgers = relationship("UserLedger", back_populates="ledger")
    bills = relationship("Bill", back_populates="ledger")
    chat_messages = relationship("ChatMessage", back_populates="ledger")
    invitations = relationship("Invitation", back_populates="ledger")

class UserLedger(Base):
    __tablename__ = "user_ledgers"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    ledger_id = Column(Integer, ForeignKey("ledgers.id"), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.MEMBER)  # 用户在账本中的角色
    joined_at = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String, default="active")  # 用户状态：active, inactive
    
    # 关系
    user = relationship("User", back_populates="user_ledgers")
    ledger = relationship("Ledger", back_populates="user_ledgers")

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

class Bill(Base):
    __tablename__ = "bills"
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    type = Column(Enum(BillType), default=BillType.EXPENSE, nullable=False)  # 收入或支出
    category = Column(String, index=True)
    description = Column(String)
    date = Column(DateTime, default=datetime.datetime.utcnow)
    owner_id = Column(Integer, ForeignKey("users.id"))
    ledger_id = Column(Integer, ForeignKey("ledgers.id"), nullable=False)  # 新增：所属账本
    
    # 关系
    owner = relationship("User", back_populates="bills")
    ledger = relationship("Ledger", back_populates="bills")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    message_type = Column(String, nullable=False)  # 'user' or 'assistant'
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    ledger_id = Column(Integer, ForeignKey("ledgers.id"), nullable=False)  # 新增：所属账本
    
    # 关联的账单信息（如果消息包含账单）
    bill_id = Column(Integer, ForeignKey("bills.id"), nullable=True)
    bill = relationship("Bill")
    
    # 消息元数据
    input_type = Column(String, nullable=True)  # 'text', 'voice', 'image'
    ai_confidence = Column(Float, nullable=True)  # AI识别的置信度
    is_processed = Column(Boolean, default=False)  # 是否已处理为账单 
    
    # 关系
    user = relationship("User", back_populates="chat_messages")
    ledger = relationship("Ledger", back_populates="chat_messages") 