# 数据库迁移指南

本项目使用 Alembic 进行数据库迁移管理。

## 安装依赖

```bash
pip install alembic==1.13.1
```

## 基本命令

### 1. 创建新的迁移

当模型发生变化时，需要创建新的迁移：

```bash
# 自动生成迁移文件
alembic revision --autogenerate -m "描述你的变更"

# 手动创建空的迁移文件
alembic revision -m "描述你的变更"
```

### 2. 应用迁移

```bash
# 升级到最新版本
alembic upgrade head

# 升级到指定版本
alembic upgrade <revision_id>

# 升级一个版本
alembic upgrade +1
```

### 3. 回滚迁移

```bash
# 回滚到上一个版本
alembic downgrade -1

# 回滚到指定版本
alembic downgrade <revision_id>

# 回滚到最初版本
alembic downgrade base
```

### 4. 查看迁移状态

```bash
# 查看当前迁移状态
alembic current

# 查看迁移历史
alembic history

# 查看迁移历史（详细）
alembic history --verbose
```

## 工作流程

### 开发新功能时

1. **修改模型**：在 `app/models/` 目录下修改或添加模型
2. **生成迁移**：`alembic revision --autogenerate -m "添加新功能"`
3. **检查迁移文件**：查看生成的迁移文件是否正确
4. **应用迁移**：`alembic upgrade head`
5. **测试功能**：运行测试确保功能正常

### 部署时

1. **备份数据库**（生产环境）
2. **应用迁移**：`alembic upgrade head`
3. **验证数据**：检查数据完整性

## 注意事项

1. **自动生成迁移**：使用 `--autogenerate` 时，确保所有模型都已导入到 `migrations/env.py` 中
2. **检查迁移文件**：自动生成的迁移文件可能需要手动调整，特别是复杂的数据变更
3. **测试迁移**：在生产环境应用迁移前，先在测试环境验证
4. **备份数据**：重要数据变更前务必备份数据库

## 常见问题

### Q: 迁移失败怎么办？
A: 检查迁移文件中的 SQL 语句，可能需要手动修复或回滚到上一个版本

### Q: 如何重置数据库？
A: 删除数据库文件，然后重新运行 `alembic upgrade head`

### Q: 如何添加新的模型？
A: 创建模型文件，导入到 `migrations/env.py`，然后生成新的迁移

## 文件结构

```
migrations/
├── versions/          # 迁移文件目录
│   ├── 81d3c1b87591_initial_migration.py
│   └── ...
├── env.py            # Alembic 环境配置
├── script.py.mako    # 迁移文件模板
└── README.md         # 本文档
```

## 配置说明

- **数据库 URL**：在 `alembic.ini` 中配置 `sqlalchemy.url`
- **模型导入**：在 `migrations/env.py` 中导入所有模型
- **目标元数据**：设置为 `Base.metadata` 