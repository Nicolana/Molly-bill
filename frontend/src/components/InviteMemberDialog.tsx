'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';

import { InvitationCreate } from '@/types';
import { UserRole } from '@/constants/enums';
import { UserPlus, Mail, Shield, User, Clock, AlertCircle } from 'lucide-react';

interface InviteMemberDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: InvitationCreate) => Promise<void>;
  ledgerId?: number;
}

const formSchema = z.object({
  invitee_email: z
    .string()
    .min(1, '邮箱地址不能为空')
    .email('请输入有效的邮箱地址'),
  role: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: '请选择用户角色' }),
  }),
});

type FormData = z.infer<typeof formSchema>;

export default function InviteMemberDialog({ open, onClose, onSubmit, ledgerId }: InviteMemberDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      invitee_email: '',
      role: UserRole.MEMBER,
    },
  });

  const selectedRole = form.watch('role');

  const handleSubmit = async (data: FormData) => {
    if (!ledgerId) {
      form.setError('root', { message: '账本ID无效' });
      return;
    }

    try {
      setLoading(true);
      
      const invitationData: InvitationCreate = {
        ...data,
        ledger_id: ledgerId,
      };
      
      await onSubmit(invitationData);
      form.reset();
      onClose();
    } catch (error: any) {
      console.error('发送邀请失败:', error);
      const errorMessage = error.response?.data?.detail || error.message || '发送邀请失败';
      form.setError('root', { message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const getRoleInfo = (role: UserRole) => {
    if (role === UserRole.ADMIN) {
      return {
        icon: Shield,
        title: '管理员权限',
        description: '可以编辑账本信息、邀请/移除成员、管理账单记录',
        color: 'text-orange-500',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
      };
    }
    return {
      icon: User,
      title: '成员权限',
      description: '可以查看账本信息、记录和编辑自己的账单',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    };
  };

  const roleInfo = getRoleInfo(selectedRole);
  const RoleIcon = roleInfo.icon;

  return (
    <Dialog open={open && !!ledgerId} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-600" />
            邀请协作成员
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {form.formState.errors.root && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <p className="text-red-700 text-sm">{form.formState.errors.root.message}</p>
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="invitee_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    邀请邮箱
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="输入要邀请的用户邮箱"
                      type="email"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    邀请链接将发送到此邮箱地址
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    分配角色
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-auto min-h-[3.5rem] py-2">
                        <SelectValue placeholder="选择用户角色" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={UserRole.MEMBER} className="h-auto py-3 min-h-[3.5rem]">
                        <div className="flex items-center gap-2 w-full">
                          <User className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="font-medium">成员</div>
                            <div className="text-sm text-gray-500 leading-tight">可以查看和记录账单</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value={UserRole.ADMIN} className="h-auto py-3 min-h-[3.5rem]">
                        <div className="flex items-center gap-2 w-full">
                          <Shield className="h-4 w-4 text-orange-500 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="font-medium">管理员</div>
                            <div className="text-sm text-gray-500 leading-tight">可以管理账本和邀请其他成员</div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 角色权限说明 */}
            <div className={`p-4 rounded-lg border ${roleInfo.bgColor} ${roleInfo.borderColor}`}>
              <div className="flex items-start gap-3">
                <RoleIcon className={`h-5 w-5 ${roleInfo.color} mt-0.5`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900">{roleInfo.title}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {selectedRole === UserRole.ADMIN ? '管理员' : '成员'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{roleInfo.description}</p>
                </div>
              </div>
            </div>

            {/* 邀请提醒 */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-900 mb-1">邀请说明</h4>
                  <p className="text-sm text-amber-800">
                    邀请链接将在 <strong>24小时</strong> 后过期，被邀请用户需要在此期间接受邀请。
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                取消
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    发送中...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    发送邀请
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 