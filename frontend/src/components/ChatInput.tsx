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
  const [, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingStartTime = useRef<number>(0);
  const initialTouchPosition = useRef({ x: 0, y: 0 });
  const waveformTimer = useRef<NodeJS.Timeout | null>(null);
  const shouldCancelRecording = useRef<boolean>(false);
  const pressStartTime = useRef<number>(0);
  const shortPressTimer = useRef<NodeJS.Timeout | null>(null);
  const initialViewportHeight = useRef<number>(0);

  // 键盘检测和视口高度监听
  useEffect(() => {
    // 记录初始视口高度
    initialViewportHeight.current = window.visualViewport?.height || window.innerHeight;

    const handleViewportChange = () => {
      const currentHeight = window.visualViewport?.height || window.innerHeight;
      const heightDiff = initialViewportHeight.current - currentHeight;

      // 如果高度差超过150px，认为键盘弹出
      if (heightDiff > 150) {
        setIsKeyboardVisible(true);
        setKeyboardHeight(heightDiff);
        // 添加body类来防止背景滚动
        document.body.classList.add('keyboard-visible');
      } else {
        setIsKeyboardVisible(false);
        setKeyboardHeight(0);
        // 移除body类
        document.body.classList.remove('keyboard-visible');
      }
    };

    // 监听视口变化
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
    } else {
      // 降级方案：监听窗口大小变化
      window.addEventListener('resize', handleViewportChange);
    }

    // 监听输入框焦点事件
    const handleFocusIn = (e: FocusEvent) => {
      // 只对输入元素响应
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        // 延迟检测，等待键盘动画完成
        setTimeout(handleViewportChange, 300);
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      // 只对输入元素响应
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        // 延迟重置，等待键盘收起动画完成
        setTimeout(() => {
          setIsKeyboardVisible(false);
          setKeyboardHeight(0);
          document.body.classList.remove('keyboard-visible');
        }, 300);
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
      } else {
        window.removeEventListener('resize', handleViewportChange);
      }
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      // 清理body类
      document.body.classList.remove('keyboard-visible');
    };
  }, []);

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
      // 重置取消标志
      shouldCancelRecording.current = false;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 检查支持的音频格式
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = ''; // 使用默认格式
          }
        }
      }

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const audioChunks: Blob[] = [];

      console.log('使用音频格式:', mimeType || '默认格式');

      recorder.ondataavailable = (event) => {
        console.log('收到音频数据块:', event.data.size, 'bytes');
        audioChunks.push(event.data);
      };

      recorder.onstop = async () => {
        // 使用录制时的实际格式
        const audioBlob = new Blob(audioChunks, { type: recorder.mimeType });
        const currentRecordingTime = Math.floor((Date.now() - recordingStartTime.current) / 1000);

        console.log('录音停止', {
          currentRecordingTime,
          shouldCancel: shouldCancelRecording.current,
          blobSize: audioBlob.size,
          mimeType: audioBlob.type
        });

        // 检查录音时长，太短的录音不处理
        if (currentRecordingTime < 1) {
          toast.info('录音时间太短，至少需要1秒');
          // 清理资源
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        // 如果不是取消操作，则处理音频
        if (!shouldCancelRecording.current) {
          console.log('处理音频数据');
          const reader = new FileReader();
          reader.onload = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            onVoiceInput(base64Audio);
          };
          reader.readAsDataURL(audioBlob);
        } else {
          console.log('录音已取消，不处理音频');
        }

        // 清理资源
        stream.getTracks().forEach(track => track.stop());
        // 重置取消标志
        shouldCancelRecording.current = false;
      };

      // 开始录音，设置时间片为100ms以确保有足够的数据
      recorder.start(100);
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
      console.log('停止录音 - 将发送音频');
      shouldCancelRecording.current = false; // 确保不取消
      mediaRecorder.stop();
      setIsRecording(false);
      setRecordingTime(0);

      // 清理定时器
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

  // 清理所有定时器的函数
  const cleanupTimers = useCallback(() => {
    if (shortPressTimer.current) {
      clearTimeout(shortPressTimer.current);
      shortPressTimer.current = null;
    }
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    if (recordingTimer) {
      clearInterval(recordingTimer);
      setRecordingTimer(null);
    }
    if (waveformTimer.current) {
      clearInterval(waveformTimer.current);
      waveformTimer.current = null;
    }
  }, [longPressTimer, recordingTimer]);

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      cleanupTimers();
    };
  }, [cleanupTimers]);

  // 取消录音
  const cancelRecording = useCallback(() => {
    if (mediaRecorder && isRecording) {
      console.log('取消录音 - 不发送音频');
      shouldCancelRecording.current = true; // 标记为取消
      mediaRecorder.stop();
      setIsRecording(false);
      setRecordingTime(0);
      setIsDragging(false);
      setCancelZoneActive(false);
      setDragPosition({ x: 0, y: 0 });

      // 清理定时器
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
    pressStartTime.current = Date.now();

    console.log('按下开始'); // 调试日志

    // 设置短按检测定时器（200ms后开始录音）
    const timer = setTimeout(() => {
      console.log('长按检测 - 开始录音');
      setIsLongPress(true);
      startRecording();
    }, 200);

    shortPressTimer.current = timer;
  }, [disabled, isLoading, startRecording]);

  // 结束按住
  const handlePressEnd = useCallback(() => {
    const pressDuration = Date.now() - pressStartTime.current;
    console.log('松开按钮', { pressDuration, isRecording, isDragging, cancelZoneActive }); // 调试日志

    // 清理定时器
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    if (shortPressTimer.current) {
      clearTimeout(shortPressTimer.current);
      shortPressTimer.current = null;
    }

    // 检查是否为短按（少于200ms且未开始录音）
    if (pressDuration < 200 && !isRecording) {
      console.log('短按检测 - 忽略操作');
      toast.info('请长按进行录音');
      // 重置状态
      setIsLongPress(false);
      setIsDragging(false);
      setCancelZoneActive(false);
      setDragPosition({ x: 0, y: 0 });
      return;
    }

    // 如果正在录音，根据状态决定是停止还是取消
    if (isRecording) {
      if (isDragging || cancelZoneActive) {
        console.log('取消录音');
        cancelRecording();
      } else {
        console.log('停止录音');
        stopRecording();
      }
    }

    // 重置所有状态
    setIsLongPress(false);
    setIsDragging(false);
    setCancelZoneActive(false);
    setDragPosition({ x: 0, y: 0 });
  }, [longPressTimer, isRecording, isDragging, cancelZoneActive, cancelRecording, stopRecording]);

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

  // 计算动态底部位置
  const getBottomPosition = () => {
    if (isKeyboardVisible) {
      // 键盘弹出时，使用安全区域底部 + 一些额外间距
      return '20px';
    }
    // 默认位置（底部导航栏上方）
    return '72px';
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

      <div
        className="chat-input-container p-2 sm:p-4 fixed w-full left-0 bg-white lg:relative lg:bottom-0! lg:w-auto transition-all duration-300 ease-in-out z-50"
        style={{
          bottom: getBottomPosition(),
          // 添加安全区域支持
          paddingBottom: isKeyboardVisible ? 'env(safe-area-inset-bottom, 0px)' : '0px'
        }}
      >
        {isVoiceMode ? (
          /* 语音模式界面 */
          <div className="flex items-center space-x-2">
            {/* 切换到文本模式按钮 */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleVoiceMode}
              disabled={isLoading || disabled || isRecording}
              className="flex-shrink-0 h-12 w-12 p-2"
            >
              <Keyboard className="h-5 w-5" />
            </Button>

            {/* 图片上传按钮 */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || disabled || isRecording}
              className="flex-shrink-0 h-12 w-12 p-2"
            >
              <Camera className="h-5 w-5" />
            </Button>

            {/* 语音录制按钮 - 占据大部分空间 */}
            <div
              className={`flex-1 h-14 rounded-lg border-2 border-dashed transition-all duration-200 select-none voice-input-area ${
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
              onTouchCancel={handlePressEnd}
              onTouchMove={handlePressMove}
              style={{
                transform: isRecording ? `translateY(${Math.min(dragPosition.y * 0.1, 0)}px)` : 'none',
                touchAction: 'none' // 防止浏览器默认的触摸行为
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
                    <span className="font-medium">长按 说话</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* 文本模式界面 */
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            autoComplete="off"
            noValidate
          >
            <div className="flex items-center space-x-2">
            {/* 语音模式切换按钮 */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleVoiceMode}
              disabled={isLoading || disabled}
              className="flex-shrink-0 h-12 w-12 sm:h-12 sm:w-auto p-2 sm:px-4"
            >
              <Mic className="h-5 w-5" />
              <span className="hidden sm:inline ml-1">语音</span>
            </Button>

            {/* 图片上传按钮 */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || disabled}
              className="flex-shrink-0 h-12 w-12 sm:h-12 sm:w-auto p-2 sm:px-4"
            >
              <Camera className="h-5 w-5" />
              <span className="hidden sm:inline ml-1">图片</span>
            </Button>

            {/* 文本输入 */}
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="flex-1 text-sm h-12 px-4 outline-none"
              style={{
                boxShadow: 'none'
              }}
              disabled={isLoading || disabled}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              data-form-type="other"
              data-lpignore="true"
              data-1p-ignore="true"
              name="chat-input"
              role="textbox"
              aria-autocomplete="none"
            />

            {/* 发送按钮 */}
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading || disabled}
              size="sm"
              className="flex-shrink-0 h-12 w-12 sm:h-12 sm:w-auto p-2 sm:px-4"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
              <span className="hidden sm:inline ml-1">发送</span>
            </Button>
            </div>
          </form>
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
