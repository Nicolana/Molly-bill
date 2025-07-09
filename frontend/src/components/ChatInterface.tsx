'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ChatMessage, BillCreate } from '@/types';
import { aiAPI, chatAPI } from '@/lib/api';
import { Mic, MicOff, Camera, Send, Loader2, Trash2 } from 'lucide-react';

interface ChatInterfaceProps {
  onBillCreated?: (bill: BillCreate) => void;
}

export default function ChatInterface({ onBillCreated }: ChatInterfaceProps) {
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
      const response = await chatAPI.getRecentMessages(100);
      const dbMessages = response.data;
      
      // 转换数据库消息格式为前端格式
      const convertedMessages: ChatMessage[] = dbMessages.map(dbMsg => ({
        id: dbMsg.id.toString(),
        type: dbMsg.message_type as 'user' | 'assistant',
        content: dbMsg.content,
        timestamp: new Date(dbMsg.timestamp),
        bill: undefined // 暂时不处理账单关联，可以后续优化
      }));
      
      setMessages(convertedMessages);
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

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 添加消息到聊天（本地状态）
  const addMessage = (content: string, type: 'user' | 'assistant', bill?: BillCreate) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      bill,
    };
    setMessages(prev => [...prev, newMessage]);
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
      const response = await aiAPI.chat(userMessage);
      const { message, bill } = response.data;

      // 添加AI回复到本地状态
      addMessage(message, 'assistant', bill);

      // 如果有账单信息，通知父组件
      if (bill && onBillCreated) {
        onBillCreated(bill);
      }
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
      alert('无法访问麦克风，请检查权限设置。');
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
      const response = await aiAPI.recognizeVoice(audioData);
      const { text } = response.data;
      
      if (text) {
        addMessage(`语音输入: ${text}`, 'user');
        // 继续处理文本
        const aiResponse = await aiAPI.chat(text);
        const { message, bill } = aiResponse.data;
        addMessage(message, 'assistant', bill);
        
        if (bill && onBillCreated) {
          onBillCreated(bill);
        }
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
      const response = await aiAPI.analyzeImage(imageData);
      const { text, bills } = response.data;
      
      addMessage(`图片分析: ${text}`, 'user');
      
      if (bills && bills.length > 0) {
        const message = `我识别出了以下账单信息：\n${bills.map(bill => 
          `- ${bill.description || '未知项目'}: ¥${bill.amount}`
        ).join('\n')}`;
        addMessage(message, 'assistant');
        
        // 通知父组件创建账单
        bills.forEach(bill => {
          if (onBillCreated) {
            onBillCreated(bill);
          }
        });
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
      await chatAPI.deleteMessage(parseInt(messageId));
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
    <div className="flex flex-col h-full max-w-4xl mx-auto">
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
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <Card className={`max-w-xs lg:max-w-md relative ${
                  message.type === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100'
                }`}>
                  <CardContent className="p-3">
                    <p className="text-sm">{message.content}</p>
                    {message.bill && (
                      <div className="mt-2 p-2 bg-white bg-opacity-20 rounded text-xs">
                        <p>识别到账单: ¥{message.bill.amount}</p>
                        {message.bill.description && <p>描述: {message.bill.description}</p>}
                        {message.bill.category && <p>分类: {message.bill.category}</p>}
                      </div>
                    )}
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
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