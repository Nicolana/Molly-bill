'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BarChart3, LogOut, Menu, X, BookOpen, Target } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function TopNavigation() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
                <span>仪表盘</span>
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

          {/* 右侧：用户操作 */}
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">登出</span>
            </Button>
            
            {/* 移动端菜单按钮 */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* 移动端导航菜单 */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-2">
              <Link href="/dashboard">
                <Button
                  variant={isActive('/dashboard') ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-2 justify-start w-full"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>仪表盘</span>
                </Button>
              </Link>
              <Link href="/dashboard/ledgers">
                <Button
                  variant={isActive('/dashboard/ledgers') ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-2 justify-start w-full"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>账本管理</span>
                </Button>
              </Link>
              <Link href="/dashboard/budgets">
                <Button
                  variant={isActive('/dashboard/budgets') ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-2 justify-start w-full"
                >
                  <Target className="h-4 w-4" />
                  <span>预算管理</span>
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
} 