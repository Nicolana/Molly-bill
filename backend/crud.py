from sqlalchemy.orm import Session
from models import User, Bill, ChatMessage
from schemas import UserCreate, BillCreate, ChatMessageCreate
from passlib.context import CryptContext
from typing import List, Optional
from datetime import datetime

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

def get_user(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user: UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_bills(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(Bill).filter(Bill.owner_id == user_id).offset(skip).limit(limit).all()

def get_bills_count(db: Session, user_id: int):
    """获取用户账单总数"""
    return db.query(Bill).filter(Bill.owner_id == user_id).count()

def create_bill(db: Session, bill: BillCreate, user_id: int):
    db_bill = Bill(**bill.dict(), owner_id=user_id)
    db.add(db_bill)
    db.commit()
    db.refresh(db_bill)
    return db_bill

def delete_bill(db: Session, bill_id: int, user_id: int):
    bill = db.query(Bill).filter(Bill.id == bill_id, Bill.owner_id == user_id).first()
    if bill:
        db.delete(bill)
        db.commit()
        return True
    return False

# 聊天消息相关操作
def create_chat_message(db: Session, message: ChatMessageCreate, user_id: int, bill_id: Optional[int] = None):
    """创建聊天消息"""
    db_message = ChatMessage(
        content=message.content,
        message_type=message.message_type,
        input_type=message.input_type,
        ai_confidence=message.ai_confidence,
        user_id=user_id,
        bill_id=bill_id,
        is_processed=bill_id is not None
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

def get_chat_messages(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    """获取用户的聊天消息历史"""
    return db.query(ChatMessage).filter(
        ChatMessage.user_id == user_id
    ).order_by(ChatMessage.timestamp.desc()).offset(skip).limit(limit).all()

def get_chat_messages_count(db: Session, user_id: int):
    """获取用户聊天消息总数"""
    return db.query(ChatMessage).filter(ChatMessage.user_id == user_id).count()

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

def get_recent_chat_messages(db: Session, user_id: int, limit: int = 50):
    """获取最近的聊天消息（按时间正序），包含关联的账单信息"""
    return db.query(ChatMessage).filter(
        ChatMessage.user_id == user_id
    ).order_by(ChatMessage.timestamp.asc()).limit(limit).all() 