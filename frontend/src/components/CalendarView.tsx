'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
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
      .filter(bill => isSameDay(new Date(bill.date), date))
      .reduce((sum, bill) => sum + bill.amount, 0);
  };

  // 获取当前月份的所有日期
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // 获取日历开始日期（包括上个月的日期以填充第一周）
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(calendarStart.getDate() - getDay(monthStart));

  // 生成日历网格
  const calendarDays = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(calendarStart);
    date.setDate(date.getDate() + i);
    calendarDays.push(date);
  }

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
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
          {format(currentMonth, 'yyyy年MM月', { locale: zhCN })}
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
            const isCurrentMonth = isSameMonth(date, currentMonth);
            const isSelected = isSameDay(date, selectedDate);
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
                    {format(date, 'd')}
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