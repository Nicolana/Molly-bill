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

  // 根据支出金额获取颜色
  const getColorByExpense = (expense: number) => {
    if (expense === 0) return '#f3f4f6'; // 无支出 - 浅灰色
    const intensity = Math.min(expense / maxExpense, 1);
    const red = Math.floor(239 + (255 - 239) * intensity); // 从浅红到深红
    const green = Math.floor(68 + (99 - 68) * intensity);
    const blue = Math.floor(68 + (71 - 68) * intensity);
    return `rgb(${red}, ${green}, ${blue})`;
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
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>支出热力图</CardTitle>
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
          
          {/* 日期格子 - 热力图样式 */}
          {calendarDays.map((date, index) => {
            const isCurrentMonth = dayjs(date).isSame(currentMonth, 'month');
            const isSelected = dayjs(date).isSame(selectedDate, 'day');
            const dayExpense = getDayExpense(date);
            const backgroundColor = getColorByExpense(dayExpense);

            return (
              <div
                key={index}
                className={`h-16 border border-gray-200 p-1 cursor-pointer hover:opacity-80 transition-all ${
                  !isCurrentMonth ? 'opacity-30' : ''
                } ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
                style={{ backgroundColor }}
                onClick={() => onDateSelect(date)}
              >
                <div className="flex flex-col h-full">
                  <div className={`text-xs font-medium ${
                    isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  } ${dayExpense > maxExpense * 0.5 ? 'text-white' : ''}`}>
                    {dayjs(date).format('D')}
                  </div>
                  {dayExpense > 0 && (
                    <div className="flex-1 flex items-end">
                      <div className="w-full text-center">
                        <div className={`text-xs font-medium ${
                          dayExpense > maxExpense * 0.5 ? 'text-white' : 'text-red-600'
                        }`}>
                          ¥{dayExpense.toFixed(0)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* 图例 */}
        <div className="mt-4 flex items-center justify-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-100 border border-gray-300"></div>
            <span className="text-xs text-gray-600">无支出</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-200 border border-gray-300"></div>
            <span className="text-xs text-gray-600">低支出</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-400 border border-gray-300"></div>
            <span className="text-xs text-gray-600">中支出</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-600 border border-gray-300"></div>
            <span className="text-xs text-gray-600">高支出</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 