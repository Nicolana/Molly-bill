import pytest
from fastapi.testclient import TestClient
from main import app
from sqlalchemy.orm import Session
from database import SessionLocal
from crud import get_user_by_email

client = TestClient(app)

def test_register_and_login_and_me():
    # 注册新用户
    email = "testuser@example.com"
    password = "testpassword123"
    db: Session = SessionLocal()
    # 如果用户已存在，先删掉
    user = get_user_by_email(db, email=email)
    if user:
        db.delete(user)
        db.commit()
    db.close()

    # 注册
    response = client.post("/register", json={"email": email, "password": password})
    assert response.status_code == 200
    assert response.json()["email"] == email

    # 登录，获取 token
    data = {"username": email, "password": password}
    response = client.post("/token", data=data)
    assert response.status_code == 200
    token = response.json()["access_token"]
    assert token

    # 用 token 访问 /me
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["email"] == email 