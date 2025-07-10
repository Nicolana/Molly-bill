from sqlalchemy import Column, Integer, String, Text, DateTime, Enum
from sqlalchemy.orm import relationship
import datetime
from app.db.database import Base
from app.models.enums import LedgerStatus

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