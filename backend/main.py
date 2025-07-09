from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from datetime import timedelta

from database import engine
from models import Base
from schemas import User, UserCreate, Bill, BillCreate, Token, AIAnalysisRequest, AIAnalysisResponse, VoiceRecognitionRequest, VoiceRecognitionResponse, ImageAnalysisRequest, ImageAnalysisResponse, ChatRequest, ChatResponse
from crud import create_user, get_user_by_email, verify_password, get_bills, create_bill, delete_bill
from deps import create_access_token, get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES, get_db
from ai_service import ai_service

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

@app.get("/")
def read_root():
    return {"msg": "Molly Bill API 在线"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/register", response_model=User)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="邮箱已被注册")
    return create_user(db=db, user=user)

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = get_user_by_email(db, email=form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/bills/", response_model=List[Bill])
async def read_bills(skip: int = 0, limit: int = 100, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    bills = get_bills(db, user_id=current_user.id, skip=skip, limit=limit)
    return bills

@app.post("/bills/", response_model=Bill)
async def create_user_bill(bill: BillCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return create_bill(db=db, bill=bill, user_id=current_user.id)

@app.delete("/bills/{bill_id}")
async def delete_user_bill(bill_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    success = delete_bill(db=db, bill_id=bill_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="账单不存在")
    return {"message": "账单已删除"}

@app.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

# AI相关端点
@app.post("/ai/analyze", response_model=AIAnalysisResponse)
async def analyze_input(request: AIAnalysisRequest, current_user: User = Depends(get_current_user)):
    """分析用户输入（文本、图片、音频）"""
    try:
        if request.image:
            # 分析图片
            result = ai_service.analyze_image(request.image)
            if result.get("has_bill", False):
                bills = result.get("bills", [])
                if bills:
                    return AIAnalysisResponse(
                        message=result.get("message", "识别到账单信息"),
                        bill=bills[0],  # 返回第一个账单
                        confidence=0.9
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
                    bill = text_result.get("bill")
                    return AIAnalysisResponse(
                        message=f"语音识别：{text}\n{text_result.get('message', '')}",
                        bill=bill,
                        confidence=voice_result.get("confidence", 0.0)
                    )
                return AIAnalysisResponse(
                    message=f"语音识别：{text}\n{text_result.get('message', '')}",
                    bill=None,
                    confidence=voice_result.get("confidence", 0.0)
                )
            else:
                return AIAnalysisResponse(
                    message=voice_result.get("message", "语音识别失败"),
                    bill=None,
                    confidence=0.0
                )
        else:
            # 纯文本分析
            result = ai_service.analyze_text(request.message)
            if result.get("has_bill", False):
                bill = result.get("bill")
                return AIAnalysisResponse(
                    message=result.get("message", "识别到账单信息"),
                    bill=bill,
                    confidence=0.9
                )
            return AIAnalysisResponse(
                message=result.get("message", "未识别到账单信息"),
                bill=None,
                confidence=0.0
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI分析失败: {str(e)}")

@app.post("/ai/voice", response_model=VoiceRecognitionResponse)
async def recognize_voice(request: VoiceRecognitionRequest, current_user: User = Depends(get_current_user)):
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
async def analyze_image(request: ImageAnalysisRequest, current_user: User = Depends(get_current_user)):
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
async def chat(request: ChatRequest, current_user: User = Depends(get_current_user)):
    """聊天对话"""
    try:
        result = ai_service.chat(request.message)
        return ChatResponse(
            message=result.get("message", ""),
            bill=result.get("bill")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"聊天失败: {str(e)}") 