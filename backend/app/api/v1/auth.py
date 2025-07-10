from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from datetime import timedelta

from app.core.security.auth import create_access_token, get_current_user
from app.core.security.password import verify_password
from app.core.config.settings import settings
from app.db.database import get_db
from app.crud.user import get_user_by_email, create_user
from app.schemas.base import BaseResponse, LoginRequest
from app.schemas.user import UserCreate, User
from app.utils.response import success_response, error_response

router = APIRouter()

@router.post("/register", response_model=BaseResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    """用户注册"""
    db_user = get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="邮箱已被注册")
    
    created_user = create_user(db=db, user=user)
    return success_response(
        data=User.model_validate(created_user),
        message="注册成功"
    )

@router.post("/login", response_model=BaseResponse)
async def login_for_access_token(login_data: LoginRequest, db: Session = Depends(get_db)):
    """用户登录"""
    user = get_user_by_email(db, email=login_data.email)
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return success_response(
        data={
            "access_token": access_token, 
            "token_type": "bearer",
            "user": User.model_validate(user)
        }, 
        message="登录成功"
    )

@router.get("/me", response_model=BaseResponse)
async def read_users_me(current_user = Depends(get_current_user)):
    """获取当前用户信息"""
    return success_response(
        data=User.model_validate(current_user),
        message="获取用户信息成功"
    ) 