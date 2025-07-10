from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from app.models import BillType

class BillBase(BaseModel):
    amount: float
    type: BillType = BillType.EXPENSE  # 默认为支出
    category: Optional[str] = None
    description: Optional[str] = None
    date: Optional[datetime] = None

class BillCreate(BillBase):
    ledger_id: int

class BillResponse(BillBase):
    id: int
    owner_id: int
    ledger_id: int
    date: datetime
    
    model_config = ConfigDict(from_attributes=True)

class BillUpdate(BaseModel):
    amount: Optional[float] = None
    type: Optional[BillType] = None
    category: Optional[str] = None
    description: Optional[str] = None
    date: Optional[datetime] = None 