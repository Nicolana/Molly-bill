import pytest
from fastapi import status
from sqlalchemy.orm import Session

from app.crud.user import get_user_by_email
from app.models import User, Ledger, UserLedger

class TestAuth:
    """认证相关测试"""
    
    def test_register_success(self, client, test_user_data):
        """测试用户注册成功"""
        response = client.post("/api/v1/register", json=test_user_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["message"] == "注册成功"
        assert data["data"]["email"] == test_user_data["email"]
        assert data["data"]["username"] == test_user_data["username"]
        assert "id" in data["data"]
        assert "created_at" in data["data"]
        # 确保密码没有返回
        assert "hashed_password" not in data["data"]
        assert "password" not in data["data"]
    
    def test_register_duplicate_email(self, client, test_user_data):
        """测试重复邮箱注册失败"""
        # 第一次注册
        response1 = client.post("/api/v1/register", json=test_user_data)
        assert response1.status_code == 200
        
        # 第二次注册相同邮箱
        response2 = client.post("/api/v1/register", json=test_user_data)
        assert response2.status_code == 400
        assert "邮箱已被注册" in response2.json()["detail"]
    
    def test_register_invalid_email(self, client):
        """测试无效邮箱格式"""
        invalid_data = {
            "email": "invalid-email",
            "username": "testuser",
            "password": "testpassword123"
        }
        response = client.post("/api/v1/register", json=invalid_data)
        assert response.status_code == 422  # 验证错误
    
    def test_register_missing_fields(self, client):
        """测试缺少必填字段"""
        # 缺少密码
        data_without_password = {
            "email": "test@example.com",
            "username": "testuser"
        }
        response = client.post("/api/v1/register", json=data_without_password)
        assert response.status_code == 422
        
        # 缺少邮箱
        data_without_email = {
            "username": "testuser",
            "password": "testpassword123"
        }
        response = client.post("/api/v1/register", json=data_without_email)
        assert response.status_code == 422
    
    def test_register_without_username_and_avatar(self, client):
        """测试不传username和avatar的注册"""
        minimal_data = {
            "email": "test@example.com",
            "password": "testpassword123"
        }
        response = client.post("/api/v1/register", json=minimal_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["email"] == "test@example.com"
        assert data["data"]["username"] == "test"  # 默认使用邮箱前缀
        assert data["data"]["avatar"] is not None  # 应该有默认头像
        assert "dicebear.com" in data["data"]["avatar"]  # 验证是DiceBear头像
    
    def test_register_without_username_only(self, client):
        """测试只不传username的注册"""
        data_without_username = {
            "email": "user@example.com",
            "password": "testpassword123",
            "avatar": "https://example.com/custom-avatar.jpg"
        }
        response = client.post("/api/v1/register", json=data_without_username)
        
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["username"] == "user"  # 默认使用邮箱前缀
        assert data["data"]["avatar"] == "https://example.com/custom-avatar.jpg"  # 保持自定义头像
    
    def test_register_without_avatar_only(self, client):
        """测试只不传avatar的注册"""
        data_without_avatar = {
            "email": "newuser@example.com",
            "username": "customusername",
            "password": "testpassword123"
        }
        response = client.post("/api/v1/register", json=data_without_avatar)
        
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["username"] == "customusername"  # 保持自定义用户名
        assert data["data"]["avatar"] is not None  # 应该有默认头像
        assert "dicebear.com" in data["data"]["avatar"]  # 验证是DiceBear头像
    
    def test_login_success(self, client, test_user_data):
        """测试用户登录成功"""
        # 先注册用户
        register_response = client.post("/api/v1/register", json=test_user_data)
        assert register_response.status_code == 200
        
        # 登录
        login_data = {
            "email": test_user_data["email"],
            "password": test_user_data["password"]
        }
        response = client.post("/api/v1/login", json=login_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["message"] == "登录成功"
        assert "access_token" in data["data"]
        assert data["data"]["token_type"] == "bearer"
        assert "user" in data["data"]
        assert data["data"]["user"]["email"] == test_user_data["email"]
    
    def test_login_wrong_password(self, client, test_user_data):
        """测试错误密码登录失败"""
        # 先注册用户
        register_response = client.post("/api/v1/register", json=test_user_data)
        assert register_response.status_code == 200
        
        # 使用错误密码登录
        login_data = {
            "email": test_user_data["email"],
            "password": "wrongpassword"
        }
        response = client.post("/api/v1/login", json=login_data)
        
        assert response.status_code == 401
        assert "邮箱或密码错误" in response.json()["detail"]
    
    def test_login_nonexistent_user(self, client):
        """测试不存在的用户登录失败"""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "testpassword123"
        }
        response = client.post("/api/v1/login", json=login_data)
        
        assert response.status_code == 401
        assert "邮箱或密码错误" in response.json()["detail"]
    
    def test_login_invalid_data(self, client):
        """测试无效登录数据"""
        # 缺少密码
        login_data = {"email": "test@example.com"}
        response = client.post("/api/v1/login", json=login_data)
        assert response.status_code == 422
        
        # 缺少邮箱
        login_data = {"password": "testpassword123"}
        response = client.post("/api/v1/login", json=login_data)
        assert response.status_code == 422
    
    def test_get_me_without_token(self, client):
        """测试无token获取用户信息失败"""
        response = client.get("/api/v1/me")
        assert response.status_code == 403  # 缺少认证头
    
    def test_get_me_with_invalid_token(self, client):
        """测试无效token获取用户信息失败"""
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/api/v1/me", headers=headers)
        assert response.status_code == 401
    
    def test_get_me_success(self, client, test_user_data):
        """测试成功获取用户信息"""
        # 注册并登录用户
        register_response = client.post("/api/v1/register", json=test_user_data)
        assert register_response.status_code == 200
        
        login_data = {
            "email": test_user_data["email"],
            "password": test_user_data["password"]
        }
        login_response = client.post("/api/v1/login", json=login_data)
        assert login_response.status_code == 200
        
        # 获取token
        token = login_response.json()["data"]["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 获取用户信息
        response = client.get("/api/v1/me", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["message"] == "获取用户信息成功"
        assert data["data"]["email"] == test_user_data["email"]
        assert data["data"]["username"] == test_user_data["username"]
        assert "id" in data["data"]
        assert "created_at" in data["data"]
        assert "hashed_password" not in data["data"]
    
    def test_register_creates_personal_ledger(self, client, test_user_data, db: Session):
        """测试注册时自动创建个人账本"""
        response = client.post("/api/v1/register", json=test_user_data)
        assert response.status_code == 200
        
        # 检查数据库中是否创建了用户
        user = get_user_by_email(db, test_user_data["email"])
        assert user is not None
        
        # 检查是否创建了个人账本
        user_ledgers = db.query(UserLedger).filter(UserLedger.user_id == user.id).all()
        assert len(user_ledgers) == 1
        
        ledger = db.query(Ledger).filter(Ledger.id == user_ledgers[0].ledger_id).first()
        assert ledger is not None
        assert ledger.name == f"{test_user_data['username']}的个人账本"
        assert user_ledgers[0].role.value == "admin"  # 用户应该是账本管理员
    
    def test_multiple_users_registration(self, client, test_user_data, test_user_data2):
        """测试多个用户注册"""
        # 注册第一个用户
        response1 = client.post("/api/v1/register", json=test_user_data)
        assert response1.status_code == 200
        
        # 注册第二个用户
        response2 = client.post("/api/v1/register", json=test_user_data2)
        assert response2.status_code == 200
        
        # 验证两个用户都注册成功
        assert response1.json()["data"]["email"] == test_user_data["email"]
        assert response2.json()["data"]["email"] == test_user_data2["email"]
        assert response1.json()["data"]["id"] != response2.json()["data"]["id"] 