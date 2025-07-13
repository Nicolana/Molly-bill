'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  PieChart as PieChartIcon,
  Calendar,
  Activity,
  Eye,
  EyeOff
} from 'lucide-react';
import { Bill } from '@/types';
import dayjs from 'dayjs';

interface AnalyticsPanelProps {
  bills: Bill[];
  timeRange: { start: Date; end: Date };
  quickMode: string;
  onDateSelect?: (date: Date) => void;
  className?: string;
}

interface ChartData {
  date: string;
  income: number;
  expense: number;
  net: number;
  cumulative: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
  type: 'income' | 'expense';
}

export default function AnalyticsPanel({
  bills,
  timeRange,
  onDateSelect,
  className = ''
}: AnalyticsPanelProps) {
  const [activeTab, setActiveTab] = useState('trend');
  const [showCumulative, setShowCumulative] = useState(false);

  // 生成趋势数据
  const generateTrendData = (): ChartData[] => {
    const data: ChartData[] = [];
    const start = dayjs(timeRange.start);
    const end = dayjs(timeRange.end);
    let cumulative = 0;

    // 根据时间范围决定数据粒度
    const getTimeUnit = () => {
      const days = end.diff(start, 'day');
      if (days <= 7) return 'day';
      if (days <= 31) return 'day';
      if (days <= 365) return 'month';
      return 'year';
    };

    const timeUnit = getTimeUnit();
    let current = start.startOf(timeUnit);

    while (current.isBefore(end) || current.isSame(end, timeUnit)) {
      const periodStart = current.startOf(timeUnit);
      const periodEnd = current.endOf(timeUnit);

      const periodBills = bills.filter(bill => {
        const billDate = dayjs(bill.date);
        return billDate.isSame(periodStart, timeUnit) || 
               (billDate.isAfter(periodStart) && billDate.isBefore(periodEnd));
      });

      const income = periodBills.filter(bill => bill.type === 'income').reduce((sum, bill) => sum + bill.amount, 0);
      const expense = periodBills.filter(bill => bill.type === 'expense').reduce((sum, bill) => sum + bill.amount, 0);
      const net = income - expense;
      cumulative += net;

      data.push({
        date: current.format(timeUnit === 'day' ? 'MM/DD' : timeUnit === 'month' ? 'YYYY-MM' : 'YYYY'),
        income,
        expense,
        net,
        cumulative
      });

      current = current.add(1, timeUnit);
    }

    return data;
  };

  // 生成分类数据
  const generateCategoryData = (): { income: CategoryData[]; expense: CategoryData[] } => {
    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
      '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
    ];

    const incomeStats = bills
      .filter(bill => bill.type === 'income')
      .reduce((stats, bill) => {
        const category = bill.category || '未分类';
        stats[category] = (stats[category] || 0) + bill.amount;
        return stats;
      }, {} as Record<string, number>);

    const expenseStats = bills
      .filter(bill => bill.type === 'expense')
      .reduce((stats, bill) => {
        const category = bill.category || '未分类';
        stats[category] = (stats[category] || 0) + bill.amount;
        return stats;
      }, {} as Record<string, number>);

    const incomeData: CategoryData[] = Object.entries(incomeStats)
      .map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length],
        type: 'income' as const
      }))
      .sort((a, b) => b.value - a.value);

    const expenseData: CategoryData[] = Object.entries(expenseStats)
      .map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length],
        type: 'expense' as const
      }))
      .sort((a, b) => b.value - a.value);

    return { income: incomeData, expense: expenseData };
  };

  // 生成热力图数据
  const generateHeatmapData = () => {
    const heatmapData: { date: string; day: number; amount: number; count: number }[] = [];
    const start = dayjs(timeRange.start);
    const end = dayjs(timeRange.end);
    let current = start;

    while (current.isBefore(end) || current.isSame(end, 'day')) {
      const dayBills = bills.filter(bill => dayjs(bill.date).isSame(current, 'day'));
      const dayExpense = dayBills.filter(bill => bill.type === 'expense').reduce((sum, bill) => sum + bill.amount, 0);
      
      heatmapData.push({
        date: current.format('YYYY-MM-DD'),
        day: current.day(),
        amount: dayExpense,
        count: dayBills.length
      });

      current = current.add(1, 'day');
    }

    return heatmapData;
  };

  const trendData = generateTrendData();
  const categoryData = generateCategoryData();
  const heatmapData = generateHeatmapData();

  // 格式化金额
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // 自定义工具提示
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-800 mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <span className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  {entry.name}
                </span>
                <span className="font-medium ml-4">
                  {formatCurrency(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <span>数据分析</span>
            </div>
            <div className="text-sm text-gray-500">
              {dayjs(timeRange.start).format('YYYY/MM/DD')} - {dayjs(timeRange.end).format('YYYY/MM/DD')}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="trend" className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>趋势分析</span>
              </TabsTrigger>
              <TabsTrigger value="category" className="flex items-center space-x-2">
                <PieChartIcon className="h-4 w-4" />
                <span>分类分析</span>
              </TabsTrigger>
              <TabsTrigger value="heatmap" className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>时间分析</span>
              </TabsTrigger>
            </TabsList>

            {/* 趋势分析 */}
            <TabsContent value="trend" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">收支趋势</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCumulative(!showCumulative)}
                  className="flex items-center space-x-2"
                >
                  {showCumulative ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span>{showCumulative ? '隐藏' : '显示'}累计</span>
                </Button>
              </div>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  {showCumulative ? (
                    <AreaChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis fontSize={12} tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="cumulative"
                        stroke="#3B82F6"
                        fill="#3B82F6"
                        fillOpacity={0.1}
                        name="累计净收入"
                      />
                    </AreaChart>
                  ) : (
                    <BarChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis fontSize={12} tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="income" fill="#10B981" name="收入" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" fill="#EF4444" name="支出" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </TabsContent>

            {/* 分类分析 */}
            <TabsContent value="category" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 支出分类 */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">支出分类</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                                                 <Pie
                           data={categoryData.expense}
                           cx="50%"
                           cy="50%"
                           labelLine={false}
                           label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                           outerRadius={80}
                           fill="#8884d8"
                           dataKey="value"
                         >
                          {categoryData.expense.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {categoryData.expense.slice(0, 5).map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: item.color }}
                          ></div>
                          <span>{item.name}</span>
                        </div>
                        <span className="font-medium">{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 收入分类 */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">收入分类</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                                                 <Pie
                           data={categoryData.income}
                           cx="50%"
                           cy="50%"
                           labelLine={false}
                           label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                           outerRadius={80}
                           fill="#8884d8"
                           dataKey="value"
                         >
                          {categoryData.income.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {categoryData.income.slice(0, 5).map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: item.color }}
                          ></div>
                          <span>{item.name}</span>
                        </div>
                        <span className="font-medium">{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* 时间分析 */}
            <TabsContent value="heatmap" className="space-y-4">
              <h3 className="text-lg font-semibold">支出热力图</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-7 gap-1 text-xs text-center text-gray-600 mb-2">
                  <div>日</div>
                  <div>一</div>
                  <div>二</div>
                  <div>三</div>
                  <div>四</div>
                  <div>五</div>
                  <div>六</div>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {heatmapData.map((day, index) => {
                    const maxAmount = Math.max(...heatmapData.map(d => d.amount));
                    const intensity = maxAmount > 0 ? day.amount / maxAmount : 0;
                    const opacity = Math.max(0.1, intensity);
                    
                    return (
                      <div
                        key={index}
                        className="aspect-square rounded cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                        style={{
                          backgroundColor: `rgba(239, 68, 68, ${opacity})`,
                        }}
                        onClick={() => onDateSelect?.(new Date(day.date))}
                        title={`${day.date}: ${formatCurrency(day.amount)} (${day.count}笔)`}
                      >
                        <div className="w-full h-full flex items-center justify-center text-xs">
                          {dayjs(day.date).date()}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
                  <span>支出较少</span>
                  <div className="flex items-center space-x-1">
                    {[0.2, 0.4, 0.6, 0.8, 1.0].map((opacity, index) => (
                      <div
                        key={index}
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: `rgba(239, 68, 68, ${opacity})` }}
                      ></div>
                    ))}
                  </div>
                  <span>支出较多</span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 