from sqlalchemy import Column, Integer, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
import datetime
from app.db.database import Base

class MessageBill(Base):
    """消息和账单的关联表，支持多对多关系"""
    __tablename__ = "message_bills"
    
    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("chat_messages.id"), nullable=False)
    bill_id = Column(Integer, ForeignKey("bills.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # AI识别的置信度（针对这个特定的消息-账单关联）
    confidence = Column(Float, nullable=True)
    
    # 关系
    message = relationship("ChatMessage", back_populates="message_bills")
    bill = relationship("Bill", back_populates="message_bills")
