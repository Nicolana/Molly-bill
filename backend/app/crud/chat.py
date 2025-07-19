from sqlalchemy.orm import Session
from typing import Optional, List
from app.models import ChatMessage, MessageBill, Bill
from app.schemas.chat import ChatMessageCreate

def create_chat_message(db: Session, message: ChatMessageCreate, user_id: int):
    """创建聊天消息"""
    db_message = ChatMessage(
        content=message.content,
        message_type=message.message_type,
        input_type=message.input_type,
        ai_confidence=message.ai_confidence,
        user_id=user_id,
        ledger_id=message.ledger_id,
        is_processed=False  # 默认未处理，当关联账单后会更新
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

def create_message_bill_association(db: Session, message_id: int, bill_id: int, confidence: Optional[float] = None):
    """创建消息和账单的关联"""
    # 检查关联是否已存在
    existing = db.query(MessageBill).filter(
        MessageBill.message_id == message_id,
        MessageBill.bill_id == bill_id
    ).first()

    if existing:
        return existing

    # 创建新的关联
    message_bill = MessageBill(
        message_id=message_id,
        bill_id=bill_id,
        confidence=confidence
    )
    db.add(message_bill)

    # 更新消息的处理状态
    message = db.query(ChatMessage).filter(ChatMessage.id == message_id).first()
    if message:
        message.is_processed = True

    db.commit()
    db.refresh(message_bill)
    return message_bill

def create_message_bills_associations(db: Session, message_id: int, bill_ids: List[int], confidence: Optional[float] = None):
    """批量创建消息和多个账单的关联"""
    associations = []
    for bill_id in bill_ids:
        association = create_message_bill_association(db, message_id, bill_id, confidence)
        associations.append(association)
    return associations

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
    ).order_by(ChatMessage.timestamp.desc()).limit(limit).all()

def get_message_bills(db: Session, message_id: int):
    """获取消息关联的所有账单"""
    message_bills = db.query(MessageBill).filter(
        MessageBill.message_id == message_id
    ).all()

    bills = []
    for mb in message_bills:
        bill = db.query(Bill).filter(Bill.id == mb.bill_id).first()
        if bill:
            bills.append(bill)

    return bills

def get_bill_messages(db: Session, bill_id: int):
    """获取账单关联的所有消息"""
    message_bills = db.query(MessageBill).filter(
        MessageBill.bill_id == bill_id
    ).all()

    messages = []
    for mb in message_bills:
        message = db.query(ChatMessage).filter(ChatMessage.id == mb.message_id).first()
        if message:
            messages.append(message)

    return messages