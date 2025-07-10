from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.base import UserRole, LedgerStatus

class LedgerBase(BaseModel):
    name: str
    description: Optional[str] = None
    currency: str = "CNY"
    timezone: str = "Asia/Shanghai"

class LedgerCreate(LedgerBase):
    pass

class Ledger(LedgerBase):
    id: int
    status: LedgerStatus
    created_at: datetime
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserLedgerBase(BaseModel):
    role: UserRole = UserRole.MEMBER

class UserLedgerCreate(UserLedgerBase):
    user_id: int
    ledger_id: int

class UserLedger(UserLedgerBase):
    id: int
    user_id: int
    ledger_id: int
    joined_at: datetime
    status: str

    class Config:
        from_attributes = True 