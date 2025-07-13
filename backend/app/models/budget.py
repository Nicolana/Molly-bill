from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
import datetime
from app.db.database import Base
from app.models.enums import BudgetPeriodType, BudgetStatus

class Budget(Base):
    __tablename__ = "budgets"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # 预算名称
    amount = Column(Float, nullable=False)  # 预算金额
    spent = Column(Float, default=0.0)  # 已花费金额
    category = Column(String, nullable=True)  # 预算分类
    period_type = Column(Enum(BudgetPeriodType), nullable=False)  # 周期类型
    start_date = Column(DateTime, nullable=False)  # 开始日期
    end_date = Column(DateTime, nullable=False)  # 结束日期
    status = Column(Enum(BudgetStatus), default=BudgetStatus.ACTIVE)  # 状态
    alert_threshold = Column(Float, default=0.8)  # 预警阈值（80%）
    ledger_id = Column(Integer, ForeignKey("ledgers.id"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # 关系
    ledger = relationship("Ledger", back_populates="budgets")
    creator = relationship("User", back_populates="created_budgets")
    alerts = relationship("BudgetAlert", back_populates="budget", cascade="all, delete-orphan")
    
    @property
    def progress(self) -> float:
        """计算预算进度百分比"""
        if self.amount <= 0:
            return 0.0
        return min(self.spent / self.amount, 1.0)
    
    @property
    def remaining(self) -> float:
        """计算剩余预算"""
        return max(self.amount - self.spent, 0.0)
    
    @property
    def is_exceeded(self) -> bool:
        """判断是否超支"""
        return self.spent > self.amount
    
    @property
    def is_warning(self) -> bool:
        """判断是否达到预警阈值"""
        return self.progress >= self.alert_threshold 