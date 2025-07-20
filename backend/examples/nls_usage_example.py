#!/usr/bin/env python3
# -*- coding: UTF-8 -*-
"""
阿里云NLS语音识别服务使用示例

本示例展示如何在应用中使用阿里云NLS语音识别服务
"""

import base64
import asyncio
from app.services.ai.aliyun_nls_service import aliyun_nls_service


def load_audio_file(file_path: str) -> str:
    """
    加载音频文件并转换为base64编码
    
    Args:
        file_path: 音频文件路径
        
    Returns:
        str: base64编码的音频数据
    """
    try:
        with open(file_path, 'rb') as f:
            audio_data = f.read()
        return base64.b64encode(audio_data).decode('utf-8')
    except Exception as e:
        print(f"加载音频文件失败: {e}")
        return ""


def example_basic_recognition():
    """基础语音识别示例"""
    print("=== 基础语音识别示例 ===")
    
    # 假设我们有一个音频文件
    audio_file_path = "test_audio.wav"  # 替换为实际的音频文件路径
    
    # 加载音频文件
    audio_base64 = load_audio_file(audio_file_path)
    if not audio_base64:
        print("无法加载音频文件，跳过示例")
        return
    
    # 调用语音识别
    result = aliyun_nls_service.recognize_voice(audio_base64)
    
    # 处理结果
    if result.get('success'):
        print(f"识别成功: {result.get('text')}")
        print(f"置信度: {result.get('confidence')}")
    else:
        print(f"识别失败: {result.get('message')}")


def example_with_error_handling():
    """带错误处理的语音识别示例"""
    print("\n=== 带错误处理的语音识别示例 ===")
    
    # 模拟base64音频数据（实际使用时应该是真实的音频数据）
    fake_audio_data = "fake_audio_data"
    
    try:
        result = aliyun_nls_service.recognize_voice(fake_audio_data)
        
        if result.get('success'):
            recognized_text = result.get('text', '')
            confidence = result.get('confidence', 0.0)
            
            # 根据置信度判断识别质量
            if confidence >= 0.8:
                print(f"高质量识别: {recognized_text}")
            elif confidence >= 0.6:
                print(f"中等质量识别: {recognized_text}")
            else:
                print(f"低质量识别: {recognized_text} (建议重新录音)")
                
        else:
            error_message = result.get('message', '未知错误')
            print(f"识别失败: {error_message}")
            
            # 根据错误类型进行不同处理
            if "配置" in error_message:
                print("建议检查API密钥配置")
            elif "网络" in error_message or "连接" in error_message:
                print("建议检查网络连接")
            elif "格式" in error_message:
                print("建议检查音频格式")
            else:
                print("建议稍后重试")
                
    except Exception as e:
        print(f"调用服务时发生异常: {e}")


async def example_async_recognition():
    """异步语音识别示例"""
    print("\n=== 异步语音识别示例 ===")
    
    def recognize_audio(audio_data: str) -> dict:
        """同步识别函数"""
        return aliyun_nls_service.recognize_voice(audio_data)
    
    # 模拟多个音频识别任务
    audio_tasks = [
        "audio_data_1",
        "audio_data_2", 
        "audio_data_3"
    ]
    
    # 创建异步任务
    loop = asyncio.get_event_loop()
    tasks = []
    
    for i, audio_data in enumerate(audio_tasks):
        # 将同步函数包装为异步任务
        task = loop.run_in_executor(None, recognize_audio, audio_data)
        tasks.append((i, task))
    
    # 等待所有任务完成
    print("开始并发识别...")
    for i, task in tasks:
        try:
            result = await task
            print(f"任务 {i+1} 完成: {result.get('success', False)}")
        except Exception as e:
            print(f"任务 {i+1} 失败: {e}")


def example_batch_recognition():
    """批量语音识别示例"""
    print("\n=== 批量语音识别示例 ===")
    
    # 模拟多个音频文件
    audio_files = [
        "audio1.wav",
        "audio2.wav", 
        "audio3.wav"
    ]
    
    results = []
    
    for i, audio_file in enumerate(audio_files):
        print(f"处理文件 {i+1}/{len(audio_files)}: {audio_file}")
        
        # 实际使用时应该加载真实的音频文件
        # audio_base64 = load_audio_file(audio_file)
        audio_base64 = f"fake_audio_data_{i}"
        
        result = aliyun_nls_service.recognize_voice(audio_base64)
        results.append({
            'file': audio_file,
            'result': result
        })
    
    # 统计结果
    success_count = sum(1 for r in results if r['result'].get('success'))
    total_count = len(results)
    
    print(f"\n批量识别完成: {success_count}/{total_count} 成功")
    
    # 显示详细结果
    for item in results:
        file_name = item['file']
        result = item['result']
        if result.get('success'):
            text = result.get('text', '')
            print(f"✅ {file_name}: {text}")
        else:
            error = result.get('message', '未知错误')
            print(f"❌ {file_name}: {error}")


def example_integration_with_chat():
    """与聊天系统集成的示例"""
    print("\n=== 与聊天系统集成示例 ===")
    
    # 模拟聊天场景中的语音消息处理
    def process_voice_message(user_id: int, audio_data: str) -> dict:
        """处理语音消息"""
        print(f"处理用户 {user_id} 的语音消息...")
        
        # 语音识别
        recognition_result = aliyun_nls_service.recognize_voice(audio_data)
        
        if recognition_result.get('success'):
            recognized_text = recognition_result.get('text', '')
            confidence = recognition_result.get('confidence', 0.0)
            
            # 构建响应
            response = {
                'success': True,
                'user_id': user_id,
                'original_text': recognized_text,
                'confidence': confidence,
                'message': f"[语音识别] {recognized_text}"
            }
            
            # 根据置信度添加提示
            if confidence < 0.6:
                response['warning'] = "识别置信度较低，请确认内容是否正确"
            
            return response
        else:
            return {
                'success': False,
                'user_id': user_id,
                'error': recognition_result.get('message', '语音识别失败'),
                'message': '抱歉，语音识别失败，请重试'
            }
    
    # 模拟处理语音消息
    user_id = 12345
    audio_data = "fake_voice_message_data"
    
    result = process_voice_message(user_id, audio_data)
    
    if result.get('success'):
        print(f"用户消息: {result.get('message')}")
        if result.get('warning'):
            print(f"警告: {result.get('warning')}")
    else:
        print(f"处理失败: {result.get('error')}")


def main():
    """主函数"""
    print("阿里云NLS语音识别服务使用示例")
    print("=" * 50)
    
    # 检查服务配置
    if not aliyun_nls_service.app_key or not aliyun_nls_service.token:
        print("❌ 服务未正确配置，请设置环境变量:")
        print("   ALIYUN_NLS_APP_KEY")
        print("   ALIYUN_NLS_TOKEN")
        return
    
    print("✅ 服务配置正常")
    
    # 运行示例
    try:
        # example_basic_recognition()
        example_with_error_handling()
        # asyncio.run(example_async_recognition())
        example_batch_recognition()
        example_integration_with_chat()
        
    except KeyboardInterrupt:
        print("\n用户中断执行")
    except Exception as e:
        print(f"\n执行示例时发生错误: {e}")


if __name__ == "__main__":
    main()
