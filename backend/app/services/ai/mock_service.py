#!/usr/bin/env python3
"""
模拟AI服务，用于测试记账功能
"""

import re
from typing import Dict, Any

class MockAIService:
    def __init__(self):
        pass
        
    def analyze_text(self, text: str) -> Dict[str, Any]:
        """模拟分析文本中的账单信息"""
        # 使用正则表达式匹配消费信息
        # 匹配模式：数字 + 块/元/块钱 + 描述
        patterns = [
            r'(\w+)\s*花了\s*(\d+(?:\.\d+)?)\s*(块|元|块钱)',
            r'在\s*(\w+)\s*花了\s*(\d+(?:\.\d+)?)\s*(块|元|块钱)',
            r'(\w+)\s*(\d+(?:\.\d+)?)\s*(块|元|块钱)',
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text)
            if matches:
                # 取第一个匹配的结果
                match = matches[0]
                if len(match) == 3:
                    description, amount, unit = match
                else:
                    # 如果只有两个元素，说明没有描述
                    amount, unit = match
                    description = "未知消费"
                
                # 确定分类
                category = self._determine_category(description)
                
                return {
                    "has_bill": True,
                    "bill": {
                        "amount": float(amount),
                        "description": description,
                        "category": category
                    },
                    "message": f"已识别到账单信息：{description} ¥{amount}"
                }
        
        # 如果没有匹配到消费信息
        return {
            "has_bill": False,
            "message": "我没有识别到消费信息，请告诉我您花了多少钱，在什么地方消费的。"
        }
    
    def _determine_category(self, description: str) -> str:
        """根据描述确定消费分类"""
        description_lower = description.lower()
        
        # 餐饮类
        if any(word in description_lower for word in ['午餐', '晚餐', '早餐', '咖啡', '奶茶', '餐厅', '饭店', '外卖', '零食']):
            return "餐饮"
        
        # 交通类
        if any(word in description_lower for word in ['打车', '公交', '地铁', '出租车', '滴滴', '车费']):
            return "交通"
        
        # 购物类
        if any(word in description_lower for word in ['衣服', '鞋子', '包包', '化妆品', '日用品']):
            return "购物"
        
        # 娱乐类
        if any(word in description_lower for word in ['电影', '游戏', 'KTV', '酒吧', '娱乐']):
            return "娱乐"
        
        # 默认分类
        return "其他"
    
    def chat(self, message: str) -> Dict[str, Any]:
        """模拟聊天对话"""
        # 首先尝试分析是否包含账单信息
        analysis = self.analyze_text(message)
        
        if analysis.get("has_bill", False):
            bill = analysis.get("bill")
            # 检查是否还有更多账单信息
            remaining_text = message.lower()
            if bill:
                # 移除已识别的账单信息
                bill_desc = bill.get("description", "").lower()
                bill_amount = str(bill.get("amount", ""))
                remaining_text = remaining_text.replace(bill_desc, "").replace(bill_amount, "")
            
            # 如果还有更多消费信息，提示用户
            if any(word in remaining_text for word in ["花了", "消费", "购买", "买了", "花了"]):
                return {
                    "message": f"{analysis.get('message', '已识别到账单信息')}。我注意到您可能还有更多消费，请分别告诉我每笔消费的详细信息。",
                    "bill": bill
                }
            else:
                return {
                    "message": analysis.get("message", "已识别到账单信息"),
                    "bill": bill
                }
        else:
            # 如果没有账单信息，进行一般性对话
            return {
                "message": "您好！我是您的AI记账助手。请告诉我您的消费信息，比如'今天在星巴克花了35元'，我会帮您记录下来。",
                "bill": None
            }

# 创建全局模拟AI服务实例
mock_ai_service = MockAIService() 