'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
} from '@/components/ui/form';

import { Ledger, LedgerCreate } from '@/types';

interface EditLedgerDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<LedgerCreate>) => Promise<void>;
  ledger?: Ledger;
}

const formSchema = z.object({
  name: z.string().min(1, '账本名称不能为空'),
  description: z.string().optional(),
  currency: z.string().min(1, '请选择货币'),
  timezone: z.string().min(1, '请选择时区'),
});

type FormData = z.infer<typeof formSchema>;

export default function EditLedgerDialog({ open, onClose, onSubmit, ledger }: EditLedgerDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      currency: 'CNY',
      timezone: 'Asia/Shanghai',
    },
  });

  // 当ledger prop改变时，更新表单数据
  useEffect(() => {
    if (ledger) {
      form.reset({
        name: ledger.name,
        description: ledger.description || '',
        currency: ledger.currency,
        timezone: ledger.timezone,
      });
    }
  }, [ledger, form]);

  const handleSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      await onSubmit(data);
      onClose();
    } catch (error) {
      console.error('更新账本失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open && !!ledger} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>编辑账本</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>账本名称 *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="输入账本名称"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>描述</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="输入账本描述（可选）"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>货币</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择货币" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="CNY">人民币 (CNY)</SelectItem>
                      <SelectItem value="USD">美元 (USD)</SelectItem>
                      <SelectItem value="EUR">欧元 (EUR)</SelectItem>
                      <SelectItem value="JPY">日元 (JPY)</SelectItem>
                      <SelectItem value="HKD">港币 (HKD)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>时区</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择时区" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Asia/Shanghai">中国标准时间 (UTC+8)</SelectItem>
                      <SelectItem value="America/New_York">美国东部时间 (UTC-5)</SelectItem>
                      <SelectItem value="Europe/London">英国时间 (UTC+0)</SelectItem>
                      <SelectItem value="Asia/Tokyo">日本时间 (UTC+9)</SelectItem>
                      <SelectItem value="Asia/Hong_Kong">香港时间 (UTC+8)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                取消
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? '更新中...' : '更新'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 