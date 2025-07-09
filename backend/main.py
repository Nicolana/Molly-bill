from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from datetime import timedelta, datetime

from database import engine
from models import Base
from schemas import (
    User, UserCreate, Bill, BillCreate, Token, BaseResponse, PaginatedResponse,
    ChatRequest, ChatResponse, ChatMessage, ChatHistoryResponse, ChatMessageCreate, LoginRequest
)
from crud import create_user, get_user_by_email, verify_password, get_bills, get_bills_count, create_bill, delete_bill, create_chat_message, get_chat_messages, get_chat_messages_count, get_recent_chat_messages, delete_chat_message
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

@app.get("/bills/", response_model=BaseResponse)
async def read_bills(skip: int = 0, limit: int = 100, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    bills = get_bills(db, user_id=current_user.id, skip=skip, limit=limit)
    # 将SQLAlchemy模型转换为Pydantic模型
    bill_schemas = []
    for bill in bills:
        bill_schema = Bill(
            id=bill.id,
            amount=bill.amount,
            category=bill.category,
            description=bill.description,
            date=bill.date,
            owner_id=bill.owner_id
        )
        bill_schemas.append(bill_schema)
    
    # 获取总数
    total = get_bills_count(db, user_id=current_user.id)
    return success_response(
        data={
            "data": bill_schemas,
            "total": total,
            "skip": skip,
            "limit": limit
        },
        message="获取账单列表成功"
    )



@app.delete("/bills/{bill_id}", response_model=BaseResponse)
async def delete_user_bill(bill_id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    success = delete_bill(db=db, bill_id=bill_id, user_id=current_user.id)
    if not success:
        return error_response("账单不存在", "BILL_NOT_FOUND")
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
@app.get("/chat/messages", response_model=BaseResponse)
async def get_chat_history(
    skip: int = 0, 
    limit: int = 50, 
    current_user = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """获取聊天消息历史"""
    messages = get_chat_messages(db, user_id=current_user.id, skip=skip, limit=limit)
    total = get_chat_messages_count(db, user_id=current_user.id)
    
    # 将SQLAlchemy模型转换为Pydantic模型
    message_schemas = []
    for message in messages:
        message_schema = ChatMessage(
            id=message.id,
            content=message.content,
            message_type=message.message_type,
            input_type=message.input_type,
            ai_confidence=message.ai_confidence,
            timestamp=message.timestamp,
            user_id=message.user_id,
            bill_id=message.bill_id,
            is_processed=message.is_processed
        )
        message_schemas.append(message_schema)
    
    return success_response(
        data={
            "data": message_schemas,
            "total": total,
            "skip": skip,
            "limit": limit
        },
        message="获取聊天消息历史成功"
    )

@app.get("/chat/messages/recent", response_model=BaseResponse)
async def get_recent_messages(
    limit: int = 50,
    current_user = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """获取最近的聊天消息"""
    messages = get_recent_chat_messages(db, user_id=current_user.id, limit=limit)
    
    # 将SQLAlchemy模型转换为Pydantic模型
    message_schemas = []
    for message in messages:
        message_schema = ChatMessage(
            id=message.id,
            content=message.content,
            message_type=message.message_type,
            input_type=message.input_type,
            ai_confidence=message.ai_confidence,
            timestamp=message.timestamp,
            user_id=message.user_id,
            bill_id=message.bill_id,
            is_processed=message.is_processed
        )
        message_schemas.append(message_schema)
    
    return success_response(data=message_schemas, message="获取最近聊天消息成功")

@app.delete("/chat/messages/{message_id}", response_model=BaseResponse)
async def delete_message(
    message_id: int,
    current_user = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """删除聊天消息"""
    success = delete_chat_message(db, message_id=message_id, user_id=current_user.id)
    if not success:
        return error_response("消息不存在或无权限删除", "MESSAGE_NOT_FOUND")
    return success_response(message="消息已删除")

# AI聊天端点



@app.post("/ai/chat", response_model=BaseResponse)
async def chat(request: ChatRequest, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    """聊天对话（支持文本、语音、图片）"""
    try:
        # 确定输入类型
        input_type = "text"
        if request.image:
            input_type = "image"
        elif request.audio:
            input_type = "voice"
        
        # 保存用户消息
        user_message = create_chat_message(
            db=db,
            message=ChatMessageCreate(
                content=request.message,
                message_type="user",
                input_type=input_type
            ),
            user_id=current_user.id
        )
        
        # 处理不同类型的输入
        if request.image:
            # 图片分析
            result = ai_service.analyze_image(request.image)
            confidence = 0.9 if result.get("has_bill", False) else 0.0
            message_content = result.get("message", "未识别到账单信息")
            bills = result.get("bills", [])
            
            # 如果有账单信息，创建账单
            bill_ids = []
            if bills:
                for bill_data in bills:
                    bill_data_with_date = {**bill_data, "date": datetime.now()}
                    bill_create = BillCreate(**bill_data_with_date)
                    bill = create_bill(db=db, bill=bill_create, user_id=current_user.id)
                    bill_ids.append(bill.id)
            
            # 保存AI回复
            ai_message = create_chat_message(
                db=db,
                message=ChatMessageCreate(
                    content=message_content,
                    message_type="assistant",
                    input_type="image",
                    ai_confidence=confidence
                ),
                user_id=current_user.id,
                bill_id=bill_ids[0] if bill_ids else None
            )
            
            return success_response(
                data={
                    "message": message_content,
                    "bills": bills,
                    "confidence": confidence
                },
                message="图片分析完成"
            )
            
        elif request.audio:
            # 语音识别
            voice_result = ai_service.recognize_voice(request.audio)
            if voice_result.get("success", False):
                text = voice_result.get("text", "")
                confidence = voice_result.get("confidence", 0.0)
                
                # 继续分析文本
                text_result = ai_service.analyze_text(text)
                message_content = f"语音识别：{text}\n{text_result.get('message', '')}"
                bills = []
                
                if text_result.get("has_bill", False):
                    bill_data = text_result.get("bill")
                    bills = [bill_data]
                    # 创建账单
                    bill_data_with_date = {**bill_data, "date": datetime.now()}
                    bill_create = BillCreate(**bill_data_with_date)
                    bill = create_bill(db=db, bill=bill_create, user_id=current_user.id)
                    
                    # 保存AI回复并关联账单
                    ai_message = create_chat_message(
                        db=db,
                        message=ChatMessageCreate(
                            content=message_content,
                            message_type="assistant",
                            input_type="voice",
                            ai_confidence=confidence
                        ),
                        user_id=current_user.id,
                        bill_id=bill.id
                    )
                else:
                    # 保存AI回复
                    ai_message = create_chat_message(
                        db=db,
                        message=ChatMessageCreate(
                            content=message_content,
                            message_type="assistant",
                            input_type="voice",
                            ai_confidence=confidence
                        ),
                        user_id=current_user.id
                    )
                
                return success_response(
                    data={
                        "message": message_content,
                        "bills": bills,
                        "confidence": confidence
                    },
                    message="语音识别完成"
                )
            else:
                # 语音识别失败
                error_message = voice_result.get("message", "语音识别失败")
                ai_message = create_chat_message(
                    db=db,
                    message=ChatMessageCreate(
                        content=error_message,
                        message_type="assistant",
                        input_type="voice",
                        ai_confidence=0.0
                    ),
                    user_id=current_user.id
                )
                return error_response(
                    message=error_message,
                    error_code="VOICE_RECOGNITION_FAILED",
                    data={
                        "message": error_message,
                        "bills": [],
                        "confidence": 0.0
                    }
                )
        else:
            # 纯文本聊天
            result = ai_service.chat(request.message)
            confidence = 0.9 if result.get("bills") else 0.0
            bills = result.get("bills", [])
            
            # 如果有账单信息，创建账单
            bill_ids = []
            if bills:
                for bill_data in bills:
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
                    ai_confidence=confidence
                ),
                user_id=current_user.id,
                bill_id=bill_ids[0] if bill_ids else None
            )
            
            return success_response(
                data={
                    "message": result.get("message", ""),
                    "bills": bills,
                    "confidence": confidence
                },
                message="聊天回复完成"
            )
    except Exception as e:
        return error_response(
            message=f"聊天失败: {str(e)}",
            error_code="CHAT_ERROR"
        ) 