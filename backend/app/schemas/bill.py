from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.base import BillType

class BillBase(BaseModel):
    amount: float
    type: BillType = BillType.EXPENSE  # 默认为支出
    category: Optional[str] = None
    description: Optional[str] = None
    date: Optional[datetime] = None

class BillCreate(BillBase):
    ledger_id: int

class Bill(BillBase):
    id: int
    owner_id: int
    ledger_id: int
    date: datetime

    class Config:
        from_attributes = True 