'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import dayjs from 'dayjs';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import 'dayjs/locale/zh-cn';

dayjs.extend(quarterOfYear);

export type TimeMode = 'quick' | 'range' | 'calendar';
export type QuickMode = 'today' | 'week' | 'month' | 'quarter' | 'year';

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface TimeControllerState {
  mode: TimeMode;
  quickMode: QuickMode;
  range: TimeRange;
  selectedDate: Date;
}

interface TimeControllerProps {
  value: TimeControllerState;
  onChange: (state: TimeControllerState) => void;
  className?: string;
}

export default function TimeController({ value, onChange, className = '' }: TimeControllerProps) {
  const [isExpanded] = useState(true);

  // 计算时间范围
  const calculateTimeRange = (mode: QuickMode): TimeRange => {
    const now = dayjs();
    switch (mode) {
      case 'today':
        return {
          start: now.startOf('day').toDate(),
          end: now.endOf('day').toDate()
        };
      case 'week':
        return {
          start: now.startOf('week').toDate(),
          end: now.endOf('week').toDate()
        };
      case 'month':
        return {
          start: now.startOf('month').toDate(),
          end: now.endOf('month').toDate()
        };
      case 'quarter':
        return {
          start: now.startOf('quarter').toDate(),
          end: now.endOf('quarter').toDate()
        };
      case 'year':
        return {
          start: now.startOf('year').toDate(),
          end: now.endOf('year').toDate()
        };
      default:
        return {
          start: now.startOf('month').toDate(),
          end: now.endOf('month').toDate()
        };
    }
  };

  // 处理快捷时间选择
  const handleQuickModeChange = (mode: QuickMode) => {
    const range = calculateTimeRange(mode);
    onChange({
      ...value,
      mode: 'quick',
      quickMode: mode,
      range
    });
  };

  return (
    <Card className={`${className}`}>
      <CardContent>
        {/* 顶部控制栏 */}
        {/* <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">时间控制</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-5 w-5 p-0"
            >
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </div>
          <div className="text-center px-2 py-1 bg-blue-50 rounded text-sm font-medium text-blue-900">
            {getDisplayText()}
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleTimeNavigation('prev')}
              className="h-6 w-6 p-0"
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToday}
              className="text-xs px-2 py-1 h-6"
            >
              今天
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleTimeNavigation('next')}
              className="h-6 w-6 p-0"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div> */}

        {/* 折叠内容 */}
        <div className={`transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="space-y-3">
            {/* 快捷时间选择 */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">快捷选择</div>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
                <Button
                  variant={value.quickMode === 'today' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleQuickModeChange('today')}
                  className="text-xs"
                >
                  今日
                </Button>
                <Button
                  variant={value.quickMode === 'week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleQuickModeChange('week')}
                  className="text-xs"
                >
                  本周
                </Button>
                <Button
                  variant={value.quickMode === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleQuickModeChange('month')}
                  className="text-xs"
                >
                  本月
                </Button>
                <Button
                  variant={value.quickMode === 'quarter' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleQuickModeChange('quarter')}
                  className="text-xs"
                >
                  本季度
                </Button>
                <Button
                  variant={value.quickMode === 'year' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleQuickModeChange('year')}
                  className="text-xs"
                >
                  本年
                </Button>
              </div>
            </div>

            {/* 自定义日期选择 */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">自定义范围</div>
              <div className="flex items-center space-x-2">
                <DatePicker
                  date={value.range.start}
                  onDateChange={(date) => {
                    if (date) {
                      onChange({
                        ...value,
                        mode: 'range',
                        range: { ...value.range, start: date }
                      });
                    }
                  }}
                  placeholder="开始日期"
                  className="flex-1"
                />
                <span className="text-gray-500">至</span>
                <DatePicker
                  date={value.range.end}
                  onDateChange={(date) => {
                    if (date) {
                      onChange({
                        ...value,
                        mode: 'range',
                        range: { ...value.range, end: date }
                      });
                    }
                  }}
                  placeholder="结束日期"
                  className="flex-1"
                />
              </div>
            </div>

            {/* 统计信息 */}
            <div className="pt-2 border-t">
              <div className="text-xs text-gray-500 text-center">
                时间跨度: {dayjs(value.range.end).diff(dayjs(value.range.start), 'day') + 1} 天
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 