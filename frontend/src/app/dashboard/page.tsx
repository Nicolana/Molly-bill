'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { billsAPI } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Bill, BillCreate } from '@/types';
import { Plus, Trash2, DollarSign } from 'lucide-react';

export default function DashboardPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBill, setNewBill] = useState<BillCreate>({
    amount: 0,
    description: '',
  });
  const { user, logout } = useAuthStore();

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const response = await billsAPI.getBills();
      setBills(response.data);
    } catch (error) {
      console.error('获取账单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBill = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await billsAPI.createBill(newBill);
      setNewBill({ amount: 0, description: '' });
      setShowAddForm(false);
      fetchBills();
    } catch (error) {
      console.error('添加账单失败:', error);
    }
  };

  const handleDeleteBill = async (id: number) => {
    try {
      await billsAPI.deleteBill(id);
      fetchBills();
    } catch (error) {
      console.error('删除账单失败:', error);
    }
  };

  const totalAmount = bills.reduce((sum, bill) => sum + bill.amount, 0);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">加载中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold">Molly Bill</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">欢迎，{user?.email}</span>
              <Button variant="outline" onClick={logout}>
                退出
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 统计卡片 */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>本月统计</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  ¥{totalAmount.toFixed(2)}
                </div>
                <p className="text-gray-600">总支出</p>
              </CardContent>
            </Card>
          </div>

          {/* 账单列表 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>账单记录</CardTitle>
                    <CardDescription>您的所有交易记录</CardDescription>
                  </div>
                  <Button onClick={() => setShowAddForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    添加账单
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {bills.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    暂无账单记录
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bills.map((bill) => (
                      <div
                        key={bill.id}
                        className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <div className="font-medium">
                            {bill.description || '无描述'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {bill.category && `${bill.category} • `}
                            {new Date(bill.date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="font-bold text-red-600">
                            -¥{bill.amount.toFixed(2)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteBill(bill.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 添加账单表单 */}
          {showAddForm && (
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>添加账单</CardTitle>
                  <CardDescription>记录新的支出</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddBill} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">金额</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={newBill.amount}
                        onChange={(e) =>
                          setNewBill({ ...newBill, amount: parseFloat(e.target.value) || 0 })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">描述</Label>
                      <Input
                        id="description"
                        value={newBill.description}
                        onChange={(e) =>
                          setNewBill({ ...newBill, description: e.target.value })
                        }
                        placeholder="例如：午餐"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">分类</Label>
                      <Input
                        id="category"
                        value={newBill.category || ''}
                        onChange={(e) =>
                          setNewBill({ ...newBill, category: e.target.value })
                        }
                        placeholder="例如：餐饮"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button type="submit" className="flex-1">
                        添加
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAddForm(false)}
                      >
                        取消
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 