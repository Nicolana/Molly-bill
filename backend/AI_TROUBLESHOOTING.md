# AI服务故障排除指南

## 常见错误及解决方案

### 1. "name '账单数量' is not defined" 错误

**问题描述**: 在AI服务的prompt中使用了未定义的变量。

**解决方案**: 
- ✅ 已修复：移除了prompt中的`{账单数量}`变量引用
- 现在使用固定的消息格式

### 2. "'dict' object has no attribute 'dict'" 错误

**问题描述**: 在创建账单时，代码试图调用字典对象的dict()方法。

**解决方案**:
- ✅ 已修复：将字典转换为BillCreate对象
- 添加了默认日期字段
- 修复了所有相关接口的数据转换问题

### 3. DASHSCOPE_API_KEY 未设置

**问题描述**: AI服务无法正常工作，提示API密钥错误。

**解决方案**:
1. 复制 `.env.example` 为 `.env`:
   ```bash
   cp env.example .env
   ```

2. 编辑 `.env` 文件，设置有效的API密钥:
   ```env
   DASHSCOPE_API_KEY=your-actual-api-key-here
   ```

3. 重启后端服务:
   ```bash
   python main.py
   ```

### 4. 测试AI服务

运行测试脚本验证AI服务是否正常工作:

```bash
cd backend
python test_ai.py
```

### 5. 常见错误排查

#### 5.1 检查环境变量
```bash
echo $DASHSCOPE_API_KEY
```

#### 5.2 检查Python依赖
```bash
pip install -r requirements.txt
```

#### 5.3 检查网络连接
确保能够访问阿里百练API服务。

### 6. 日志调试

在 `ai_service.py` 中启用详细日志:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### 7. API响应格式

AI服务返回的标准格式:

```json
{
  "has_bill": true,
  "bills": [
    {
      "amount": 18,
      "description": "午餐",
      "category": "餐饮"
    }
  ],
  "message": "已识别到消费信息"
}
```

### 8. 错误处理

AI服务包含以下错误处理:
- API调用失败
- JSON解析错误
- 网络连接问题
- 无效输入

### 9. 性能优化

- 使用缓存减少重复API调用
- 批量处理多个请求
- 异步处理长时间运行的任务

## 联系支持

如果问题仍然存在，请检查:
1. API密钥是否有效
2. 网络连接是否正常
3. 依赖包是否正确安装
4. 环境变量是否正确设置 