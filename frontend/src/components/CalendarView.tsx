'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { Bill } from '@/types';

interface CalendarViewProps {
  bills: Bill[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export default function CalendarView({ bills, selectedDate, onDateSelect }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // 计算指定日期的支出
  const getDayExpense = (date: Date) => {
    return bills
      .filter(bill => dayjs(bill.date).isSame(date, 'day') && bill.type === 'expense')
      .reduce((sum, bill) => sum + bill.amount, 0);
  };

  // 获取当前月份的所有日期
  const monthStart = dayjs(currentMonth).startOf('month');
  const monthEnd = dayjs(currentMonth).endOf('month');
  const monthDays = [];
  let currentDay = monthStart;
  while (currentDay.isBefore(monthEnd) || currentDay.isSame(monthEnd, 'day')) {
    monthDays.push(currentDay.toDate());
    currentDay = currentDay.add(1, 'day');
  }

  // 获取日历开始日期（包括上个月的日期以填充第一周）
  const calendarStart = monthStart.subtract(monthStart.day(), 'day');

  // 生成日历网格
  const calendarDays = [];
  for (let i = 0; i < 42; i++) {
    const date = calendarStart.add(i, 'day').toDate();
    calendarDays.push(date);
  }

  // 计算所有日期的支出，用于确定颜色深浅
  const allExpenses = calendarDays.map(date => getDayExpense(date));
  const maxExpense = Math.max(...allExpenses, 1); // 避免除以0

  // 根据支出金额获取颜色 - 使用小清新薄荷绿配色
  const getColorByExpense = (expense: number) => {
    if (expense === 0) return '#fafafa'; // 无支出 - 极浅灰白
    const intensity = Math.min(expense / maxExpense, 1);
    
    // 使用薄荷绿渐变色系：从极浅薄荷到深薄荷绿
    if (intensity <= 0.2) {
      return '#f0fdfa'; // 极浅薄荷
    } else if (intensity <= 0.4) {
      return '#ccfbf1'; // 浅薄荷
    } else if (intensity <= 0.6) {
      return '#99f6e4'; // 中薄荷
    } else if (intensity <= 0.8) {
      return '#5eead4'; // 深薄荷
    } else {
      return '#2dd4bf'; // 最深薄荷
    }
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(dayjs(currentMonth).subtract(1, 'month').toDate());
  };

  const goToNextMonth = () => {
    setCurrentMonth(dayjs(currentMonth).add(1, 'month').toDate());
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <CardTitle className="text-base sm:text-lg">支出热力图</CardTitle>
          <div className="flex items-center justify-between sm:justify-end space-x-2">
            <Button variant="outline" size="sm" onClick={goToPreviousMonth} className="h-8 w-8 p-0">
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday} className="text-xs px-2 h-8">
              今天
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextMonth} className="h-8 w-8 p-0">
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
        <div className="text-base sm:text-lg font-semibold text-center">
          {dayjs(currentMonth).locale('zh-cn').format('YYYY年MM月')}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {/* 星期标题 */}
          {['日', '一', '二', '三', '四', '五', '六'].map(day => (
            <div key={day} className="h-6 sm:h-8 flex items-center justify-center text-xs sm:text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
          
          {/* 日期格子 - 热力图样式 */}
          {calendarDays.map((date, index) => {
            const isCurrentMonth = dayjs(date).isSame(currentMonth, 'month');
            const isSelected = dayjs(date).isSame(selectedDate, 'day');
            const dayExpense = getDayExpense(date);
            const backgroundColor = getColorByExpense(dayExpense);

            return (
              <div
                key={index}
                className={`h-12 sm:h-16 p-2 cursor-pointer hover:opacity-80 transition-all rounded-lg ${
                  !isCurrentMonth ? 'opacity-30' : ''
                } ${isSelected ? 'shadow-md' : ''}`}
                style={{ backgroundColor }}
              >
                <div className="flex flex-col h-full">
                  <div className={`text-base font-semibold text-center ${
                    isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  } ${dayExpense > maxExpense * 0.6 ? 'text-white' : ''}`}>
                    {dayjs(date).format('D')}
                  </div>
                  {dayExpense > 0 && (
                    <div className="flex">
                      <div className="w-full text-center">
                        <div className={`text-xs font-medium ${
                          dayExpense > maxExpense * 0.6 ? 'text-white' : 'text-teal-700'
                        }`}>
                          <span className="hidden sm:inline">¥</span>{dayExpense.toFixed(0)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
} 