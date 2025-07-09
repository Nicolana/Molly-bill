'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bill } from '@/types';
import { billsAPI } from '@/lib/api';
import { Trash2 } from 'lucide-react';

export default function BillList() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 获取账单列表
  const fetchBills = async () => {
    try {
      setLoading(true);
      const response = await billsAPI.getBills();
      setBills(response.data);
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
      setBills(prev => prev.filter(bill => bill.id !== id));
    } catch (err) {
      console.error('删除账单失败:', err);
      alert('删除账单失败');
    }
  };



  useEffect(() => {
    fetchBills();
  }, []);

  // 计算总金额
  const totalAmount = bills.reduce((sum, bill) => sum + bill.amount, 0);

  // 按分类统计
  const categoryStats = bills.reduce((stats, bill) => {
    const category = bill.category || '未分类';
    stats[category] = (stats[category] || 0) + bill.amount;
    return stats;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        {error}
        <Button onClick={fetchBills} className="ml-2">重试</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div className="text-2xl font-bold text-blue-600">{bills.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">平均支出</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ¥{bills.length > 0 ? (totalAmount / bills.length).toFixed(2) : '0.00'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 分类统计 */}
      {Object.keys(categoryStats).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>分类统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(categoryStats)
                .sort(([,a], [,b]) => b - a)
                .map(([category, amount]) => (
                  <div key={category} className="flex justify-between items-center">
                    <span className="text-sm">{category}</span>
                    <span className="font-medium">¥{amount.toFixed(2)}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 账单列表 */}
      <Card>
        <CardHeader>
          <CardTitle>账单记录</CardTitle>
        </CardHeader>
        <CardContent>
          {bills.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>还没有账单记录</p>
              <p className="text-sm mt-1">开始使用AI助手记录你的支出吧！</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bills.map((bill) => (
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
                      {new Date(bill.date).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteBill(bill.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 