from typing import Any, Optional
from pydantic import BaseModel

class BaseResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None
    error_code: Optional[str] = None

class PaginatedResponse(BaseModel):
    success: bool
    message: str
    data: list[Any]
    total: int
    skip: int
    limit: int

def success_response(data: Any = None, message: str = "操作成功"):
    return BaseResponse(
        success=True,
        message=message,
        data=data
    )

def error_response(message: str, error_code: str = None, data: Any = None):
    return BaseResponse(
        success=False,
        message=message,
        error_code=error_code,
        data=data
    )

def paginated_response(data: list[Any], total: int, skip: int, limit: int, message: str = "获取数据成功"):
    return PaginatedResponse(
        success=True,
        message=message,
        data=data,
        total=total,
        skip=skip,
        limit=limit
    ) 