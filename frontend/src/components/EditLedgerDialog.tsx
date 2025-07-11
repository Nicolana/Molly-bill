'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Ledger, LedgerCreate } from '@/types';

interface EditLedgerDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<LedgerCreate>) => Promise<void>;
  ledger?: Ledger;
}

export default function EditLedgerDialog({ open, onClose, onSubmit, ledger }: EditLedgerDialogProps) {
  const [formData, setFormData] = useState<LedgerCreate>({
    name: '',
    description: '',
    currency: 'CNY',
    timezone: 'Asia/Shanghai'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 当ledger prop改变时，更新表单数据
  useEffect(() => {
    if (ledger) {
      setFormData({
        name: ledger.name,
        description: ledger.description || '',
        currency: ledger.currency,
        timezone: ledger.timezone
      });
    }
  }, [ledger]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('账本名称不能为空');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  if (!open || !ledger) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">编辑账本</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">账本名称 *</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="输入账本名称"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">描述</Label>
            <textarea
              id="description"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="输入账本描述（可选）"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="currency">货币</Label>
            <select
              id="currency"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            >
              <option value="CNY">人民币 (CNY)</option>
              <option value="USD">美元 (USD)</option>
              <option value="EUR">欧元 (EUR)</option>
              <option value="JPY">日元 (JPY)</option>
              <option value="HKD">港币 (HKD)</option>
            </select>
          </div>

          <div>
            <Label htmlFor="timezone">时区</Label>
            <select
              id="timezone"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
            >
              <option value="Asia/Shanghai">中国标准时间 (UTC+8)</option>
              <option value="America/New_York">美国东部时间 (UTC-5)</option>
              <option value="Europe/London">英国时间 (UTC+0)</option>
              <option value="Asia/Tokyo">日本时间 (UTC+9)</option>
              <option value="Asia/Hong_Kong">香港时间 (UTC+8)</option>
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '更新中...' : '更新'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 