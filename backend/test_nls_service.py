#!/usr/bin/env python3
# -*- coding: UTF-8 -*-
"""
阿里云NLS语音识别服务测试脚本

使用方法：
1. 确保已配置环境变量：ALIYUN_NLS_APP_KEY 和 ALIYUN_NLS_TOKEN
2. 准备一个测试音频文件（WAV格式，16kHz采样率）
3. 运行脚本：python test_nls_service.py [音频文件路径]

如果没有提供音频文件路径，脚本将创建一个简单的测试音频文件。
"""

import os
import sys
import base64
import tempfile
import wave
import struct
import math
from app.services.ai.aliyun_nls_service import aliyun_nls_service


def create_test_audio(duration=2, sample_rate=16000, frequency=440):
    """
    创建一个简单的测试音频文件（正弦波）
    
    Args:
        duration: 音频时长（秒）
        sample_rate: 采样率
        frequency: 频率（Hz）
    
    Returns:
        str: 临时音频文件路径
    """
    # 创建临时文件
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
    temp_file.close()
    
    # 生成正弦波数据
    frames = []
    for i in range(int(duration * sample_rate)):
        # 生成正弦波样本
        sample = int(32767 * math.sin(2 * math.pi * frequency * i / sample_rate))
        frames.append(struct.pack('<h', sample))
    
    # 写入WAV文件
    with wave.open(temp_file.name, 'wb') as wav_file:
        wav_file.setnchannels(1)  # 单声道
        wav_file.setsampwidth(2)  # 16位
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(b''.join(frames))
    
    return temp_file.name


def audio_file_to_base64(file_path):
    """
    将音频文件转换为base64编码
    
    Args:
        file_path: 音频文件路径
    
    Returns:
        str: base64编码的音频数据
    """
    with open(file_path, 'rb') as f:
        audio_data = f.read()
    return base64.b64encode(audio_data).decode('utf-8')


def test_nls_service(audio_file_path=None):
    """
    测试阿里云NLS语音识别服务
    
    Args:
        audio_file_path: 音频文件路径，如果为None则创建测试音频
    """
    print("=" * 50)
    print("阿里云NLS语音识别服务测试")
    print("=" * 50)
    
    # 检查配置
    print("1. 检查配置...")
    if not aliyun_nls_service.app_key:
        print("❌ 错误：未配置 ALIYUN_NLS_APP_KEY")
        print("请在环境变量中设置 ALIYUN_NLS_APP_KEY")
        return False
    
    if not aliyun_nls_service.token:
        print("❌ 错误：未配置 ALIYUN_NLS_TOKEN")
        print("请在环境变量中设置 ALIYUN_NLS_TOKEN")
        return False
    
    print(f"✅ APP_KEY: {aliyun_nls_service.app_key[:10]}...")
    print(f"✅ TOKEN: {aliyun_nls_service.token[:10]}...")
    print(f"✅ HOST: {aliyun_nls_service.host}")
    
    # 准备音频文件
    print("\n2. 准备音频文件...")
    temp_audio_created = False
    
    if audio_file_path is None:
        print("未提供音频文件，创建测试音频...")
        audio_file_path = create_test_audio()
        temp_audio_created = True
        print(f"✅ 创建测试音频文件: {audio_file_path}")
    else:
        if not os.path.exists(audio_file_path):
            print(f"❌ 错误：音频文件不存在: {audio_file_path}")
            return False
        print(f"✅ 使用音频文件: {audio_file_path}")
    
    try:
        # 转换为base64
        print("\n3. 转换音频为base64...")
        audio_base64 = audio_file_to_base64(audio_file_path)
        print(f"✅ 音频数据大小: {len(audio_base64)} 字符")
        
        # 调用语音识别服务
        print("\n4. 调用语音识别服务...")
        print("正在识别，请稍候...")
        
        result = aliyun_nls_service.recognize_voice(audio_base64)
        
        # 显示结果
        print("\n5. 识别结果:")
        print("-" * 30)
        print(f"成功: {result.get('success', False)}")
        print(f"文本: {result.get('text', '')}")
        print(f"置信度: {result.get('confidence', 'N/A')}")
        print(f"消息: {result.get('message', '')}")
        
        if result.get('success'):
            print("\n✅ 语音识别测试成功！")
            return True
        else:
            print("\n❌ 语音识别测试失败！")
            return False
            
    except Exception as e:
        print(f"\n❌ 测试过程中发生错误: {e}")
        return False
        
    finally:
        # 清理临时文件
        if temp_audio_created and os.path.exists(audio_file_path):
            os.remove(audio_file_path)
            print(f"🗑️ 清理临时文件: {audio_file_path}")


def main():
    """主函数"""
    audio_file = None
    
    # 检查命令行参数
    if len(sys.argv) > 1:
        audio_file = sys.argv[1]
        print(f"使用指定的音频文件: {audio_file}")
    else:
        print("未指定音频文件，将创建测试音频")
    
    # 运行测试
    success = test_nls_service(audio_file)
    
    if success:
        print("\n🎉 所有测试通过！阿里云NLS服务配置正确。")
        sys.exit(0)
    else:
        print("\n💥 测试失败！请检查配置和网络连接。")
        sys.exit(1)


if __name__ == "__main__":
    main()
