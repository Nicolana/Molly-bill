'use client';

import React from 'react';
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
import { BillCreate } from '@/types';
import dayjs from 'dayjs';

interface BillCardProps {
  bill: BillCreate;
  index: number;
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

export default function BillCard({ bill, index }: BillCardProps) {
  const IconComponent = categoryIcons[bill.category || '其他'] || DollarSign;

  return (
    <Card className="bg-white shadow-sm hover:shadow-md transition-shadow py-0">
      <CardContent className="p-4 min-w-[300px]">
        {/* 顶部区域 */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-gray-500">已记录：费用</div>
          <div className="text-xs text-gray-400">
            {bill.date ? dayjs(bill.date).locale('zh-cn').format('MM-DD dddd') : '刚刚'}
          </div>
        </div>
        
        {/* 主要内容区域 */}
        <div className="flex items-start space-x-3">
          {/* 左侧图标 */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100">
              <IconComponent className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          
          {/* 中间内容 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* 分类作为标题 */}
                <h4 className="font-medium text-gray-900 mb-1">
                  {bill.category || '未分类'}
                </h4>
                {/* 描述作为副标题 */}
                {bill.description && (
                  <p className="text-sm text-gray-600 truncate">
                    {bill.description}
                  </p>
                )}
              </div>
              
              {/* 右侧金额 */}
              <div className="flex-shrink-0 ml-3">
                <span className="font-semibold text-lg text-gray-900">
                  ¥{bill.amount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 