from sqlalchemy import Column, Integer, Text, String, DateTime, ForeignKey, Float, Boolean
from sqlalchemy.orm import relationship
import datetime
from app.db.database import Base

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    message_type = Column(String, nullable=False)  # 'user' or 'assistant'
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    ledger_id = Column(Integer, ForeignKey("ledgers.id"), nullable=False)  # 所属账本
    
    # 关联的账单信息（通过MessageBill中间表）
    message_bills = relationship("MessageBill", back_populates="message", cascade="all, delete-orphan")
    
    # 消息元数据
    input_type = Column(String, nullable=True)  # 'text', 'voice', 'image'
    ai_confidence = Column(Float, nullable=True)  # AI识别的置信度
    is_processed = Column(Boolean, default=False)  # 是否已处理为账单
    
    # 关系
    user = relationship("User", back_populates="chat_messages")
    ledger = relationship("Ledger", back_populates="chat_messages") 