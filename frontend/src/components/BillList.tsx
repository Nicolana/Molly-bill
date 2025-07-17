'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { Bill } from '@/types';
import { BillType } from '@/constants/enums';
import BillCardMain from './BillCardMain';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

interface BillListProps {
  bills: Bill[];
  title?: string;
}

interface DayGroup {
  date: string;
  displayDate: string;
  bills: Bill[];
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
}

export default function BillList({ 
  bills, 
  title = "账单记录" 
}: BillListProps) {
  
  // 按日期分组账单
  const groupBillsByDate = (bills: Bill[]): DayGroup[] => {
    const groups: { [key: string]: Bill[] } = {};
    
    bills.forEach(bill => {
      const dateKey = dayjs(bill.date).locale('zh-cn').format('YYYY-MM-DD');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(bill);
    });
    
    // 转换为DayGroup数组并按日期排序
    const dayGroups: DayGroup[] = Object.entries(groups).map(([date, bills]) => {
      const totalIncome = bills
        .filter(bill => bill.type === BillType.INCOME)
        .reduce((sum, bill) => sum + bill.amount, 0);
      
      const totalExpense = bills
        .filter(bill => bill.type === BillType.EXPENSE)
        .reduce((sum, bill) => sum + bill.amount, 0);
      
      const netAmount = totalIncome - totalExpense;
      
      return {
        date,
        displayDate: dayjs(date).locale('zh-cn').format('MM月DD日 dddd'),
        bills,
        totalIncome,
        totalExpense,
        netAmount
      };
    });
    
    // 按日期倒序排序（最新的在前）
    return dayGroups.sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());
  };

  const dayGroups = groupBillsByDate(bills);

  return (
    <Card className="gap-2">
      <CardHeader>
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              <span>{title}</span>
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {dayGroups.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-base sm:text-lg font-medium">该时间段没有账单记录</p>
            <p className="text-gray-400 text-sm mt-1">尝试选择其他时间段或添加新的账单</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[600px] overflow-auto">
            {dayGroups.map((group) => (
              <div key={group.date} className="border rounded-lg p-4 bg-white">
                {/* 日期标题和统计 */}
                <div className="flex items-center justify-between mb-3 pb-2 border-b">
                  <div className="flex items-center space-x-2 text-sm">
                    <div>{group.displayDate}</div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                      <div className="text-gray-500">出:</div>
                      <span>¥{(group?.totalExpense || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="text-gray-500">入:</div>
                      <span>¥{(group?.totalIncome || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                {/* 账单列表 */}
                <div className="space-y-2">
                  {group.bills.map((bill, index) => (
                    <div key={bill.id} className="relative group">
                      <BillCardMain bill={bill} index={index} showRecordLabel={false} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 