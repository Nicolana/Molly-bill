from sqlalchemy.orm import Session
from models import User, Bill, ChatMessage, Ledger, UserLedger, Invitation, UserRole, InvitationStatus, LedgerStatus
from schemas import UserCreate, BillCreate, ChatMessageCreate, LedgerCreate, UserLedgerCreate, InvitationCreate
from passlib.context import CryptContext
from typing import List, Optional
from datetime import datetime, timedelta
import secrets

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
    db_user = User(
        email=user.email, 
        username=user.username,
        avatar=user.avatar,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # 为新用户创建个人账本
    create_personal_ledger(db, db_user.id, user.username or user.email.split('@')[0])
    
    return db_user

# 账本相关操作
def create_ledger(db: Session, ledger: LedgerCreate, owner_id: int):
    """创建账本"""
    db_ledger = Ledger(**ledger.model_dump())
    db.add(db_ledger)
    db.commit()
    db.refresh(db_ledger)
    
    # 创建者自动成为管理员
    user_ledger = UserLedger(
        user_id=owner_id,
        ledger_id=db_ledger.id,
        role=UserRole.ADMIN
    )
    db.add(user_ledger)
    db.commit()
    
    return db_ledger

def create_personal_ledger(db: Session, user_id: int, username: str):
    """为用户创建个人账本"""
    ledger = LedgerCreate(
        name=f"{username}的个人账本",
        description="个人财务管理账本"
    )
    return create_ledger(db, ledger, user_id)

def get_user_ledgers(db: Session, user_id: int):
    """获取用户的所有账本"""
    return db.query(UserLedger).filter(
        UserLedger.user_id == user_id,
        UserLedger.status == "active"
    ).all()

def get_ledger(db: Session, ledger_id: int):
    """获取账本信息"""
    return db.query(Ledger).filter(Ledger.id == ledger_id).first()

def get_ledger_members(db: Session, ledger_id: int):
    """获取账本成员"""
    return db.query(UserLedger).filter(
        UserLedger.ledger_id == ledger_id,
        UserLedger.status == "active"
    ).all()

def check_user_ledger_access(db: Session, user_id: int, ledger_id: int):
    """检查用户是否有账本访问权限"""
    return db.query(UserLedger).filter(
        UserLedger.user_id == user_id,
        UserLedger.ledger_id == ledger_id,
        UserLedger.status == "active"
    ).first()

def check_user_ledger_admin(db: Session, user_id: int, ledger_id: int):
    """检查用户是否是账本管理员"""
    return db.query(UserLedger).filter(
        UserLedger.user_id == user_id,
        UserLedger.ledger_id == ledger_id,
        UserLedger.role == UserRole.ADMIN,
        UserLedger.status == "active"
    ).first()

def transfer_ledger_ownership(db: Session, ledger_id: int, new_owner_id: int):
    """转让账本所有权"""
    # 将新用户设为管理员
    new_admin = UserLedger(
        user_id=new_owner_id,
        ledger_id=ledger_id,
        role=UserRole.ADMIN
    )
    db.add(new_admin)
    db.commit()
    return True

def delete_ledger(db: Session, ledger_id: int):
    """删除账本（移动到回收站）"""
    ledger = db.query(Ledger).filter(Ledger.id == ledger_id).first()
    if ledger:
        ledger.status = LedgerStatus.DELETED
        ledger.deleted_at = datetime.utcnow()
        db.commit()
        return True
    return False

def permanently_delete_ledger(db: Session, ledger_id: int):
    """永久删除账本"""
    ledger = db.query(Ledger).filter(Ledger.id == ledger_id).first()
    if ledger:
        db.delete(ledger)
        db.commit()
        return True
    return False

# 邀请相关操作
def create_invitation(db: Session, invitation: InvitationCreate, inviter_id: int):
    """创建邀请"""
    # 设置过期时间为1天后
    expires_at = datetime.utcnow() + timedelta(days=1)
    
    db_invitation = Invitation(
        ledger_id=invitation.ledger_id,
        inviter_id=inviter_id,
        invitee_email=invitation.invitee_email,
        role=invitation.role,
        expires_at=expires_at
    )
    db.add(db_invitation)
    db.commit()
    db.refresh(db_invitation)
    return db_invitation

def get_invitation(db: Session, invitation_id: int):
    """获取邀请信息"""
    return db.query(Invitation).filter(Invitation.id == invitation_id).first()

def get_ledger_invitations(db: Session, ledger_id: int):
    """获取账本的所有邀请"""
    return db.query(Invitation).filter(Invitation.ledger_id == ledger_id).all()

def accept_invitation(db: Session, invitation_id: int, user_id: int):
    """接受邀请"""
    invitation = db.query(Invitation).filter(Invitation.id == invitation_id).first()
    if not invitation:
        return False
    
    # 检查邀请是否过期
    if invitation.expires_at < datetime.utcnow():
        invitation.status = InvitationStatus.EXPIRED
        db.commit()
        return False
    
    # 检查用户是否已经在账本中
    existing_membership = db.query(UserLedger).filter(
        UserLedger.user_id == user_id,
        UserLedger.ledger_id == invitation.ledger_id
    ).first()
    
    if existing_membership:
        # 如果已存在，更新状态为活跃
        existing_membership.status = "active"
        existing_membership.role = invitation.role
    else:
        # 创建新的用户账本关联
        user_ledger = UserLedger(
            user_id=user_id,
            ledger_id=invitation.ledger_id,
            role=invitation.role
        )
        db.add(user_ledger)
    
    # 更新邀请状态
    invitation.status = InvitationStatus.ACCEPTED
    invitation.accepted_at = datetime.utcnow()
    db.commit()
    return True

def reject_invitation(db: Session, invitation_id: int):
    """拒绝邀请"""
    invitation = db.query(Invitation).filter(Invitation.id == invitation_id).first()
    if invitation:
        invitation.status = InvitationStatus.REJECTED
        db.commit()
        return True
    return False

def expire_invitations(db: Session):
    """过期过期的邀请"""
    expired_invitations = db.query(Invitation).filter(
        Invitation.status == InvitationStatus.PENDING,
        Invitation.expires_at < datetime.utcnow()
    ).all()
    
    for invitation in expired_invitations:
        invitation.status = InvitationStatus.EXPIRED
    
    db.commit()
    return len(expired_invitations)

# 账单相关操作（更新以支持账本）
def get_bills(db: Session, user_id: int, ledger_id: int, skip: int = 0, limit: int = 100, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None):
    """获取账本账单，支持时间筛选"""
    query = db.query(Bill).filter(Bill.ledger_id == ledger_id)
    
    # 添加时间筛选
    if start_date and end_date:
        query = query.filter(Bill.date >= start_date, Bill.date <= end_date)
    
    return query.order_by(Bill.date.desc()).offset(skip).limit(limit).all()

def get_bills_count(db: Session, user_id: int, ledger_id: int, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None):
    """获取账本账单总数，支持时间筛选"""
    query = db.query(Bill).filter(Bill.ledger_id == ledger_id)
    
    # 添加时间筛选
    if start_date and end_date:
        query = query.filter(Bill.date >= start_date, Bill.date <= end_date)
    
    return query.count()

def create_bill(db: Session, bill: BillCreate, user_id: int):
    db_bill = Bill(**bill.model_dump(), owner_id=user_id)
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

# 聊天消息相关操作（更新以支持账本）
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

def get_chat_messages(db: Session, user_id: int, ledger_id: int, skip: int = 0, limit: int = 100):
    """获取账本的聊天消息历史"""
    return db.query(ChatMessage).filter(
        ChatMessage.ledger_id == ledger_id
    ).order_by(ChatMessage.timestamp.desc()).offset(skip).limit(limit).all()

def get_chat_messages_count(db: Session, user_id: int, ledger_id: int):
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

def get_recent_chat_messages(db: Session, user_id: int, ledger_id: int, limit: int = 50):
    """获取账本最近的聊天消息（按时间正序），包含关联的账单信息"""
    return db.query(ChatMessage).filter(
        ChatMessage.ledger_id == ledger_id
    ).order_by(ChatMessage.timestamp.asc()).limit(limit).all() 

# 清理过期数据
def cleanup_expired_data(db: Session):
    """清理过期数据：删除3个月前的已删除账本"""
    three_months_ago = datetime.utcnow() - timedelta(days=90)
    expired_ledgers = db.query(Ledger).filter(
        Ledger.status == LedgerStatus.DELETED,
        Ledger.deleted_at < three_months_ago
    ).all()
    
    for ledger in expired_ledgers:
        db.delete(ledger)
    
    db.commit()
    return len(expired_ledgers) 