'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus, Settings, Users, Crown, UserPlus, MoreVertical, Trash2, Edit, Calendar } from 'lucide-react';
import { UserLedger, Ledger, LedgerCreate, Invitation, InvitationCreate } from '@/types';
import { UserRole, LedgerStatus, ROLE_DISPLAY, LEDGER_STATUS_DISPLAY } from '@/constants/enums';
import { ledgersAPI, invitationsAPI } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useLedgerStore } from '@/store/ledger';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

// 导入对话框组件
import CreateLedgerDialog from '@/components/CreateLedgerDialog';
import EditLedgerDialog from '@/components/EditLedgerDialog';
import InviteMemberDialog from '@/components/InviteMemberDialog';
import MembersManagementDialog from '@/components/MembersManagementDialog';
import PendingInvitationsNotification from '@/components/PendingInvitationsNotification';

export default function LedgersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLedger, setSelectedLedger] = useState<UserLedger | null>(null);
  
  // 使用全局账本状态
  const { userLedgers, currentLedgerId, fetchUserLedgers, setCurrentLedger } = useLedgerStore();
  
  // 对话框状态
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  
  // 刷新账本数据
  const refreshLedgers = async () => {
    try {
      setLoading(true);
      await fetchUserLedgers(); // 使用全局store的方法
    } catch (err) {
      console.error('获取账本列表失败:', err);
      setError('获取账本列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 创建账本
  const handleCreateLedger = async (data: LedgerCreate) => {
    try {
      const response = await ledgersAPI.createLedger(data);
      if (response.data.success) {
        setShowCreateDialog(false);
        refreshLedgers(); // 重新获取列表
      } else {
        throw new Error(response.data.message || '创建账本失败');
      }
    } catch (err) {
      console.error('创建账本失败:', err);
      throw err;
    }
  };

  // 更新账本
  const handleUpdateLedger = async (data: Partial<LedgerCreate>) => {
    if (!selectedLedger?.ledger_id) return;
    
    try {
      const response = await ledgersAPI.updateLedger(selectedLedger.ledger_id, data);
      if (response.data.success) {
        setShowEditDialog(false);
        setSelectedLedger(null);
        refreshLedgers(); // 重新获取列表
      } else {
        throw new Error(response.data.message || '更新账本失败');
      }
    } catch (err) {
      console.error('更新账本失败:', err);
      throw err;
    }
  };

  // 删除账本
  const handleDeleteLedger = async (ledgerId: number) => {
    if (!confirm('确定要删除这个账本吗？此操作无法撤销。')) return;
    
    try {
      const response = await ledgersAPI.deleteLedger(ledgerId);
      if (response.data.success) {
        refreshLedgers(); // 重新获取列表
      } else {
        throw new Error(response.data.message || '删除账本失败');
      }
    } catch (err) {
      console.error('删除账本失败:', err);
      alert('删除账本失败');
    }
  };

  // 邀请成员
  const handleInviteMember = async (data: InvitationCreate) => {
    try {
      const response = await invitationsAPI.createInvitation(data);
      if (response.data.success) {
        setShowInviteDialog(false);
        setSelectedLedger(null);
        alert('邀请发送成功！');
      } else {
        throw new Error(response.data.message || '发送邀请失败');
      }
    } catch (err) {
      console.error('发送邀请失败:', err);
      throw err;
    }
  };

  // 处理账本操作
  const handleLedgerAction = (action: string, ledger: UserLedger) => {
    console.log('handleLedgerAction:', action, ledger);
    setSelectedLedger(ledger);
    switch (action) {
      case 'edit':
        setShowEditDialog(true);
        break;
      case 'invite':
        console.log('Opening invite dialog, ledger_id:', ledger.ledger_id);
        setShowInviteDialog(true);
        break;
      case 'members':
        setShowMembersDialog(true);
        break;
      case 'delete':
        handleDeleteLedger(ledger.ledger_id);
        break;
    }
  };

  useEffect(() => {
    refreshLedgers();
  }, []);

  // 根据角色获取角色显示文本和图标
  const getRoleDisplay = (role: UserRole) => {
    if (role === UserRole.ADMIN) {
      return { text: ROLE_DISPLAY[UserRole.ADMIN].text, icon: <Crown className="h-4 w-4 text-yellow-500" /> };
    }
    return { text: ROLE_DISPLAY[UserRole.MEMBER].text, icon: <Users className="h-4 w-4 text-blue-500" /> };
  };

  if (loading) {
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
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* 页面标题和操作 */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <BookOpen className="h-6 w-6" />
                <span>账本管理</span>
              </h1>
              <p className="text-gray-600 mt-1">管理您的账本和协作成员</p>
            </div>
            
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>创建账本</span>
            </Button>
          </div>

          {/* 待处理邀请通知 */}
          <PendingInvitationsNotification />

          {/* 错误提示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* 账本列表 */}
          {userLedgers.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">暂无账本</h3>
                <p className="text-gray-500 mb-4">创建您的第一个账本开始记账吧</p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  创建账本
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userLedgers.map((userLedger) => {
                const ledger = userLedger.ledger;
                if (!ledger) return null; // 安全检查
                const roleDisplay = getRoleDisplay(userLedger.role);
                
                return (
                  <Card key={userLedger.id} className={`hover:shadow-lg transition-shadow ${
                    currentLedgerId === ledger.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}>
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <CardTitle className="text-lg">{ledger.name}</CardTitle>
                            {currentLedgerId === ledger.id && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                当前选中
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            {roleDisplay.icon}
                            <span>{roleDisplay.text}</span>
                          </div>
                        </div>
                        
                        {/* 更多操作菜单 */}
                        <div className="relative group">
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                          <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg py-1 z-10 min-w-32 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleLedgerAction('edit', userLedger)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
                              disabled={userLedger.role !== UserRole.ADMIN}
                            >
                              <Edit className="h-4 w-4" />
                              <span>编辑</span>
                            </button>
                            <button
                              onClick={() => handleLedgerAction('invite', userLedger)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
                              disabled={userLedger.role !== UserRole.ADMIN}
                            >
                              <UserPlus className="h-4 w-4" />
                              <span>邀请成员</span>
                            </button>
                            <button
                              onClick={() => handleLedgerAction('members', userLedger)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
                            >
                              <Users className="h-4 w-4" />
                              <span>成员管理</span>
                            </button>
                            <button
                              onClick={() => handleLedgerAction('delete', userLedger)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2 text-red-600"
                              disabled={userLedger.role !== UserRole.ADMIN}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>删除</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      {/* 账本描述 */}
                      {ledger.description && (
                        <p className="text-gray-600 text-sm mb-3">{ledger.description}</p>
                      )}
                      
                      {/* 账本信息 */}
                      <div className="space-y-2 text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>创建于 {dayjs(ledger.created_at).format('YYYY年MM月DD日')}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>货币: {ledger.currency}</span>
                          <span>时区: {ledger.timezone}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>状态: {LEDGER_STATUS_DISPLAY[ledger.status].text}</span>
                          <span>加入于 {dayjs(userLedger.joined_at).format('MM/DD')}</span>
                        </div>
                      </div>
                      
                      {/* 选择账本按钮 */}
                      {currentLedgerId !== ledger.id && (
                        <div className="mt-3 pt-3 border-t">
                          <Button
                            onClick={() => setCurrentLedger(ledger.id)}
                            size="sm"
                            className="w-full"
                          >
                            选择此账本
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* 对话框组件 */}
        <CreateLedgerDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onSubmit={handleCreateLedger}
        />

        <EditLedgerDialog
          open={showEditDialog}
          onClose={() => {
            setShowEditDialog(false);
            setSelectedLedger(null);
          }}
          onSubmit={handleUpdateLedger}
          ledger={selectedLedger?.ledger}
        />

        <InviteMemberDialog
          open={showInviteDialog}
          onClose={() => {
            setShowInviteDialog(false);
            setSelectedLedger(null);
          }}
          onSubmit={handleInviteMember}
          ledgerId={selectedLedger?.ledger_id}
        />

        <MembersManagementDialog
          open={showMembersDialog}
          onClose={() => {
            setShowMembersDialog(false);
            setSelectedLedger(null);
          }}
          userLedger={selectedLedger}
          onMemberRemoved={refreshLedgers}
        />
      </div>
    </ProtectedRoute>
  );
} 