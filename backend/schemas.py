from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any, Union
from datetime import datetime
from enum import Enum
from models import BillType

# 统一响应格式
class BaseResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None
    error_code: Optional[str] = None

class PaginatedResponse(BaseModel):
    success: bool
    message: str
    data: List[Any]
    total: int
    skip: int
    limit: int

# 用户相关模型
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# 账单相关模型
class BillBase(BaseModel):
    amount: float
    type: BillType = BillType.EXPENSE  # 默认为支出
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

# 认证相关模型
class LoginRequest(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# 聊天消息相关模型
class ChatMessageBase(BaseModel):
    content: str
    message_type: str  # 'user' or 'assistant'
    input_type: Optional[str] = None  # 'text', 'voice', 'image'
    ai_confidence: Optional[float] = None

class ChatMessageCreate(ChatMessageBase):
    pass

class ChatMessage(ChatMessageBase):
    id: int
    timestamp: datetime
    user_id: int
    bill_id: Optional[int] = None
    is_processed: bool

    class Config:
        from_attributes = True

class ChatHistoryResponse(BaseModel):
    messages: List[ChatMessage]
    total: int

# AI聊天相关模型
class ChatRequest(BaseModel):
    message: str
    image: Optional[str] = None  # base64编码的图片
    audio: Optional[str] = None  # base64编码的音频

class ChatResponse(BaseModel):
    message: str
    bills: Optional[List[BillCreate]] = None
    confidence: Optional[float] = None 