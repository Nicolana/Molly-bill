from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.db.database import get_db
from app.models import User, Bill
from app.schemas.bill import BillCreate, BillResponse, BillUpdate
from app.core.security.auth import get_current_user
from app.crud.bill import (
    get_bills, get_bills_count, create_bill, get_bill,
    update_bill, delete_bill
)
from app.crud.ledger import check_user_ledger_access

router = APIRouter()

@router.post("/", response_model=BillResponse)
def create_new_bill(
    bill: BillCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """创建新账单"""
    # 检查用户是否有账本访问权限
    if not check_user_ledger_access(db, current_user.id, bill.ledger_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权限访问此账本"
        )
    
    return create_bill(db=db, bill=bill, user_id=current_user.id)

@router.get("/", response_model=List[BillResponse])
def get_ledger_bills(
    ledger_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取账本账单列表"""
    # 检查用户是否有账本访问权限
    if not check_user_ledger_access(db, current_user.id, ledger_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权限访问此账本"
        )
    
    return get_bills(db, ledger_id, skip, limit, start_date, end_date)

@router.get("/count")
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
    return {"count": count}

@router.get("/{bill_id}", response_model=BillResponse)
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
    
    return bill

@router.put("/{bill_id}", response_model=BillResponse)
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
    
    return updated_bill

@router.delete("/{bill_id}")
def delete_bill_endpoint(
    bill_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除账单（仅账单创建者）"""
    if delete_bill(db, bill_id, current_user.id):
        return {"message": "账单已删除"}
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="账单不存在或无权限删除"
    ) 