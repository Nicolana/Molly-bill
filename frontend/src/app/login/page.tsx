'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import PublicRoute from '@/components/PublicRoute';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('发送登录请求...');
      const response = await authAPI.login({ email, password });
      console.log('登录响应:', response);
      console.log('响应数据:', response.data);
      
      const { access_token } = response.data;
      console.log('获取到的token:', access_token);
      
      // 获取用户信息
      console.log('获取用户信息...');
      const userResponse = await authAPI.getMe();
      console.log('用户信息响应:', userResponse);
      
      login(access_token, userResponse.data);
      console.log('登录成功，跳转到dashboard');
      
      router.push('/dashboard');
    } catch (err: unknown) {
      console.error('登录错误:', err);
      const errorMessage = err instanceof Error ? err.message : '登录失败';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicRoute>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>登录</CardTitle>
          <CardDescription>登录您的Molly Bill账户</CardDescription>
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
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <a href="/register" className="text-blue-600 hover:underline">
              还没有账户？立即注册
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
    </PublicRoute>
  );
} 