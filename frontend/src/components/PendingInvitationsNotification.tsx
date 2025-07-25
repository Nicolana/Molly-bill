'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Invitation } from '@/types';
import { invitationsAPI } from '@/lib/api';
import { Mail, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { InvitationStatus, UserRole } from '@/constants/enums';

export default function PendingInvitationsNotification() {
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 获取待处理邀请
  const fetchPendingInvitations = async () => {
    try {
      setLoading(true);
      const response = await invitationsAPI.getPendingInvitations();
      if (response.data.success && response.data.data) {
        setPendingInvitations(response.data.data);
      }
    } catch (err) {
      console.error('获取待处理邀请失败:', err);
      setError('获取待处理邀请失败');
    } finally {
      setLoading(false);
    }
  };

  // 接受邀请
  const handleAcceptInvitation = async (invitationId: number) => {
    try {
      const response = await invitationsAPI.acceptInvitation(invitationId);
      if (response.data.success) {
        // 显示成功消息
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        successDiv.textContent = '邀请接受成功！正在刷新页面...';
        document.body.appendChild(successDiv);
        
        // 延迟刷新页面
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setError(response.data.message || '接受邀请失败');
      }
    } catch (err: any) {
      console.error('接受邀请失败:', err);
      const errorMessage = err.response?.data?.detail || '接受邀请失败';
      setError(errorMessage);
    }
  };

  // 拒绝邀请
  const handleRejectInvitation = async (invitationId: number) => {
    if (!confirm('确定要拒绝这个邀请吗？')) return;
    
    try {
      const response = await invitationsAPI.rejectInvitation(invitationId);
      if (response.data.success) {
        // 显示成功消息
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        successDiv.textContent = '邀请已拒绝';
        document.body.appendChild(successDiv);
        
        // 自动移除消息
        setTimeout(() => {
          document.body.removeChild(successDiv);
        }, 3000);
        
        fetchPendingInvitations(); // 重新获取邀请列表
      } else {
        setError(response.data.message || '拒绝邀请失败');
      }
    } catch (err: any) {
      console.error('拒绝邀请失败:', err);
      const errorMessage = err.response?.data?.detail || '拒绝邀请失败';
      setError(errorMessage);
    }
  };

  useEffect(() => {
    fetchPendingInvitations();
    
    // 设置定时器，每30秒检查一次邀请状态
    const interval = setInterval(() => {
      fetchPendingInvitations();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // 如果没有待处理邀请或正在加载，不显示组件
  if (loading || pendingInvitations.length === 0) {
    return null;
  }

  // 检查是否有即将过期的邀请（24小时内）
  const getInvitationUrgency = (expiresAt: string) => {
    const now = dayjs();
    const expiry = dayjs(expiresAt);
    const hoursUntilExpiry = expiry.diff(now, 'hour');
    
    if (hoursUntilExpiry <= 0) {
      return { level: 'expired', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
    } else if (hoursUntilExpiry <= 24) {
      return { level: 'urgent', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' };
    } else {
      return { level: 'normal', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' };
    }
  };

  return (
    <div className="mb-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {pendingInvitations.map((invitation) => {
        const urgency = getInvitationUrgency(invitation.expires_at);
        
        return (
          <Card key={invitation.id} className={`${urgency.bgColor} ${urgency.borderColor} border-l-4 mb-4`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className={`w-10 h-10 ${urgency.bgColor} rounded-full flex items-center justify-center border`}>
                    <Mail className={`h-5 w-5 ${urgency.color}`} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium text-gray-900">账本邀请</h3>
                      {urgency.level === 'urgent' && (
                        <div className="flex items-center space-x-1 text-orange-600">
                          <Clock className="h-4 w-4" />
                          <span className="text-xs font-medium">即将过期</span>
                        </div>
                      )}
                      {urgency.level === 'expired' && (
                        <div className="flex items-center space-x-1 text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-xs font-medium">已过期</span>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-700 mb-1">
                      <span className="font-medium">{invitation.inviter?.email || `用户${invitation.inviter_id}`}</span> 
                      邀请您加入账本 
                      <span className="font-medium text-blue-600">
                        {invitation.ledger?.name || `账本${invitation.ledger_id}`}
                      </span>
                    </p>
                    {invitation.ledger?.description && (
                      <p className="text-sm text-gray-600 mb-2">{invitation.ledger.description}</p>
                    )}
                    <p className="text-gray-700">
                      您的角色将是：
                      <span className={`ml-1 px-2 py-1 rounded text-xs font-medium ${
                        invitation.role === UserRole.ADMIN ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {invitation.role === UserRole.ADMIN ? '管理员' : '成员'}
                      </span>
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                      <span>邀请时间: {dayjs(invitation.created_at).format('MM/DD HH:mm')}</span>
                      <span>•</span>
                      <span className={urgency.color}>
                        过期时间: {dayjs(invitation.expires_at).format('MM/DD HH:mm')}
                      </span>
                    </div>
                  </div>
                </div>
                
                {invitation.status === InvitationStatus.PENDING && urgency.level !== 'expired' && (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRejectInvitation(invitation.id)}
                      className="flex items-center space-x-1 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>拒绝</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAcceptInvitation(invitation.id)}
                      className="flex items-center space-x-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>接受</span>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
} 