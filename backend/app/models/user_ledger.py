from sqlalchemy import Column, Integer, DateTime, ForeignKey, String, Enum
from sqlalchemy.orm import relationship
import datetime
from app.db.database import Base
from app.models.enums import UserRole

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