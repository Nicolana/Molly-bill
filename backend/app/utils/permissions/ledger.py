from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.crud.ledger import check_user_ledger_access, check_user_ledger_admin
from app.models.base import User

def require_ledger_access(user: User, ledger_id: int, db: Session):
    """要求用户有账本访问权限"""
    access = check_user_ledger_access(db, user.id, ledger_id)
    if not access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无账本访问权限",
            headers={"error_code": "LEDGER_ACCESS_DENIED"}
        )
    return access

def require_ledger_admin(user: User, ledger_id: int, db: Session):
    """要求用户是账本管理员"""
    admin = check_user_ledger_admin(db, user.id, ledger_id)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理员权限",
            headers={"error_code": "LEDGER_ADMIN_REQUIRED"}
        )
    return admin

def require_bill_owner(user: User, bill_owner_id: int):
    """要求用户是账单所有者"""
    if user.id != bill_owner_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权限操作此账单",
            headers={"error_code": "BILL_ACCESS_DENIED"}
        ) 