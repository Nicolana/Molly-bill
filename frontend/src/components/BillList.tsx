'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { Bill } from '@/types';
import BillCard from './BillCard';
import dayjs from 'dayjs';

interface BillListProps {
  bills: Bill[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onDeleteBill: (id: number) => void;
  title?: string;
}

export default function BillList({ 
  bills, 
  selectedDate, 
  onDateChange, 
  onDeleteBill, 
  title = "账单记录" 
}: BillListProps) {
  // 计算当日统计
  const totalIncome = bills.filter(bill => bill.type === 'income').reduce((sum, bill) => sum + bill.amount, 0);
  const totalExpense = bills.filter(bill => bill.type === 'expense').reduce((sum, bill) => sum + bill.amount, 0);
  // const netAmount = totalIncome - totalExpense;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col space-y-3">
          <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            <span>{title}</span>
          </CardTitle>
          
          {/* 移动端布局 */}
          <div className="flex flex-col space-y-3 sm:hidden">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">选择日期:</label>
              <input
                type="date"
                value={dayjs(selectedDate).format('YYYY-MM-DD')}
                onChange={(e) => onDateChange(new Date(e.target.value))}
                className="flex-1 px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex justify-between text-sm">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-green-600 font-medium">
                  收入: ¥{totalIncome.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-red-600 font-medium">
                  支出: ¥{totalExpense.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          
          {/* 桌面端布局 */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">选择日期:</label>
              <input
                type="date"
                value={dayjs(selectedDate).format('YYYY-MM-DD')}
                onChange={(e) => onDateChange(new Date(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-green-600 font-medium">
                  收入: ¥{totalIncome.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-red-600 font-medium">
                  支出: ¥{totalExpense.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {bills.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-base sm:text-lg font-medium">该日期没有账单记录</p>
            <p className="text-gray-400 text-sm mt-1">尝试选择其他日期或添加新的账单</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:gap-3 max-h-200 overflow-auto">
            {bills.map((bill, index) => (
              <div key={bill.id} className="relative group">
                <BillCard bill={bill} index={index} showRecordLabel={false} />
                <div className="absolute top-2 sm:top-3 right-2 sm:right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                  <button
                    onClick={() => onDeleteBill(bill.id)}
                    className="w-6 h-6 sm:w-7 sm:h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110"
                    title="删除账单"
                  >
                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 