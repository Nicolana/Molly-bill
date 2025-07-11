'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { UserLedger } from '@/types';
import { ledgersAPI } from '@/lib/api';
import { ChevronDown, BookOpen, Crown, User } from 'lucide-react';

interface LedgerSelectorProps {
  selectedLedgerId?: number;
  onLedgerChange: (ledgerId: number) => void;
  className?: string;
}

export default function LedgerSelector({ selectedLedgerId, onLedgerChange, className }: LedgerSelectorProps) {
  const [userLedgers, setUserLedgers] = useState<UserLedger[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  // 获取用户账本列表
  const fetchUserLedgers = async () => {
    try {
      setLoading(true);
      const response = await ledgersAPI.getUserLedgers();
      if (response.data.success && response.data.data) {
        const ledgers = response.data.data;
        setUserLedgers(ledgers);
        
        // 如果没有选中的账本，选择第一个
        if (!selectedLedgerId && ledgers.length > 0) {
          onLedgerChange(ledgers[0].ledger!.id);
        }
      }
    } catch (err) {
      console.error('获取账本列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserLedgers();
  }, []);

  // 获取当前选中的账本
  const selectedLedger = userLedgers.find(ul => ul.ledger?.id === selectedLedgerId);

  // 获取角色显示信息
  const getRoleDisplay = (role: string) => {
    if (role === 'ADMIN') {
      return { text: '管理员', icon: <Crown className="h-3 w-3 text-yellow-500" /> };
    }
    return { text: '成员', icon: <User className="h-3 w-3 text-blue-500" /> };
  };

  if (loading || userLedgers.length === 0) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <BookOpen className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-500">
          {loading ? '加载中...' : '暂无账本'}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 min-w-48"
      >
        <BookOpen className="h-4 w-4" />
        <div className="flex-1 text-left">
          <div className="font-medium">
            {selectedLedger?.ledger?.name || '选择账本'}
          </div>
          {selectedLedger && (
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              {getRoleDisplay(selectedLedger.role).icon}
              <span>{getRoleDisplay(selectedLedger.role).text}</span>
            </div>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg py-1 z-50 max-h-64 overflow-y-auto">
          {userLedgers.map((userLedger) => {
            const ledger = userLedger.ledger!;
            const roleDisplay = getRoleDisplay(userLedger.role);
            const isSelected = ledger.id === selectedLedgerId;
            
            return (
              <button
                key={userLedger.id}
                onClick={() => {
                  onLedgerChange(ledger.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center space-x-3 ${
                  isSelected ? 'bg-blue-50 text-blue-700' : ''
                }`}
              >
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{ledger.name}</div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    {roleDisplay.icon}
                    <span>{roleDisplay.text}</span>
                    <span>•</span>
                    <span>{ledger.currency}</span>
                  </div>
                </div>
                {isSelected && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* 点击外部关闭下拉菜单 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
} 