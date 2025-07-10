from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security.auth import get_current_user
from app.db.database import get_db
from app.schemas.base import BaseResponse
from app.utils.response import success_response

router = APIRouter()

@router.get("/", response_model=BaseResponse)
async def get_bills_list(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取账单列表（临时实现）"""
    return success_response(
        data=[],
        message="获取账单列表成功"
    ) 