'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Camera, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onVoiceInput: (audioData: string) => void;
  onImageInput: (imageData: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({
  onSendMessage,
  onVoiceInput,
  onImageInput,
  isLoading = false,
  disabled = false,
  placeholder = "输入记账信息..."
}: ChatInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null);
  const [isLongPress, setIsLongPress] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingStartTime = useRef<number>(0);
  const voiceButtonRef = useRef<HTMLButtonElement>(null);
  const initialTouchPosition = useRef({ x: 0, y: 0 });

  // 发送文本消息
  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim() || isLoading || disabled) return;
    
    onSendMessage(inputValue.trim());
    setInputValue('');
  }, [inputValue, isLoading, disabled, onSendMessage]);

  // 处理键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // 开始录音
  const startRecording = useCallback(async () => {
    if (disabled) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });

        // 检查录音时长，太短的录音不处理
        if (recordingTime < 1) {
          toast.info('录音时间太短');
          return;
        }

        const reader = new FileReader();
        reader.onload = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          onVoiceInput(base64Audio);
        };
        reader.readAsDataURL(audioBlob);

        // 清理资源
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      recordingStartTime.current = Date.now();

      // 开始计时
      const timer = setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - recordingStartTime.current) / 1000));
      }, 100); // 更频繁的更新以获得更流畅的动画
      setRecordingTimer(timer);

    } catch (error) {
      console.error('无法访问麦克风:', error);
      toast.error('无法访问麦克风，请检查权限设置');
    }
  }, [disabled, onVoiceInput, recordingTime]);

  // 停止录音
  const stopRecording = useCallback(() => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setRecordingTime(0);
      
      if (recordingTimer) {
        clearInterval(recordingTimer);
        setRecordingTimer(null);
      }
    }
  }, [mediaRecorder, isRecording, recordingTimer]);

  // 取消录音
  const cancelRecording = useCallback(() => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setRecordingTime(0);
      setIsDragging(false);
      setDragPosition({ x: 0, y: 0 });

      if (recordingTimer) {
        clearInterval(recordingTimer);
        setRecordingTimer(null);
      }

      toast.info('录音已取消');
    }
  }, [mediaRecorder, isRecording, recordingTimer]);

  // 长按开始
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled || isLoading) return;

    e.preventDefault();
    initialTouchPosition.current = { x: e.clientX, y: e.clientY };

    const timer = setTimeout(() => {
      setIsLongPress(true);
      startRecording();
    }, 200); // 200ms后开始录音

    setLongPressTimer(timer);
  }, [disabled, isLoading, startRecording]);

  // 长按结束
  const handleMouseUp = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    if (isLongPress && isRecording) {
      if (isDragging) {
        cancelRecording();
      } else {
        stopRecording();
      }
    }

    setIsLongPress(false);
    setIsDragging(false);
    setDragPosition({ x: 0, y: 0 });
  }, [longPressTimer, isLongPress, isRecording, isDragging, cancelRecording, stopRecording]);

  // 拖拽处理
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isLongPress || !isRecording) return;

    const deltaX = e.clientX - initialTouchPosition.current.x;
    const deltaY = e.clientY - initialTouchPosition.current.y;

    setDragPosition({ x: deltaX, y: deltaY });

    // 如果向上拖拽超过一定距离，标记为取消
    if (deltaY < -50) {
      setIsDragging(true);
    } else {
      setIsDragging(false);
    }
  }, [isLongPress, isRecording]);

  // 处理图片上传
  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || disabled) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Image = (reader.result as string).split(',')[1];
      onImageInput(base64Image);
    };
    reader.readAsDataURL(file);
    
    // 清空文件输入
    event.target.value = '';
  }, [disabled, onImageInput]);

  // 格式化录音时间
  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 生成波形动画
  const generateWaveform = () => {
    const bars = [];
    for (let i = 0; i < 5; i++) {
      bars.push(
        <div
          key={i}
          className="w-1 bg-red-500 animate-pulse"
          style={{
            height: `${Math.random() * 16 + 8}px`,
            animationDelay: `${i * 0.1}s`,
            animationDuration: '0.8s'
          }}
        />
      );
    }
    return bars;
  };

  return (
    <div className="border-t p-2 sm:p-4 bg-white">
      {/* 录音状态显示 */}
      {isRecording && (
        <div className="mb-2 flex items-center justify-center space-x-3 text-red-500 bg-red-50 rounded-lg p-3 mx-2">
          <div className="flex space-x-1 items-end">
            {generateWaveform()}
          </div>
          <span className="text-sm font-medium">{formatRecordingTime(Math.floor(recordingTime / 10))}</span>
          <div className="flex items-center space-x-2">
            {isDragging && (
              <span className="text-xs text-red-600 animate-pulse">松开取消</span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={cancelRecording}
              className="text-red-500 hover:text-red-600 h-6 px-2"
            >
              取消
            </Button>
          </div>
        </div>
      )}
      
      <div className="flex items-center space-x-1 sm:space-x-2">
        {/* 图片上传按钮 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading || disabled}
          className="flex-shrink-0 h-8 w-8 sm:h-9 sm:w-auto p-1 sm:px-3"
        >
          <Camera className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline ml-1">图片</span>
        </Button>
        
        {/* 语音按钮 */}
        <Button
          ref={voiceButtonRef}
          variant="outline"
          size="sm"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseUp}
          disabled={isLoading || disabled}
          className={`flex-shrink-0 h-8 w-8 sm:h-9 sm:w-auto p-1 sm:px-3 select-none transition-all duration-200 ${
            isRecording
              ? isDragging
                ? 'bg-gray-500 text-white hover:bg-gray-600 transform scale-95'
                : 'bg-red-500 text-white hover:bg-red-600 transform scale-105'
              : 'hover:bg-blue-50'
          }`}
          style={{
            transform: isRecording ? `translate(${dragPosition.x * 0.1}px, ${dragPosition.y * 0.1}px) ${isDragging ? 'scale(0.95)' : 'scale(1.05)'}` : 'scale(1)'
          }}
        >
          {isRecording ? (
            isDragging ? (
              <MicOff className="h-3 w-3 sm:h-4 sm:w-4" />
            ) : (
              <div className="relative">
                <Mic className="h-3 w-3 sm:h-4 sm:w-4" />
                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
              </div>
            )
          ) : (
            <Mic className="h-3 w-3 sm:h-4 sm:w-4" />
          )}
          <span className="hidden sm:inline ml-1">
            {isRecording ? (isDragging ? '取消' : '录音中') : '按住说话'}
          </span>
        </Button>
        
        {/* 文本输入 */}
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
          disabled={isLoading || disabled}
        />
        
        {/* 发送按钮 */}
        <Button
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || isLoading || disabled}
          size="sm"
          className="flex-shrink-0 h-8 w-8 sm:h-9 sm:w-auto p-1 sm:px-3"
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
          ) : (
            <Send className="h-3 w-3 sm:h-4 sm:w-4" />
          )}
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
  );
}
