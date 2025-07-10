from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models import User
from app.schemas.user import UserResponse
from app.core.security.auth import get_current_user
from app.crud.user import get_user
from app.crud.ledger import check_user_ledger_admin

router = APIRouter()

@router.get("/", response_model=List[UserResponse])
def get_users(
    ledger_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取账本用户列表（仅管理员）"""
    # 检查当前用户是否是账本管理员
    if not check_user_ledger_admin(db, current_user.id, ledger_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足"
        )
    
    # TODO: 实现获取账本用户列表的逻辑
    return []

@router.get("/{user_id}", response_model=UserResponse)
def get_user_info(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取用户信息"""
    user = get_user(db, user_id=user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    return user 