from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models import User, Ledger, UserLedger, UserRole
from app.schemas.ledger import LedgerCreate, LedgerResponse, LedgerUpdate
from app.core.security.auth import get_current_user
from app.crud.ledger import (
    create_ledger, get_user_ledgers, get_ledger, get_ledger_members,
    check_user_ledger_access, check_user_ledger_admin, transfer_ledger_ownership,
    delete_ledger, restore_ledger, permanently_delete_ledger
)
from app.crud.user import get_user_by_email

router = APIRouter()

@router.post("/", response_model=LedgerResponse)
def create_new_ledger(
    ledger: LedgerCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """创建新账本"""
    return create_ledger(db=db, ledger=ledger, owner_id=current_user.id)

@router.get("/", response_model=List[LedgerResponse])
def get_my_ledgers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取我的账本列表"""
    user_ledgers = get_user_ledgers(db, current_user.id)
    return [user_ledger.ledger for user_ledger in user_ledgers]

@router.get("/{ledger_id}", response_model=LedgerResponse)
def get_ledger_info(
    ledger_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取账本信息"""
    # 检查访问权限
    if not check_user_ledger_access(db, current_user.id, ledger_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权限访问此账本"
        )
    
    ledger = get_ledger(db, ledger_id)
    if not ledger:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="账本不存在"
        )
    
    return ledger

@router.put("/{ledger_id}", response_model=LedgerResponse)
def update_ledger(
    ledger_id: int,
    ledger_update: LedgerUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """更新账本信息（仅管理员）"""
    # 检查管理员权限
    if not check_user_ledger_admin(db, current_user.id, ledger_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足"
        )
    
    ledger = get_ledger(db, ledger_id)
    if not ledger:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="账本不存在"
        )
    
    # 更新账本信息
    for key, value in ledger_update.model_dump(exclude_unset=True).items():
        setattr(ledger, key, value)
    
    db.commit()
    db.refresh(ledger)
    return ledger

@router.post("/{ledger_id}/transfer")
def transfer_ledger(
    ledger_id: int,
    new_owner_email: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """转让账本所有权（仅当前管理员）"""
    # 检查管理员权限
    if not check_user_ledger_admin(db, current_user.id, ledger_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足"
        )
    
    # 查找新所有者
    new_owner = get_user_by_email(db, new_owner_email)
    if not new_owner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    # 检查新所有者是否已在账本中
    if not check_user_ledger_access(db, new_owner.id, ledger_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户不在账本中"
        )
    
    # 转让所有权
    if transfer_ledger_ownership(db, ledger_id, new_owner.id):
        return {"message": "账本转让成功"}
    
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="转让失败"
    )

@router.delete("/{ledger_id}")
def delete_ledger_endpoint(
    ledger_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除账本（移动到回收站）"""
    # 检查管理员权限
    if not check_user_ledger_admin(db, current_user.id, ledger_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足"
        )
    
    if delete_ledger(db, ledger_id):
        return {"message": "账本已删除"}
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="账本不存在"
    )

@router.post("/{ledger_id}/restore")
def restore_ledger_endpoint(
    ledger_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """从回收站恢复账本"""
    # 检查管理员权限
    if not check_user_ledger_admin(db, current_user.id, ledger_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足"
        )
    
    if restore_ledger(db, ledger_id):
        return {"message": "账本已恢复"}
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="账本不存在或无法恢复"
    )

@router.delete("/{ledger_id}/permanent")
def permanently_delete_ledger_endpoint(
    ledger_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """永久删除账本"""
    # 检查管理员权限
    if not check_user_ledger_admin(db, current_user.id, ledger_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足"
        )
    
    if permanently_delete_ledger(db, ledger_id):
        return {"message": "账本已永久删除"}
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="账本不存在"
    ) 