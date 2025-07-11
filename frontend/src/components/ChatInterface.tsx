'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ChatMessage, BillCreate, APIChatMessage, Bill } from '@/types';
import { aiAPI, chatAPI } from '@/lib/api';
import { Mic, MicOff, Camera, Send, Loader2, Trash2 } from 'lucide-react';
import BillCard from './BillCard';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';


interface ChatInterfaceProps {
  onBillsCreated?: (bills: Bill[]) => void;
}

export default function ChatInterface({ onBillsCreated }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 加载历史聊天记录
  const loadChatHistory = async () => {
    try {
      setIsLoadingHistory(true);
      // 使用新的API路径，默认账本ID为1
      const response = await aiAPI.getChatHistory(1, 0, 100);
      
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
    loadChatHistory();
  }, []);

  useEffect(() => {
    // 只有在有新消息时才滚动到底部，避免初始化时的闪烁
    if (messages.length > 0 && !isLoadingHistory) {
      scrollToBottom();
    } else if (messages.length === 0 && !isLoadingHistory) {
      // 当没有消息且加载完成时，确保显示在底部
      initializeScrollPosition();
    }
  }, [messages, isLoadingHistory]);

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

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    // 添加用户消息到本地状态
    addMessage(userMessage, 'user');

    try {
      const response = await aiAPI.chat({ message: userMessage });
      
      // 检查统一返回格式
      if (!response.data?.success) {
        throw new Error(response.data?.message || '聊天失败');
      }
      
      const { message, bills } = response.data.data || {};
      console.log(bills);

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
    setIsLoading(true);
    try {
      const response = await aiAPI.chat({ 
        message: '语音输入', 
        audio: audioData 
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

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Image = (reader.result as string).split(',')[1];
      await processImageInput(base64Image);
    };
    reader.readAsDataURL(file);
  };

  // 处理图片分析
  const processImageInput = async (imageData: string) => {
    setIsLoading(true);
    try {
      const response = await aiAPI.chat({ 
        message: '图片分析', 
        image: imageData 
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

  return (
    <div className="flex flex-col h-full">
      {/* 聊天消息区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoadingHistory ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">加载聊天记录...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-lg font-medium">欢迎使用AI记账助手！</p>
            <p className="text-sm mt-2">你可以通过文字、语音或图片来记录账单</p>
          </div>
        ) : (
          <>
            {/* 清空聊天按钮 */}
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={clearChat}
                className="text-gray-500 hover:text-red-500"
              >
                清空聊天记录
              </Button>
            </div>
            
            {messages.map((message) => (
              <div key={message.id} className="space-y-3">
                {/* 消息卡片 */}
                <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <Card className={`max-w-xs lg:max-w-md relative py-0 ${
                    message.type === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white shadow-sm hover:shadow-md transition-shadow py-0'
                  }`}>
                    <CardContent className="p-3">
                      <p className="text-sm">{message.content}</p>
                      {/* <p className="text-xs opacity-70 mt-1">
                        {dayjs(message.timestamp).locale('zh-cn').format('YYYY-MM-DD HH:mm:ss')}
                      </p> */}
                    </CardContent>
                    
                    {/* 删除按钮 */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMessage(message.id)}
                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </Card>
                </div>
                
                {/* 账单卡片 - 单独显示 */}
                {message.bills && message.bills.length > 0 && (
                  <div className="flex justify-start">
                    <div className="max-w-xs lg:max-w-md space-y-2">
                      {message.bills.map((bill: BillCreate, index) => (
                        <BillCard key={index} bill={bill} index={index} />
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
            <Card className="bg-gray-100">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">AI正在思考...</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="border-t p-4 bg-white">
        <div className="flex items-center space-x-2">
          {/* 图片上传按钮 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            <Camera className="h-4 w-4" />
          </Button>
          
          {/* 语音按钮 */}
          <Button
            variant="outline"
            size="sm"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isLoading}
            className={isRecording ? 'bg-red-500 text-white' : ''}
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          
          {/* 文本输入 */}
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="输入记账信息，如：今天在星巴克花了35元..."
            className="flex-1"
            disabled={isLoading}
          />
          
          {/* 发送按钮 */}
          <Button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="sm"
          >
            <Send className="h-4 w-4" />
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