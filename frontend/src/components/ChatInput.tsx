'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Camera, Send, Loader2, Keyboard, X } from 'lucide-react';
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
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null);
  const [isLongPress, setIsLongPress] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [cancelZoneActive, setCancelZoneActive] = useState(false);
  const [waveformKey, setWaveformKey] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingStartTime = useRef<number>(0);
  const initialTouchPosition = useRef({ x: 0, y: 0 });
  const waveformTimer = useRef<NodeJS.Timeout | null>(null);

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
        const currentRecordingTime = Math.floor((Date.now() - recordingStartTime.current) / 1000);

        // 检查录音时长，太短的录音不处理
        if (currentRecordingTime < 1) {
          toast.info('录音时间太短，至少需要1秒');
          return;
        }

        // 如果不是取消操作，则处理音频
        if (!isDragging) {
          const reader = new FileReader();
          reader.onload = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            onVoiceInput(base64Audio);
          };
          reader.readAsDataURL(audioBlob);
        }

        // 清理资源
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      recordingStartTime.current = Date.now();
      setRecordingTime(0);

      // 开始计时，每100ms更新一次
      const timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordingStartTime.current) / 1000);
        setRecordingTime(elapsed);
      }, 100);
      setRecordingTimer(timer);

      // 启动波形动画
      const waveTimer = setInterval(() => {
        setWaveformKey(prev => prev + 1);
      }, 150);
      waveformTimer.current = waveTimer;

    } catch (error) {
      console.error('无法访问麦克风:', error);
      toast.error('无法访问麦克风，请检查权限设置');
    }
  }, [disabled, onVoiceInput, isDragging]);

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

      if (waveformTimer.current) {
        clearInterval(waveformTimer.current);
        waveformTimer.current = null;
      }
    }
  }, [mediaRecorder, isRecording, recordingTimer]);

  // 监听录音时间，60秒自动停止
  useEffect(() => {
    if (recordingTime >= 60 && isRecording) {
      stopRecording();
      toast.info('录音时间已达到最大限制（60秒）');
    }
  }, [recordingTime, isRecording, stopRecording]);

  // 取消录音
  const cancelRecording = useCallback(() => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setRecordingTime(0);
      setIsDragging(false);
      setCancelZoneActive(false);
      setDragPosition({ x: 0, y: 0 });

      if (recordingTimer) {
        clearInterval(recordingTimer);
        setRecordingTimer(null);
      }

      if (waveformTimer.current) {
        clearInterval(waveformTimer.current);
        waveformTimer.current = null;
      }

      toast.info('录音已取消');
    }
  }, [mediaRecorder, isRecording, recordingTimer]);

  // 切换语音模式
  const toggleVoiceMode = useCallback(() => {
    setIsVoiceMode(!isVoiceMode);
  }, [isVoiceMode]);

  // 获取触摸位置
  const getTouchPosition = (e: React.TouchEvent | React.MouseEvent) => {
    if ('touches' in e) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  // 开始按住（支持鼠标和触摸）
  const handlePressStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (disabled || isLoading) return;

    e.preventDefault();
    const position = getTouchPosition(e);
    initialTouchPosition.current = position;

    // 立即开始录音（微信风格）
    setIsLongPress(true);
    startRecording();
  }, [disabled, isLoading, startRecording]);

  // 结束按住
  const handlePressEnd = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    if (isLongPress && isRecording) {
      if (isDragging || cancelZoneActive) {
        cancelRecording();
      } else {
        stopRecording();
      }
    }

    setIsLongPress(false);
    setIsDragging(false);
    setCancelZoneActive(false);
    setDragPosition({ x: 0, y: 0 });
  }, [longPressTimer, isLongPress, isRecording, isDragging, cancelZoneActive, cancelRecording, stopRecording]);

  // 拖拽处理（支持鼠标和触摸）
  const handlePressMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isLongPress || !isRecording) return;

    const position = getTouchPosition(e);
    const deltaX = position.x - initialTouchPosition.current.x;
    const deltaY = position.y - initialTouchPosition.current.y;

    setDragPosition({ x: deltaX, y: deltaY });

    // 向上拖拽超过80px进入取消区域
    const cancelThreshold = 80;
    const shouldCancel = deltaY < -cancelThreshold;

    setIsDragging(shouldCancel);
    setCancelZoneActive(shouldCancel);
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
    const barCount = 7;
    for (let i = 0; i < barCount; i++) {
      // 使用waveformKey和索引创建动态高度
      const phase = (waveformKey * 0.3) + (i * 0.8);
      const height = Math.sin(phase) * 8 + 16;
      bars.push(
        <div
          key={i}
          className="w-1 bg-green-500 rounded-full transition-all duration-150 ease-in-out waveform-bar"
          style={{
            height: `${Math.max(6, Math.abs(height))}px`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      );
    }
    return bars;
  };

  return (
    <div className={`border-t bg-white ${isRecording ? 'recording-active' : ''}`}>
      {/* 取消录音提示区域 */}
      {isRecording && (
        <div className="relative">
          {/* 取消区域指示器 */}
          <div className={`absolute top-0 left-0 right-0 h-16 bg-red-500 transition-all duration-200 ${
            cancelZoneActive ? 'opacity-100 cancel-zone-active' : 'opacity-0'
          } flex items-center justify-center z-10`}>
            <div className="flex items-center space-x-2 text-white">
              <X className="h-5 w-5" />
              <span className="text-sm font-medium">松开取消</span>
            </div>
          </div>

          {/* 录音状态显示 */}
          <div className="bg-gray-100 p-4 flex flex-col items-center space-y-3">
            <div className="flex items-center space-x-3">
              <div className="flex space-x-1 items-end">
                {generateWaveform()}
              </div>
              <span className="text-lg font-mono text-gray-700">
                {formatRecordingTime(recordingTime)}
              </span>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                {cancelZoneActive ? '松开取消录音' : '正在录音...'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                最长支持60秒语音 ({60 - recordingTime}秒)
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="p-2 sm:p-4">
        {isVoiceMode ? (
          /* 语音模式界面 */
          <div className="flex items-center space-x-2">
            {/* 切换到文本模式按钮 */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleVoiceMode}
              disabled={isLoading || disabled || isRecording}
              className="flex-shrink-0 h-10 w-10 p-2"
            >
              <Keyboard className="h-4 w-4" />
            </Button>

            {/* 图片上传按钮 */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || disabled || isRecording}
              className="flex-shrink-0 h-10 w-10 p-2"
            >
              <Camera className="h-4 w-4" />
            </Button>

            {/* 语音录制按钮 - 占据大部分空间 */}
            <div
              className={`flex-1 h-12 rounded-lg border-2 border-dashed transition-all duration-200 select-none voice-input-area ${
                isRecording
                  ? cancelZoneActive
                    ? 'bg-red-500 border-red-600 text-white'
                    : 'bg-green-500 border-green-600 text-white voice-recording-button'
                  : 'bg-gray-50 border-gray-300 hover:bg-gray-100 active:bg-gray-200'
              } voice-recording-button`}
              onMouseDown={handlePressStart}
              onMouseUp={handlePressEnd}
              onMouseMove={handlePressMove}
              onMouseLeave={handlePressEnd}
              onTouchStart={handlePressStart}
              onTouchEnd={handlePressEnd}
              onTouchMove={handlePressMove}
              style={{
                transform: isRecording ? `translateY(${Math.min(dragPosition.y * 0.1, 0)}px)` : 'none'
              }}
            >
              <div className="h-full flex items-center justify-center">
                {isRecording ? (
                  <div className="flex items-center space-x-2">
                    {cancelZoneActive ? (
                      <>
                        <MicOff className="h-5 w-5" />
                        <span className="font-medium">松开取消</span>
                      </>
                    ) : (
                      <>
                        <div className="relative">
                          <Mic className="h-5 w-5" />
                          <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-30"></div>
                        </div>
                        <span className="font-medium">正在录音...</span>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Mic className="h-5 w-5" />
                    <span className="font-medium">按住 说话</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* 文本模式界面 */
          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* 语音模式切换按钮 */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleVoiceMode}
              disabled={isLoading || disabled}
              className="flex-shrink-0 h-8 w-8 sm:h-9 sm:w-auto p-1 sm:px-3"
            >
              <Mic className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline ml-1">语音</span>
            </Button>

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
        )}
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
