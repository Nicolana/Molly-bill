from sqlalchemy.orm import Session
from typing import Optional
from app.models import ChatMessage
from app.schemas.chat import ChatMessageCreate

def create_chat_message(db: Session, message: ChatMessageCreate, user_id: int, bill_id: Optional[int] = None):
    """创建聊天消息"""
    db_message = ChatMessage(
        content=message.content,
        message_type=message.message_type,
        input_type=message.input_type,
        ai_confidence=message.ai_confidence,
        user_id=user_id,
        ledger_id=message.ledger_id,
        bill_id=bill_id,
        is_processed=bill_id is not None
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

def get_chat_messages(db: Session, ledger_id: int, skip: int = 0, limit: int = 100):
    """获取账本的聊天消息历史"""
    return db.query(ChatMessage).filter(
        ChatMessage.ledger_id == ledger_id
    ).order_by(ChatMessage.timestamp.desc()).offset(skip).limit(limit).all()

def get_chat_messages_count(db: Session, ledger_id: int):
    """获取账本聊天消息总数"""
    return db.query(ChatMessage).filter(ChatMessage.ledger_id == ledger_id).count()

def update_chat_message_bill(db: Session, message_id: int, bill_id: int):
    """更新聊天消息关联的账单"""
    message = db.query(ChatMessage).filter(ChatMessage.id == message_id).first()
    if message:
        message.bill_id = bill_id
        message.is_processed = True
        db.commit()
        db.refresh(message)
        return message
    return None

def delete_chat_message(db: Session, message_id: int, user_id: int):
    """删除聊天消息"""
    message = db.query(ChatMessage).filter(
        ChatMessage.id == message_id, 
        ChatMessage.user_id == user_id
    ).first()
    if message:
        db.delete(message)
        db.commit()
        return True
    return False

def get_recent_chat_messages(db: Session, ledger_id: int, limit: int = 50):
    """获取账本最近的聊天消息（按时间正序），包含关联的账单信息"""
    return db.query(ChatMessage).filter(
        ChatMessage.ledger_id == ledger_id
    ).order_by(ChatMessage.timestamp.asc()).limit(limit).all() 