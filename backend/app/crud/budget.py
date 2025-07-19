from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional
from datetime import datetime, timedelta

from app.models import Budget, BudgetAlert, Bill
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetStats
from app.models.enums import BudgetStatus, BillType, AlertType

# 预算CRUD操作
def create_budget(db: Session, budget: BudgetCreate, user_id: int) -> Budget:
    """创建预算"""

    # 计算该预算时间范围内的已有支出
    total_spend = db.query(func.sum(Bill.amount)).filter(
        and_(
            Bill.ledger_id == budget.ledger_id,
            Bill.owner_id == user_id,
            Bill.type == BillType.EXPENSE,
            Bill.date >= budget.start_date,
            Bill.date <= budget.end_date
        )
    ).scalar() or 0.0
    budget.spent = total_spend

    db_budget = Budget(
        **budget.model_dump(),
        created_by=user_id
    )
    db.add(db_budget)
    db.commit()
    db.refresh(db_budget)

    print(db_budget)

    return db_budget

def get_budget(db: Session, budget_id: int) -> Optional[Budget]:
    """获取单个预算"""
    return db.query(Budget).filter(Budget.id == budget_id).first()

def get_budgets_by_ledger(
    db: Session, 
    ledger_id: int, 
    status: Optional[BudgetStatus] = None,
    skip: int = 0,
    limit: int = 100
) -> List[Budget]:
    """获取账本的预算列表"""
    query = db.query(Budget).filter(Budget.ledger_id == ledger_id)
    
    if status:
        query = query.filter(Budget.status == status)
    
    return query.offset(skip).limit(limit).all()

def get_active_budgets_by_category(
    db: Session, 
    ledger_id: int, 
    current_date: datetime
) -> List[Budget]:
    """获取指定分类的活跃预算"""
    return db.query(Budget).filter(
        and_(
            Budget.ledger_id == ledger_id,
            Budget.status == BudgetStatus.ACTIVE,
            Budget.start_date <= current_date,
            Budget.end_date >= current_date
        )
    ).all()

def update_budget(db: Session, budget_id: int, budget_update: BudgetUpdate) -> Optional[Budget]:
    """更新预算"""
    db_budget = db.query(Budget).filter(Budget.id == budget_id).first()
    if not db_budget:
        return None
    
    update_data = budget_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_budget, field, value)
    
    db_budget.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_budget)
    return db_budget

def delete_budget(db: Session, budget_id: int) -> bool:
    """删除预算"""
    db_budget = db.query(Budget).filter(Budget.id == budget_id).first()
    if not db_budget:
        return False
    
    db.delete(db_budget)
    db.commit()
    return True

def update_budget_spent(db: Session, ledger_id: int, amount: float, bill_type: BillType, billDate: datetime):
    """更新预算支出金额"""
    if bill_type != BillType.EXPENSE:
        return
    
    active_budgets = get_active_budgets_by_category(db, ledger_id, billDate)
    
    for budget in active_budgets:
        budget.spent += amount
        
        # 检查是否需要创建提醒
        check_and_create_alerts(db, budget)
    
    db.commit()

def recalculate_budget_spent(db: Session, budget_id: int):
    """重新计算预算支出金额"""
    budget = get_budget(db, budget_id)
    if not budget:
        return
    
    # 计算该预算时间范围内的支出总额
    total_spent = db.query(func.sum(Bill.amount)).filter(
        and_(
            Bill.ledger_id == budget.ledger_id,
            Bill.type == BillType.EXPENSE,
            Bill.date >= budget.start_date,
            Bill.date <= budget.end_date
        )
    ).scalar() or 0.0
    
    budget.spent = total_spent
    db.commit()

def get_budget_stats(db: Session, ledger_id: int) -> BudgetStats:
    """获取预算统计信息"""
    current_date = datetime.utcnow()
    
    # 总预算数
    total_budgets = db.query(Budget).filter(Budget.ledger_id == ledger_id).count()
    
    # 活跃预算数
    active_budgets = db.query(Budget).filter(
        and_(
            Budget.ledger_id == ledger_id,
            Budget.status == BudgetStatus.ACTIVE,
            Budget.start_date <= current_date,
            Budget.end_date >= current_date
        )
    ).count()
    
    # 总预算金额和支出
    budget_totals = db.query(
        func.sum(Budget.amount).label('total_amount'),
        func.sum(Budget.spent).label('total_spent')
    ).filter(
        and_(
            Budget.ledger_id == ledger_id,
            Budget.status == BudgetStatus.ACTIVE
        )
    ).first()
    
    total_amount = budget_totals.total_amount or 0.0
    total_spent = budget_totals.total_spent or 0.0
    total_remaining = max(total_amount - total_spent, 0.0)
    
    # 超支和预警预算数
    active_budget_list = db.query(Budget).filter(
        and_(
            Budget.ledger_id == ledger_id,
            Budget.status == BudgetStatus.ACTIVE,
            Budget.start_date <= current_date,
            Budget.end_date >= current_date
        )
    ).all()
    
    exceeded_count = sum(1 for b in active_budget_list if b.is_exceeded)
    warning_count = sum(1 for b in active_budget_list if b.is_warning and not b.is_exceeded)
    
    return BudgetStats(
        total_budgets=total_budgets,
        active_budgets=active_budgets,
        total_amount=total_amount,
        total_spent=total_spent,
        total_remaining=total_remaining,
        exceeded_count=exceeded_count,
        warning_count=warning_count
    )

# 预算提醒相关操作
def check_and_create_alerts(db: Session, budget: Budget):
    """检查并创建预算提醒"""
    current_progress = budget.progress
    
    # 检查是否需要创建预警提醒
    if current_progress >= budget.alert_threshold and current_progress < 0.95:
        create_alert_if_not_exists(db, budget, AlertType.WARNING, budget.alert_threshold)
    
    # 检查是否需要创建严重提醒
    if current_progress >= 0.95 and current_progress < 1.0:
        create_alert_if_not_exists(db, budget, AlertType.CRITICAL, 0.95)
    
    # 检查是否需要创建超支提醒
    if current_progress >= 1.0:
        create_alert_if_not_exists(db, budget, AlertType.EXCEEDED, 1.0)

def create_alert_if_not_exists(db: Session, budget: Budget, alert_type: AlertType, threshold: float):
    """如果不存在则创建提醒"""
    existing_alert = db.query(BudgetAlert).filter(
        and_(
            BudgetAlert.budget_id == budget.id,
            BudgetAlert.alert_type == alert_type,
            BudgetAlert.threshold == threshold
        )
    ).first()
    
    if not existing_alert:
        alert_message = generate_alert_message(budget, alert_type)
        db_alert = BudgetAlert(
            budget_id=budget.id,
            alert_type=alert_type,
            threshold=threshold,
            message=alert_message
        )
        db.add(db_alert)

def generate_alert_message(budget: Budget, alert_type: AlertType) -> str:
    """生成提醒消息"""
    if alert_type == AlertType.WARNING:
        return f"预算 '{budget.name}' 已使用 {budget.progress:.1%}，接近预警阈值"
    elif alert_type == AlertType.CRITICAL:
        return f"预算 '{budget.name}' 已使用 {budget.progress:.1%}，即将超支"
    elif alert_type == AlertType.EXCEEDED:
        return f"预算 '{budget.name}' 已超支 {budget.spent - budget.amount:.2f} 元"
    return ""

def get_budget_alerts(db: Session, ledger_id: int, unread_only: bool = False) -> List[BudgetAlert]:
    """获取预算提醒"""
    query = db.query(BudgetAlert).join(Budget).filter(Budget.ledger_id == ledger_id)
    
    if unread_only:
        query = query.filter(BudgetAlert.is_sent == False)
    
    return query.order_by(BudgetAlert.created_at.desc()).all()

def mark_alert_as_sent(db: Session, alert_id: int) -> bool:
    """标记提醒为已发送"""
    alert = db.query(BudgetAlert).filter(BudgetAlert.id == alert_id).first()
    if not alert:
        return False
    
    alert.is_sent = True
    alert.sent_at = datetime.utcnow()
    db.commit()
    return True 