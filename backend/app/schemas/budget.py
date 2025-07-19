from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import datetime
from app.models.enums import BudgetPeriodType, BudgetStatus, AlertType

# 预算基础模型
class BudgetBase(BaseModel):
    name: str = Field(..., description="预算名称")
    amount: float = Field(..., gt=0, description="预算金额")
    period_type: BudgetPeriodType = Field(..., description="周期类型")
    start_date: datetime = Field(..., description="开始日期")
    end_date: datetime = Field(..., description="结束日期")
    alert_threshold: float = Field(0.8, ge=0, le=1, description="预警阈值")

# 创建预算请求模型
class BudgetCreate(BudgetBase):
    spent: Optional[float] = Field(0.0, description="已花费金额")
    ledger_id: int = Field(..., description="账本ID")

# 更新预算请求模型
class BudgetUpdate(BaseModel):
    name: Optional[str] = Field(None, description="预算名称")
    amount: Optional[float] = Field(None, gt=0, description="预算金额")
    period_type: Optional[BudgetPeriodType] = Field(None, description="周期类型")
    start_date: Optional[datetime] = Field(None, description="开始日期")
    end_date: Optional[datetime] = Field(None, description="结束日期")
    status: Optional[BudgetStatus] = Field(None, description="状态")
    alert_threshold: Optional[float] = Field(None, ge=0, le=1, description="预警阈值")

# 预算响应模型
class BudgetResponse(BudgetBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    spent: float
    status: BudgetStatus
    ledger_id: int
    created_by: int
    created_at: datetime
    updated_at: datetime
    
    # 计算属性
    progress: float = Field(..., description="进度百分比")
    remaining: float = Field(..., description="剩余预算")
    is_exceeded: bool = Field(..., description="是否超支")
    is_warning: bool = Field(..., description="是否达到预警阈值")

# 预算统计模型
class BudgetStats(BaseModel):
    total_budgets: int = Field(..., description="总预算数")
    active_budgets: int = Field(..., description="活跃预算数")
    total_amount: float = Field(..., description="总预算金额")
    total_spent: float = Field(..., description="总支出金额")
    total_remaining: float = Field(..., description="总剩余金额")
    exceeded_count: int = Field(..., description="超支预算数")
    warning_count: int = Field(..., description="预警预算数")

# 预算进度模型
class BudgetProgress(BaseModel):
    budget_id: int
    name: str
    amount: float
    spent: float
    progress: float
    remaining: float
    is_exceeded: bool
    is_warning: bool
    days_remaining: int = Field(..., description="剩余天数")

# 预算提醒基础模型
class BudgetAlertBase(BaseModel):
    alert_type: AlertType = Field(..., description="提醒类型")
    threshold: float = Field(..., ge=0, le=1, description="触发阈值")
    message: Optional[str] = Field(None, description="提醒消息")

# 创建预算提醒模型
class BudgetAlertCreate(BudgetAlertBase):
    budget_id: int = Field(..., description="预算ID")

# 预算提醒响应模型
class BudgetAlertResponse(BudgetAlertBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    budget_id: int
    is_sent: bool
    sent_at: Optional[datetime]
    created_at: datetime

# 预算列表响应模型
class BudgetListResponse(BaseModel):
    budgets: List[BudgetResponse]
    total: int
    stats: BudgetStats

# 预算总览模型
class BudgetSummary(BaseModel):
    monthly_budgets: List[BudgetResponse]
    yearly_budgets: List[BudgetResponse]
    custom_budgets: List[BudgetResponse]
    alerts: List[BudgetAlertResponse]
    stats: BudgetStats 