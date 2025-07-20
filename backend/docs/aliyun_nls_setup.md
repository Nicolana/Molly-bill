# 阿里云NLS语音识别服务配置指南

本文档介绍如何配置和使用阿里云NLS（Natural Language Service）语音识别服务。

## 1. 服务概述

阿里云NLS语音识别服务是阿里云提供的智能语音识别服务，支持：
- 实时语音识别
- 录音文件识别
- 多种音频格式支持
- 高精度中文识别
- 标点符号预测
- 数字格式化

## 2. 获取API密钥

### 2.1 注册阿里云账号
1. 访问 [阿里云官网](https://www.aliyun.com/)
2. 注册并完成实名认证

### 2.2 开通NLS服务
1. 访问 [智能语音交互控制台](https://nls-portal.console.aliyun.com/)
2. 开通智能语音交互服务
3. 选择合适的计费方式（按量付费或资源包）

### 2.3 创建项目和获取密钥
1. 在控制台中创建新项目
2. 记录项目的 `AppKey`
3. 生成访问令牌 `Token`

## 3. 环境配置

### 3.1 设置环境变量
在 `.env` 文件中添加以下配置：

```bash
# 阿里云NLS语音识别配置
ALIYUN_NLS_APP_KEY=your-app-key-here
ALIYUN_NLS_TOKEN=your-token-here
ALIYUN_NLS_HOST=nls-gateway-cn-shanghai.aliyuncs.com
```

### 3.2 配置说明
- `ALIYUN_NLS_APP_KEY`: 项目的AppKey
- `ALIYUN_NLS_TOKEN`: 访问令牌
- `ALIYUN_NLS_HOST`: NLS服务网关地址（可选，默认为上海区域）

## 4. 支持的音频格式

### 4.1 音频格式要求
- **格式**: PCM, WAV, MP3, AAC, OPUS, SPEEX, AMR
- **采样率**: 8000Hz, 16000Hz（推荐16000Hz）
- **声道**: 单声道（推荐）
- **位深**: 16位
- **文件大小**: 最大10MB

### 4.2 推荐配置
```
格式: WAV
采样率: 16000Hz
声道: 单声道
位深: 16位
```

## 5. API参数说明

### 5.1 请求参数
- `appkey`: 项目AppKey
- `format`: 音频格式（pcm, wav, mp3等）
- `sample_rate`: 采样率（8000或16000）
- `enable_punctuation_prediction`: 是否启用标点符号预测（true/false）
- `enable_inverse_text_normalization`: 是否启用数字格式化（true/false）
- `enable_voice_detection`: 是否启用语音检测（true/false）

### 5.2 响应格式
```json
{
  "status": 20000000,
  "message": "SUCCESS",
  "result": "识别出的文本内容"
}
```

## 6. 测试服务

### 6.1 运行测试脚本
```bash
cd backend
python test_nls_service.py
```

### 6.2 使用自定义音频测试
```bash
python test_nls_service.py /path/to/your/audio.wav
```

## 7. 错误处理

### 7.1 常见错误码
- `20000000`: 成功
- `40000000`: 客户端错误
- `50000000`: 服务端错误

### 7.2 常见问题
1. **Token过期**: 重新生成访问令牌
2. **AppKey无效**: 检查AppKey是否正确
3. **音频格式不支持**: 转换为支持的格式
4. **网络连接问题**: 检查网络和防火墙设置

## 8. 性能优化

### 8.1 音频预处理
- 降噪处理
- 音量标准化
- 格式转换

### 8.2 请求优化
- 合理设置超时时间
- 实现重试机制
- 缓存Token

## 9. 计费说明

### 9.1 计费方式
- 按识别时长计费
- 支持预付费资源包
- 提供免费额度

### 9.2 成本控制
- 监控使用量
- 设置预算告警
- 优化音频质量

## 10. 安全建议

### 10.1 密钥管理
- 定期更换Token
- 不要在代码中硬编码密钥
- 使用环境变量存储敏感信息

### 10.2 访问控制
- 限制API访问来源
- 监控异常访问
- 设置访问频率限制

## 11. 迁移说明

从DashScope语音识别迁移到NLS服务的主要变化：
1. API接口不同
2. 参数格式不同
3. 响应格式不同
4. 需要单独的AppKey和Token

## 12. 技术支持

如遇到问题，可以：
1. 查看阿里云NLS官方文档
2. 提交工单获取技术支持
3. 参考社区讨论

---

更多详细信息请参考：
- [阿里云NLS官方文档](https://help.aliyun.com/product/30413.html)
- [API参考手册](https://help.aliyun.com/document_detail/84428.html)
