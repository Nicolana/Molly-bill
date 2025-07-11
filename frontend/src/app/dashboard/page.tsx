'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { MessageSquare, BarChart3, Calendar, TrendingUp } from 'lucide-react';
import { Bill, BillCreate } from '@/types';
import { billsAPI } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import ChatInterface from '@/components/ChatInterface';
import CalendarView from '@/components/CalendarView';
import BillList from '@/components/BillList';
import LedgerSelector from '@/components/LedgerSelector';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

export default function DashboardPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'month' | 'year'>('month'); // 新增时间筛选
  const [selectedLedgerId, setSelectedLedgerId] = useState<number | undefined>(undefined);

  // 获取账单列表
  const fetchBills = async () => {
    if (!selectedLedgerId) return; // 如果没有选中账本，不获取账单
    
    try {
      setLoading(true);
      const response = await billsAPI.getBills(0, 1000, timeFilter, selectedLedgerId); // 传递账本ID
      console.log("bills", response)
      
      if (response.data.success && response.data.data) {
        const paginatedData = response.data.data;
        console.log("获取到的bill 列表", paginatedData)
        setBills(paginatedData || []);
      } else {
        setError(response.data.message || '获取账单失败');
      }
    } catch (err) {
      console.error('获取账单失败:', err);
      setError('获取账单失败');
    } finally {
      setLoading(false);
    }
  };

  // 删除账单
  const deleteBill = async (id: number) => {
    try {
      await billsAPI.deleteBill(id);
      fetchBills(); // 重新获取数据
    } catch (err) {
      console.error('删除账单失败:', err);
      alert('删除账单失败');
    }
  };

  // 处理新账单创建
  const handleBillsCreated = async (newBills: BillCreate[]) => {
    // 重新获取账单数据以更新图表和列表
    await fetchBills();
  };

  // 处理日期选择
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  useEffect(() => {
    fetchBills();
  }, [timeFilter, selectedLedgerId]); // 当时间筛选或账本改变时重新获取数据

  // 处理账本切换
  const handleLedgerChange = (ledgerId: number) => {
    setSelectedLedgerId(ledgerId);
    setBills([]); // 清空当前账单数据
  };

  // 计算统计数据
  const totalAmount = bills.reduce((sum, bill) => {
    return bill.type === 'income' ? sum + bill.amount : sum - bill.amount;
  }, 0);
  const totalCount = bills.length;
  const averageAmount = totalCount > 0 ? Math.abs(totalAmount) / totalCount : 0;

  // 按分类统计
  const categoryStats = bills.reduce((stats, bill) => {
    const category = bill.category || '未分类';
    const type = bill.type === 'income' ? '收入' : '支出';
    const key = `${type}-${category}`;
    stats[key] = (stats[key] || 0) + bill.amount;
    return stats;
  }, {} as Record<string, number>);

  // 生成日期范围数据
  const generateDateRangeData = () => {
    const now = dayjs();
    let days = 30; // 默认30天
    let startDate = now.subtract(29, 'day'); // 默认显示最近30天
    
    // 根据时间筛选调整显示范围
    switch (timeFilter) {
      case 'today':
        days = 24; // 显示24小时
        startDate = now.startOf('day');
        break;
      case 'month':
        days = now.daysInMonth();
        startDate = now.startOf('month');
        break;
      case 'year':
        days = 12; // 显示12个月
        startDate = now.startOf('year');
        break;
      default:
        // 'all' 使用原来的dateRange逻辑
        days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
        startDate = now.subtract(days - 1, 'day');
    }
    
    const data = [];
    
    if (timeFilter === 'year') {
      // 年度视图：显示12个月的数据
      for (let i = 0; i < 12; i++) {
        const monthDate = now.startOf('year').add(i, 'month');
        const monthStart = monthDate.startOf('month');
        const monthEnd = monthDate.endOf('month');
        
        const monthBills = bills.filter(bill => {
          const billDate = dayjs(bill.date);
          return billDate.isSame(monthStart, 'month') && billDate.isSame(monthStart, 'year');
        });
        
        const monthIncome = monthBills.filter(bill => bill.type === 'income').reduce((sum, bill) => sum + bill.amount, 0);
        const monthExpense = monthBills.filter(bill => bill.type === 'expense').reduce((sum, bill) => sum + bill.amount, 0);
        
        data.push({
          date: monthDate.format('MM月'),
          income: monthIncome,
          expense: monthExpense,
          count: monthBills.length
        });
      }
    } else {
      // 日视图：显示具体天数
      for (let i = 0; i < days; i++) {
        const date = startDate.add(i, timeFilter === 'today' ? 'hour' : 'day');
        const dayStart = date.startOf(timeFilter === 'today' ? 'hour' : 'day');
        const dayEnd = date.endOf(timeFilter === 'today' ? 'hour' : 'day');
        
        const dayBills = bills.filter(bill => {
          const billDate = dayjs(bill.date);
          return billDate.isSame(dayStart, timeFilter === 'today' ? 'hour' : 'day') || 
                 (billDate.isAfter(dayStart) && billDate.isBefore(dayEnd));
        });
        
        const dayIncome = dayBills.filter(bill => bill.type === 'income').reduce((sum, bill) => sum + bill.amount, 0);
        const dayExpense = dayBills.filter(bill => bill.type === 'expense').reduce((sum, bill) => sum + bill.amount, 0);
        
        data.push({
          date: date.format(timeFilter === 'today' ? 'HH:mm' : 'MM/DD'),
          income: dayIncome,
          expense: dayExpense,
          count: dayBills.length
        });
      }
    }
    
    return data;
  };

  // 生成饼图数据
  const generatePieData = () => {
    return Object.entries(categoryStats).map(([name, value]) => ({
      name,
      value
    }));
  };

  // 获取选中日期的账单
  const getSelectedDateBills = () => {
    const dayStart = dayjs(selectedDate).startOf('day');
    const dayEnd = dayjs(selectedDate).endOf('day');
    
    return bills.filter(bill => {
      const billDate = dayjs(bill.date);
      return billDate.isSame(dayStart, 'day') || (billDate.isAfter(dayStart) && billDate.isBefore(dayEnd));
    });
  };

  const selectedDateBills = getSelectedDateBills();
  const selectedDateTotal = selectedDateBills.reduce((sum, bill) => sum + bill.amount, 0);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  if (loading && bills.length === 0) {
    return (
      <ProtectedRoute>
        <div className="flex justify-center items-center h-screen">
          <div className="text-gray-500">加载中...</div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="h-[calc(100vh-65px)] bg-gray-50">
        <div className="flex h-full">
          {/* 左侧聊天区域 */}
          <div className="w-1/2 border-r border-gray-200">
            <Card className="h-full rounded-none border-0">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5" />
                    <span>AI记账助手</span>
                  </CardTitle>
                  <LedgerSelector 
                    selectedLedgerId={selectedLedgerId}
                    onLedgerChange={handleLedgerChange}
                    className="ml-4"
                  />
                </div>
              </CardHeader>
              <CardContent className="h-[calc(100%-80px)] p-0">
                <ChatInterface 
                  onBillsCreated={handleBillsCreated} 
                  selectedLedgerId={selectedLedgerId}
                />
              </CardContent>
            </Card>
          </div>

          {/* 右侧账单和图表区域 */}
          <div className="w-1/2 overflow-auto">
            <div className="p-6 space-y-6">
              {/* 时间筛选 */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">
                  {timeFilter === 'today' && '今日统计'}
                  {timeFilter === 'month' && '本月统计'}
                  {timeFilter === 'year' && '本年统计'}
                  {timeFilter === 'all' && '全部统计'}
                </h2>
                <div className="flex space-x-2">
                  <Button
                    variant={timeFilter === 'today' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeFilter('today')}
                  >
                    今日
                  </Button>
                  <Button
                    variant={timeFilter === 'month' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeFilter('month')}
                  >
                    本月
                  </Button>
                  <Button
                    variant={timeFilter === 'year' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeFilter('year')}
                  >
                    本年
                  </Button>
                  <Button
                    variant={timeFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeFilter('all')}
                  >
                    全部
                  </Button>
                </div>
              </div>

              {/* 统计卡片 */}
              <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-400/20 via-green-300/15 to-teal-200/20 backdrop-blur-md border-0">
                {/* 背景插图 */}
                <div className="absolute inset-0 opacity-10">
                  <img 
                    src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
                    alt="Finance background"
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <CardContent className="px-6 py-0 relative z-10">
                  <div className="flex items-center justify-between">
                    {/* 主要区域 - 支出 */}
                    <div className="flex-1">
                      <div className="mb-2">
                        <h3 className="text-sm font-medium text-gray-700 mb-1">总支出</h3>
                        <div className="text-3xl font-bold text-gray-800">
                          ¥{bills.filter(bill => bill.type === 'expense').reduce((sum, bill) => sum + bill.amount, 0).toFixed(2)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                        </svg>
                        <span>本月支出</span>
                      </div>
                    </div>
                    
                    {/* 次要区域 - 右侧信息 */}
                    <div className="flex flex-col space-y-4 ml-8">
                      {/* 收入 */}
                      <div className="text-right">
                        <div className="text-xs text-gray-600 mb-1">总收入</div>
                        <div className="text-lg font-semibold text-green-600">
                          ¥{bills.filter(bill => bill.type === 'income').reduce((sum, bill) => sum + bill.amount, 0).toFixed(2)}
                        </div>
                      </div>
                      
                      {/* 账单数量 */}
                      <div className="text-right">
                        <div className="text-xs text-gray-600 mb-1">账单数量</div>
                        <div className="text-lg font-semibold text-emerald-600">
                          {totalCount}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 收支趋势柱状图 */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      {timeFilter === 'today' && '今日收支趋势'}
                      {timeFilter === 'month' && '本月收支趋势'}
                      {timeFilter === 'year' && '本年收支趋势'}
                      {timeFilter === 'all' && '收支趋势'}
                    </CardTitle>
                    {timeFilter === 'all' && (
                      <div className="flex space-x-2">
                        <Button
                          variant={dateRange === '7d' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setDateRange('7d')}
                        >
                          7天
                        </Button>
                        <Button
                          variant={dateRange === '30d' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setDateRange('30d')}
                        >
                          30天
                        </Button>
                        <Button
                          variant={dateRange === '90d' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setDateRange('90d')}
                        >
                          90天
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={generateDateRangeData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`¥${value}`, '金额']} />
                        <Bar dataKey="income" fill="#10b981" name="收入" />
                        <Bar dataKey="expense" fill="#ef4444" name="支出" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* 分类统计饼图 */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {timeFilter === 'today' && '今日分类统计'}
                    {timeFilter === 'month' && '本月分类统计'}
                    {timeFilter === 'year' && '本年分类统计'}
                    {timeFilter === 'all' && '分类统计'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={generatePieData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {generatePieData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`¥${value}`, '金额']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* 支出热力图 */}
              <CalendarView 
                bills={bills}
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
              />

              {/* 账单列表 */}
              <BillList 
                bills={selectedDateBills}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                onDeleteBill={deleteBill}
              />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 