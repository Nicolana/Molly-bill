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
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const router = useRouter();
  const { login } = useAuthStore();

  // 邮箱验证
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('请输入邮箱地址');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('请输入正确的邮箱格式');
      return false;
    }
    setEmailError('');
    return true;
  };

  // 密码验证
  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError('请输入密码');
      return false;
    }
    if (password.length < 6) {
      setPasswordError('密码长度至少6位');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 表单验证
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    
    if (!isEmailValid || !isPasswordValid) {
      toast.error('请检查输入信息', {
        description: '请修正表单中的错误后重试',
        duration: 4000,
      });
      return;
    }
    
    setLoading(true);

    try {
      console.log('发送登录请求...');
      const response = await authAPI.login({ email, password });
      console.log('登录响应:', response);
      console.log('响应数据:', response.data);
      
      // 检查响应格式
      if (!response.data) {
        throw new Error('服务器响应格式错误');
      }
      
      if (!response.data.success) {
        throw new Error(response.data.message || '登录失败');
      }
      
      // 验证登录数据
      const authData = response.data.data;
      if (!authData) {
        throw new Error('登录响应数据为空');
      }
      
      if (!authData.access_token) {
        throw new Error('登录响应中缺少访问令牌');
      }
      
      const { access_token } = authData;
      console.log('获取到的token:', access_token);
      
      // 获取用户信息
      console.log('获取用户信息...');
      const userResponse = await authAPI.getMe();
      console.log('用户信息响应:', userResponse);
      
      // 检查用户信息响应格式
      if (!userResponse.data) {
        throw new Error('用户信息响应格式错误');
      }
      
      if (!userResponse.data.success) {
        throw new Error(userResponse.data.message || '获取用户信息失败');
      }
      
      // 验证用户数据
      const userData = userResponse.data.data;
      if (!userData) {
        throw new Error('用户信息数据为空');
      }
      
      if (!userData.email) {
        throw new Error('用户信息不完整');
      }
      
      // 执行登录
      login(access_token, userData);
      console.log('登录成功，用户信息:', userData);
      
      // 显示成功提示
      toast.success(`欢迎回来，${userData.email}！`, {
        description: '正在跳转到仪表板...',
        duration: 3000,
      });
      
      // 延迟跳转，让用户看到成功提示
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (err: unknown) {
      console.error('登录错误:', err);
      
      // 智能错误处理
      let errorMessage = '登录失败';
      let errorDescription = '请检查您的邮箱和密码，然后重试';
      
      if (err instanceof Error) {
        const message = err.message.toLowerCase();
        
        // 根据错误类型提供更具体的提示
        if (message.includes('invalid credentials') || message.includes('用户名或密码错误')) {
          errorMessage = '邮箱或密码错误';
          errorDescription = '请检查您的邮箱地址和密码是否正确';
        } else if (message.includes('user not found') || message.includes('用户不存在')) {
          errorMessage = '账户不存在';
          errorDescription = '该邮箱地址未注册，请先注册账户';
        } else if (message.includes('network') || message.includes('connection')) {
          errorMessage = '网络连接失败';
          errorDescription = '请检查您的网络连接，然后重试';
        } else if (message.includes('timeout')) {
          errorMessage = '请求超时';
          errorDescription = '服务器响应超时，请稍后重试';
        } else if (message.includes('server') || message.includes('服务器')) {
          errorMessage = '服务器错误';
          errorDescription = '服务器暂时不可用，请稍后重试';
        } else if (message.includes('email') || message.includes('邮箱')) {
          errorMessage = '邮箱格式错误';
          errorDescription = '请输入正确的邮箱地址格式';
        } else if (message.includes('password') || message.includes('密码')) {
          errorMessage = '密码错误';
          errorDescription = '密码长度或格式不正确';
        } else {
          errorMessage = err.message;
        }
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      // 使用toast显示错误信息，添加重试按钮
      toast.error(errorMessage, {
        description: errorDescription,
        duration: 6000,
        action: {
          label: '重试',
          onClick: () => {
            // 清空密码字段，让用户重新输入
            setPassword('');
            // 聚焦到密码输入框
            const passwordInput = document.getElementById('password') as HTMLInputElement;
            if (passwordInput) {
              passwordInput.focus();
            }
          }
        }
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
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) validateEmail(e.target.value);
                }}
                onBlur={() => validateEmail(email)}
                required
                disabled={loading}
                className={emailError ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {emailError && (
                <p className="text-red-500 text-sm">{emailError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) validatePassword(e.target.value);
                }}
                onBlur={() => validatePassword(password)}
                required
                disabled={loading}
                className={passwordError ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {passwordError && (
                <p className="text-red-500 text-sm">{passwordError}</p>
              )}
            </div>
            <Button 
              type="submit" 
              className="w-full relative" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="absolute left-4">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  </div>
                  登录中...
                </>
              ) : (
                '登录'
              )}
            </Button>
            <p className="text-xs text-gray-500 text-center">
              提示：按 Enter 键快速登录
            </p>
          </form>
          <div className="mt-4 space-y-2 text-center">
            <a href="/register" className="text-blue-600 hover:underline text-sm">
              还没有账户？立即注册
            </a>
            <div className="text-xs text-gray-500">
              <a href="#" className="hover:text-gray-700" onClick={(e) => {
                e.preventDefault();
                toast.info('忘记密码功能', {
                  description: '请联系管理员重置密码',
                  duration: 4000,
                });
              }}>
                忘记密码？
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </PublicRoute>
  );
} 