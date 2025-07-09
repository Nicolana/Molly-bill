from sqlalchemy.orm import Session
from models import User, Bill
from schemas import UserCreate, BillCreate
from passlib.context import CryptContext

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