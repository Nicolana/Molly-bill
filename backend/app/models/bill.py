from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship, mapped_column
import datetime
from app.db.database import Base
from app.models.enums import BillType

class Bill(Base):
    __tablename__ = "bills"
    id = mapped_column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    type = Column(Enum(BillType), default=BillType.EXPENSE, nullable=False)  # 收入或支出
    category = Column(String, index=True)
    description = Column(String)
    date = Column(DateTime, default=datetime.datetime.utcnow)
    owner_id = Column(Integer, ForeignKey("users.id"))
    ledger_id = Column(Integer, ForeignKey("ledgers.id"), nullable=False)  # 所属账本
    
    # 关系
    owner = relationship("User", back_populates="bills")
    ledger = relationship("Ledger", back_populates="bills") 