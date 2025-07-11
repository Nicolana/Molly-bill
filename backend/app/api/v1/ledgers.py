from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models import User, Ledger, UserLedger, UserRole
from app.schemas.ledger import LedgerCreate, LedgerResponse, LedgerUpdate
from app.schemas.base import BaseResponse
from app.core.security.auth import get_current_user
from app.crud.ledger import (
    create_ledger, get_user_ledgers, get_ledger, get_ledger_members,
    remove_ledger_member, check_user_ledger_access, check_user_ledger_admin, 
    transfer_ledger_ownership, delete_ledger, restore_ledger, permanently_delete_ledger
)
from app.crud.user import get_user_by_email

router = APIRouter()

@router.post("/", response_model=BaseResponse[LedgerResponse])
def create_new_ledger(
    ledger: LedgerCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """创建新账本"""
    new_ledger = create_ledger(db=db, ledger=ledger, owner_id=current_user.id)
    return BaseResponse(
        success=True,
        message="账本创建成功",
        data=new_ledger
    )

@router.get("/my", response_model=BaseResponse[List[dict]])
def get_my_ledgers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取我的账本列表"""
    user_ledgers = get_user_ledgers(db, current_user.id)
    
    # 返回包含用户账本关系的完整信息
    result = []
    for user_ledger in user_ledgers:
        result.append({
            "id": user_ledger.id,
            "user_id": user_ledger.user_id,
            "ledger_id": user_ledger.ledger_id,
            "role": user_ledger.role,
            "joined_at": user_ledger.joined_at,
            "status": user_ledger.status,
            "ledger": {
                "id": user_ledger.ledger.id,
                "name": user_ledger.ledger.name,
                "description": user_ledger.ledger.description,
                "currency": user_ledger.ledger.currency,
                "timezone": user_ledger.ledger.timezone,
                "status": user_ledger.ledger.status,
                "created_at": user_ledger.ledger.created_at,
                "deleted_at": user_ledger.ledger.deleted_at
            }
        })
    
    return BaseResponse(
        success=True,
        message="获取账本列表成功",
        data=result
    )

@router.get("/current", response_model=BaseResponse[dict])
def get_current_ledger(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取用户当前选中的账本"""
    # 检查用户是否有当前选中的账本ID（可以存储在用户表的字段中，或者返回第一个）
    user_ledgers = get_user_ledgers(db, current_user.id)
    if not user_ledgers:
        return BaseResponse(
            success=True,
            message="暂无账本",
            data={"current_ledger_id": None}
        )
    
    # 暂时返回第一个账本，后续可以添加用户偏好设置
    current_ledger_id = getattr(current_user, 'current_ledger_id', None)
    if current_ledger_id and any(ul.ledger_id == current_ledger_id for ul in user_ledgers):
        data = {"current_ledger_id": current_ledger_id}
    else:
        data = {"current_ledger_id": user_ledgers[0].ledger_id}
    
    return BaseResponse(
        success=True,
        message="获取当前账本成功",
        data=data
    )

@router.post("/current/{ledger_id}", response_model=BaseResponse[dict])
def set_current_ledger(
    ledger_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """设置用户当前选中的账本"""
    # 检查用户是否有权限访问此账本
    if not check_user_ledger_access(db, current_user.id, ledger_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权限访问此账本"
        )
    
    # 更新用户的当前账本ID（需要在User模型中添加current_ledger_id字段）
    # 暂时返回成功，后续可以添加数据库字段存储
    return BaseResponse(
        success=True,
        message="当前账本已更新",
        data={"current_ledger_id": ledger_id}
    )

@router.get("/{ledger_id}", response_model=BaseResponse[LedgerResponse])
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
    
    return BaseResponse(
        success=True,
        message="获取账本信息成功",
        data=ledger
    )

@router.get("/{ledger_id}/members", response_model=BaseResponse[List[dict]])
def get_ledger_members_endpoint(
    ledger_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取账本成员列表"""
    # 检查访问权限
    if not check_user_ledger_access(db, current_user.id, ledger_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权限访问此账本"
        )
    
    members = get_ledger_members(db, ledger_id)
    
    # 返回包含用户信息的完整成员列表
    result = []
    for member in members:
        result.append({
            "id": member.id,
            "user_id": member.user_id,
            "ledger_id": member.ledger_id,
            "role": member.role,
            "joined_at": member.joined_at,
            "status": member.status,
            "user": {
                "id": member.user.id,
                "email": member.user.email,
                "username": member.user.username
            } if member.user else None
        })
    
    return BaseResponse(
        success=True,
        message="获取成员列表成功",
        data=result
    )

@router.put("/{ledger_id}", response_model=BaseResponse[LedgerResponse])
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
    return BaseResponse(
        success=True,
        message="账本更新成功",
        data=ledger
    )

@router.post("/{ledger_id}/transfer", response_model=BaseResponse[dict])
def transfer_ledger(
    ledger_id: int,
    transfer_data: dict,
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
    
    new_owner_id = transfer_data.get("new_owner_id")
    if not new_owner_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="缺少新所有者ID"
        )
    
    # 检查新所有者是否已在账本中
    if not check_user_ledger_access(db, new_owner_id, ledger_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户不在账本中"
        )
    
    # 转让所有权
    if transfer_ledger_ownership(db, ledger_id, new_owner_id):
        return BaseResponse(
            success=True,
            message="账本转让成功",
            data={}
        )
    
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="转让失败"
    )

@router.delete("/{ledger_id}/members/{user_id}", response_model=BaseResponse[dict])
def remove_member_endpoint(
    ledger_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """从账本中移除成员（仅管理员）"""
    # 检查管理员权限
    if not check_user_ledger_admin(db, current_user.id, ledger_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足"
        )
    
    # 不能移除自己
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不能移除自己"
        )
    
    # 移除成员
    if remove_ledger_member(db, ledger_id, user_id):
        return BaseResponse(
            success=True,
            message="成员移除成功",
            data={}
        )
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="成员不存在或已被移除"
    )

@router.delete("/{ledger_id}", response_model=BaseResponse[dict])
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
        return BaseResponse(
            success=True,
            message="账本已删除",
            data={}
        )
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="账本不存在"
    )

@router.post("/{ledger_id}/restore", response_model=BaseResponse[dict])
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
        return BaseResponse(
            success=True,
            message="账本已恢复",
            data={}
        )
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="账本不存在或无法恢复"
    )

@router.delete("/{ledger_id}/permanent", response_model=BaseResponse[dict])
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
        return BaseResponse(
            success=True,
            message="账本已永久删除",
            data={}
        )
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="账本不存在"
    ) 