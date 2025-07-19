'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ChatMessage, BillCreate, Bill } from '@/types';
import { aiAPI, billsAPI } from '@/lib/api';
import { Mic, MicOff, Camera, Send, Loader2, Trash2, ChevronUp } from 'lucide-react';
import BillCard from './BillCard';
import { toast } from 'sonner';

interface ChatInterfaceProps {
  onBillsCreated?: (bills: Bill[]) => void;
  selectedLedgerId?: number;
}

type Pagination = {
  total: number;
  skip: number;
  limit: number;
}

const INITIAL_PAGE_SIZE = 20; // 每页加载的消息数量

export default function ChatInterface({ onBillsCreated, selectedLedgerId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    skip: 0,
    limit: INITIAL_PAGE_SIZE
  })
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastSelectedLedgerId = useRef<number | undefined>(undefined);
  const isInitialLoad = useRef(true);


  // 加载历史聊天记录
  const loadChatHistory = useCallback(async (page: number = 0, append: boolean = false) => {
    if (!selectedLedgerId) return;
    
    try {
      if (!append) {
        setIsLoadingHistory(true);
      } else {
        setIsLoadingMore(true);
      }

      const skip = page * pagination.limit;
      const response = await aiAPI.getChatHistory(selectedLedgerId, skip, pagination.limit);
      
      if (!response.data?.success) {
        toast.error(response.data?.message || '加载聊天历史失败');
        return;
      }
      
      const dbMessages = response.data.data || [];
      setPagination(prev => ({
        ...prev,
        total: response.data.total,
      }));
      
      // 检查是否还有更多消息ı
      setHasMoreMessages(dbMessages.length === pagination.limit);
      
      // 转换数据库消息格式为前端格式
      const convertedMessages: ChatMessage[] = dbMessages.map((dbMsg: any) => ({
        id: dbMsg.id.toString(),
        type: dbMsg.message_type as 'user' | 'assistant',
        content: dbMsg.content,
        timestamp: new Date(dbMsg.timestamp),
        bills: dbMsg.bills || []
      }));

      if (append) {
        // 追加到现有消息的开头（因为是历史消息）
        setMessages(prev => [...convertedMessages.reverse(), ...prev]);
      } else {
        // 替换所有消息
        setMessages(convertedMessages.reverse());
        // isInitialLoad.current = false;
      }
    } catch (error) {
      console.error('加载聊天历史失败:', error);
    } finally {
      setIsLoadingHistory(false);
      setIsLoadingMore(false);
    }
  }, [selectedLedgerId]);

  // 加载更多历史消息
  const loadMoreMessages = useCallback(async () => {
    if (!hasMoreMessages || isLoadingMore || !selectedLedgerId) return;

    if (pagination.skip * pagination.limit >= pagination.total) return;

    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    await loadChatHistory(nextPage, true);
  }, [currentPage, hasMoreMessages, isLoadingMore, selectedLedgerId, loadChatHistory]);

  // 处理滚动事件
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    
    // 检查是否滚动到顶部，触发加载更多
    if (scrollTop <= 180 && hasMoreMessages && !isLoadingMore) {
      const previousScrollHeight = scrollHeight;
      loadMoreMessages().then(() => {
        // 保持滚动位置
        requestAnimationFrame(() => {
          const newScrollHeight = container.scrollHeight;
          const scrollDiff = newScrollHeight - previousScrollHeight;
          container.scrollTop = scrollTop + scrollDiff;
        });
      });
    }

    // 检查是否显示回到底部按钮
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 180;
    setShowScrollToBottom(!isNearBottom);
  }, [hasMoreMessages, isLoadingMore, loadMoreMessages]);

  // 自动滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // 监听账本切换
  useEffect(() => {
    if (selectedLedgerId !== lastSelectedLedgerId.current) {
      lastSelectedLedgerId.current = selectedLedgerId;
      setCurrentPage(0);
      setHasMoreMessages(true);
      isInitialLoad.current = true;
      
      if (selectedLedgerId) {
        setMessages([]);
        loadChatHistory(0, false);
      } else {
        setMessages([]);
        setIsLoadingHistory(false);
      }
    }
  }, [selectedLedgerId, loadChatHistory]);

  // 监听消息变化，自动滚动
  useEffect(() => {
    if (messages.length > 0 && !isLoadingHistory && !isInitialLoad.current) {
      const container = messagesContainerRef.current;
      if (container) {
        scrollToBottom();
      }
    }
  }, [messages, isLoadingHistory]);

  // 设置滚动监听
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (
      container &&
      !isLoadingHistory &&
      messages.length > 0 && isInitialLoad.current
    ) {
      container.scrollTop = container.scrollHeight;
      isInitialLoad.current = false;
    }
  }, [messages, isLoadingHistory]);

  // 添加消息到聊天（本地状态）
  const addMessage = useCallback((content: string, type: 'user' | 'assistant', bills?: Bill[] | BillCreate[]) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      bills: bills as Bill[],
    };
    setMessages(prev => [...prev, newMessage]);
    
    // 如果有新账单创建，通知父组件
    if (bills && bills.length > 0 && onBillsCreated) {
      onBillsCreated(bills as Bill[]);
    }
  }, [onBillsCreated]);

  // 发送文本消息
  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    // 检查是否选中了账本
    if (!selectedLedgerId) {
      addMessage('请先在账本管理页面选择一个账本，然后再开始聊天。', 'assistant');
      return;
    }

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    // 添加用户消息到本地状态
    addMessage(userMessage, 'user');

    try {
      const response = await aiAPI.chat({ 
        message: userMessage,
        ledger_id: selectedLedgerId
      });
      
      // 检查统一返回格式
      if (!response.data?.success) {
        throw new Error(response.data?.message || '聊天失败');
      }
      
      const { message, bills } = response.data.data || {};
      // 添加AI回复到本地状态
      addMessage(message || '抱歉，我没有理解您的意思。', 'assistant', bills);
    } catch (error) {
      console.error('发送消息失败:', error);
      addMessage('抱歉，我遇到了一些问题，请稍后再试。', 'assistant');
    } finally {
      setIsLoading(false);
    }
  };

  // 开始录音
  const startRecording = async () => {
    // 检查是否选中了账本
    if (!selectedLedgerId) {
      addMessage('请先在账本管理页面选择一个账本，然后再开始录音。', 'assistant');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.onload = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          await processVoiceInput(base64Audio);
        };
        reader.readAsDataURL(audioBlob);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('无法访问麦克风:', error);
      alert('无法访问麦克风，请检查权限设置。请确保已授予麦克风权限。');
    }
  };

  // 停止录音
  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  // 处理语音输入
  const processVoiceInput = async (audioData: string) => {
    // 检查是否选中了账本
    if (!selectedLedgerId) {
      addMessage('请先在账本管理页面选择一个账本，然后再开始语音输入。', 'assistant');
      return;
    }

    setIsLoading(true);
    try {
      const response = await aiAPI.chat({ 
        message: '语音输入', 
        audio: audioData,
        ledger_id: selectedLedgerId
      });
      
      // 检查统一返回格式
      if (!response.data?.success) {
        throw new Error(response.data?.message || '语音识别失败');
      }
      
      const { message, bills } = response.data.data || {};
      
      if (message) {
        addMessage(message, 'assistant', bills);
      } else {
        addMessage('抱歉，我没有听清楚，请再说一遍。', 'assistant');
      }
    } catch (error) {
      console.error('语音识别失败:', error);
      addMessage('语音识别失败，请重试。', 'assistant');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理图片输入
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 检查是否选中了账本
    if (!selectedLedgerId) {
      addMessage('请先在账本管理页面选择一个账本，然后再上传图片。', 'assistant');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Image = (reader.result as string).split(',')[1];
      await processImageInput(base64Image);
    };
    reader.readAsDataURL(file);
  };

  // 处理图片分析
  const processImageInput = async (imageData: string) => {
    // 检查是否选中了账本
    if (!selectedLedgerId) {
      addMessage('请先在账本管理页面选择一个账本，然后再开始图片分析。', 'assistant');
      return;
    }

    setIsLoading(true);
    try {
      const response = await aiAPI.chat({ 
        message: '图片分析', 
        image: imageData,
        ledger_id: selectedLedgerId
      });
      
      // 检查统一返回格式
      if (!response.data?.success) {
        throw new Error(response.data?.message || '图片分析失败');
      }
      
      const { message, bills } = response.data.data || {};
      
      if (message) {
        addMessage(message, 'assistant', bills);
      } else {
        addMessage('抱歉，我没有从图片中识别出账单信息。', 'assistant');
      }
    } catch (error) {
      console.error('图片分析失败:', error);
      addMessage('图片分析失败，请重试。', 'assistant');
    } finally {
      setIsLoading(false);
    }
  };

  // 删除消息
  const deleteMessage = async (messageId: string) => {
    try {
      // 暂时从本地状态删除，后续可以添加删除API
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('删除消息失败:', error);
    }
  };

  // 更新账单
  const handleUpdateBill = async (id: number, data: Partial<BillCreate>) => {
    try {
      const response = await billsAPI.updateBill(id, data);
      if (!response.data?.success) {
        throw new Error(response.data?.message || '更新账单失败');
      }
      
      // 更新本地消息中的账单信息
      setMessages(prev => prev.map(msg => {
        if (msg.bills) {
          return {
            ...msg,
            bills: msg.bills.map(bill => 
              bill.id === id ? { ...bill, ...data } : bill
            )
          };
        }
        return msg;
      }));
      
      // 通知父组件账单已更新
      if (onBillsCreated) {
        // 这里可以触发账单列表刷新
        onBillsCreated([]);
      }
    } catch (error) {
      console.error('更新账单失败:', error);
      throw error;
    }
  };

  // 删除账单
  const handleDeleteBill = async (id: number) => {
    try {
      const response = await billsAPI.deleteBill(id);
      if (!response.data?.success) {
        throw new Error(response.data?.message || '删除账单失败');
      }
      
      // 从本地消息中移除账单
      setMessages(prev => prev.map(msg => {
        if (msg.bills) {
          return {
            ...msg,
            bills: msg.bills.filter(bill => bill.id !== id)
          };
        }
        return msg;
      }));
      
      // 通知父组件账单已删除
      if (onBillsCreated) {
        // 这里可以触发账单列表刷新
        onBillsCreated([]);
      }
    } catch (error) {
      console.error('删除账单失败:', error);
      throw error;
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* 聊天消息区域 */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4 [scrollbar-gutter:stable_both-edges]"
        id="chatMessageContainer"
      >
        {/* 加载更多历史消息指示器 */}
        {isLoadingMore && (
          <div className="flex justify-center items-center py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="ml-2 text-xs text-gray-500">加载更多消息...</span>
          </div>
        )}

        {/* 没有更多消息提示 */}
        {!hasMoreMessages && messages.length > 0 && (
          <div className="text-center py-2">
            <span className="text-xs text-gray-400">没有更多消息了</span>
          </div>
        )}

        {isLoadingHistory ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2 text-sm">加载聊天记录...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-4 sm:mt-8">
            <p className="text-base sm:text-lg font-medium">欢迎使用AI记账助手！</p>
            <p className="text-xs sm:text-sm mt-2">你可以通过文字、语音或图片来记录账单</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div key={message.id} className="space-y-2 sm:space-y-3">
                {/* 消息卡片 */}
                <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <Card className={`max-w-[85%] sm:max-w-xs lg:max-w-md relative py-0 ${
                    message.type === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white shadow-sm hover:shadow-md transition-shadow py-0'
                  }`}>
                    <CardContent className="p-2 sm:p-3">
                      <p className="text-xs sm:text-sm break-words">{message.content}</p>
                    </CardContent>
                    
                    {/* 删除按钮 */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMessage(message.id)}
                      className="absolute top-0.5 right-0.5 h-5 w-5 sm:h-6 sm:w-6 p-0 opacity-0 hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    </Button>
                  </Card>
                </div>
                
                {/* 账单卡片 - 单独显示 */}
                {message.bills && message.bills.length > 0 && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] sm:max-w-xs lg:max-w-md space-y-2">
                      {message.bills.map((bill: BillCreate, index) => (
                        <BillCard 
                          key={index} 
                          bill={bill} 
                          index={index}
                          onUpdate={handleUpdateBill}
                          onDelete={handleDeleteBill}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <Card className="bg-gray-100 max-w-[85%] sm:max-w-xs">
              <CardContent className="p-2 sm:p-3">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  <span className="text-xs sm:text-sm">AI正在思考...</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 回到底部按钮 */}
      {showScrollToBottom && (
        <Button
          variant="outline"
          size="sm"
          onClick={scrollToBottom}
          className="absolute bottom-20 right-4 z-10 h-8 w-8 p-0 rounded-full shadow-lg bg-white hover:bg-gray-50"
        >
          <ChevronUp className="h-4 w-4 rotate-180" />
        </Button>
      )}

      {/* 输入区域 */}
      <div className="border-t p-2 sm:p-4 bg-white">
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* 图片上传按钮 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="flex-shrink-0 h-8 w-8 sm:h-9 sm:w-auto p-1 sm:px-3"
          >
            <Camera className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline ml-1">图片</span>
          </Button>
          
          {/* 语音按钮 */}
          <Button
            variant="outline"
            size="sm"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isLoading}
            className={`flex-shrink-0 h-8 w-8 sm:h-9 sm:w-auto p-1 sm:px-3 ${
              isRecording ? 'bg-red-500 text-white hover:bg-red-600' : ''
            }`}
          >
            {isRecording ? (
              <MicOff className="h-3 w-3 sm:h-4 sm:w-4" />
            ) : (
              <Mic className="h-3 w-3 sm:h-4 sm:w-4" />
            )}
            <span className="hidden sm:inline ml-1">
              {isRecording ? '停止' : '语音'}
            </span>
          </Button>
          
          {/* 文本输入 */}
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="输入记账信息..."
            className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
            disabled={isLoading}
          />
          
          {/* 发送按钮 */}
          <Button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="sm"
            className="flex-shrink-0 h-8 w-8 sm:h-9 sm:w-auto p-1 sm:px-3"
          >
            <Send className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline ml-1">发送</span>
          </Button>
        </div>
        
        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>
    </div>
  );
} 