from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from app.models import UserRole, LedgerStatus

class LedgerBase(BaseModel):
    name: str
    description: Optional[str] = None
    currency: str = "CNY"
    timezone: str = "Asia/Shanghai"

class LedgerCreate(LedgerBase):
    pass

class LedgerResponse(LedgerBase):
    id: int
    status: LedgerStatus
    created_at: datetime
    deleted_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class LedgerUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    currency: Optional[str] = None
    timezone: Optional[str] = None

class UserLedgerBase(BaseModel):
    role: UserRole = UserRole.MEMBER

class UserLedgerCreate(UserLedgerBase):
    user_id: int
    ledger_id: int

class UserLedgerResponse(UserLedgerBase):
    id: int
    user_id: int
    ledger_id: int
    joined_at: datetime
    status: str
    
    model_config = ConfigDict(from_attributes=True) 