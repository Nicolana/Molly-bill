from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    username: Optional[str] = None
    avatar: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLedgerInfo(BaseModel):
    """用户账本信息"""
    id: int
    user_id: int
    ledger_id: int
    role: str
    joined_at: datetime
    status: str
    ledger: dict  # 账本详细信息
    
    model_config = ConfigDict(from_attributes=True)

class UserResponse(UserBase):
    id: int
    created_at: datetime
    current_ledger_id: Optional[int] = None
    user_ledgers: Optional[List[UserLedgerInfo]] = None
    
    model_config = ConfigDict(from_attributes=True) 