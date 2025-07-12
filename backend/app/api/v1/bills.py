from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

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

@router.get("/", response_model=BaseResponse)
def get_ledger_bills(
    ledger_id: int,
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
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