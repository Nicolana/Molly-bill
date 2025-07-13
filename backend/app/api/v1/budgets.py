from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from app.db.database import get_db
from app.models import User
from app.schemas.budget import (
    BudgetCreate, BudgetUpdate, BudgetResponse, BudgetListResponse,
    BudgetStats, BudgetProgress, BudgetAlertResponse, BudgetSummary
)
from app.schemas.base import BaseResponse
from app.core.security.auth import get_current_user
from app.crud import budget as budget_crud
from app.crud.ledger import check_user_ledger_access
from app.utils.response import success_response, error_response
from app.models.enums import BudgetStatus, BudgetPeriodType

router = APIRouter()

@router.post("/", response_model=BaseResponse)
def create_budget(
    budget: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """创建预算"""
    # 检查用户是否有账本访问权限
    if not check_user_ledger_access(db, current_user.id, budget.ledger_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权限访问此账本"
        )
    
    # 验证日期范围
    if budget.start_date >= budget.end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="开始日期必须早于结束日期"
        )
    
    try:
        db_budget = budget_crud.create_budget(db, budget, current_user.id)
        budget_data = BudgetResponse.model_validate(db_budget)
        return success_response(data=budget_data, message="预算创建成功")
    except Exception as e:
        return error_response(f"创建预算失败: {str(e)}")

@router.get("/", response_model=BaseResponse)
def get_budgets(
    ledger_id: int,
    status: Optional[BudgetStatus] = Query(None, description="预算状态过滤"),
    skip: int = Query(0, ge=0, description="跳过数量"),
    limit: int = Query(100, ge=1, le=100, description="限制数量"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取预算列表"""
    # 检查用户是否有账本访问权限
    if not check_user_ledger_access(db, current_user.id, ledger_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权限访问此账本"
        )
    
    budgets = budget_crud.get_budgets_by_ledger(db, ledger_id, status, skip, limit)
    stats = budget_crud.get_budget_stats(db, ledger_id)
    
    budgets_data = [BudgetResponse.model_validate(budget) for budget in budgets]
    
    response_data = BudgetListResponse(
        budgets=budgets_data,
        total=len(budgets_data),
        stats=stats
    )
    
    return success_response(data=response_data, message="获取预算列表成功")

@router.get("/{budget_id}", response_model=BaseResponse)
def get_budget(
    budget_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取单个预算详情"""
    budget = budget_crud.get_budget(db, budget_id)
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="预算不存在"
        )
    
    # 检查用户是否有账本访问权限
    if not check_user_ledger_access(db, current_user.id, budget.ledger_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权限访问此预算"
        )
    
    budget_data = BudgetResponse.model_validate(budget)
    return success_response(data=budget_data, message="获取预算详情成功")

@router.put("/{budget_id}", response_model=BaseResponse)
def update_budget(
    budget_id: int,
    budget_update: BudgetUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """更新预算"""
    budget = budget_crud.get_budget(db, budget_id)
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="预算不存在"
        )
    
    # 检查用户是否有账本访问权限
    if not check_user_ledger_access(db, current_user.id, budget.ledger_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权限修改此预算"
        )
    
    # 验证日期范围（如果提供了日期）
    start_date = budget_update.start_date or budget.start_date
    end_date = budget_update.end_date or budget.end_date
    if start_date >= end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="开始日期必须早于结束日期"
        )
    
    try:
        updated_budget = budget_crud.update_budget(db, budget_id, budget_update)
        if updated_budget:
            budget_data = BudgetResponse.model_validate(updated_budget)
            return success_response(data=budget_data, message="预算更新成功")
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="预算不存在"
            )
    except Exception as e:
        return error_response(f"更新预算失败: {str(e)}")

@router.delete("/{budget_id}", response_model=BaseResponse)
def delete_budget(
    budget_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除预算"""
    budget = budget_crud.get_budget(db, budget_id)
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="预算不存在"
        )
    
    # 检查用户是否有账本访问权限
    if not check_user_ledger_access(db, current_user.id, budget.ledger_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权限删除此预算"
        )
    
    try:
        if budget_crud.delete_budget(db, budget_id):
            return success_response(message="预算删除成功")
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="预算不存在"
            )
    except Exception as e:
        return error_response(f"删除预算失败: {str(e)}")

@router.get("/{budget_id}/progress", response_model=BaseResponse)
def get_budget_progress(
    budget_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取预算进度"""
    budget = budget_crud.get_budget(db, budget_id)
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="预算不存在"
        )
    
    # 检查用户是否有账本访问权限
    if not check_user_ledger_access(db, current_user.id, budget.ledger_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权限访问此预算"
        )
    
    # 计算剩余天数
    current_date = datetime.utcnow()
    days_remaining = max((budget.end_date - current_date).days, 0)
    
    progress_data = BudgetProgress(
        budget_id=budget.id,
        name=budget.name,
        amount=budget.amount,
        spent=budget.spent,
        progress=budget.progress,
        remaining=budget.remaining,
        is_exceeded=budget.is_exceeded,
        is_warning=budget.is_warning,
        days_remaining=days_remaining
    )
    
    return success_response(data=progress_data, message="获取预算进度成功")

@router.get("/{budget_id}/recalculate", response_model=BaseResponse)
def recalculate_budget(
    budget_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """重新计算预算支出"""
    budget = budget_crud.get_budget(db, budget_id)
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="预算不存在"
        )
    
    # 检查用户是否有账本访问权限
    if not check_user_ledger_access(db, current_user.id, budget.ledger_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权限操作此预算"
        )
    
    try:
        budget_crud.recalculate_budget_spent(db, budget_id)
        updated_budget = budget_crud.get_budget(db, budget_id)
        budget_data = BudgetResponse.model_validate(updated_budget)
        return success_response(data=budget_data, message="预算重新计算成功")
    except Exception as e:
        return error_response(f"重新计算预算失败: {str(e)}")

@router.get("/ledger/{ledger_id}/stats", response_model=BaseResponse)
def get_ledger_budget_stats(
    ledger_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取账本预算统计"""
    # 检查用户是否有账本访问权限
    if not check_user_ledger_access(db, current_user.id, ledger_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权限访问此账本"
        )
    
    stats = budget_crud.get_budget_stats(db, ledger_id)
    return success_response(data=stats, message="获取预算统计成功")

@router.get("/ledger/{ledger_id}/alerts", response_model=BaseResponse)
def get_budget_alerts(
    ledger_id: int,
    unread_only: bool = Query(False, description="只获取未读提醒"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取预算提醒"""
    # 检查用户是否有账本访问权限
    if not check_user_ledger_access(db, current_user.id, ledger_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权限访问此账本"
        )
    
    alerts = budget_crud.get_budget_alerts(db, ledger_id, unread_only)
    alerts_data = [BudgetAlertResponse.model_validate(alert) for alert in alerts]
    
    return success_response(data=alerts_data, message="获取预算提醒成功")

@router.post("/alerts/{alert_id}/mark-sent", response_model=BaseResponse)
def mark_alert_sent(
    alert_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """标记提醒为已发送"""
    try:
        if budget_crud.mark_alert_as_sent(db, alert_id):
            return success_response(message="提醒标记成功")
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="提醒不存在"
            )
    except Exception as e:
        return error_response(f"标记提醒失败: {str(e)}")

@router.get("/ledger/{ledger_id}/summary", response_model=BaseResponse)
def get_budget_summary(
    ledger_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取预算总览"""
    # 检查用户是否有账本访问权限
    if not check_user_ledger_access(db, current_user.id, ledger_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权限访问此账本"
        )
    
    # 获取不同类型的预算
    monthly_budgets = budget_crud.get_budgets_by_ledger(db, ledger_id, BudgetStatus.ACTIVE)
    monthly_budgets = [b for b in monthly_budgets if b.period_type == BudgetPeriodType.MONTHLY]
    
    yearly_budgets = budget_crud.get_budgets_by_ledger(db, ledger_id, BudgetStatus.ACTIVE)
    yearly_budgets = [b for b in yearly_budgets if b.period_type == BudgetPeriodType.YEARLY]
    
    custom_budgets = budget_crud.get_budgets_by_ledger(db, ledger_id, BudgetStatus.ACTIVE)
    custom_budgets = [b for b in custom_budgets if b.period_type == BudgetPeriodType.CUSTOM]
    
    # 获取提醒和统计
    alerts = budget_crud.get_budget_alerts(db, ledger_id, unread_only=True)
    stats = budget_crud.get_budget_stats(db, ledger_id)
    
    summary_data = BudgetSummary(
        monthly_budgets=[BudgetResponse.model_validate(b) for b in monthly_budgets],
        yearly_budgets=[BudgetResponse.model_validate(b) for b in yearly_budgets],
        custom_budgets=[BudgetResponse.model_validate(b) for b in custom_budgets],
        alerts=[BudgetAlertResponse.model_validate(a) for a in alerts],
        stats=stats
    )
    
    return success_response(data=summary_data, message="获取预算总览成功") 