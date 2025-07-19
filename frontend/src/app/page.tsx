'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // 检测是否为移动端
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // 移动端默认进入聊天页面，桌面端进入统计页面
        if (isMobile) {
          router.push('/dashboard/chat');
        } else {
          router.push('/dashboard');
        }
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, isLoading, isMobile, router]);

  // 在认证状态初始化期间显示加载界面
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return null;
}
