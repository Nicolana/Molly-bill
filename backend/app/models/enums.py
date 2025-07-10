from enum import Enum as PyEnum

class BillType(str, PyEnum):
    EXPENSE = "expense"  # 支出
    INCOME = "income"    # 收入

class UserRole(str, PyEnum):
    ADMIN = "admin"      # 管理员
    MEMBER = "member"    # 普通成员

class InvitationStatus(str, PyEnum):
    PENDING = "pending"      # 待接受
    ACCEPTED = "accepted"    # 已接受
    REJECTED = "rejected"    # 已拒绝
    EXPIRED = "expired"      # 已过期

class LedgerStatus(str, PyEnum):
    ACTIVE = "active"        # 活跃
    DELETED = "deleted"      # 已删除（回收站） 