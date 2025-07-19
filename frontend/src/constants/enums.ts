// 用户角色枚举
export enum UserRole {
  ADMIN = 'admin',
  MEMBER = 'member'
}

// 账单类型枚举
export enum BillType {
  EXPENSE = 'expense',
  INCOME = 'income'
}

// 邀请状态枚举
export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

// 账本状态枚举
export enum LedgerStatus {
  ACTIVE = 'active',
  DELETED = 'deleted'
}

// 用户状态枚举
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

// 预算周期类型枚举
export enum BudgetPeriodType {
  MONTHLY = 'monthly',
  WEEKLY = 'weekly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  CUSTOM = 'custom'
}

// 预算状态枚举
export enum BudgetStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  EXPIRED = 'expired'
}

// 预算提醒类型枚举
export enum AlertType {
  WARNING = 'warning',
  CRITICAL = 'critical',
  EXCEEDED = 'exceeded'
}

// 角色显示信息
export const ROLE_DISPLAY = {
  [UserRole.ADMIN]: {
    text: '管理员',
    description: '可以编辑账本信息、邀请/移除成员、管理账单记录'
  },
  [UserRole.MEMBER]: {
    text: '成员',
    description: '可以查看账本信息、记录和编辑自己的账单'
  }
} as const;

// 邀请状态显示信息
export const INVITATION_STATUS_DISPLAY = {
  [InvitationStatus.PENDING]: {
    text: '待处理',
    color: 'text-yellow-600'
  },
  [InvitationStatus.ACCEPTED]: {
    text: '已接受',
    color: 'text-green-600'
  },
  [InvitationStatus.REJECTED]: {
    text: '已拒绝',
    color: 'text-red-600'
  },
  [InvitationStatus.EXPIRED]: {
    text: '已过期',
    color: 'text-gray-600'
  }
} as const;

// 账本状态显示信息
export const LEDGER_STATUS_DISPLAY = {
  [LedgerStatus.ACTIVE]: {
    text: '活跃'
  },
  [LedgerStatus.DELETED]: {
    text: '已删除'
  }
} as const; 