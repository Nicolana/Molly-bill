import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from app.main import app

client = TestClient(app)

@pytest.fixture
def user_token_header(client):
    # 注册并登录，获取token
    user_data = {"email": "chatuser@example.com", "username": "chatuser", "password": "testpassword123"}
    client.post("/api/v1/register", json=user_data)
    resp = client.post("/api/v1/login", json={"email": user_data["email"], "password": user_data["password"]})
    token = resp.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_chat_with_ai_success(user_token_header):
    with patch("app.services.ai.service.ai_service.chat", new_callable=AsyncMock) as mock_chat:
        mock_chat.return_value = "你好，有什么可以帮您？"
        payload = {"message": "你好"}
        response = client.post("/api/v1/chat/", json=payload, headers=user_token_header)
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "你好，有什么可以帮您？"
        assert "user_id" in data
        mock_chat.assert_awaited_once_with("你好")

def test_chat_with_ai_error(user_token_header):
    with patch("app.services.ai.service.ai_service.chat", new_callable=AsyncMock) as mock_chat:
        mock_chat.side_effect = Exception("AI服务异常")
        payload = {"message": "测试异常"}
        response = client.post("/api/v1/chat/", json=payload, headers=user_token_header)
        assert response.status_code == 500
        assert "AI服务错误" in response.json()["detail"] 