#!/usr/bin/env python3
"""
AI服务测试脚本
"""

import os
import sys
from ai_service import AIService

def test_ai_service():
    """测试AI服务"""
    print("开始测试AI服务...")
    
    # 检查API密钥
    api_key = os.getenv("DASHSCOPE_API_KEY")
    if not api_key or api_key == "your-dashscope-api-key-here":
        print("❌ 错误：请设置有效的DASHSCOPE_API_KEY环境变量")
        return False
    
    # 创建AI服务实例
    try:
        ai_service = AIService()
        print("✅ AI服务实例创建成功")
    except Exception as e:
        print(f"❌ AI服务实例创建失败: {e}")
        return False
    
    # 测试文本分析
    print("\n测试文本分析...")
    test_text = "午餐花了18块"
    try:
        result = ai_service.analyze_text(test_text)
        print(f"✅ 文本分析结果: {result}")
        return True
    except Exception as e:
        print(f"❌ 文本分析失败: {e}")
        return False

def test_chat():
    """测试聊天功能"""
    print("\n测试聊天功能...")
    
    api_key = os.getenv("DASHSCOPE_API_KEY")
    if not api_key or api_key == "your-dashscope-api-key-here":
        print("❌ 错误：请设置有效的DASHSCOPE_API_KEY环境变量")
        return False
    
    try:
        ai_service = AIService()
        test_message = "你好"
        result = ai_service.chat(test_message)
        print(f"✅ 聊天测试结果: {result}")
        return True
    except Exception as e:
        print(f"❌ 聊天测试失败: {e}")
        return False

if __name__ == "__main__":
    print("=== AI服务测试 ===")
    
    # 测试AI服务
    if test_ai_service():
        print("\n✅ AI服务测试通过")
    else:
        print("\n❌ AI服务测试失败")
        sys.exit(1)
    
    # 测试聊天功能
    if test_chat():
        print("\n✅ 聊天功能测试通过")
    else:
        print("\n❌ 聊天功能测试失败")
        sys.exit(1)
    
    print("\n🎉 所有测试通过！") 