'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { UserLedger, Invitation } from '@/types';
import { ledgersAPI, invitationsAPI } from '@/lib/api';
import { Users, Crown, User, Mail, Clock, CheckCircle, XCircle, Trash2, UserX, RefreshCw } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { InvitationStatus, UserRole } from '@/constants/enums';

interface MembersManagementDialogProps {
  open: boolean;
  onClose: () => void;
  userLedger?: UserLedger | null;
  onMemberRemoved: () => void;
}

interface MembersResponse {
  members: UserLedger[];
  current_user_is_owner: boolean;
}

export default function MembersManagementDialog({ 
  open, 
  onClose, 
  userLedger, 
  onMemberRemoved 
}: MembersManagementDialogProps) {
  const [members, setMembers] = useState<UserLedger[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOwner, setIsOwner] = useState(false);

  const ledgerId = userLedger?.ledger?.id;
  const isAdmin = userLedger?.role === UserRole.ADMIN;

  // 获取成员列表
  const fetchMembers = async () => {
    if (!ledgerId) return;
    
    try {
      setLoading(true);
      const response = await ledgersAPI.getLedgerMembers(ledgerId);
      if (response.data.success && response.data.data) {
        const responseData = response.data.data;
        if (Array.isArray(responseData)) {
          // 兼容旧的API响应格式
          setMembers(responseData);
          setIsOwner(false);
        } else {
          // 新的API响应格式
          const membersData = responseData as MembersResponse;
          setMembers(membersData.members);
          setIsOwner(membersData.current_user_is_owner);
        }
      }
    } catch (err) {
      console.error('获取成员列表失败:', err);
      setError('获取成员列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取邀请列表
  const fetchInvitations = async () => {
    if (!ledgerId) return;
    
    try {
      const response = await invitationsAPI.getLedgerInvitations(ledgerId);
      if (response.data.success && response.data.data) {
        setInvitations(response.data.data);
      }
    } catch (err) {
      console.error('获取邀请列表失败:', err);
    }
  };

  // 移除成员
  const handleRemoveMember = async (memberId: number, memberName?: string) => {
    if (!ledgerId || !isAdmin) return;
    
    const memberDisplayName = memberName || `用户${memberId}`;
    if (!confirm(`确定要移除成员 "${memberDisplayName}" 吗？`)) return;
    
    try {
      const response = await ledgersAPI.removeMember(ledgerId, memberId);
      if (response.data.success) {
        fetchMembers(); // 重新获取成员列表
        onMemberRemoved(); // 通知父组件更新
      } else {
        setError(response.data.message || '移除成员失败');
      }
    } catch (err: any) {
      console.error('移除成员失败:', err);
      const errorMessage = err.response?.data?.detail || '移除成员失败';
      setError(errorMessage);
    }
  };

  // 转移所有权
  const handleTransferOwnership = async (newOwnerId: number, newOwnerName?: string) => {
    if (!ledgerId || !isAdmin) return;
    
    const ownerDisplayName = newOwnerName || `用户${newOwnerId}`;
    if (!confirm(`确定要将账本所有权转移给 "${ownerDisplayName}" 吗？转移后您将失去管理员权限。`)) return;
    
    try {
      const response = await ledgersAPI.transferOwnership(ledgerId, newOwnerId);
      if (response.data.success) {
        // 显示成功消息
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        successDiv.textContent = '所有权转移成功！';
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
          document.body.removeChild(successDiv);
        }, 3000);
        
        onClose();
        onMemberRemoved(); // 通知父组件更新
      } else {
        setError(response.data.message || '转移所有权失败');
      }
    } catch (err: any) {
      console.error('转移所有权失败:', err);
      const errorMessage = err.response?.data?.detail || '转移所有权失败';
      setError(errorMessage);
    }
  };

  // 取消邀请
  const handleCancelInvitation = async (invitationId: number) => {
    if (!isAdmin) return;
    
    if (!confirm('确定要取消这个邀请吗？')) return;
    
    try {
      const response = await invitationsAPI.cancelInvitation(invitationId);
      if (response.data.success) {
        // 显示成功消息
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        successDiv.textContent = '邀请已取消';
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
          document.body.removeChild(successDiv);
        }, 3000);
        
        fetchInvitations(); // 重新获取邀请列表
      } else {
        setError(response.data.message || '取消邀请失败');
      }
    } catch (err: any) {
      console.error('取消邀请失败:', err);
      const errorMessage = err.response?.data?.detail || '取消邀请失败';
      setError(errorMessage);
    }
  };

  useEffect(() => {
    if (open && ledgerId) {
      fetchMembers();
      fetchInvitations();
      
      // 设置定时器，每30秒刷新一次数据
      const interval = setInterval(() => {
        fetchMembers();
        fetchInvitations();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [open, ledgerId, fetchMembers, fetchInvitations]);

  // 根据角色获取角色显示信息
  const getRoleDisplay = (role: string, isOwner: boolean = false) => {
    if (role === UserRole.ADMIN) {
      if (isOwner) {
        return { text: '拥有者', icon: <Crown className="h-4 w-4 text-purple-500" />, color: 'text-purple-600' };
      }
      return { text: '管理员', icon: <Crown className="h-4 w-4 text-yellow-500" />, color: 'text-yellow-600' };
    }
    return { text: '成员', icon: <User className="h-4 w-4 text-blue-500" />, color: 'text-blue-600' };
  };

  // 获取邀请状态显示信息
  const getInvitationStatusDisplay = (status: string) => {
    switch (status) {
      case InvitationStatus.PENDING:
        return { text: '待处理', icon: <Clock className="h-4 w-4 text-yellow-500" />, color: 'text-yellow-600' };
      case InvitationStatus.ACCEPTED:
        return { text: '已接受', icon: <CheckCircle className="h-4 w-4 text-green-500" />, color: 'text-green-600' };
      case InvitationStatus.REJECTED:
        return { text: '已拒绝', icon: <XCircle className="h-4 w-4 text-red-500" />, color: 'text-red-600' };
      case InvitationStatus.EXPIRED:
        return { text: '已过期', icon: <XCircle className="h-4 w-4 text-gray-500" />, color: 'text-gray-600' };
      default:
        return { text: status, icon: null, color: 'text-gray-600' };
    }
  };

  if (!open || !userLedger) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">成员管理</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* 当前成员列表 */}
        <div className="mb-6">
          <h3 className="text-md font-medium mb-3 flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>当前成员 ({members.length})</span>
          </h3>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-5 w-5 animate-spin text-gray-500" />
              <span className="ml-2 text-gray-500">加载中...</span>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无成员
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => {
                const roleDisplay = getRoleDisplay(member.role, member.is_owner);
                return (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{member.user?.email || `用户${member.user_id}`}</p>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          {roleDisplay.icon}
                          <span className={roleDisplay.color}>{roleDisplay.text}</span>
                          <span>•</span>
                          <span>加入于 {dayjs(member.joined_at).format('YYYY/MM/DD')}</span>
                        </div>
                      </div>
                    </div>
                    
                    {isAdmin && member.user_id !== userLedger.user_id && (
                      <div className="flex items-center space-x-2">
                        {member.role === UserRole.MEMBER && isOwner && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTransferOwnership(member.user_id, member.user?.email)}
                            className="flex items-center space-x-1"
                          >
                            <Crown className="h-3 w-3" />
                            <span>转移所有权</span>
                          </Button>
                        )}
                        {(member.role === UserRole.MEMBER || (member.role === UserRole.ADMIN && isOwner)) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveMember(member.user_id, member.user?.email)}
                            className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                          >
                            <UserX className="h-3 w-3" />
                            <span>移除</span>
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 待处理邀请列表 */}
        <div>
          <h3 className="text-md font-medium mb-3 flex items-center space-x-2">
            <Mail className="h-4 w-4" />
            <span>待处理邀请 ({invitations.filter(inv => inv.status === InvitationStatus.PENDING).length})</span>
          </h3>
          
          {invitations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无邀请
            </div>
          ) : (
            <div className="space-y-3">
              {invitations.map((invitation) => {
                const statusDisplay = getInvitationStatusDisplay(invitation.status);
                const roleDisplay = getRoleDisplay(invitation.role);
                
                return (
                  <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <Mail className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium">{invitation.invitee_email}</p>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          {roleDisplay.icon}
                          <span className={roleDisplay.color}>{roleDisplay.text}</span>
                          <span>•</span>
                          {statusDisplay.icon}
                          <span className={statusDisplay.color}>{statusDisplay.text}</span>
                          <span>•</span>
                          <span>邀请于 {dayjs(invitation.created_at).format('MM/DD HH:mm')}</span>
                        </div>
                        {invitation.status === InvitationStatus.PENDING && (
                          <p className="text-xs text-orange-600">
                            过期时间: {dayjs(invitation.expires_at).format('MM/DD HH:mm')}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {isAdmin && invitation.status === InvitationStatus.PENDING && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelInvitation(invitation.id)}
                        className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>取消</span>
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={onClose}>关闭</Button>
        </div>
      </div>
    </div>
  );
} 