from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models import User
from app.schemas.chat import ChatRequest, ChatResponse
from app.core.security.auth import get_current_user
from app.services.ai.service import ai_service

router = APIRouter()

@router.post("/", response_model=ChatResponse)
async def chat_with_ai(
    chat_request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """与AI聊天"""
    try:
        response = await ai_service.chat(chat_request.message)
        return ChatResponse(
            message=response,
            user_id=current_user.id
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI服务错误: {str(e)}"
        ) 