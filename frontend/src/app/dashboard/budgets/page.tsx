'use client';

import { useState, useEffect } from 'react';
import { Budget, BudgetCreate, BudgetListResponse } from '@/types';
import { BudgetStatus } from '@/constants/enums';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BudgetCard from '@/components/BudgetCard';
import CreateBudgetDialog from '@/components/CreateBudgetDialog';
import { Plus, TrendingUp, AlertTriangle, DollarSign, Target } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useLedgerStore } from '@/store/ledger';
import { budgetsAPI } from '@/lib/api';

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [stats, setStats] = useState({
    total_budgets: 0,
    active_budgets: 0,
    total_amount: 0,
    total_spent: 0,
    total_remaining: 0,
    exceeded_count: 0,
    warning_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  const { userLedgers, currentLedgerId } = useLedgerStore();
  console.log(userLedgers, currentLedgerId);
  const currentLedger = userLedgers.find(ul => ul.ledger?.id === currentLedgerId)?.ledger;

  useEffect(() => {
    if (currentLedger) {
      fetchBudgets();
    }
  }, [currentLedger]);

  const fetchBudgets = async () => {
    if (!currentLedger) return;
    
    try {
      setLoading(true);
      const response = await budgetsAPI.getBudgets(currentLedger.id);
      
      if (response.data.success) {
        const data: BudgetListResponse = response.data.data;
        setBudgets(data.budgets);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('获取预算列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBudget = async (budgetData: BudgetCreate) => {
    try {
      const response = await budgetsAPI.createBudget(budgetData);
      
      if (response.data.success) {
        fetchBudgets(); // 重新获取预算列表
      }
    } catch (error) {
      console.error('创建预算失败:', error);
    }
  };

  const handleDeleteBudget = async (budgetId: number) => {
    if (!confirm('确定要删除这个预算吗？')) return;

    try {
      const response = await budgetsAPI.deleteBudget(budgetId);
      
      if (response.data.success) {
        fetchBudgets(); // 重新获取预算列表
      }
    } catch (error) {
      console.error('删除预算失败:', error);
    }
  };

  const getFilteredBudgets = () => {
    switch (activeTab) {
      case 'active':
        return budgets.filter(budget => budget.status === BudgetStatus.ACTIVE);
      case 'exceeded':
        return budgets.filter(budget => budget.is_exceeded);
      case 'warning':
        return budgets.filter(budget => budget.is_warning && !budget.is_exceeded);
      default:
        return budgets;
    }
  };

  const StatCard = ({ title, value, icon: Icon, color = 'text-blue-600' }: {
    title: string;
    value: string | number;
    icon: any;
    color?: string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );

  if (!currentLedger) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">请先选择一个账本</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 pb-20 md:pb-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">预算管理</h1>
          <p className="text-gray-600 mt-1">管理您的预算，控制支出</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          创建预算
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="总预算数"
          value={stats.total_budgets}
          icon={Target}
          color="text-blue-600"
        />
        <StatCard
          title="预算总额"
          value={formatCurrency(stats.total_amount)}
          icon={DollarSign}
          color="text-green-600"
        />
        <StatCard
          title="已支出"
          value={formatCurrency(stats.total_spent)}
          icon={TrendingUp}
          color="text-orange-600"
        />
        <StatCard
          title="超支预算"
          value={stats.exceeded_count}
          icon={AlertTriangle}
          color="text-red-600"
        />
      </div>

      {/* 预算列表 */}
      <Card>
        <CardHeader>
          <CardTitle>预算列表</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">全部 ({budgets.length})</TabsTrigger>
              <TabsTrigger value="active">
                活跃 ({budgets.filter(b => b.status === BudgetStatus.ACTIVE).length})
              </TabsTrigger>
              <TabsTrigger value="warning">
                预警 ({stats.warning_count})
              </TabsTrigger>
              <TabsTrigger value="exceeded">
                超支 ({stats.exceeded_count})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getFilteredBudgets().length === 0 ? (
                    <div className="col-span-full text-center py-12">
                      <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {activeTab === 'all' ? '暂无预算' : `暂无${activeTab === 'active' ? '活跃' : activeTab === 'warning' ? '预警' : '超支'}预算`}
                      </p>
                      {activeTab === 'all' && (
                        <Button
                          onClick={() => setIsCreateDialogOpen(true)}
                          className="mt-4"
                          variant="outline"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          创建第一个预算
                        </Button>
                      )}
                    </div>
                  ) : (
                    getFilteredBudgets().map((budget) => (
                      <BudgetCard
                        key={budget.id}
                        budget={budget}
                        onDelete={handleDeleteBudget}
                        onViewDetails={(budget) => {
                          // TODO: 实现查看详情功能
                          console.log('查看预算详情:', budget);
                        }}
                      />
                    ))
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 创建预算对话框 */}
      <CreateBudgetDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreateBudget}
        ledgerId={currentLedger.id}
      />
    </div>
  );
} 