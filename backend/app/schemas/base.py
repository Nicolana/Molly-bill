from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any, Union
from datetime import datetime
from enum import Enum
from app.models import BillType

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

# 认证相关模型
class LoginRequest(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# 账本统计模型
class LedgerStats(BaseModel):
    total_income: float
    total_expense: float
    net_amount: float
    bill_count: int
    category_stats: dict
    time_filter: str 