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
  const getDayAmount = (date: Date) => {
    return bills
      .filter(bill => dayjs(bill.date).isSame(date, 'day'))
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
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>日历视图</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              今天
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="text-lg font-semibold text-center">
          {dayjs(currentMonth).locale('zh-cn').format('YYYY年MM月')}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {/* 星期标题 */}
          {['日', '一', '二', '三', '四', '五', '六'].map(day => (
            <div key={day} className="h-8 flex items-center justify-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
          
          {/* 日期格子 */}
          {calendarDays.map((date, index) => {
            const isCurrentMonth = dayjs(date).isSame(currentMonth, 'month');
            const isSelected = dayjs(date).isSame(selectedDate, 'day');
            const dayAmount = getDayAmount(date);
            const hasBills = dayAmount > 0;

            return (
              <div
                key={index}
                className={`h-16 border border-gray-200 p-1 cursor-pointer hover:bg-gray-50 transition-colors ${
                  !isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
                } ${isSelected ? 'bg-blue-100 border-blue-300' : ''}`}
                onClick={() => onDateSelect(date)}
              >
                <div className="flex flex-col h-full">
                  <div className={`text-xs ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                    {dayjs(date).format('D')}
                  </div>
                  {hasBills && (
                    <div className="flex-1 flex items-end">
                      <div className="w-full text-center">
                        <div className="text-xs font-medium text-red-600">
                          ¥{dayAmount.toFixed(0)}
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