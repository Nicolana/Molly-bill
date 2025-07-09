import openai
import os
from dotenv import load_dotenv

load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")

def classify_transaction(description: str, amount: float) -> str:
    """使用OpenAI API对交易进行分类"""
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "你是一个财务分类专家。请根据交易描述和金额，将交易分类为以下类别之一：餐饮、交通、购物、娱乐、医疗、教育、住房、投资、其他。只返回分类名称，不要其他内容。"
                },
                {
                    "role": "user",
                    "content": f"交易描述：{description}，金额：{amount}元"
                }
            ],
            max_tokens=10,
            temperature=0.1
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"AI分类错误: {e}")
        return "其他" 