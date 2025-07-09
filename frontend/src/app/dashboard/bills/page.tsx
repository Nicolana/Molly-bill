'use client';

import React from 'react';
import BillList from '@/components/BillList';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function BillsPage() {
  return (
    <ProtectedRoute>
      <div className="h-[calc(100vh-65px)] bg-gray-50 overflow-auto">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <BillList />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
} 