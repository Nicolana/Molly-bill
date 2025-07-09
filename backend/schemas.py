from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class BillBase(BaseModel):
    amount: float
    category: Optional[str] = None
    description: Optional[str] = None
    date: Optional[datetime] = None

class BillCreate(BillBase):
    pass

class Bill(BillBase):
    id: int
    owner_id: int
    date: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# AI相关模型
class AIAnalysisRequest(BaseModel):
    message: str
    image: Optional[str] = None  # base64编码的图片
    audio: Optional[str] = None  # base64编码的音频

class AIAnalysisResponse(BaseModel):
    message: str
    bill: Optional[BillCreate] = None
    confidence: Optional[float] = None

class VoiceRecognitionRequest(BaseModel):
    audio: str  # base64编码的音频

class VoiceRecognitionResponse(BaseModel):
    text: str
    confidence: float

class ImageAnalysisRequest(BaseModel):
    image: str  # base64编码的图片

class ImageAnalysisResponse(BaseModel):
    text: str
    bills: List[BillCreate]

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    message: str
    bill: Optional[BillCreate] = None 