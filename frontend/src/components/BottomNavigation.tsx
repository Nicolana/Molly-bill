'use client';

import React from 'react';
import { MessageSquare, BarChart3, BookOpen, Target } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function BottomNavigation() {
  const pathname = usePathname();

  // 判断当前路由是否激活
  const isActive = (path: string) => {
    return pathname === path;
  };

  // 如果不在dashboard相关页面，不显示导航
  if (!pathname?.startsWith('/dashboard')) {
    return null;
  }

  const navItems = [
    {
      href: '/dashboard/chat',
      icon: MessageSquare,
      label: '聊天',
      isActive: isActive('/dashboard/chat')
    },
    {
      href: '/dashboard',
      icon: BarChart3,
      label: '统计',
      isActive: isActive('/dashboard')
    },
    {
      href: '/dashboard/ledgers',
      icon: BookOpen,
      label: '账本',
      isActive: isActive('/dashboard/ledgers')
    },
    {
      href: '/dashboard/budgets',
      icon: Target,
      label: '预算',
      isActive: isActive('/dashboard/budgets')
    }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1 ${
                item.isActive
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <IconComponent className={`h-5 w-5 mb-1 ${
                item.isActive ? 'text-blue-600' : 'text-gray-600'
              }`} />
              <span className={`text-xs font-medium ${
                item.isActive ? 'text-blue-600' : 'text-gray-600'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
