from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security.auth import get_current_user
from app.db.database import get_db
from app.crud.user import get_user
from app.schemas.base import BaseResponse
from app.schemas.user import User
from app.utils.response import success_response

router = APIRouter()

@router.get("/profile", response_model=BaseResponse)
async def get_user_profile(current_user = Depends(get_current_user)):
    """获取用户个人信息"""
    return success_response(
        data=User.model_validate(current_user),
        message="获取用户信息成功"
    ) 