#!/usr/bin/env python3
"""
聊天功能测试脚本
"""

import requests
import json

def test_chat_api():
    """测试聊天API"""
    base_url = "http://localhost:8000"
    
    # 测试数据
    test_message = "午餐花了18块，喝咖啡花了13块"
    
    print("=== 聊天API测试 ===")
    print(f"测试消息: {test_message}")
    
    try:
        # 发送聊天请求
        response = requests.post(
            f"{base_url}/ai/chat",
            json={"message": test_message},
            headers={"Content-Type": "application/json"}
        )
        
        print(f"状态码: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ 成功响应: {json.dumps(result, indent=2, ensure_ascii=False)}")
            return True
        else:
            print(f"❌ 错误响应: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ 请求失败: {e}")
        return False

def test_ai_service_direct():
    """直接测试AI服务"""
    print("\n=== 直接AI服务测试 ===")
    
    try:
        from ai_service import AIService
        
        ai_service = AIService()
        test_message = "午餐花了18块，喝咖啡花了13块"
        
        result = ai_service.chat(test_message)
        print(f"✅ AI服务结果: {json.dumps(result, indent=2, ensure_ascii=False)}")
        return True
        
    except Exception as e:
        print(f"❌ AI服务测试失败: {e}")
        return False

if __name__ == "__main__":
    print("开始测试聊天功能...")
    
    # 测试AI服务
    if test_ai_service_direct():
        print("\n✅ AI服务测试通过")
    else:
        print("\n❌ AI服务测试失败")
    
    # 测试API接口
    if test_chat_api():
        print("\n✅ API接口测试通过")
    else:
        print("\n❌ API接口测试失败")
    
    print("\n测试完成！") 