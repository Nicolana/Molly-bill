from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, date

from app.db.database import get_db
from app.models import User
from app.schemas.chat import ChatRequest, ChatResponse, ChatMessageCreate
from app.schemas.bill import BillCreate, BillResponse
from app.models.enums import BillType
from app.core.security.auth import get_current_user
from app.services.ai.service import ai_service
from app.crud import chat as chat_crud
from app.crud import bill as bill_crud
from app.utils.response import BaseResponse, success_response, error_response

router = APIRouter()

@router.post("/", response_model=BaseResponse)
async def chat_with_ai(
    chat_request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """与AI聊天，支持文本、图片、音频输入"""
    try:
        # 检查账本ID是否提供
        if not chat_request.ledger_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="请选择一个账本"
            )
        
        # 保存用户消息到数据库
        user_message = ChatMessageCreate(
            content=chat_request.message,
            message_type="user",
            input_type="text",
            ledger_id=chat_request.ledger_id
        )
        user_msg_db = chat_crud.create_chat_message(
            db, user_message, current_user.id
        )
        
        # 处理不同类型的输入
        ai_response = None
        bills_created = []
        print(chat_request)
        
        if chat_request.audio:
            # 处理音频输入
            voice_result = ai_service.recognize_voice(chat_request.audio)
            if voice_result.get("success"):
                # 语音识别成功，分析识别出的文本
                recognized_text = voice_result["text"]
                ai_response = ai_service.analyze_text(recognized_text)
                
                # 更新用户消息内容为识别出的文本
                user_msg_db.content = f"[语音识别] {recognized_text}"
                user_msg_db.input_type = "voice"
                user_msg_db.ai_confidence = voice_result.get("confidence", 0.9)
                db.commit()
            else:
                ai_response = {
                    "message": "抱歉，语音识别失败，请重试。",
                    "bills": []
                }
        
        elif chat_request.image:
            # 处理图片输入
            ai_response = ai_service.analyze_image(chat_request.image)
            user_msg_db.input_type = "image"
            db.commit()
        
        else:
            # 处理文本输入
            ai_response = ai_service.chat(chat_request.message)
        # 如果AI识别出账单信息，创建账单
        if ai_response.get("bills"):
            for bill_data in ai_response["bills"]:
                try:
                    # 处理日期信息
                    bill_date = datetime.now()
                    if "date" in bill_data and bill_data["date"]:
                        try:
                            # 尝试解析AI返回的日期字符串
                            if isinstance(bill_data["date"], str):
                                bill_date = datetime.strptime(bill_data["date"], "%Y-%m-%d")
                            elif isinstance(bill_data["date"], date):
                                bill_date = datetime.combine(bill_data["date"], datetime.min.time())
                        except (ValueError, TypeError):
                            # 如果日期解析失败，使用当前日期
                            bill_date = datetime.now()
                    
                    # 创建账单
                    bill_create = BillCreate(
                        amount=bill_data["amount"],
                        type=BillType(bill_data["type"]),
                        description=bill_data.get("description", ""),
                        category=bill_data.get("category", "其他"),
                        date=bill_date,
                        ledger_id=chat_request.ledger_id
                    )
                    
                    bill_db = bill_crud.create_bill(db, bill_create, current_user.id)
                    bills_created.append(bill_db)
                    
                    # 更新聊天消息关联账单
                    chat_crud.update_chat_message_bill(
                        db, user_msg_db.id, bill_db.id
                    )
                    
                except Exception as e:
                    print(f"创建账单失败: {e}")
                    continue

        # 保存AI回复到数据库
        ai_message = ChatMessageCreate(
            content=ai_response.get("message", "抱歉，我无法理解您的输入。"),
            message_type="assistant",
            input_type="text",
            ledger_id=chat_request.ledger_id
        )
        chat_crud.create_chat_message(db, ai_message, current_user.id)
        
        # 构建响应
        response_data = {
            "message": ai_response.get("message", "抱歉，我无法理解您的输入。"),
            "user_id": current_user.id,
            "bills": [BillResponse.model_validate(bill) for bill in bills_created] if bills_created else None,
            "confidence": ai_response.get("confidence")
        }
        
        return success_response(ChatResponse(**response_data))
        
    except Exception as e:
        # 确保在异常情况下也返回正确的响应格式
        error_response_data = {
            "message": f"AI服务错误: {str(e)}",
            "user_id": current_user.id,
            "bills": None,
            "confidence": None
        }
        return error_response(f"AI服务错误: {str(e)}", data=ChatResponse(**error_response_data))

@router.get("/history/{ledger_id}")
async def get_chat_history(
    ledger_id: int,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取聊天历史"""
    try:
        messages = chat_crud.get_recent_chat_messages(db, ledger_id, limit)
        
        # 构建响应数据，包含账单详情
        response_data = []
        for msg in messages:
            message_data = {
                "id": msg.id,
                "content": msg.content,
                "message_type": msg.message_type,
                "timestamp": msg.timestamp.isoformat(),
                "input_type": msg.input_type,
                "ai_confidence": msg.ai_confidence,
                "bill_id": msg.bill_id,
                "is_processed": msg.is_processed,
                "bills": []  # 初始化账单列表
            }
            
            # 如果消息关联了账单，获取账单详情
            if msg.bill_id:
                bill = bill_crud.get_bill(db, msg.bill_id)
                if bill:
                    message_data["bills"] = [BillResponse.model_validate(bill)]
            
            response_data.append(message_data)
        
        return success_response(response_data)
    except Exception as e:
        return error_response(f"获取聊天历史失败: {str(e)}") 