'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, BookOpen } from 'lucide-react';
import ChatInterface from '@/components/ChatInterface';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useLedgerStore } from '@/store/ledger';
import Link from 'next/link';

export default function ChatPage() {
  const { currentLedgerId, userLedgers } = useLedgerStore();

  return (
    <ProtectedRoute>
      <div className="h-[calc(100vh-65px)] bg-gray-50">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8 h-full">
          <div className="space-y-6 h-full">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5" />
                    <span>AI记账助手</span>
                  </CardTitle>
                  <Link href="/dashboard/ledgers">
                    <Button variant="outline" size="sm" className="flex items-center space-x-2">
                      <BookOpen className="h-4 w-4" />
                      <span className="hidden sm:inline">
                        {currentLedgerId ?
                          userLedgers.find(ul => ul.ledger?.id === currentLedgerId)?.ledger?.name || '选择账本' :
                          '选择账本'
                        }
                      </span>
                      <span className="sm:hidden">账本</span>
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="h-[calc(100%-80px)] p-0">
                <ChatInterface
                  selectedLedgerId={currentLedgerId || undefined}
                />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}