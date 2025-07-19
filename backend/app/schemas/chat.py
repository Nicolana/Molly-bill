from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.schemas.bill import BillResponse

class ChatMessageBase(BaseModel):
    content: str
    message_type: str  # 'user' or 'assistant'
    input_type: Optional[str] = None  # 'text', 'voice', 'image'
    ai_confidence: Optional[float] = None

class ChatMessageCreate(ChatMessageBase):
    ledger_id: int

class ChatMessageResponse(ChatMessageBase):
    id: int
    timestamp: datetime
    user_id: int
    ledger_id: int
    is_processed: bool
    bills: Optional[List[BillResponse]] = None  # 关联的账单列表

    model_config = ConfigDict(from_attributes=True)

class ChatHistoryResponse(BaseModel):
    messages: List[ChatMessageResponse]
    total: int

class ChatRequest(BaseModel):
    message: str
    ledger_id: Optional[int] = None
    image: Optional[str] = None  # base64编码的图片
    audio: Optional[str] = None  # base64编码的音频

class MessageBillResponse(BaseModel):
    """消息-账单关联响应"""
    id: int
    message_id: int
    bill_id: int
    created_at: datetime
    confidence: Optional[float] = None
    bill: Optional[BillResponse] = None

    model_config = ConfigDict(from_attributes=True)

class ChatResponse(BaseModel):
    message: str
    user_id: int
    bills: Optional[List[BillResponse]] = None
    confidence: Optional[float] = None