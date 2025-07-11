'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InvitationCreate } from '@/types';
import { UserPlus, Mail, Shield, User } from 'lucide-react';

interface InviteMemberDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: InvitationCreate) => Promise<void>;
  ledgerId?: number;
}

export default function InviteMemberDialog({ open, onClose, onSubmit, ledgerId }: InviteMemberDialogProps) {
  const [formData, setFormData] = useState<InvitationCreate>({
    ledger_id: 0,
    invitee_email: '',
    role: 'MEMBER'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.invitee_email.trim()) {
      setError('邮箱地址不能为空');
      return;
    }

    if (!ledgerId) {
      setError('账本ID无效');
      return;
    }

    // 简单的邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.invitee_email)) {
      setError('请输入有效的邮箱地址');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const invitationData: InvitationCreate = {
        ...formData,
        ledger_id: ledgerId
      };
      
      await onSubmit(invitationData);
      
      // 重置表单
      setFormData({
        ledger_id: 0,
        invitee_email: '',
        role: 'MEMBER'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送邀请失败');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      ledger_id: 0,
      invitee_email: '',
      role: 'MEMBER'
    });
    setError('');
    onClose();
  };

  if (!open || !ledgerId) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center space-x-2 mb-4">
          <UserPlus className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold">邀请协作成员</h2>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>邀请邮箱 *</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.invitee_email}
              onChange={(e) => setFormData({ ...formData, invitee_email: e.target.value })}
              placeholder="输入要邀请的用户邮箱"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              邀请链接将发送到此邮箱地址
            </p>
          </div>

          <div>
            <Label htmlFor="role" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>分配角色</span>
            </Label>
            <select
              id="role"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'MEMBER' })}
            >
              <option value="MEMBER">
                成员 - 可以查看和记录账单
              </option>
              <option value="ADMIN">
                管理员 - 可以管理账本和邀请其他成员
              </option>
            </select>
            
            <div className="mt-2 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-2">
                {formData.role === 'ADMIN' ? (
                  <Shield className="h-4 w-4 text-orange-500 mt-0.5" />
                ) : (
                  <User className="h-4 w-4 text-blue-500 mt-0.5" />
                )}
                <div className="text-sm">
                  <p className="font-medium text-gray-900">
                    {formData.role === 'ADMIN' ? '管理员权限' : '成员权限'}
                  </p>
                  <p className="text-gray-600">
                    {formData.role === 'ADMIN' 
                      ? '可以编辑账本信息、邀请/移除成员、管理账单记录' 
                      : '可以查看账本信息、记录和编辑自己的账单'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <p className="text-yellow-800 text-sm">
              <strong>注意：</strong> 邀请链接将在24小时后过期，被邀请用户需要在此期间接受邀请。
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '发送中...' : '发送邀请'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 