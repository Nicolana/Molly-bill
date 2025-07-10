from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserCreate(BaseModel):
    email: EmailStr
    username: Optional[str] = None
    avatar: Optional[str] = None
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    username: Optional[str] = None
    avatar: Optional[str] = None
    created_at: datetime 