from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.database import get_db
from app.models import User
from app.schemas.auth import UserCreate, UserResponse
from app.core.security.auth import create_access_token, get_current_user
from app.crud.user import get_user_by_email, create_user
from app.core.security.password import verify_password
from app.utils.response import success_response

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    """用户注册"""
    # 检查邮箱是否已存在
    db_user = get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="邮箱已被注册"
        )
    
    # 设置默认值
    if not user.username:
        user.username = user.email.split('@')[0]  # 使用邮箱前缀作为默认用户名
    
    if not user.avatar:
        # 使用 DiceBear API 生成默认头像
        user.avatar = f"https://api.dicebear.com/7.x/avataaars/svg?seed={user.email}"
    
    # 创建新用户
    created_user = create_user(db=db, user=user)
    return success_response(
        data=UserResponse.model_validate(created_user),
        message="注册成功"
    )

@router.post("/login")
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """用户登录"""
    # 验证用户
    user = get_user_by_email(db, email=login_data.email)
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 生成访问令牌
    access_token = create_access_token(data={"sub": user.email})
    return success_response(
        data={
            "access_token": access_token,
            "token_type": "bearer",
            "user": UserResponse.model_validate(user)
        },
        message="登录成功"
    )

@router.get("/me")
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """获取当前用户信息"""
    return success_response(
        data=UserResponse.model_validate(current_user),
        message="获取用户信息成功"
    ) 