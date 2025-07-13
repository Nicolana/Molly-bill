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

class BudgetPeriodType(str, PyEnum):
    MONTHLY = "monthly"      # 月度预算
    QUARTERLY = "quarterly"  # 季度预算
    YEARLY = "yearly"        # 年度预算
    CUSTOM = "custom"        # 自定义周期

class BudgetStatus(str, PyEnum):
    ACTIVE = "active"        # 活跃
    PAUSED = "paused"        # 暂停
    COMPLETED = "completed"  # 已完成
    EXPIRED = "expired"      # 已过期

class AlertType(str, PyEnum):
    WARNING = "warning"      # 预警（80%）
    CRITICAL = "critical"    # 严重（95%）
    EXCEEDED = "exceeded"    # 超支 