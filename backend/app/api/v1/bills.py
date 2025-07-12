from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, date, timedelta

from app.db.database import get_db
from app.models import User, Bill
from app.schemas.bill import BillResponse, BillUpdate
from app.schemas.base import BaseResponse
from app.core.security.auth import get_current_user
from app.crud.bill import (
    get_bills_no_pagination, get_bill,
    update_bill, delete_bill
)
from app.crud.ledger import check_user_ledger_access
from app.utils.response import success_response, error_response

router = APIRouter()

def get_date_range_from_filter(time_filter: str) -> tuple[Optional[datetime], Optional[datetime]]:
    """根据时间过滤器获取日期范围"""
    now = datetime.now()
    
    if time_filter == 'today':
        # 今天：从今天00:00:00到23:59:59
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = now.replace(hour=23, minute=59, second=59, microsecond=999999)
        return start_date, end_date
    elif time_filter == 'month':
        # 本月：从本月1日00:00:00到本月最后一天23:59:59
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        # 获取本月最后一天
        if now.month == 12:
            next_month = now.replace(year=now.year + 1, month=1, day=1)
        else:
            next_month = now.replace(month=now.month + 1, day=1)
        end_date = (next_month - timedelta(days=1)).replace(hour=23, minute=59, second=59, microsecond=999999)
        return start_date, end_date
    elif time_filter == 'year':
        # 本年：从今年1月1日00:00:00到今年12月31日23:59:59
        start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        end_date = now.replace(month=12, day=31, hour=23, minute=59, second=59, microsecond=999999)
        return start_date, end_date
    else:
        # 'all' 或其他值：不限制时间范围
        return None, None

@router.get("/", response_model=BaseResponse)
def get_ledger_bills(
    ledger_id: int,
    time_filter: Optional[str] = Query(None, description="时间过滤器: today, month, year, all"),
    start_date: Optional[datetime] = Query(None, description="开始日期（优先级高于time_filter）"),
    end_date: Optional[datetime] = Query(None, description="结束日期（优先级高于time_filter）"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取账本账单列表"""
    # 检查用户是否有账本访问权限
    # if not check_user_ledger_access(db, current_user.id, ledger_id):
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="无权限访问此账本"
    #     )
    
    # 如果没有提供具体的start_date和end_date，则使用time_filter
    if not start_date and not end_date and time_filter:
        start_date, end_date = get_date_range_from_filter(time_filter)
    
    bills = get_bills_no_pagination(db, ledger_id, start_date, end_date)
    
    # 使用Pydantic模型自动序列化
    bills_data = [BillResponse.model_validate(bill) for bill in bills]
    
    return success_response(
        data=bills_data,
        message="获取账单列表成功"
    )

@router.get("/count", response_model=BaseResponse)
def get_ledger_bills_count(
    ledger_id: int,
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取账本账单总数"""
    # 检查用户是否有账本访问权限
    if not check_user_ledger_access(db, current_user.id, ledger_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权限访问此账本"
        )
    
    count = get_bills_count(db, ledger_id, start_date, end_date)
    return success_response(
        data={"count": count},
        message="获取账单总数成功"
    )

@router.get("/{bill_id}", response_model=BaseResponse)
def get_bill_info(
    bill_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取账单信息"""
    bill = get_bill(db, bill_id)
    if not bill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="账单不存在"
        )
    
    # 检查用户是否有账本访问权限
    if not check_user_ledger_access(db, current_user.id, bill.ledger_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权限访问此账单"
        )
    
    # 使用Pydantic模型自动序列化
    bill_data = BillResponse.model_validate(bill)
    
    return success_response(
        data=bill_data,
        message="获取账单信息成功"
    )

@router.put("/{bill_id}", response_model=BaseResponse)
def update_bill_info(
    bill_id: int,
    bill_update: BillUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """更新账单信息（仅账单创建者）"""
    updated_bill = update_bill(db, bill_id, current_user.id, **bill_update.model_dump(exclude_unset=True))
    if not updated_bill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="账单不存在或无权限修改"
        )
    
    # 使用Pydantic模型自动序列化
    updated_bill_data = BillResponse.model_validate(updated_bill)
    
    return success_response(
        data=updated_bill_data,
        message="账单更新成功"
    )

@router.delete("/{bill_id}", response_model=BaseResponse)
def delete_bill_endpoint(
    bill_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除账单（仅账单创建者）"""
    if delete_bill(db, bill_id, current_user.id):
        return success_response(
            data={"message": "账单已删除"},
            message="账单删除成功"
        )
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="账单不存在或无权限删除"
    ) 