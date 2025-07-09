'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authAPI } from '@/lib/api';
import PublicRoute from '@/components/PublicRoute';
import { toast } from 'sonner';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('发送注册请求...');
      const response = await authAPI.register({ email, password });
      console.log('注册响应:', response);
      console.log('响应数据:', response.data);
      
      // 检查响应格式
      if (!response.data) {
        throw new Error('服务器响应格式错误');
      }
      
      if (!response.data.success) {
        throw new Error(response.data.message || '注册失败');
      }
      
      // 验证注册数据
      const userData = response.data.data;
      if (!userData) {
        throw new Error('注册响应数据为空');
      }
      
      if (!userData.email) {
        throw new Error('注册响应中缺少用户信息');
      }
      
      console.log('注册成功，用户信息:', userData);
      
      // 显示成功提示
      toast.success('注册成功！请登录您的账户');
      
      router.push('/login');
    } catch (err: unknown) {
      console.error('注册错误:', err);
      let errorMessage = '注册失败';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      // 使用toast显示错误信息
      toast.error(errorMessage, {
        description: '请检查您的邮箱格式和密码强度，然后重试',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicRoute>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>注册</CardTitle>
          <CardDescription>创建您的Molly Bill账户</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '注册中...' : '注册'}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <a href="/login" className="text-blue-600 hover:underline">
              已有账户？立即登录
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
    </PublicRoute>
  );
} 