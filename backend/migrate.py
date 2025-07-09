#!/usr/bin/env python3
"""
数据库迁移脚本
用于创建或更新数据库表结构
"""

from database import engine
from models import Base
import sqlite3
import os

def migrate_database():
    """执行数据库迁移"""
    print("🔄 开始数据库迁移...")
    
    # 删除现有数据库文件（如果存在）
    db_file = "test.db"
    if os.path.exists(db_file):
        print(f"🗑️  删除现有数据库文件: {db_file}")
        os.remove(db_file)
    
    # 创建所有表
    print("📋 创建数据库表...")
    Base.metadata.create_all(bind=engine)
    
    # 验证表是否创建成功
    try:
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()
        
        # 获取所有表名
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        print("✅ 数据库表创建成功:")
        for table in tables:
            print(f"   - {table[0]}")
        
        # 检查特定表的结构
        expected_tables = ['users', 'bills', 'chat_messages']
        for table_name in expected_tables:
            cursor.execute(f"PRAGMA table_info({table_name});")
            columns = cursor.fetchall()
            print(f"\n📊 {table_name} 表结构:")
            for col in columns:
                print(f"   - {col[1]} ({col[2]})")
        
        conn.close()
        print("\n🎉 数据库迁移完成！")
        
    except Exception as e:
        print(f"❌ 数据库迁移失败: {e}")
        raise

if __name__ == "__main__":
    migrate_database() 