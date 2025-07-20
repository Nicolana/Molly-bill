# -*- coding: UTF-8 -*-
import http.client
import json
import base64
import tempfile
import os
from typing import Dict, Any
from pydub import AudioSegment
from app.core.config.settings import settings


class AliyunNLSService:
    """阿里云NLS语音识别服务"""
    
    def __init__(self):
        self.app_key = settings.aliyun_nls_app_key
        self.token = settings.aliyun_nls_token
        self.host = settings.aliyun_nls_host
        self.url = f'https://{self.host}/stream/v1/asr'
        
    def recognize_voice(self, audio_data: str) -> Dict[str, Any]:
        """
        使用阿里云NLS服务进行语音识别
        
        Args:
            audio_data: base64编码的音频数据
            
        Returns:
            Dict包含识别结果
        """
        try:
            # 检查必要的配置
            if not self.app_key or not self.token:
                return {
                    "success": False,
                    "text": "",
                    "message": "阿里云NLS服务配置不完整，请检查APP_KEY和TOKEN"
                }
            
            # 解码base64音频数据
            audio_bytes = base64.b64decode(audio_data)

            # 转换音频格式为PCM WAV
            converted_audio_path = self._convert_audio_to_pcm(audio_bytes)
            
            try:
                # 调用阿里云NLS API
                result = self._process_audio(converted_audio_path)
                return result
            finally:
                # 清理临时文件
                if os.path.exists(converted_audio_path):
                    os.remove(converted_audio_path)
                    
        except Exception as e:
            print(f"语音识别错误: {e}")
            return {
                "success": False,
                "text": "",
                "message": f"语音识别服务异常: {str(e)}"
            }

    def _convert_audio_to_pcm(self, audio_bytes: bytes) -> str:
        """
        将音频数据转换为WAV格式

        Args:
            audio_bytes: 原始音频数据

        Returns:
            str: 转换后的WAV文件路径
        """
        try:
            # 创建临时文件保存原始音频
            with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as temp_input:
                temp_input.write(audio_bytes)
                temp_input_path = temp_input.name

            # 创建输出文件路径
            temp_output_path = temp_input_path.replace('.webm', '_converted.wav')

            try:
                # 使用pydub加载音频（自动检测格式）
                audio = AudioSegment.from_file(temp_input_path)

                # 转换为16kHz单声道PCM WAV
                audio = audio.set_frame_rate(16000).set_channels(1)

                # 导出为WAV格式
                audio.export(temp_output_path, format="wav")
                with open('test_audio.wav', 'wb') as f:
                    f.write(audio.export(format="wav").read())

                print(f"音频转换成功: {temp_input_path} -> {temp_output_path}")
                print(f"转换后音频信息: 采样率={audio.frame_rate}Hz, 声道数={audio.channels}, 时长={len(audio)}ms")

                return temp_output_path

            finally:
                # 清理输入临时文件
                if os.path.exists(temp_input_path):
                    os.remove(temp_input_path)

        except Exception as e:
            print(f"音频转换失败: {e}")
            # 如果转换失败，尝试直接保存为WAV文件
            with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
                temp_file.write(audio_bytes)
                return temp_file.name

    def _process_audio(self, audio_file_path: str) -> Dict[str, Any]:
        """
        处理音频文件，调用阿里云NLS API
        
        Args:
            audio_file_path: 音频文件路径
            
        Returns:
            Dict包含识别结果
        """
        try:
            # 读取音频文件
            with open(audio_file_path, mode='rb') as f:
                audio_content = f.read()
            
            # 构建请求URL和参数
            request_url = self._build_request_url()
            
            # 设置HTTPS请求头部
            http_headers = {
                'X-NLS-Token': self.token,
                'Content-type': 'application/octet-stream',
                'Content-Length': str(len(audio_content))
            }
            
            # 创建HTTPS连接
            conn = http.client.HTTPSConnection(self.host)
            
            # 发送POST请求
            conn.request(
                method='POST',
                url=request_url, 
                body=audio_content, 
                headers=http_headers
            )
            
            # 获取响应
            response = conn.getresponse()
            print(f'Response status: {response.status}, reason: {response.reason}')
            
            # 读取响应内容
            body = response.read()
            conn.close()
            
            # 解析响应
            return self._parse_response(response.status, body)
            
        except Exception as e:
            print(f"处理音频文件错误: {e}")
            return {
                "success": False,
                "text": "",
                "message": f"音频处理失败: {str(e)}"
            }
    
    def _build_request_url(self) -> str:
        """构建请求URL"""
        # 基础参数
        params = {
            'appkey': self.app_key,
            'format': 'WAV',
            'sample_rate': '16000',
            'enable_punctuation_prediction': 'true',
            'enable_inverse_text_normalization': 'true',
            'enable_voice_detection': 'false'
        }
        
        # 构建查询字符串
        query_string = '&'.join([f'{key}={value}' for key, value in params.items()])
        request_url = f'/stream/v1/asr?{query_string}'
        
        print(f'Request URL: {request_url}')
        return request_url
    
    def _parse_response(self, status_code: int, body: bytes) -> Dict[str, Any]:
        """解析API响应"""
        try:
            if status_code == 200:
                # 解析JSON响应
                response_data = json.loads(body.decode('utf-8'))
                print(f'Recognize response: {response_data}')
                
                status = response_data.get('status')
                if status == 20000000:  # 成功状态码
                    result_text = response_data.get('result', '')
                    print(f'Recognize result: {result_text}')
                    
                    return {
                        "success": True,
                        "text": result_text,
                        "confidence": 0.9,  # NLS API通常不返回置信度，使用默认值
                        "message": "语音识别成功"
                    }
                else:
                    error_message = response_data.get('message', '识别失败')
                    print(f'Recognition failed with status: {status}, message: {error_message}')
                    
                    return {
                        "success": False,
                        "text": "",
                        "message": f"语音识别失败: {error_message}"
                    }
            else:
                print(f'HTTP error: {status_code}')
                return {
                    "success": False,
                    "text": "",
                    "message": f"HTTP请求失败，状态码: {status_code}"
                }
                
        except json.JSONDecodeError as e:
            print(f'JSON解析错误: {e}')
            print(f'Response body: {body.decode("utf-8", errors="ignore")}')
            return {
                "success": False,
                "text": "",
                "message": "响应格式错误，无法解析JSON"
            }
        except Exception as e:
            print(f'响应解析错误: {e}')
            return {
                "success": False,
                "text": "",
                "message": f"响应解析失败: {str(e)}"
            }


# 创建全局NLS服务实例
aliyun_nls_service = AliyunNLSService()
