from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.models import Bill
from app.schemas.bill import BillCreate

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
    if db_bill.category:
        from app.crud.budget import update_budget_spent
        update_budget_spent(db, db_bill.ledger_id, db_bill.category, db_bill.amount, db_bill.type)
    
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
        old_amount = bill.amount
        old_type = bill.type
        
        for key, value in kwargs.items():
            if hasattr(bill, key):
                setattr(bill, key, value)
        db.commit()
        db.refresh(bill)
        
        # 重新计算相关预算
        from app.crud.budget import recalculate_budget_spent, get_active_budgets_by_category
        current_date = datetime.utcnow()
        
        # 重新计算原分类的预算
        if old_category:
            old_budgets = get_active_budgets_by_category(db, bill.ledger_id, old_category, current_date)
            for budget in old_budgets:
                recalculate_budget_spent(db, budget.id)
        
        # 重新计算新分类的预算
        if bill.category and bill.category != old_category:
            new_budgets = get_active_budgets_by_category(db, bill.ledger_id, bill.category, current_date)
            for budget in new_budgets:
                recalculate_budget_spent(db, budget.id)
        
        return bill
    return None

def delete_bill(db: Session, bill_id: int, user_id: int):
    print("Bill Id =", bill_id)
    print("User id =", user_id)
    bill = db.query(Bill).filter(Bill.id == bill_id, Bill.owner_id == user_id).first()
    print("Bill =", bill)
    if bill:
        # 保存账单信息用于重新计算预算
        ledger_id = bill.ledger_id
        category = bill.category
        
        db.delete(bill)
        db.commit()
        
        # 重新计算相关预算
        if category:
            from app.crud.budget import recalculate_budget_spent, get_active_budgets_by_category
            current_date = datetime.utcnow()
            budgets = get_active_budgets_by_category(db, ledger_id, category, current_date)
            for budget in budgets:
                recalculate_budget_spent(db, budget.id)
        
        return True
    return False 