'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

interface ChartData {
  date: string;
  income: number;
  expense: number;
  count: number;
}

interface IncomeExpenseChartProps {
  data: ChartData[];
  timeFilter: 'all' | 'today' | 'month' | 'year';
  dateRange?: '7d' | '30d' | '90d';
  onDateRangeChange?: (range: '7d' | '30d' | '90d') => void;
  className?: string;
}

// 自定义工具提示组件
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const income = payload.find((p: any) => p.dataKey === 'income')?.value || 0;
    const expense = payload.find((p: any) => p.dataKey === 'expense')?.value || 0;
    const net = income - expense;
    
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-800 mb-2">{label}</p>
        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-between">
            <span className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              收入
            </span>
            <span className="font-medium text-green-600">¥{income.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              支出
            </span>
            <span className="font-medium text-red-600">¥{expense.toFixed(2)}</span>
          </div>
          <div className="border-t pt-1 flex items-center justify-between">
            <span className="flex items-center">
              {net >= 0 ? (
                <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-500 mr-1" />
              )}
              净额
            </span>
            <span className={`font-medium ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ¥{Math.abs(net).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function IncomeExpenseChart({
  data,
  timeFilter,
  dateRange,
  onDateRangeChange,
  className = ''
}: IncomeExpenseChartProps) {
  // 计算总收入和总支出
  const totalIncome = data.reduce((sum, item) => sum + item.income, 0);
  const totalExpense = data.reduce((sum, item) => sum + item.expense, 0);
  const netAmount = totalIncome - totalExpense;

  const getChartTitle = () => {
    switch (timeFilter) {
      case 'today':
        return '今日收支趋势';
      case 'month':
        return '本月收支趋势';
      case 'year':
        return '本年收支趋势';
      default:
        return '收支趋势';
    }
  };

  return (
    <Card className={`${className} overflow-hidden`}>
      <CardHeader className="pb-3 lg:pb-4">
        <div className="flex flex-col space-y-3 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600" />
            <CardTitle className="text-base lg:text-lg">{getChartTitle()}</CardTitle>
          </div>
          
          {/* 时间范围选择器 - 仅在 'all' 模式下显示 */}
          {timeFilter === 'all' && onDateRangeChange && (
            <div className="flex flex-wrap gap-2 lg:space-x-2">
              <Button
                variant={dateRange === '7d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onDateRangeChange('7d')}
                className="text-xs"
              >
                7天
              </Button>
              <Button
                variant={dateRange === '30d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onDateRangeChange('30d')}
                className="text-xs"
              >
                30天
              </Button>
              <Button
                variant={dateRange === '90d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onDateRangeChange('90d')}
                className="text-xs"
              >
                90天
              </Button>
            </div>
          )}
        </div>
        
        {/* 统计概览 */}
        <div className="grid grid-cols-3 gap-2 lg:gap-4 mt-4 p-3 lg:p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">总收入</div>
            <div className="text-xs lg:text-sm font-semibold text-green-600 flex items-center justify-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              <span className="truncate">¥{totalIncome.toFixed(2)}</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">总支出</div>
            <div className="text-xs lg:text-sm font-semibold text-red-600 flex items-center justify-center">
              <TrendingDown className="w-3 h-3 mr-1" />
              <span className="truncate">¥{totalExpense.toFixed(2)}</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">净收支</div>
            <div className={`text-xs lg:text-sm font-semibold flex items-center justify-center ${
              netAmount >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {netAmount >= 0 ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              <span className="truncate">¥{Math.abs(netAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-48 sm:h-64 lg:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 20,
                right: 15,
                left: 10,
                bottom: 5,
              }}
              barCategoryGap="20%"
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#f0f0f0"
                horizontal={true}
                vertical={false}
              />
              <XAxis 
                dataKey="date" 
                fontSize={12}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#666' }}
                interval="preserveStartEnd"
              />
              <YAxis 
                fontSize={12}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#666' }}
                tickFormatter={(value) => `¥${value}`}
              />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              <Bar 
                dataKey="income" 
                fill="#10b981" 
                name="收入"
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
              />
              <Bar 
                dataKey="expense" 
                fill="#ef4444" 
                name="支出"
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* 空数据提示 */}
        {data.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <BarChart3 className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm">暂无数据</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 