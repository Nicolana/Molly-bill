from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime, timedelta
from app.models import Ledger, UserLedger, UserRole, LedgerStatus
from app.schemas.ledger import LedgerCreate
from app.core.config.settings import settings

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

def get_user_current_ledger(db: Session, user_id: int):
    """获取用户当前账本"""
    return db.query(UserLedger).options(
        joinedload(UserLedger.ledger)
    ).filter(
        UserLedger.user_id == user_id,
        UserLedger.status == "active"
    ).first()

def get_user_ledgers(db: Session, user_id: int):
    """获取用户的所有账本"""
    return db.query(UserLedger).options(
        joinedload(UserLedger.ledger)
    ).filter(
        UserLedger.user_id == user_id,
        UserLedger.status == "active"
    ).join(UserLedger.ledger).filter(Ledger.status == LedgerStatus.ACTIVE).all()

def get_ledger(db: Session, ledger_id: int):
    """获取账本信息"""
    return db.query(Ledger).filter(Ledger.id == ledger_id).first()

def get_ledger_members(db: Session, ledger_id: int):
    """获取账本成员"""
    return db.query(UserLedger).filter(
        UserLedger.ledger_id == ledger_id,
        UserLedger.status == "active"
    ).all()

def remove_ledger_member(db: Session, ledger_id: int, user_id: int):
    """从账本中移除成员"""
    user_ledger = db.query(UserLedger).filter(
        UserLedger.user_id == user_id,
        UserLedger.ledger_id == ledger_id,
        UserLedger.status == "active"
    ).first()
    
    if user_ledger:
        # 设置状态为 inactive 而不是删除记录
        user_ledger.status = "inactive"
        db.commit()
        return True
    return False

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
    # 将当前管理员改为普通成员
    current_admins = db.query(UserLedger).filter(
        UserLedger.ledger_id == ledger_id,
        UserLedger.role == UserRole.ADMIN,
        UserLedger.status == "active"
    ).all()
    
    for admin in current_admins:
        admin.role = UserRole.MEMBER
    
    # 将新用户设为管理员
    new_admin = db.query(UserLedger).filter(
        UserLedger.user_id == new_owner_id,
        UserLedger.ledger_id == ledger_id,
        UserLedger.status == "active"
    ).first()
    
    if new_admin:
        new_admin.role = UserRole.ADMIN
    else:
        # 如果用户不在账本中，创建新记录
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

        db.query(UserLedger).filter(UserLedger.ledger_id == ledger_id, UserLedger.status == "active").update({"status": "inactive"})
        db.commit()
        return True
    return False

def restore_ledger(db: Session, ledger_id: int):
    """从回收站恢复账本"""
    ledger = db.query(Ledger).filter(Ledger.id == ledger_id).first()
    if ledger and ledger.status == LedgerStatus.DELETED:
        ledger.status = LedgerStatus.ACTIVE
        ledger.deleted_at = None
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

def cleanup_expired_data(db: Session):
    """清理过期数据：删除3个月前的已删除账本"""
    three_months_ago = datetime.utcnow() - timedelta(days=settings.recycle_bin_expire_days)
    expired_ledgers = db.query(Ledger).filter(
        Ledger.status == LedgerStatus.DELETED,
        Ledger.deleted_at < three_months_ago
    ).all()
    
    for ledger in expired_ledgers:
        db.delete(ledger)
    
    db.commit()
    return len(expired_ledgers) 

def check_user_ledger_owner(db: Session, user_id: int, ledger_id: int):
    """检查用户是否是账本拥有者（最早加入的管理员）"""
    # 获取该账本中最早加入的管理员
    earliest_admin = db.query(UserLedger).filter(
        UserLedger.ledger_id == ledger_id,
        UserLedger.role == UserRole.ADMIN,
        UserLedger.status == "active"
    ).order_by(UserLedger.joined_at.asc()).first()
    
    return earliest_admin and earliest_admin.user_id == user_id 