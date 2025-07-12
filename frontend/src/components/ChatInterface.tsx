'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ChatMessage, BillCreate, Bill } from '@/types';
import { aiAPI, billsAPI } from '@/lib/api';
import { Mic, MicOff, Camera, Send, Loader2, Trash2 } from 'lucide-react';
import BillCard from './BillCard';

interface ChatInterfaceProps {
  onBillsCreated?: (bills: Bill[]) => void;
  selectedLedgerId?: number;
}

export default function ChatInterface({ onBillsCreated, selectedLedgerId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastSelectedLedgerId = useRef<number | undefined>(undefined);

  // 加载历史聊天记录
  const loadChatHistory = async () => {
    if (!selectedLedgerId) return; // 如果没有选中账本，不加载历史
    
    try {
      setIsLoadingHistory(true);
      const response = await aiAPI.getChatHistory(selectedLedgerId, 0, 100);
      
      // 检查统一返回格式
      if (!response.data?.success) {
        throw new Error(response.data?.message || '加载聊天历史失败');
      }
      
      const dbMessages = response.data.data || [];
      
      // 转换数据库消息格式为前端格式
      const convertedMessages: ChatMessage[] = dbMessages.map((dbMsg: any) => ({
        id: dbMsg.id.toString(),
        type: dbMsg.message_type as 'user' | 'assistant',
        content: dbMsg.content,
        timestamp: new Date(dbMsg.timestamp),
        bills: dbMsg.bills || [] // 使用后端返回的完整账单信息
      }));

      console.log(convertedMessages);
      
      setMessages(convertedMessages);
      // 使用 requestAnimationFrame 确保在DOM更新后设置滚动位置
      requestAnimationFrame(() => {
        initializeScrollPosition();
      });
    } catch (error) {
      console.error('加载聊天历史失败:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 初始化时设置滚动位置到底部
  const initializeScrollPosition = () => {
    const messagesContainer = messagesEndRef.current?.parentElement;
    if (messagesContainer) {
      // 使用 requestAnimationFrame 确保在下一帧执行，避免布局闪烁
      requestAnimationFrame(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      });
    }
  };

  useEffect(() => {
    // 只有当 selectedLedgerId 真正改变时才重新加载历史记录
    if (selectedLedgerId !== lastSelectedLedgerId.current) {
      lastSelectedLedgerId.current = selectedLedgerId;
      if (selectedLedgerId) {
        setMessages([]); // 清空当前消息
        loadChatHistory();
      } else {
        // 如果没有选中账本，清空消息并停止加载
        setMessages([]);
        setIsLoadingHistory(false);
      }
    }
  }, [selectedLedgerId]);

  useEffect(() => {
    // 只有在有新消息时才滚动到底部，避免初始化时的闪烁
    if (messages.length > 0 && !isLoadingHistory) {
      scrollToBottom();
    } else if (messages.length === 0 && !isLoadingHistory) {
      // 当没有消息且加载完成时，确保显示在底部
      initializeScrollPosition();
    }
  }, [messages, isLoadingHistory, scrollToBottom, initializeScrollPosition]);

  // 添加消息到聊天（本地状态）
  const addMessage = (content: string, type: 'user' | 'assistant', bills?: Bill[] | BillCreate[]) => {
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
  };

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

  // 清空聊天记录
  const clearChat = async () => {
    if (confirm('确定要清空所有聊天记录吗？')) {
      try {
        // 这里可以添加清空所有消息的API调用
        setMessages([]);
      } catch (error) {
        console.error('清空聊天记录失败:', error);
      }
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
    <div className="flex flex-col h-full">
      {/* 聊天消息区域 */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4">
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
            {/* 清空聊天按钮 */}
            {/* <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={clearChat}
                className="text-gray-500 hover:text-red-500 text-xs"
              >
                清空聊天记录
              </Button>
            </div> */}
            
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
                      {/* <p className="text-xs opacity-70 mt-1">
                        {dayjs(message.timestamp).locale('zh-cn').format('YYYY-MM-DD HH:mm:ss')}
                      </p> */}
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