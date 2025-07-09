'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, BarChart3, LogOut } from 'lucide-react';
import ChatInterface from '@/components/ChatInterface';
import BillList from '@/components/BillList';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { BillCreate } from '@/types';
import { billsAPI } from '@/lib/api';

export default function DashboardPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('chat');

  // 处理账单创建
  const handleBillCreated = async (billData: BillCreate) => {
    try {
      const response = await billsAPI.createBill(billData);
      console.log('账单创建成功:', response.data);
      // 可以在这里添加成功提示
    } catch (error) {
      console.error('创建账单失败:', error);
    }
  };

  // 处理登出
  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">Molly Bill AI助手</h1>
              <span className="text-sm text-gray-500">欢迎回来，{user.email}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                登出
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* 标签页导航 */}
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat" className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>AI助手</span>
            </TabsTrigger>
            <TabsTrigger value="bills" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>账单记录</span>
            </TabsTrigger>
          </TabsList>

          {/* AI助手标签页 */}
          <TabsContent value="chat" className="space-y-6">
            <Card className="h-[600px]">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>AI记账助手</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[calc(100%-80px)] p-0">
                <ChatInterface onBillCreated={handleBillCreated} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* 账单记录标签页 */}
          <TabsContent value="bills" className="space-y-6">
            <BillList />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
} 