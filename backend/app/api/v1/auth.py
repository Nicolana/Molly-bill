from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.database import get_db
from app.models import User
from app.schemas.auth import UserCreate, UserResponse
from app.schemas.base import BaseResponse
from app.core.security.auth import create_access_token, get_current_user
from app.crud.user import get_user_by_email, create_user
from app.core.security.password import verify_password
from app.utils.response import success_response, error_response

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/register", response_model=BaseResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    """用户注册"""
    # 检查邮箱是否已存在
    db_user = get_user_by_email(db, email=user.email)
    if db_user:
        return error_response(
            message="邮箱已被注册",
            error_code="EMAIL_ALREADY_EXISTS"
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

@router.post("/login", response_model=BaseResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """用户登录"""
    # 验证用户
    user = get_user_by_email(db, email=login_data.email)
    if not user or not verify_password(login_data.password, user.hashed_password):
        return error_response(
            message="邮箱或密码错误",
            error_code="INVALID_CREDENTIALS"
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

@router.get("/me", response_model=BaseResponse)
def get_current_user_info(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """获取当前用户信息"""
    from app.crud.ledger import get_user_ledgers
    
    # 获取用户的账本信息
    user_ledgers = get_user_ledgers(db, current_user.id)
    
    # 构建用户响应数据
    user_data = {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "avatar": current_user.avatar,
        "created_at": current_user.created_at,
        "current_ledger_id": current_user.current_ledger_id,
        "user_ledgers": []
    }
    
    # 添加账本信息
    for user_ledger in user_ledgers:
        user_data["user_ledgers"].append({
            "id": user_ledger.id,
            "user_id": user_ledger.user_id,
            "ledger_id": user_ledger.ledger_id,
            "role": user_ledger.role,
            "joined_at": user_ledger.joined_at,
            "status": user_ledger.status,
            "ledger": {
                "id": user_ledger.ledger.id,
                "name": user_ledger.ledger.name,
                "description": user_ledger.ledger.description,
                "currency": user_ledger.ledger.currency,
                "timezone": user_ledger.ledger.timezone,
                "status": user_ledger.ledger.status,
                "created_at": user_ledger.ledger.created_at,
                "deleted_at": user_ledger.ledger.deleted_at
            }
        })
    
    return success_response(
        data=user_data,
        message="获取用户信息成功"
    ) 