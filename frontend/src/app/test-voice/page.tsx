'use client';

import React, { useState } from 'react';
import ChatInput from '@/components/ChatInput';
import { toast } from 'sonner';

export default function TestVoicePage() {
  const [messages, setMessages] = useState<Array<{
    id: number;
    content: string;
    type: 'user' | 'assistant';
    timestamp: Date;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = (message: string) => {
    const newMessage = {
      id: Date.now(),
      content: message,
      type: 'user' as const,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // 模拟AI回复
    setTimeout(() => {
      const aiMessage = {
        id: Date.now() + 1,
        content: `我收到了您的消息："${message}"`,
        type: 'assistant' as const,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 1000);
  };

  const handleVoiceInput = (audioData: string) => {
    console.log('收到语音数据，长度:', audioData.length);

    // 尝试解码base64数据检查大小
    try {
      const binaryString = atob(audioData);
      const audioSize = binaryString.length;
      console.log('音频数据大小:', audioSize, 'bytes', `(${(audioSize/1024).toFixed(2)} KB)`);

      // 检查是否有实际数据
      if (audioSize < 1000) {
        console.warn('音频数据可能太小:', audioSize, 'bytes');
        toast.warning('录音数据较小，可能录制失败');
      }
    } catch (e) {
      console.error('解码base64数据失败:', e);
    }

    setIsLoading(true);
    toast.info('正在处理语音...');

    // 模拟语音识别
    setTimeout(() => {
      const recognizedText = '这是模拟的语音识别结果：今天午餐花了25元';
      handleSendMessage(`[语音识别] ${recognizedText}`);
      setIsLoading(false);
      toast.success('语音识别完成');
    }, 2000);
  };

  const handleImageInput = (imageData: string) => {
    setIsLoading(true);
    toast.info('正在处理图片...');
    
    // 模拟图片识别
    setTimeout(() => {
      const recognizedText = '这是模拟的图片识别结果：超市购物小票，总计68元';
      handleSendMessage(`[图片识别] ${recognizedText}`);
      setIsLoading(false);
      toast.success('图片识别完成');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 头部 */}
      <div className="bg-white border-b p-4">
        <h1 className="text-xl font-semibold text-center">语音输入测试</h1>
        <p className="text-sm text-gray-600 text-center mt-1">
          测试微信风格的语音输入功能
        </p>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>开始对话吧！</p>
            <p className="text-sm mt-2">
              点击麦克风图标切换到语音模式，然后按住说话
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-800 border'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 border px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-sm">AI正在思考...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <ChatInput
        onSendMessage={handleSendMessage}
        onVoiceInput={handleVoiceInput}
        onImageInput={handleImageInput}
        isLoading={isLoading}
        placeholder="输入消息或使用语音..."
      />

      {/* 使用说明 */}
      <div className="bg-yellow-50 border-t border-yellow-200 p-3">
        <div className="text-xs text-yellow-800 space-y-1">
          <p><strong>使用说明：</strong></p>
          <p>• 点击麦克风图标切换到语音模式</p>
          <p>• 在语音模式下，<strong>长按</strong>大按钮开始录音（至少200ms）</p>
          <p>• 短按（少于200ms）会被忽略，提示"请长按进行录音"</p>
          <p>• 向上滑动到红色区域可以取消录音</p>
          <p>• 最长支持60秒语音录制</p>
          <p>• 录音时间少于1秒将被忽略</p>
        </div>
      </div>
    </div>
  );
}
