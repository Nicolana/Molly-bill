#!/usr/bin/env python3

import os
from datetime import datetime, timedelta
from jose import JWTError, jwt
from database import SessionLocal
from crud import get_user_by_email

# 使用相同的配置
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def test_token():
    # 测试邮箱
    test_email = "nicolanazwj@gmail.com"
    
    # 创建 token
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": test_email}, expires_delta=access_token_expires
    )
    
    print(f"生成的 token: {access_token}")
    
    # 验证 token
    try:
        payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        print(f"解码后的 email: {email}")
        
        # 检查用户是否存在
        db = SessionLocal()
        try:
            user = get_user_by_email(db, email=email)
            if user:
                print(f"找到用户: {user.email}")
            else:
                print("用户不存在")
        finally:
            db.close()
            
    except JWTError as e:
        print(f"Token 验证失败: {e}")

if __name__ == "__main__":
    test_token() 