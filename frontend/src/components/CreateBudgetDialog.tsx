'use client';

import { useState } from 'react';
import { BudgetCreate } from '@/types';
import { BudgetPeriodType } from '@/constants/enums';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Calendar, DollarSign } from 'lucide-react';

interface CreateBudgetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (budget: BudgetCreate) => void;
  ledgerId: number;
}

export default function CreateBudgetDialog({
  isOpen,
  onClose,
  onSubmit,
  ledgerId,
}: CreateBudgetDialogProps) {
  const [formData, setFormData] = useState<BudgetCreate>({
    name: '',
    amount: undefined,
    category: '',
    period_type: BudgetPeriodType.MONTHLY,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    alert_threshold: 0.8,
    ledger_id: ledgerId,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof BudgetCreate, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 清除该字段的错误
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '预算名称不能为空';
    }

    if (formData.amount <= 0) {
      newErrors.amount = '预算金额必须大于0';
    }

    if (!formData.start_date) {
      newErrors.start_date = '开始日期不能为空';
    }

    if (!formData.end_date) {
      newErrors.end_date = '结束日期不能为空';
    }

    if (formData.start_date && formData.end_date && formData.start_date >= formData.end_date) {
      newErrors.end_date = '结束日期必须晚于开始日期';
    }

    if ((formData.alert_threshold ?? 0.8) < 0 || (formData.alert_threshold ?? 0.8) > 1) {
      newErrors.alert_threshold = '预警阈值必须在0-1之间';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      amount: 0,
      category: '',
      period_type: BudgetPeriodType.MONTHLY,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      alert_threshold: 0.8,
      ledger_id: ledgerId,
    });
    setErrors({});
    onClose();
  };

  const handlePeriodChange = (period: BudgetPeriodType) => {
    const startDate = new Date();
    let endDate = new Date();

    switch (period) {
      case BudgetPeriodType.MONTHLY:
        endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
        break;
      case BudgetPeriodType.QUARTERLY:
        endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 3, 0);
        break;
      case BudgetPeriodType.YEARLY:
        endDate = new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate());
        break;
      default:
        endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    setFormData(prev => ({
      ...prev,
      period_type: period,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-xl font-semibold">创建预算</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 预算名称 */}
              <div className="space-y-2">
                <Label htmlFor="name">预算名称 *</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="请输入预算名称"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              {/* 预算金额 */}
              <div className="space-y-2">
                <Label htmlFor="amount">预算金额 *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', parseFloat(e.target.value))}
                    placeholder="0.00"
                    className={`pl-10 ${errors.amount ? 'border-red-500' : ''}`}
                    min="0"
                    step="0.01"
                  />
                </div>
                {errors.amount && (
                  <p className="text-sm text-red-500">{errors.amount}</p>
                )}
              </div>

              {/* 预算分类 */}
              <div className="space-y-2">
                <Label htmlFor="category">预算分类</Label>
                <Input
                  id="category"
                  type="text"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  placeholder="如：餐饮、交通、购物等"
                />
              </div>

              {/* 预算周期 */}
              <div className="space-y-2">
                <Label>预算周期</Label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(BudgetPeriodType).map((period) => (
                    <Button
                      key={period}
                      type="button"
                      variant={formData.period_type === period ? 'default' : 'outline'}
                      onClick={() => handlePeriodChange(period)}
                      className="text-sm"
                    >
                      {period === BudgetPeriodType.MONTHLY && '月度'}
                      {period === BudgetPeriodType.QUARTERLY && '季度'}
                      {period === BudgetPeriodType.YEARLY && '年度'}
                      {period === BudgetPeriodType.CUSTOM && '自定义'}
                    </Button>
                  ))}
                </div>
              </div>

              {/* 时间范围 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">开始日期 *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => handleInputChange('start_date', e.target.value)}
                      className={`pl-10 ${errors.start_date ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.start_date && (
                    <p className="text-sm text-red-500">{errors.start_date}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">结束日期 *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => handleInputChange('end_date', e.target.value)}
                      className={`pl-10 ${errors.end_date ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.end_date && (
                    <p className="text-sm text-red-500">{errors.end_date}</p>
                  )}
                </div>
              </div>

              {/* 预警阈值 */}
              <div className="space-y-2">
                <Label htmlFor="alert_threshold">
                  预警阈值 ({Math.round((formData.alert_threshold ?? 0.8) * 100)}%)
                </Label>
                <Input
                  id="alert_threshold"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.alert_threshold}
                  onChange={(e) => handleInputChange('alert_threshold', parseFloat(e.target.value))}
                  className="w-full"
                />
                <p className="text-sm text-gray-500">
                  当预算使用达到此百分比时将发出预警
                </p>
                {errors.alert_threshold && (
                  <p className="text-sm text-red-500">{errors.alert_threshold}</p>
                )}
              </div>

              {/* 提交按钮 */}
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  取消
                </Button>
                <Button type="submit" className="flex-1">
                  创建预算
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 