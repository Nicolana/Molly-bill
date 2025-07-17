'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
  DollarSign
} from 'lucide-react';
import { Bill, BillCreate } from '@/types';
import BillDetailDialog from './BillDetailDialog';
import dayjs from 'dayjs';

interface BillCardProps {
  bill: Bill | BillCreate;
  index: number;
  showRecordLabel?: boolean; // 是否显示"已记录"标签
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

export default function BillCardMain({ bill, onUpdate, onDelete }: BillCardProps) {
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const IconComponent = categoryIcons[bill.category || '其他'] || DollarSign;
  
  // 检查是否为完整的 Bill 对象（有 id 属性）
  const isFullBill = 'id' in bill;
  
  const handleCardClick = () => {
    // 只有完整的 Bill 对象才能打开详情弹窗
    if (isFullBill) {
      setShowDetailDialog(true);
    }
  };
  
  return (
    <>
      <Card className={`hover:bg-gray-50 transition-shadow py-0 w-full cursor-pointer bg-none border-none shadow-none`} onClick={handleCardClick}>
        <CardContent className="p-1.5 sm:p-2 min-w-0">
          {/* 主要内容区域 - 单行布局 */}
          <div className="flex items-center space-x-2">
            {/* 左侧图标 */}
            <div className="flex-shrink-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100">
                <IconComponent className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
              </div>
            </div>
            
            {/* 中间内容 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  {/* 分类和描述在同一行 */}
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900 text-sm flex-shrink-0">
                      {bill.category || '未分类'}
                    </h4>
                    {bill.description && (
                      <p className="text-xs text-gray-500 truncate">
                        {bill.description}
                      </p>
                    )}
                  </div>
                  {/* 日期信息 */}
                  <div className="text-xs text-gray-400 mt-0.5">
                    {bill.date ? dayjs(bill.date).locale('zh-cn').format('MM-DD dddd') : '刚刚'}
                  </div>
                </div>
                
                {/* 右侧金额 */}
                <div className="flex-shrink-0 ml-2">
                  <span className={`font-semibold text-sm ${
                    bill.type === 'income' ? 'text-green-600' : 'text-gray-900'
                  }`}>
                    {bill.type === 'income' ? '+' : '-'}¥{bill.amount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 详情弹窗 */}
      {isFullBill && (
        <BillDetailDialog
          open={showDetailDialog}
          onClose={() => setShowDetailDialog(false)}
          bill={bill as Bill}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      )}
    </>
  );
} 