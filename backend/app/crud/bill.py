from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.models import Bill
from app.schemas.bill import BillCreate

def get_bills(db: Session, ledger_id: int, skip: int = 0, limit: int = 100, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None):
    """获取账本账单，支持时间筛选"""
    query = db.query(Bill).filter(Bill.ledger_id == ledger_id)
    
    # 添加时间筛选
    if start_date and end_date:
        query = query.filter(Bill.date >= start_date, Bill.date <= end_date)
    
    return query.order_by(Bill.date.desc()).offset(skip).limit(limit).all()

def get_bills_count(db: Session, ledger_id: int, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None):
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

def get_bill(db: Session, bill_id: int):
    """获取单个账单"""
    return db.query(Bill).filter(Bill.id == bill_id).first()

def update_bill(db: Session, bill_id: int, user_id: int, **kwargs):
    """更新账单"""
    bill = db.query(Bill).filter(Bill.id == bill_id, Bill.owner_id == user_id).first()
    if bill:
        for key, value in kwargs.items():
            if hasattr(bill, key):
                setattr(bill, key, value)
        db.commit()
        db.refresh(bill)
        return bill
    return None

def delete_bill(db: Session, bill_id: int, user_id: int):
    bill = db.query(Bill).filter(Bill.id == bill_id, Bill.owner_id == user_id).first()
    if bill:
        db.delete(bill)
        db.commit()
        return True
    return False 