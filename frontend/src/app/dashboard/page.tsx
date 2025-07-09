'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, BarChart3, Calendar, TrendingUp } from 'lucide-react';
import { Bill, BillCreate } from '@/types';
import { billsAPI } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import ChatInterface from '@/components/ChatInterface';
import CalendarView from '@/components/CalendarView';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

export default function DashboardPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // 获取账单列表
  const fetchBills = async () => {
    try {
      setLoading(true);
      const response = await billsAPI.getBills(0, 1000); // 获取更多数据用于图表
      
      if (response.data.success && response.data.data) {
        const paginatedData = response.data.data;
        setBills(paginatedData.data || []);
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
  }, []);

  // 计算统计数据
  const totalAmount = bills.reduce((sum, bill) => sum + bill.amount, 0);
  const totalCount = bills.length;
  const averageAmount = totalCount > 0 ? totalAmount / totalCount : 0;

  // 按分类统计
  const categoryStats = bills.reduce((stats, bill) => {
    const category = bill.category || '未分类';
    stats[category] = (stats[category] || 0) + bill.amount;
    return stats;
  }, {} as Record<string, number>);

  // 生成日期范围数据
  const generateDateRangeData = () => {
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day');
      const dayStart = date.startOf('day');
      const dayEnd = date.endOf('day');
      
      const dayBills = bills.filter(bill => {
        const billDate = dayjs(bill.date);
        return billDate.isSame(dayStart, 'day') || (billDate.isAfter(dayStart) && billDate.isBefore(dayEnd));
      });
      
      const dayTotal = dayBills.reduce((sum, bill) => sum + bill.amount, 0);
      
      data.push({
        date: date.format('MM/DD'),
        amount: dayTotal,
        count: dayBills.length
      });
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
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>AI记账助手</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[calc(100%-80px)] p-0">
                <ChatInterface onBillsCreated={handleBillsCreated} />
              </CardContent>
            </Card>
          </div>

          {/* 右侧账单和图表区域 */}
          <div className="w-1/2 overflow-auto">
            <div className="p-6 space-y-6">
              {/* 统计卡片 */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">总支出</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">¥{totalAmount.toFixed(2)}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">账单数量</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{totalCount}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">平均支出</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">¥{averageAmount.toFixed(2)}</div>
                  </CardContent>
                </Card>
              </div>

              {/* 图表和账单列表标签页 */}
              <Tabs defaultValue="chart" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="chart" className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>趋势图</span>
                  </TabsTrigger>
                  <TabsTrigger value="category" className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>分类统计</span>
                  </TabsTrigger>
                  <TabsTrigger value="calendar" className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>日历视图</span>
                  </TabsTrigger>
                  <TabsTrigger value="bills" className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>账单列表</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="chart" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>支出趋势</CardTitle>
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
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={generateDateRangeData()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip formatter={(value) => [`¥${value}`, '金额']} />
                            <Line type="monotone" dataKey="amount" stroke="#8884d8" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="category" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>分类统计</CardTitle>
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
                </TabsContent>

                <TabsContent value="calendar" className="space-y-4">
                  <CalendarView 
                    bills={bills}
                    selectedDate={selectedDate}
                    onDateSelect={handleDateSelect}
                  />
                </TabsContent>

                <TabsContent value="bills" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>账单记录</CardTitle>
                        <div className="flex items-center space-x-4">
                          <input
                            type="date"
                            value={dayjs(selectedDate).format('YYYY-MM-DD')}
                            onChange={(e) => setSelectedDate(new Date(e.target.value))}
                            className="px-3 py-1 border rounded-md text-sm"
                          />
                          <span className="text-sm text-gray-600">
                            当日支出: ¥{selectedDateTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {selectedDateBills.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          <p>该日期没有账单记录</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-96 overflow-auto">
                          {selectedDateBills.map((bill) => (
                            <div
                              key={bill.id}
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                            >
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">¥{bill.amount.toFixed(2)}</span>
                                  {bill.category && (
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                      {bill.category}
                                    </span>
                                  )}
                                </div>
                                {bill.description && (
                                  <p className="text-sm text-gray-600 mt-1">{bill.description}</p>
                                )}
                                <p className="text-xs text-gray-400 mt-1">
                                  {dayjs(bill.date).format('HH:mm')}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteBill(bill.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                删除
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 