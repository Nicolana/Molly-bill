from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine
from app.models.base import Base, User, Bill, ChatMessage, Ledger, UserLedger, Invitation
from app.crud.ledger import create_personal_ledger
from app.crud.user import get_user_by_email
from datetime import datetime

def migrate_database():
    """数据库迁移：为现有用户创建个人账本，为现有数据添加ledger_id"""
    db = SessionLocal()
    try:
        # 1. 为现有用户创建个人账本
        users = db.query(User).all()
        for user in users:
            # 检查用户是否已有账本
            existing_ledger = db.query(UserLedger).filter(
                UserLedger.user_id == user.id
            ).first()
            
            if not existing_ledger:
                # 为用户创建个人账本
                username = user.username or user.email.split('@')[0]
                create_personal_ledger(db, user.id, username)
                print(f"为用户 {user.email} 创建了个人账本")
        
        # 2. 为现有账单添加ledger_id（如果还没有）
        bills_without_ledger = db.query(Bill).filter(Bill.ledger_id.is_(None)).all()
        for bill in bills_without_ledger:
            # 获取用户的第一个账本
            user_ledger = db.query(UserLedger).filter(
                UserLedger.user_id == bill.owner_id
            ).first()
            
            if user_ledger:
                bill.ledger_id = user_ledger.ledger_id
                print(f"为账单 {bill.id} 添加了ledger_id: {user_ledger.ledger_id}")
        
        # 3. 为现有聊天消息添加ledger_id（如果还没有）
        messages_without_ledger = db.query(ChatMessage).filter(ChatMessage.ledger_id.is_(None)).all()
        for message in messages_without_ledger:
            # 获取用户的第一个账本
            user_ledger = db.query(UserLedger).filter(
                UserLedger.user_id == message.user_id
            ).first()
            
            if user_ledger:
                message.ledger_id = user_ledger.ledger_id
                print(f"为聊天消息 {message.id} 添加了ledger_id: {user_ledger.ledger_id}")
        
        db.commit()
        print("数据库迁移完成")
        
    except Exception as e:
        db.rollback()
        print(f"数据库迁移失败: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate_database() 