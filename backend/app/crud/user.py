from sqlalchemy.orm import Session
from app.models import User
from app.schemas.user import UserCreate
from app.core.security.password import get_password_hash
from app.crud.ledger import create_personal_ledger

def get_user(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user: UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user: User = User(
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