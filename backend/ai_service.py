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

# 设置阿里百练API密钥
dashscope.api_key = os.getenv("DASHSCOPE_API_KEY", "your-dashscope-api-key")

class AIService:
    def __init__(self):
        self.model = "qwen-vl-plus"  # 使用qwen-vl-plus模型支持多模态
        
    def analyze_text(self, text: str) -> Dict[str, Any]:
        """分析文本中的账单信息"""
        prompt = f"""
        请分析以下文本中的账单信息，提取金额、描述、分类等信息。
        如果包含账单信息，请以JSON格式返回，格式如下：
        {{
            "has_bill": true,
            "bill": {{
                "amount": 金额,
                "description": "描述",
                "category": "分类"
            }},
            "message": "回复消息"
        }}
        
        如果没有账单信息，返回：
        {{
            "has_bill": false,
            "message": "回复消息"
        }}
        
        文本内容：{text}
        """
        
        try:
            response = dashscope.Generation.call(
                model='qwen-plus',
                prompt=prompt,
                result_format='message'
            )
            
            if response.status_code == 200:
                content = response.output.choices[0].message.content
                # 尝试解析JSON响应
                try:
                    result = json.loads(content)
                    return result
                except json.JSONDecodeError:
                    # 如果不是JSON格式，返回默认响应
                    return {
                        "has_bill": False,
                        "message": content
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
            请分析这张图片中的账单信息，提取金额、商家名称、商品描述等信息。
            如果包含账单信息，请以JSON格式返回，格式如下：
            {
                "has_bill": true,
                "bills": [
                    {
                        "amount": 金额,
                        "description": "描述",
                        "category": "分类"
                    }
                ],
                "message": "我识别出了以下账单信息："
            }
            
            如果没有账单信息，返回：
            {
                "has_bill": false,
                "message": "抱歉，我没有从图片中识别出账单信息。"
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
            bill = analysis.get("bill")
            return {
                "message": analysis.get("message", "已识别到账单信息"),
                "bill": bill
            }
        else:
            # 如果没有账单信息，进行一般性对话
            prompt = f"""
            你是一个友好的AI记账助手。用户说：{message}
            
            请用友好的语气回复，并询问是否需要帮助记录账单。
            如果用户提到了支出或消费，请主动询问是否需要记录。
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
                        "bill": None
                    }
                else:
                    return {
                        "message": "抱歉，我现在无法回复，请稍后再试。",
                        "bill": None
                    }
            except Exception as e:
                print(f"聊天错误: {e}")
                return {
                    "message": "抱歉，AI服务暂时不可用，请稍后再试。",
                    "bill": None
                }

# 创建全局AI服务实例
ai_service = AIService() 