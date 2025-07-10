from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class ChatMessageBase(BaseModel):
    content: str
    message_type: str  # 'user' or 'assistant'
    input_type: Optional[str] = None  # 'text', 'voice', 'image'
    ai_confidence: Optional[float] = None

class ChatMessageCreate(ChatMessageBase):
    ledger_id: int

class ChatMessage(ChatMessageBase):
    id: int
    timestamp: datetime
    user_id: int
    ledger_id: int
    bill_id: Optional[int] = None
    is_processed: bool
    
    model_config = ConfigDict(from_attributes=True)

class ChatHistoryResponse(BaseModel):
    messages: List[ChatMessage]
    total: int

class ChatRequest(BaseModel):
    message: str
    ledger_id: int
    image: Optional[str] = None  # base64编码的图片
    audio: Optional[str] = None  # base64编码的音频

class ChatResponse(BaseModel):
    message: str
    bills: Optional[List[dict]] = None
    confidence: Optional[float] = None 