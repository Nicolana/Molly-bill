'use client';

import { Budget } from '@/types';
import { BudgetPeriodType, BudgetStatus } from '@/constants/enums';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, AlertTriangle, CheckCircle, Clock, Edit, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface BudgetCardProps {
  budget: Budget;
  onEdit?: (budget: Budget) => void;
  onDelete?: (budgetId: number) => void;
  onViewDetails?: (budget: Budget) => void;
}

export default function BudgetCard({ budget, onEdit, onDelete, onViewDetails }: BudgetCardProps) {
  const getStatusColor = (status: BudgetStatus) => {
    switch (status) {
      case BudgetStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case BudgetStatus.PAUSED:
        return 'bg-yellow-100 text-yellow-800';
      case BudgetStatus.COMPLETED:
        return 'bg-blue-100 text-blue-800';
      case BudgetStatus.EXPIRED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: BudgetStatus) => {
    switch (status) {
      case BudgetStatus.ACTIVE:
        return '活跃';
      case BudgetStatus.PAUSED:
        return '暂停';
      case BudgetStatus.COMPLETED:
        return '完成';
      case BudgetStatus.EXPIRED:
        return '过期';
      default:
        return '未知';
    }
  };

  const getPeriodText = (periodType: BudgetPeriodType) => {
    switch (periodType) {
      case BudgetPeriodType.MONTHLY:
        return '月度';
      case BudgetPeriodType.QUARTERLY:
        return '季度';
      case BudgetPeriodType.YEARLY:
        return '年度';
      case BudgetPeriodType.CUSTOM:
        return '自定义';
      default:
        return '未知';
    }
  };

  const getProgressColor = () => {
    if (budget.is_exceeded) return 'bg-red-500';
    if (budget.is_warning) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const getRemainingDays = () => {
    const endDate = new Date(budget.end_date);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900">
              {budget.name}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getStatusColor(budget.status)}>
                {getStatusText(budget.status)}
              </Badge>
              <Badge variant="outline">
                {getPeriodText(budget.period_type)}
              </Badge>
              {budget.category && (
                <Badge variant="secondary">
                  {budget.category}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(budget)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(budget.id)}
                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* 进度条 */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              进度: {(budget.progress * 100).toFixed(1)}%
            </span>
            <span className="text-sm text-gray-500">
              {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
            </span>
          </div>
          <Progress 
            value={budget.progress * 100} 
            className="h-2"
            indicatorClassName={getProgressColor()}
          />
        </div>

        {/* 预算信息 */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">剩余预算</p>
            <p className={`font-semibold ${budget.is_exceeded ? 'text-red-600' : 'text-green-600'}`}>
              {budget.is_exceeded ? '-' : ''}{formatCurrency(Math.abs(budget.remaining))}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">剩余天数</p>
            <p className="font-semibold text-gray-900">
              {getRemainingDays()} 天
            </p>
          </div>
        </div>

        {/* 时间范围 */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <Calendar className="h-4 w-4" />
          <span>
            {formatDate(budget.start_date)} - {formatDate(budget.end_date)}
          </span>
        </div>

        {/* 状态提醒 */}
        {budget.is_exceeded && (
          <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-md mb-3">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700">预算已超支</span>
          </div>
        )}
        {budget.is_warning && !budget.is_exceeded && (
          <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md mb-3">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-yellow-700">接近预算限制</span>
          </div>
        )}
        {budget.status === BudgetStatus.COMPLETED && (
          <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-md mb-3">
            <CheckCircle className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-blue-700">预算已完成</span>
          </div>
        )}
        {budget.status === BudgetStatus.EXPIRED && (
          <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-md mb-3">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-700">预算已过期</span>
          </div>
        )}

        {/* 操作按钮 */}
        {onViewDetails && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(budget)}
            className="w-full"
          >
            查看详情
          </Button>
        )}
      </CardContent>
    </Card>
  );
} 