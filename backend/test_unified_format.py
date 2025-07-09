#!/usr/bin/env python3

import pytest
from fastapi.testclient import TestClient
from main import app
from sqlalchemy.orm import Session
from database import SessionLocal
from crud import get_user_by_email

client = TestClient(app)

def test_unified_response_format():
    """测试统一的响应格式"""
    
    # 测试根路径
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert "message" in data
    assert "data" in data
    
    # 测试健康检查
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert data["message"] == "健康检查通过"
    assert data["data"]["status"] == "ok"

def test_register_and_login_unified_format():
    """测试注册和登录的统一格式"""
    
    # 清理测试用户
    email = "testuser@example.com"
    password = "testpassword123"
    db: Session = SessionLocal()
    user = get_user_by_email(db, email=email)
    if user:
        db.delete(user)
        db.commit()
    db.close()

    # 测试注册
    response = client.post("/register", json={"email": email, "password": password})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert data["message"] == "注册成功"
    assert data["data"]["email"] == email

    # 测试登录
    login_data = {"username": email, "password": password}
    response = client.post("/token", data=login_data)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert data["message"] == "登录成功"
    assert "access_token" in data["data"]
    assert data["data"]["token_type"] == "bearer"
    
    token = data["data"]["access_token"]
    
    # 测试获取用户信息
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert data["message"] == "获取用户信息成功"
    assert data["data"]["email"] == email

def test_bills_unified_format():
    """测试账单API的统一格式"""
    
    # 先登录获取token
    email = "testuser@example.com"
    password = "testpassword123"
    
    # 确保用户存在
    db: Session = SessionLocal()
    user = get_user_by_email(db, email=email)
    if not user:
        # 创建用户
        from crud import create_user
        from schemas import UserCreate
        user_create = UserCreate(email=email, password=password)
        user = create_user(db, user_create)
    db.close()
    
    # 登录
    login_data = {"username": email, "password": password}
    response = client.post("/token", data=login_data)
    token = response.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 测试获取账单列表
    response = client.get("/bills/", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert data["message"] == "获取账单列表成功"
    assert "data" in data
    assert "total" in data
    assert "skip" in data
    assert "limit" in data
    
    # 测试创建账单
    bill_data = {
        "amount": 100.0,
        "category": "餐饮",
        "description": "午餐",
        "date": "2024-01-01T12:00:00"
    }
    response = client.post("/bills/", json=bill_data, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert data["message"] == "账单创建成功"
    assert data["data"]["amount"] == 100.0

if __name__ == "__main__":
    # 运行测试
    pytest.main([__file__, "-v"]) 