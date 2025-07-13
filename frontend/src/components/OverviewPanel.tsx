'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Receipt, 
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Download,
  Target
} from 'lucide-react';
import { Bill } from '@/types';
import dayjs from 'dayjs';

interface OverviewData {
  totalIncome: number;
  totalExpense: number;
  netIncome: number;
  billCount: number;
  avgDailyExpense: number;
  maxSingleExpense: number;
  topCategory: string;
  topCategoryAmount: number;
  // 环比数据
  incomeChange: number;
  expenseChange: number;
  netIncomeChange: number;
  billCountChange: number;
}

interface OverviewPanelProps {
  bills: Bill[];
  previousBills: Bill[];
  timeRange: { start: Date; end: Date };
  onAddBill?: () => void;
  onExportData?: () => void;
  onSetBudget?: () => void;
  className?: string;
}

export default function OverviewPanel({
  bills,
  previousBills,
  timeRange,
  onAddBill,
  onExportData,
  onSetBudget,
  className = ''
}: OverviewPanelProps) {
  
  // 计算当前期间数据
  const calculatePeriodData = (billsData: Bill[]) => {
    const income = billsData.filter(bill => bill.type === 'income').reduce((sum, bill) => sum + bill.amount, 0);
    const expense = billsData.filter(bill => bill.type === 'expense').reduce((sum, bill) => sum + bill.amount, 0);
    const net = income - expense;
    const count = billsData.length;
    
    // 计算日均支出
    const days = dayjs(timeRange.end).diff(dayjs(timeRange.start), 'day') + 1;
    const avgDaily = expense / days;
    
    // 最大单笔支出
    const maxExpense = Math.max(...billsData.filter(bill => bill.type === 'expense').map(bill => bill.amount), 0);
    
    // 主要支出类别
    const categoryStats = billsData
      .filter(bill => bill.type === 'expense')
      .reduce((stats, bill) => {
        const category = bill.category || '未分类';
        stats[category] = (stats[category] || 0) + bill.amount;
        return stats;
      }, {} as Record<string, number>);
    
    const topCategoryEntry = Object.entries(categoryStats).sort(([,a], [,b]) => b - a)[0];
    const topCategory = topCategoryEntry?.[0] || '无';
    const topCategoryAmount = topCategoryEntry?.[1] || 0;
    
    return {
      income,
      expense,
      net,
      count,
      avgDaily,
      maxExpense,
      topCategory,
      topCategoryAmount
    };
  };

  const currentData = calculatePeriodData(bills);
  const previousData = calculatePeriodData(previousBills);

  // 计算环比变化
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const overviewData: OverviewData = {
    totalIncome: currentData.income,
    totalExpense: currentData.expense,
    netIncome: currentData.net,
    billCount: currentData.count,
    avgDailyExpense: currentData.avgDaily,
    maxSingleExpense: currentData.maxExpense,
    topCategory: currentData.topCategory,
    topCategoryAmount: currentData.topCategoryAmount,
    incomeChange: calculateChange(currentData.income, previousData.income),
    expenseChange: calculateChange(currentData.expense, previousData.expense),
    netIncomeChange: calculateChange(currentData.net, previousData.net),
    billCountChange: calculateChange(currentData.count, previousData.count)
  };

  // 格式化金额
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // 格式化百分比
  const formatPercent = (percent: number) => {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(1)}%`;
  };

  // 趋势指示器组件
  const TrendIndicator = ({ value, className = '' }: { value: number; className?: string }) => {
    const isPositive = value >= 0;
    const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
    const colorClass = isPositive ? 'text-green-600' : 'text-red-600';
    
    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        <Icon className={`h-3 w-3 ${colorClass}`} />
        <span className={`text-xs ${colorClass}`}>{formatPercent(value)}</span>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 核心指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 总收入 */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-green-100 rounded-full -translate-y-4 translate-x-4"></div>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">总收入</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(overviewData.totalIncome)}
                </div>
                <TrendIndicator value={overviewData.incomeChange} className="mt-1" />
              </div>
              <div className="relative z-10">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 总支出 */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-red-100 rounded-full -translate-y-4 translate-x-4"></div>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">总支出</div>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(overviewData.totalExpense)}
                </div>
                <TrendIndicator value={overviewData.expenseChange} className="mt-1" />
              </div>
              <div className="relative z-10">
                <Receipt className="h-8 w-8 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 净收入 */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-100 rounded-full -translate-y-4 translate-x-4"></div>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">净收入</div>
                <div className={`text-2xl font-bold ${overviewData.netIncome >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatCurrency(overviewData.netIncome)}
                </div>
                <TrendIndicator value={overviewData.netIncomeChange} className="mt-1" />
              </div>
              <div className="relative z-10">
                <PiggyBank className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 账单数量 */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-purple-100 rounded-full -translate-y-4 translate-x-4"></div>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">账单数量</div>
                <div className="text-2xl font-bold text-purple-600">
                  {overviewData.billCount}
                </div>
                <TrendIndicator value={overviewData.billCountChange} className="mt-1" />
              </div>
              <div className="relative z-10">
                <Receipt className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 快速洞察 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <span>快速洞察</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(overviewData.maxSingleExpense)}
              </div>
              <div className="text-sm text-gray-600 mt-1">最大单笔支出</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-teal-600">
                {formatCurrency(overviewData.avgDailyExpense)}
              </div>
              <div className="text-sm text-gray-600 mt-1">平均日支出</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-indigo-600">
                {overviewData.topCategory}
              </div>
              <div className="text-sm text-gray-600 mt-1">主要支出类别</div>
              <div className="text-xs text-gray-500">
                {formatCurrency(overviewData.topCategoryAmount)}
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`text-2xl font-bold ${overviewData.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {overviewData.netIncome >= 0 ? '盈余' : '亏损'}
              </div>
              <div className="text-sm text-gray-600 mt-1">财务状态</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <Button onClick={onAddBill} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>添加账单</span>
            </Button>
            <Button variant="outline" onClick={onExportData} className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>导出数据</span>
            </Button>
            <Button variant="outline" onClick={onSetBudget} className="flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span>设置预算</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 