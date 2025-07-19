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

export default function BillCard({ bill, showRecordLabel = true, onUpdate, onDelete }: BillCardProps) {
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
      <Card className={`bg-white shadow-sm hover:shadow-md transition-shadow py-0 w-full ${
        isFullBill ? 'cursor-pointer' : ''
      }`} onClick={handleCardClick}>
      <CardContent className="p-3 sm:p-4 min-w-[330px] sm:w-full">
        {/* 顶部区域 */}
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          {showRecordLabel ? (
            <div className="text-xs text-gray-500">已记录：{bill.type === 'expense' ? '支出' : '收入'}</div>
          ) : <div></div> }
          <div className="text-xs text-gray-400">
            {bill.date ? dayjs(bill.date).locale('zh-cn').format('MM-DD dddd') : '刚刚'}
          </div>
        </div>
        
        {/* 主要内容区域 */}
        <div className="flex items-start space-x-2 sm:space-x-3">
          {/* 左侧图标 */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100">
              <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
          </div>
          
          {/* 中间内容 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                {/* 分类作为标题 */}
                <h4 className="font-medium text-gray-900 mb-1 text-sm sm:text-base">
                  {bill.category || '未分类'}
                </h4>
                {/* 描述作为副标题 */}
                {bill.description && (
                  <p className="text-xs sm:text-sm text-gray-600 truncate">
                    {bill.description}
                  </p>
                )}
              </div>
              
              {/* 右侧金额 */}
              <div className="flex-shrink-0 ml-2 sm:ml-3">
                <span className={`font-semibold text-base sm:text-lg ${
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