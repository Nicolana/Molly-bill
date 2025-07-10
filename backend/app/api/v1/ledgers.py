from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security.auth import get_current_user
from app.db.database import get_db
from app.crud.ledger import get_user_ledgers
from app.schemas.base import BaseResponse
from app.utils.response import success_response

router = APIRouter()

@router.get("/", response_model=BaseResponse)
async def get_user_ledgers_list(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取用户的所有账本"""
    ledgers = get_user_ledgers(db, current_user.id)
    return success_response(
        data=ledgers,
        message="获取账本列表成功"
    ) 