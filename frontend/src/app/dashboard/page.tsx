'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, BookOpen } from 'lucide-react';
import { Bill } from '@/types';
import { billsAPI } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import ChatInterface from '@/components/ChatInterface';
import TimeController, { TimeControllerState } from '@/components/TimeController';
import OverviewPanel from '@/components/OverviewPanel';
import AnalyticsPanel from '@/components/AnalyticsPanel';
import BillList from '@/components/BillList';
import { useLedgerStore } from '@/store/ledger';
import Link from 'next/link';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import eventBus from '@/lib/eventBus';

export default function DashboardPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [previousBills, setPreviousBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState('');
  
  // 时间控制器状态
  const [timeState, setTimeState] = useState<TimeControllerState>({
    mode: 'quick',
    quickMode: 'month',
    range: {
      start: dayjs().startOf('month').toDate(),
      end: dayjs().endOf('month').toDate()
    },
    selectedDate: new Date()
  });
  
  // 使用全局账本状态
  const { currentLedgerId, userLedgers, fetchUserLedgers, getCurrentLedger } = useLedgerStore();

  // 获取账单列表
  const fetchBills = async (startDate: Date, endDate: Date) => {
    if (!currentLedgerId) return;
    
    try {
      setLoading(true);
      const response = await billsAPI.getBills('all', currentLedgerId);
      
      if (response.data.success && response.data.data) {
        const allBills = response.data.data;
        
        // 筛选当前时间范围的账单
        const filteredBills = allBills.filter(bill => {
          const billDate = dayjs(bill.date);
          return billDate.isSame(startDate, 'day') || 
                 billDate.isSame(endDate, 'day') ||
                 (billDate.isAfter(startDate) && billDate.isBefore(endDate));
        });
        
        setBills(filteredBills);
        
        // 获取上一个周期的数据用于环比
        const periodDiff = dayjs(endDate).diff(dayjs(startDate), 'day') + 1;
        const prevStartDate = dayjs(startDate).subtract(periodDiff, 'day');
        const prevEndDate = dayjs(startDate).subtract(1, 'day');
        
        const prevBills = allBills.filter(bill => {
          const billDate = dayjs(bill.date);
          return billDate.isSame(prevStartDate, 'day') || 
                 billDate.isSame(prevEndDate, 'day') ||
                 (billDate.isAfter(prevStartDate) && billDate.isBefore(prevEndDate));
        });
        
        setPreviousBills(prevBills);
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

  // 处理新账单创建
  const handleBillsCreated = async () => {
    await fetchBills(timeState.range.start, timeState.range.end);
  };

  // 处理时间状态变化
  const handleTimeStateChange = (newTimeState: TimeControllerState) => {
    setTimeState(newTimeState);
    fetchBills(newTimeState.range.start, newTimeState.range.end);
  };

  // 处理日期选择
  const handleDateSelect = (date: Date) => {
    setTimeState(prev => ({
      ...prev,
      selectedDate: date
    }));
  };

  // 初始化数据
  useEffect(() => {
    const initializeData = async () => {
      await fetchUserLedgers();
      await getCurrentLedger();
    };
    initializeData();
  }, []);

  useEffect(() => {
    if (currentLedgerId) {
      fetchBills(timeState.range.start, timeState.range.end);
    }

    const handleBillDelete = (billId: number) => {
      setBills(prev => prev.filter(bill => bill.id !== billId));
      setPreviousBills(prev => prev.filter(bill => bill.id !== billId));
    };

    eventBus.on('bill:delete', handleBillDelete);
    return () => {
      eventBus.off('bill:delete', handleBillDelete);
    }
  }, [currentLedgerId]);

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
      <div className="min-h-[calc(100vh-65px)] bg-gray-50">
        {/* 桌面端布局 */}
        <div className="hidden lg:flex h-[calc(100vh-65px)]">
          {/* 左侧聊天区域 */}
          <div className="w-1/2 border-r border-gray-200">
            <Card className="h-full rounded-none border-0">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5" />
                    <span>AI记账助手</span>
                  </CardTitle>
                  <Link href="/dashboard/ledgers">
                    <Button variant="outline" size="sm" className="flex items-center space-x-2">
                      <BookOpen className="h-4 w-4" />
                      <span>
                        {currentLedgerId ? 
                          userLedgers.find(ul => ul.ledger?.id === currentLedgerId)?.ledger?.name || '选择账本' : 
                          '选择账本'
                        }
                      </span>
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="h-[calc(100%-80px)] p-0">
                <ChatInterface 
                  onBillsCreated={handleBillsCreated} 
                  selectedLedgerId={currentLedgerId || undefined}
                />
              </CardContent>
            </Card>
          </div>

          {/* 右侧统计和分析区域 */}
          <div className="w-1/2 overflow-auto">
            <div className="p-6 space-y-6">
              {/* 时间控制器 */}
              <TimeController 
                value={timeState}
                onChange={handleTimeStateChange}
              />

              {/* 总览统计面板 */}
              <OverviewPanel 
                bills={bills}
                previousBills={previousBills}
                timeRange={timeState.range}
              />

              {/* 分析面板 */}
              <AnalyticsPanel 
                bills={bills}
                timeRange={timeState.range}
                quickMode={timeState.quickMode}
                onDateSelect={handleDateSelect}
              />

              {/* 账单列表 */}
              <BillList 
                bills={bills}
                title="账单明细"
              />
            </div>
          </div>
        </div>

        {/* 移动端布局 - 仅显示统计面板 */}
        <div className="lg:hidden">
          <div className="pb-20 space-y-4">
            {/* 时间控制器 - 移动端 */}
            <div className="p-4">
              <TimeController
                value={timeState}
                onChange={handleTimeStateChange}
              />
            </div>

            {/* 总览统计面板 - 移动端 */}
            <div className="px-4">
              <OverviewPanel
                bills={bills}
                previousBills={previousBills}
                timeRange={timeState.range}
              />
            </div>

            {/* 分析面板 - 移动端 */}
            <div className="px-4">
              <AnalyticsPanel
                bills={bills}
                timeRange={timeState.range}
                quickMode={timeState.quickMode}
                onDateSelect={handleDateSelect}
              />
            </div>

            {/* 账单列表 - 移动端 */}
            <div className="px-4">
              <BillList
                bills={bills}
                title="选定日期账单"
              />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 