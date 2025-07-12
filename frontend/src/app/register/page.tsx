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
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const router = useRouter();

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
      toast.success('注册成功！请登录您的账户', {
        description: '正在跳转到登录页面...',
        duration: 3000,
      });
      
      // 延迟跳转，让用户看到成功提示
      setTimeout(() => {
        router.push('/login');
      }, 1000);
    } catch (err: unknown) {
      console.error('注册错误:', err);
      let errorMessage = '注册失败';
      let errorDescription = '请检查您的邮箱格式和密码强度，然后重试';
      
      if (err instanceof Error) {
        const message = err.message.toLowerCase();
        
        // 根据错误类型提供更具体的提示
        if (message.includes('email already exists') || message.includes('邮箱已存在')) {
          errorMessage = '邮箱已被注册';
          errorDescription = '该邮箱地址已被使用，请使用其他邮箱或直接登录';
        } else if (message.includes('invalid email') || message.includes('邮箱格式')) {
          errorMessage = '邮箱格式错误';
          errorDescription = '请输入正确的邮箱地址格式';
        } else if (message.includes('password') || message.includes('密码')) {
          errorMessage = '密码不符合要求';
          errorDescription = '密码长度至少6位，建议包含字母和数字';
        } else {
          errorMessage = err.message;
        }
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      // 使用toast显示错误信息
      toast.error(errorMessage, {
        description: errorDescription,
        duration: 6000,
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
            <CardTitle className="text-2xl font-bold text-gray-900">注册账户</CardTitle>
            <CardDescription className="text-base text-gray-600">
              创建您的Molly Bill账户
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
                  placeholder="请输入密码（至少6位）"
                  required
                  disabled={loading}
                  className={`h-12 text-base ${passwordError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  autoComplete="new-password"
                />
                {passwordError && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {passwordError}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  密码长度至少6位，建议包含字母和数字
                </p>
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
                    注册中...
                  </>
                ) : (
                  '创建账户'
                )}
              </Button>
              
              <p className="text-xs text-gray-500 text-center">
                提示：按 Enter 键快速注册
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
                onClick={() => router.push('/login')}
                className="text-blue-600 hover:text-blue-800 font-medium text-base transition-colors duration-200"
              >
                已有账户？立即登录
              </button>
              
              <p className="text-xs text-gray-500 leading-relaxed">
                注册即表示您同意我们的
                <a href="#" className="text-blue-600 hover:underline">服务条款</a>
                和
                <a href="#" className="text-blue-600 hover:underline">隐私政策</a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PublicRoute>
  );
} 