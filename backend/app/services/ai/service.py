import os
import base64
import io
from typing import Optional, List, Dict, Any
from PIL import Image
import dashscope
from dashscope import MultiModalConversation
from dashscope.audio.asr import Recognition
from pydub import AudioSegment
import json
from app.core.config.settings import settings

# 设置阿里百练API密钥
dashscope.api_key = settings.dashscope_api_key or "your-dashscope-api-key"

class AIService:
    def __init__(self):
        self.model = "qwen-vl-plus"  # 使用qwen-vl-plus模型支持多模态
        
    def analyze_text(self, text: str) -> Dict[str, Any]:
        """分析文本中的账单信息"""
        prompt = f"""
        你是一个专业的记账助手。请仔细分析以下文本中的财务信息，提取金额、描述、分类等信息，并判断是收入还是支出。

        账单识别规则：
        1. 支出：任何提到花钱、消费、购买、花费、支付、付款等词汇的内容
        2. 收入：任何提到赚钱、收入、工资、奖金、报销、退款、收款等词汇的内容
        3. 金额可以是数字+单位（如：18块、13元、35.5元等）
        4. 描述应该简洁明了，如"午餐"、"咖啡"、"打车"、"工资"、"奖金"等
        5. 支出分类可以是：餐饮、交通、购物、娱乐、其他等
        6. 收入分类可以是：工资、奖金、报销、退款、其他等
        7. 如果文本中有多个财务项目，请识别所有提到的项目

        如果文本包含财务信息，请以JSON格式返回：
        {{
            "has_bill": true,
            "bills": [
                {{
                    "amount": 金额（数字）,
                    "type": "expense" 或 "income",
                    "description": "描述",
                    "category": "分类"
                }}
            ],
            "message": "已识别到财务信息"
        }}

        如果没有财务信息，返回：
        {{
            "has_bill": false,
            "message": "我没有识别到财务信息，请告诉我您的收入或支出情况。"
        }}

        示例：
        输入："午餐花了18块，喝咖啡花了13块"
        输出：{{
            "has_bill": true,
            "bills": [
                {{
                    "amount": 18,
                    "type": "expense",
                    "description": "午餐",
                    "category": "餐饮"
                }},
                {{
                    "amount": 13,
                    "type": "expense",
                    "description": "咖啡",
                    "category": "餐饮"
                }}
            ],
            "message": "已识别到支出信息：午餐 ¥18，咖啡 ¥13"
        }}

        输入："今天发了工资5000元，还有奖金1000元"
        输出：{{
            "has_bill": true,
            "bills": [
                {{
                    "amount": 5000,
                    "type": "income",
                    "description": "工资",
                    "category": "工资"
                }},
                {{
                    "amount": 1000,
                    "type": "income",
                    "description": "奖金",
                    "category": "奖金"
                }}
            ],
            "message": "已识别到收入信息：工资 ¥5000，奖金 ¥1000"
        }}

        文本内容：{text}
        """
        
        try:
            response = dashscope.Generation.call(
                model='qwen-plus',
                prompt=prompt,
                result_format='message',
                response_format={"type": "json_object"}
            )
            print(response)
            
            if response.status_code == 200:
                content = response.output.choices[0].message.content
                # 尝试解析JSON响应
                try:
                    result = json.loads(content)
                    # 确保所有账单都有type字段，默认为expense
                    if result.get("has_bill", False) and "bills" in result:
                        for bill in result["bills"]:
                            if "type" not in bill:
                                bill["type"] = "expense"
                    return result
                except json.JSONDecodeError:
                    # 如果不是JSON格式，返回默认响应
                    return {
                        "has_bill": False,
                        "message": content
                    }
            elif response.status_code == 401:
                return {
                    "has_bill": False,
                    "message": "抱歉，系统错误，请先配置API密钥"
                }
            else:
                return {
                    "has_bill": False,
                    "message": "抱歉，我无法理解您的输入，请重试。"
                }
        except Exception as e:
            print(f"AI分析错误: {e}")
            return {
                "has_bill": False,
                "message": "抱歉，AI服务暂时不可用，请稍后再试。"
            }
    
    def analyze_image(self, image_data: str) -> Dict[str, Any]:
        """分析图片中的账单信息"""
        try:
            # 解码base64图片数据
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
            
            # 将图片转换为base64字符串
            buffered = io.BytesIO()
            image.save(buffered, format="JPEG")
            img_base64 = base64.b64encode(buffered.getvalue()).decode()
            
            prompt = """
            请分析这张图片中的财务信息，提取金额、商家名称、商品描述等信息，并判断是收入还是支出。
            
            判断规则：
            1. 支出：收据、发票、消费小票、付款凭证等
            2. 收入：工资条、奖金单、报销单、收款凭证等
            
            如果包含财务信息，请以JSON格式返回，格式如下：
            {
                "has_bill": true,
                "bills": [
                    {
                        "amount": 金额,
                        "type": "expense" 或 "income",
                        "description": "描述",
                        "category": "分类"
                    }
                ],
                "message": "我识别出了以下财务信息："
            }
            
            如果没有财务信息，返回：
            {
                "has_bill": false,
                "message": "抱歉，我没有从图片中识别出财务信息。"
            }
            """
            
            response = MultiModalConversation.call(
                model=self.model,
                messages=[{
                    'role': 'user',
                    'content': [
                        {'text': prompt},
                        {'image': img_base64}
                    ]
                }]
            )
            
            if response.status_code == 200:
                content = response.output.choices[0].message.content[0].text
                try:
                    result = json.loads(content)
                    # 确保所有账单都有type字段，默认为expense
                    if result.get("has_bill", False) and "bills" in result:
                        for bill in result["bills"]:
                            if "type" not in bill:
                                bill["type"] = "expense"
                    return result
                except json.JSONDecodeError:
                    return {
                        "has_bill": False,
                        "message": content
                    }
            else:
                return {
                    "has_bill": False,
                    "message": "抱歉，图片分析失败，请重试。"
                }
        except Exception as e:
            print(f"图片分析错误: {e}")
            return {
                "has_bill": False,
                "message": "抱歉，图片分析服务暂时不可用，请稍后再试。"
            }
    
    def recognize_voice(self, audio_data: str) -> Dict[str, Any]:
        """语音识别"""
        try:
            # 解码base64音频数据
            audio_bytes = base64.b64decode(audio_data)
            
            # 保存临时音频文件
            temp_file = "temp_audio.wav"
            with open(temp_file, "wb") as f:
                f.write(audio_bytes)
            
            # 使用阿里百练语音识别
            response = Recognition.call(
                model='paraformer-realtime-v1',
                audio=temp_file
            )
            
            # 删除临时文件
            os.remove(temp_file)
            
            if response.status_code == 200:
                text = response.output.text
                return {
                    "success": True,
                    "text": text,
                    "confidence": 0.9  # 默认置信度
                }
            else:
                return {
                    "success": False,
                    "text": "",
                    "message": "语音识别失败"
                }
        except Exception as e:
            print(f"语音识别错误: {e}")
            return {
                "success": False,
                "text": "",
                "message": "语音识别服务暂时不可用"
            }
    
    def chat(self, message: str) -> Dict[str, Any]:
        """聊天对话"""
        # 首先尝试分析是否包含账单信息
        analysis = self.analyze_text(message)
        
        if analysis.get("has_bill", False):
            bills = analysis.get("bills", [])
            return {
                "message": analysis.get("message", "已识别到财务信息"),
                "bills": bills
            }
        else:
            # 如果没有账单信息，进行一般性对话
            prompt = f"""
            你是一个友好的AI记账助手。用户说：{message}
            
            请用友好的语气回复，并询问是否需要帮助记录收入或支出。
            如果用户提到了支出、消费、收入、工资等财务信息，请主动询问是否需要记录。
            记住，财务信息包括收入和支出两种类型。
            """
            
            try:
                response = dashscope.Generation.call(
                    model='qwen-plus',
                    prompt=prompt,
                    result_format='message'
                )
                
                if response.status_code == 200:
                    content = response.output.choices[0].message.content
                    return {
                        "message": content,
                        "bills": []
                    }
                else:
                    return {
                        "message": "抱歉，我现在无法回复，请稍后再试。",
                        "bills": []
                    }
            except Exception as e:
                print(f"聊天错误: {e}")
                return {
                    "message": "抱歉，AI服务暂时不可用，请稍后再试。",
                    "bills": []
                }

# 创建全局AI服务实例
ai_service = AIService() 