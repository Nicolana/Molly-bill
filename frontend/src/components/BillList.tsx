'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { Bill } from '@/types';
import BillCard from './BillCard';
import dayjs from 'dayjs';

interface BillListProps {
  bills: Bill[];
  title?: string;
}

export default function BillList({ 
  bills, 
  title = "账单记录" 
}: BillListProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              <span>{title}</span>
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {bills.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-base sm:text-lg font-medium">该日期没有账单记录</p>
            <p className="text-gray-400 text-sm mt-1">尝试选择其他日期或添加新的账单</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:gap-3 max-h-200 overflow-auto">
            {bills.map((bill, index) => (
              <div key={bill.id} className="relative group">
                <BillCard bill={bill} index={index} showRecordLabel={false} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 