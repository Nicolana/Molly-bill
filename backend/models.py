from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, Enum
from sqlalchemy.orm import relationship
from database import Base
import datetime
import enum

class BillType(enum.Enum):
    EXPENSE = "expense"  # 支出
    INCOME = "income"    # 收入

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    bills = relationship("Bill", back_populates="owner")
    chat_messages = relationship("ChatMessage", back_populates="user")

class Bill(Base):
    __tablename__ = "bills"
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    type = Column(Enum(BillType), default=BillType.EXPENSE, nullable=False)  # 收入或支出
    category = Column(String, index=True)
    description = Column(String)
    date = Column(DateTime, default=datetime.datetime.utcnow)
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="bills")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    message_type = Column(String, nullable=False)  # 'user' or 'assistant'
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="chat_messages")
    
    # 关联的账单信息（如果消息包含账单）
    bill_id = Column(Integer, ForeignKey("bills.id"), nullable=True)
    bill = relationship("Bill")
    
    # 消息元数据
    input_type = Column(String, nullable=True)  # 'text', 'voice', 'image'
    ai_confidence = Column(Float, nullable=True)  # AI识别的置信度
    is_processed = Column(Boolean, default=False)  # 是否已处理为账单 