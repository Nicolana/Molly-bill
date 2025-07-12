'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bill, BillCreate } from '@/types';
import { BillType } from '@/constants/enums';
import { 
  Coffee, 
  ShoppingBag, 
  Car, 
  Home, 
  Utensils, 
  Gamepad2, 
  BookOpen, 
  Heart, 
  Plane, 
  Bus, 
  Train, 
  Bike,
  ShoppingCart,
  Gift,
  GraduationCap,
  Briefcase,
  DollarSign,
  Edit3,
  Trash2,
  Save,
  X
} from 'lucide-react';
import dayjs from 'dayjs';

interface BillDetailDialogProps {
  open: boolean;
  onClose: () => void;
  bill: Bill;
  onUpdate?: (id: number, data: Partial<BillCreate>) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
}

// 分类图标映射
const categoryIcons: Record<string, React.ComponentType<any>> = {
  '餐饮': Utensils,
  '咖啡': Coffee,
  '购物': ShoppingBag,
  '交通': Car,
  '住房': Home,
  '娱乐': Gamepad2,
  '教育': BookOpen,
  '医疗': Heart,
  '旅行': Plane,
  '公交': Bus,
  '地铁': Train,
  '共享单车': Bike,
  '超市': ShoppingCart,
  '礼物': Gift,
  '学习': GraduationCap,
  '工作': Briefcase,
  '其他': DollarSign
};

// 常用分类选项
const categoryOptions = [
  '餐饮', '咖啡', '购物', '交通', '住房', '娱乐', 
  '教育', '医疗', '旅行', '公交', '地铁', '共享单车', 
  '超市', '礼物', '学习', '工作', '其他'
];

export default function BillDetailDialog({ open, onClose, bill, onUpdate, onDelete }: BillDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<BillCreate>({
    amount: bill.amount,
    type: bill.type,
    category: bill.category || '其他',
    description: bill.description || '',
    date: bill.date ? dayjs(bill.date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')
  });

  // 当bill prop改变时，更新表单数据
  useEffect(() => {
    if (bill) {
      setFormData({
        amount: bill.amount,
        type: bill.type,
        category: bill.category || '其他',
        description: bill.description || '',
        date: bill.date ? dayjs(bill.date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')
      });
    }
  }, [bill]);

  const handleUpdate = async () => {
    if (!formData.amount || formData.amount <= 0) {
      setError('金额必须大于0');
      return;
    }

    try {
      setLoading(true);
      setError('');
      if (onUpdate) {
        await onUpdate(bill.id, formData);
      }
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('确定要删除这条账单记录吗？')) {
      try {
        setLoading(true);
        setError('');
        if (onDelete) {
          await onDelete(bill.id);
        }
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : '删除失败');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleClose = () => {
    setError('');
    setIsEditing(false);
    onClose();
  };

  if (!open) return null;

  const IconComponent = categoryIcons[formData.category || '其他'] || DollarSign;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">账单详情</h2>
          <div className="flex items-center space-x-2">
            {!isEditing && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="p-2"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={loading}
                  className="p-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleClose}
              className="p-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* 图标和基本信息 */}
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100">
              <IconComponent className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categoryOptions.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <h3 className="text-xl font-semibold text-gray-900">{formData.category}</h3>
              )}
            </div>
          </div>

          {/* 金额 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <Label className="text-sm text-gray-600">金额</Label>
            {isEditing ? (
              <div className="flex items-center space-x-2 mt-1">
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as BillType })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="expense">支出</option>
                  <option value="income">收入</option>
                </select>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="flex-1"
                  placeholder="0.00"
                />
              </div>
            ) : (
              <p className={`text-2xl font-bold mt-1 ${
                formData.type === 'income' ? 'text-green-600' : 'text-gray-900'
              }`}>
                {formData.type === 'income' ? '+' : '-'}¥{formData.amount.toFixed(2)}
              </p>
            )}
          </div>

          {/* 描述 */}
          <div>
            <Label className="text-sm text-gray-600">描述</Label>
            {isEditing ? (
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-1"
                rows={3}
                placeholder="输入账单描述（可选）"
              />
            ) : (
              <p className="text-gray-900 mt-1">{formData.description || '无描述'}</p>
            )}
          </div>

          {/* 日期 */}
          <div>
            <Label className="text-sm text-gray-600">日期</Label>
            {isEditing ? (
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="mt-1"
              />
            ) : (
              <p className="text-gray-900 mt-1">
                {dayjs(formData.date).format('YYYY年MM月DD日 dddd')}
              </p>
            )}
          </div>

          {/* 创建时间 */}
          <div>
            <Label className="text-sm text-gray-600">创建时间</Label>
            <p className="text-gray-500 text-sm mt-1">
              {dayjs(bill.date).format('YYYY-MM-DD HH:mm:ss')}
            </p>
          </div>

          {/* 编辑模式下的按钮 */}
          {isEditing && (
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={loading}
              >
                取消
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={loading}
                className="flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{loading ? '保存中...' : '保存'}</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 