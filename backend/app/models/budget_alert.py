from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, Enum, Boolean, String
from sqlalchemy.orm import relationship
import datetime
from app.db.database import Base
from app.models.enums import AlertType

class BudgetAlert(Base):
    __tablename__ = "budget_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    budget_id = Column(Integer, ForeignKey("budgets.id"), nullable=False)
    alert_type = Column(Enum(AlertType), nullable=False)  # 提醒类型
    threshold = Column(Float, nullable=False)  # 触发阈值
    message = Column(String, nullable=True)  # 提醒消息
    is_sent = Column(Boolean, default=False)  # 是否已发送
    sent_at = Column(DateTime, nullable=True)  # 发送时间
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # 关系
    budget = relationship("Budget", back_populates="alerts") 