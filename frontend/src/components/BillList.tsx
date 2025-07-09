'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bill } from '@/types';
import { billsAPI } from '@/lib/api';
import { Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function BillList() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // 获取账单列表
  const fetchBills = async (page: number = 0, size: number = 20) => {
    try {
      setLoading(true);
      const response = await billsAPI.getBills(page * size, size);
      
      // 处理分页响应数据
      if (response.data.success && response.data.data) {
        const paginatedData = response.data.data;
        setBills(paginatedData.data || []);
        setTotal(paginatedData.total || 0);
        setCurrentPage(page);
        setPageSize(size);
        setHasMore((page + 1) * size < (paginatedData.total || 0));
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
      // 重新获取当前页数据
      fetchBills(currentPage, pageSize);
    } catch (err) {
      console.error('删除账单失败:', err);
      alert('删除账单失败');
    }
  };

  // 上一页
  const goToPreviousPage = () => {
    if (currentPage > 0) {
      fetchBills(currentPage - 1, pageSize);
    }
  };

  // 下一页
  const goToNextPage = () => {
    if (hasMore) {
      fetchBills(currentPage + 1, pageSize);
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

  if (loading && bills.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (error && bills.length === 0) {
    return (
      <div className="text-center text-red-500 p-4">
        {error}
        <Button onClick={() => fetchBills()} className="ml-2">重试</Button>
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
            <div className="text-2xl font-bold text-blue-600">{total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">平均支出</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ¥{total > 0 ? (totalAmount / total).toFixed(2) : '0.00'}
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
            <>
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

              {/* 分页控件 */}
              {total > pageSize && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    显示 {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, total)} 条，共 {total} 条
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousPage}
                      disabled={currentPage === 0 || loading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      上一页
                    </Button>
                    <span className="text-sm text-gray-600">
                      第 {currentPage + 1} 页
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextPage}
                      disabled={!hasMore || loading}
                    >
                      下一页
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 