'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { BarChart3, LogOut, BookOpen, Target } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import BottomNavigation from '@/components/BottomNavigation';

export default function TopNavigation() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  // 处理登出
  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // 判断当前路由是否激活
  const isActive = (path: string) => {
    return pathname === path;
  };

  // 如果不在dashboard相关页面，不显示导航
  if (!pathname?.startsWith('/dashboard')) {
    return null;
  }

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 左侧：应用标题 */}
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900">Molly Bill AI助手</h1>
            <span className="hidden sm:inline text-sm text-gray-500">欢迎回来，{user?.email}</span>
          </div>

          {/* 中间：桌面端导航 */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link href="/dashboard">
              <Button
                variant={isActive('/dashboard') ? 'default' : 'ghost'}
                size="sm"
                className="flex items-center space-x-2"
              >
                <BarChart3 className="h-4 w-4" />
                <span>统计</span>
              </Button>
            </Link>
            <Link href="/dashboard/ledgers">
              <Button
                variant={isActive('/dashboard/ledgers') ? 'default' : 'ghost'}
                size="sm"
                className="flex items-center space-x-2"
              >
                <BookOpen className="h-4 w-4" />
                <span>账本管理</span>
              </Button>
            </Link>
            <Link href="/dashboard/budgets">
              <Button
                variant={isActive('/dashboard/budgets') ? 'default' : 'ghost'}
                size="sm"
                className="flex items-center space-x-2"
              >
                <Target className="h-4 w-4" />
                <span>预算管理</span>
              </Button>
            </Link>
          </nav>

          {/* 右侧：用户操作（仅桌面端显示） */}
          <div className="hidden md:flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              <span>登出</span>
            </Button>
          </div>

          {/* 移动端右侧：用户邮箱和登出按钮 */}
          <div className="md:hidden flex items-center space-x-2">
            <span className="text-sm text-gray-500 truncate max-w-24">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 底部导航组件 */}
      <BottomNavigation />
    </header>
  );
}