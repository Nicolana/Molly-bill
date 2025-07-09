from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from datetime import timedelta, datetime

from database import engine
from models import Base
from schemas import (
    User, UserCreate, Bill, BillCreate, Token, BaseResponse, PaginatedResponse,
    AIAnalysisRequest, AIAnalysisResponse, VoiceRecognitionRequest, VoiceRecognitionResponse, 
    ImageAnalysisRequest, ImageAnalysisResponse, ChatRequest, ChatResponse, 
    ChatMessage, ChatHistoryResponse, ChatMessageCreate, LoginRequest
)
from crud import create_user, get_user_by_email, verify_password, get_bills, create_bill, delete_bill, create_chat_message, get_chat_messages, get_chat_messages_count, get_recent_chat_messages, delete_chat_message
from deps import create_access_token, get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES, get_db
from ai_service import ai_service
from utils import success_response, error_response, paginated_response

# 创建数据库表
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Molly Bill API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", response_model=BaseResponse)
def read_root():
    return success_response(data={"msg": "Molly Bill API 在线"}, message="API服务正常")

@app.get("/health", response_model=BaseResponse)
def health_check():
    return success_response(data={"status": "ok"}, message="健康检查通过")

@app.post("/register", response_model=BaseResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="邮箱已被注册")
    created_user = create_user(db=db, user=user)
    return success_response(data=created_user, message="注册成功")

@app.post("/token", response_model=BaseResponse)
async def login_for_access_token(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = get_user_by_email(db, email=login_data.email)
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    print(access_token)
    return success_response(
        data={"access_token": access_token, "token_type": "bearer"}, 
        message="登录成功"
    )

@app.get("/bills/", response_model=PaginatedResponse)
async def read_bills(skip: int = 0, limit: int = 100, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    bills = get_bills(db, user_id=current_user.id, skip=skip, limit=limit)
    # 这里可以添加获取总数的逻辑
    total = len(bills)  # 简化处理，实际应该查询总数
    return paginated_response(bills, total, skip, limit, "获取账单列表成功")

@app.post("/bills/", response_model=BaseResponse)
async def create_user_bill(bill: BillCreate, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    created_bill = create_bill(db=db, bill=bill, user_id=current_user.id)
    return success_response(data=created_bill, message="账单创建成功")

@app.delete("/bills/{bill_id}", response_model=BaseResponse)
async def delete_user_bill(bill_id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    success = delete_bill(db=db, bill_id=bill_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="账单不存在")
    return success_response(message="账单删除成功")

@app.get("/me", response_model=BaseResponse)
async def read_users_me(current_user = Depends(get_current_user)):
    # 将SQLAlchemy模型转换为Pydantic模型
    user_data = User(
        id=current_user.id,
        email=current_user.email,
        created_at=current_user.created_at
    )
    return success_response(data=user_data, message="获取用户信息成功")

# 聊天消息相关端点
@app.get("/chat/messages", response_model=ChatHistoryResponse)
async def get_chat_history(
    skip: int = 0, 
    limit: int = 50, 
    current_user = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """获取聊天消息历史"""
    messages = get_chat_messages(db, user_id=current_user.id, skip=skip, limit=limit)
    total = get_chat_messages_count(db, user_id=current_user.id)
    return ChatHistoryResponse(messages=messages, total=total)

@app.get("/chat/messages/recent", response_model=List[ChatMessage])
async def get_recent_messages(
    limit: int = 50,
    current_user = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """获取最近的聊天消息"""
    return get_recent_chat_messages(db, user_id=current_user.id, limit=limit)

@app.delete("/chat/messages/{message_id}")
async def delete_message(
    message_id: int,
    current_user = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """删除聊天消息"""
    success = delete_chat_message(db, message_id=message_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="消息不存在或无权限删除")
    return {"message": "消息已删除"}

# AI相关端点
@app.post("/ai/analyze", response_model=AIAnalysisResponse)
async def analyze_input(request: AIAnalysisRequest, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    """分析用户输入（文本、图片、音频）"""
    try:
        # 保存用户输入消息
        user_message = create_chat_message(
            db=db,
            message=ChatMessageCreate(
                content=request.message,
                message_type="user",
                input_type="text" if not request.image and not request.audio else ("image" if request.image else "voice")
            ),
            user_id=current_user.id
        )
        
        if request.image:
            # 分析图片
            result = ai_service.analyze_image(request.image)
            if result.get("has_bill", False):
                bills = result.get("bills", [])
                if bills:
                    # 创建账单
                    bill = create_bill(db=db, bill=bills[0], user_id=current_user.id)
                    # 保存AI回复并关联账单
                    ai_message = create_chat_message(
                        db=db,
                        message=ChatMessageCreate(
                            content=result.get("message", "识别到账单信息"),
                            message_type="assistant",
                            input_type="image",
                            ai_confidence=0.9
                        ),
                        user_id=current_user.id,
                        bill_id=bill.id
                    )
                    return AIAnalysisResponse(
                        message=result.get("message", "识别到账单信息"),
                        bill=bills[0],
                        confidence=0.9
                    )
            
            # 保存AI回复
            ai_message = create_chat_message(
                db=db,
                message=ChatMessageCreate(
                    content=result.get("message", "未识别到账单信息"),
                    message_type="assistant",
                    input_type="image",
                    ai_confidence=0.0
                ),
                user_id=current_user.id
            )
            return AIAnalysisResponse(
                message=result.get("message", "未识别到账单信息"),
                bill=None,
                confidence=0.0
            )
        elif request.audio:
            # 语音识别
            voice_result = ai_service.recognize_voice(request.audio)
            if voice_result.get("success", False):
                text = voice_result.get("text", "")
                # 继续分析文本
                text_result = ai_service.analyze_text(text)
                if text_result.get("has_bill", False):
                    bill_data = text_result.get("bill")
                    # 创建账单
                    bill_data_with_date = {**bill_data, "date": datetime.now()}
                    bill_create = BillCreate(**bill_data_with_date)
                    bill = create_bill(db=db, bill=bill_create, user_id=current_user.id)
                    # 保存AI回复并关联账单
                    ai_message = create_chat_message(
                        db=db,
                        message=ChatMessageCreate(
                            content=f"语音识别：{text}\n{text_result.get('message', '')}",
                            message_type="assistant",
                            input_type="voice",
                            ai_confidence=voice_result.get("confidence", 0.0)
                        ),
                        user_id=current_user.id,
                        bill_id=bill.id
                    )
                    return AIAnalysisResponse(
                        message=f"语音识别：{text}\n{text_result.get('message', '')}",
                        bill=bill_data,
                        confidence=voice_result.get("confidence", 0.0)
                    )
                
                # 保存AI回复
                ai_message = create_chat_message(
                    db=db,
                    message=ChatMessageCreate(
                        content=f"语音识别：{text}\n{text_result.get('message', '')}",
                        message_type="assistant",
                        input_type="voice",
                        ai_confidence=voice_result.get("confidence", 0.0)
                    ),
                    user_id=current_user.id
                )
                return AIAnalysisResponse(
                    message=f"语音识别：{text}\n{text_result.get('message', '')}",
                    bill=None,
                    confidence=voice_result.get("confidence", 0.0)
                )
            else:
                # 保存AI回复
                ai_message = create_chat_message(
                    db=db,
                    message=ChatMessageCreate(
                        content=voice_result.get("message", "语音识别失败"),
                        message_type="assistant",
                        input_type="voice",
                        ai_confidence=0.0
                    ),
                    user_id=current_user.id
                )
                return AIAnalysisResponse(
                    message=voice_result.get("message", "语音识别失败"),
                    bill=None,
                    confidence=0.0
                )
        else:
            # 纯文本分析
            result = ai_service.analyze_text(request.message)
            if result.get("has_bill", False):
                bill_data = result.get("bill")
                # 创建账单
                bill_data_with_date = {**bill_data, "date": datetime.now()}
                bill_create = BillCreate(**bill_data_with_date)
                bill = create_bill(db=db, bill=bill_create, user_id=current_user.id)
                # 保存AI回复并关联账单
                ai_message = create_chat_message(
                    db=db,
                    message=ChatMessageCreate(
                        content=result.get("message", "识别到账单信息"),
                        message_type="assistant",
                        input_type="text",
                        ai_confidence=0.9
                    ),
                    user_id=current_user.id,
                    bill_id=bill.id
                )
                return AIAnalysisResponse(
                    message=result.get("message", "识别到账单信息"),
                    bill=bill_data,
                    confidence=0.9
                )
            
            # 保存AI回复
            ai_message = create_chat_message(
                db=db,
                message=ChatMessageCreate(
                    content=result.get("message", "未识别到账单信息"),
                    message_type="assistant",
                    input_type="text",
                    ai_confidence=0.0
                ),
                user_id=current_user.id
            )
            return AIAnalysisResponse(
                message=result.get("message", "未识别到账单信息"),
                bill=None,
                confidence=0.0
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI分析失败: {str(e)}")

@app.post("/ai/voice", response_model=VoiceRecognitionResponse)
async def recognize_voice(request: VoiceRecognitionRequest, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    """语音识别"""
    try:
        result = ai_service.recognize_voice(request.audio)
        if result.get("success", False):
            return VoiceRecognitionResponse(
                text=result.get("text", ""),
                confidence=result.get("confidence", 0.0)
            )
        else:
            raise HTTPException(status_code=400, detail=result.get("message", "语音识别失败"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"语音识别失败: {str(e)}")

@app.post("/ai/image", response_model=ImageAnalysisResponse)
async def analyze_image(request: ImageAnalysisRequest, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    """图片分析"""
    try:
        result = ai_service.analyze_image(request.image)
        if result.get("has_bill", False):
            bills = result.get("bills", [])
            return ImageAnalysisResponse(
                text=result.get("message", "识别到账单信息"),
                bills=bills
            )
        return ImageAnalysisResponse(
            text=result.get("message", "未识别到账单信息"),
            bills=[]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"图片分析失败: {str(e)}")

@app.post("/ai/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    """聊天对话"""
    try:
        # 保存用户消息
        user_message = create_chat_message(
            db=db,
            message=ChatMessageCreate(
                content=request.message,
                message_type="user",
                input_type="text"
            ),
            user_id=current_user.id
        )
        
        result = ai_service.chat(request.message)
        
        # 如果有账单信息，创建账单
        bill_ids = []
        if result.get("bills"):
            for bill_data in result["bills"]:
                # 添加默认日期并转换为BillCreate对象
                bill_data_with_date = {**bill_data, "date": datetime.now()}
                bill_create = BillCreate(**bill_data_with_date)
                bill = create_bill(db=db, bill=bill_create, user_id=current_user.id)
                bill_ids.append(bill.id)
        
        # 保存AI回复
        ai_message = create_chat_message(
            db=db,
            message=ChatMessageCreate(
                content=result.get("message", ""),
                message_type="assistant",
                input_type="text",
                ai_confidence=0.9 if result.get("bills") else 0.0
            ),
            user_id=current_user.id,
            bill_id=bill_ids[0] if bill_ids else None
        )
        
        return ChatResponse(
            message=result.get("message", ""),
            bills=result.get("bills", [])
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"聊天失败: {str(e)}") 