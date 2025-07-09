from typing import Any, Optional, List
from schemas import BaseResponse, PaginatedResponse

def success_response(data: Any = None, message: str = "操作成功") -> BaseResponse:
    """成功响应"""
    return BaseResponse(
        success=True,
        message=message,
        data=data
    )

def error_response(message: str, error_code: Optional[str] = None, data: Any = None) -> BaseResponse:
    """错误响应"""
    return BaseResponse(
        success=False,
        message=message,
        error_code=error_code,
        data=data
    )

def paginated_response(
    data: List[Any], 
    total: int, 
    skip: int, 
    limit: int, 
    message: str = "获取数据成功"
) -> PaginatedResponse:
    """分页响应"""
    return PaginatedResponse(
        success=True,
        message=message,
        data=data,
        total=total,
        skip=skip,
        limit=limit
    ) 