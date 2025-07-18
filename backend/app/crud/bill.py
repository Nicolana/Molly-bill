from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.models import Bill
from app.schemas.bill import BillCreate
from app.crud.budget import update_budget_spent, recalculate_budget_spent, get_active_budgets_by_category

def get_bills(db: Session, ledger_id: int, skip: int = 0, limit: int = 100, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None):
    """获取账本账单，支持时间筛选和分页"""
    query = db.query(Bill).filter(Bill.ledger_id == ledger_id)
    
    # 添加时间筛选
    if start_date and end_date:
        query = query.filter(Bill.date >= start_date, Bill.date <= end_date)
    
    return query.order_by(Bill.date.desc()).offset(skip).limit(limit).all()

def get_bills_no_pagination(db: Session, user_id: int, ledger_id: int, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None):
    """获取账本账单，支持时间筛选，不分页"""
    query = db.query(Bill).filter(Bill.ledger_id == ledger_id, Bill.owner_id == user_id)
    
    # 添加时间筛选
    if start_date and end_date:
        query = query.filter(Bill.date >= start_date, Bill.date <= end_date)
    
    return query.order_by(Bill.date.desc()).all()

def get_bills_count(db: Session, ledger_id: int, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None):
    """获取账本账单总数，支持时间筛选"""
    query = db.query(Bill).filter(Bill.ledger_id == ledger_id)
    
    # 添加时间筛选
    if start_date and end_date:
        query = query.filter(Bill.date >= start_date, Bill.date <= end_date)
    
    return query.count()

def create_bill(db: Session, bill: BillCreate, user_id: int):
    bill_data = bill.model_dump()
    bill_data['owner_id'] = user_id
    db_bill = Bill(**bill_data)
    db.add(db_bill)
    db.commit()
    db.refresh(db_bill)
    
    # 更新预算进度
    update_budget_spent(db, db_bill.ledger_id, db_bill.amount, db_bill.type, db_bill.date)
    
    return db_bill

def get_bill(db: Session, bill_id: int):
    """获取单个账单"""
    return db.query(Bill).filter(Bill.id == bill_id).first()

def update_bill(db: Session, bill_id: int, user_id: int, **kwargs):
    """更新账单"""
    bill = db.query(Bill).filter(Bill.id == bill_id, Bill.owner_id == user_id).first()
    if bill:
        # 保存原始值以便重新计算预算
        old_category = bill.category
        
        for key, value in kwargs.items():
            if hasattr(bill, key):
                setattr(bill, key, value)
        db.commit()
        db.refresh(bill)
        
        # 重新计算该区间内的预算开销
        old_budgets = get_active_budgets_by_category(db, bill.ledger_id, bill.date)
        for budget in old_budgets:
            recalculate_budget_spent(db, budget.id)
        
        return bill
    return None

def delete_bill(db: Session, bill_id: int, user_id: int):
    bill = db.query(Bill).filter(Bill.id == bill_id, Bill.owner_id == user_id).first()
    if bill:
        # 保存账单信息用于重新计算预算
        ledger_id = bill.ledger_id
        
        db.delete(bill)
        db.commit()
        
        budgets = get_active_budgets_by_category(db, ledger_id, bill.date)
        for budget in budgets:
            recalculate_budget_spent(db, budget.id)
        
        return True
    return False 