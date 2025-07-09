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
    <Card className="bg-white bg-opacity-90 border-l-4 border-l-blue-500 shadow-sm">
      <CardContent className="p-3">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <IconComponent className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-lg text-gray-900">
                  ¥{bill.amount.toFixed(2)}
                </span>
                {bill.category && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {bill.category}
                  </span>
                )}
              </div>
            </div>
            {bill.description && (
              <p className="text-sm text-gray-600 mt-1 truncate">
                {bill.description}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 