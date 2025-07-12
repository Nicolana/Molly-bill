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

      // 先存储token到localStorage，这样后续的API调用就能带上Authorization头
      localStorage.setItem('token', access_token);
      
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
      
      // 执行登录（更新状态管理）
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
        <Card className="w-full max-w-md mx-auto shadow-lg">
          <CardHeader className="text-center space-y-2 pb-6">
            <CardTitle className="text-2xl font-bold text-gray-900">登录账户</CardTitle>
            <CardDescription className="text-base text-gray-600">
              登录您的Molly Bill账户
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  邮箱地址
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) validateEmail(e.target.value);
                  }}
                  onBlur={() => validateEmail(email)}
                  placeholder="请输入您的邮箱地址"
                  required
                  disabled={loading}
                  className={`h-12 text-base ${emailError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  autoComplete="email"
                />
                {emailError && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {emailError}
                  </p>
                )}
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  密码
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) validatePassword(e.target.value);
                  }}
                  onBlur={() => validatePassword(password)}
                  placeholder="请输入您的密码"
                  required
                  disabled={loading}
                  className={`h-12 text-base ${passwordError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  autoComplete="current-password"
                />
                {passwordError && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {passwordError}
                  </p>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-medium relative" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="absolute left-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
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
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">或者</span>
              </div>
            </div>
            
            <div className="text-center space-y-3">
              <button
                type="button"
                onClick={() => router.push('/register')}
                className="text-blue-600 hover:text-blue-800 font-medium text-base transition-colors duration-200"
              >
                还没有账户？立即注册
              </button>
              
              <button
                type="button"
                onClick={() => {
                  toast.info('忘记密码功能', {
                    description: '请联系管理员重置密码',
                    duration: 4000,
                  });
                }}
                className="block w-full text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                忘记密码？
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PublicRoute>
  );
} 