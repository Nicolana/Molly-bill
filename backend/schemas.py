from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class BillBase(BaseModel):
    amount: float
    category: Optional[str] = None
    description: Optional[str] = None
    date: Optional[datetime] = None

class BillCreate(BillBase):
    pass

class Bill(BillBase):
    id: int
    owner_id: int
    date: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None 