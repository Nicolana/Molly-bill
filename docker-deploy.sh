#!/bin/bash

# Molly Bill Docker部署脚本
# 用于快速部署和管理Docker容器

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查Docker是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi
}

# 检查环境文件
check_env_file() {
    if [ ! -f "docker.env" ]; then
        log_warning "docker.env文件不存在，正在创建..."
        cp env.example docker.env
        log_info "请编辑docker.env文件配置环境变量"
        read -p "是否现在编辑配置文件？(y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            ${EDITOR:-nano} docker.env
        fi
    fi
}

# 构建镜像
build_images() {
    log_info "开始构建Docker镜像..."
    docker-compose --env-file docker.env build
    log_success "镜像构建完成"
}

# 启动服务
start_services() {
    log_info "启动Docker服务..."
    docker-compose --env-file docker.env up -d
    log_success "服务启动完成"
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 10
    
    # 检查服务状态
    check_services
}

# 停止服务
stop_services() {
    log_info "停止Docker服务..."
    docker-compose --env-file docker.env down
    log_success "服务已停止"
}

# 重启服务
restart_services() {
    log_info "重启Docker服务..."
    docker-compose --env-file docker.env restart
    log_success "服务重启完成"
}

# 查看日志
view_logs() {
    if [ -z "$1" ]; then
        docker-compose --env-file docker.env logs -f
    else
        docker-compose --env-file docker.env logs -f "$1"
    fi
}

# 检查服务状态
check_services() {
    log_info "检查服务状态..."
    docker-compose --env-file docker.env ps
    
    # 检查健康状态
    log_info "检查健康状态..."
    
    # 检查后端
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        log_success "后端服务正常"
    else
        log_error "后端服务异常"
    fi
    
    # 检查前端
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        log_success "前端服务正常"
    else
        log_error "前端服务异常"
    fi
    
    # 检查数据库
    if docker-compose --env-file docker.env exec postgres pg_isready > /dev/null 2>&1; then
        log_success "数据库服务正常"
    else
        log_error "数据库服务异常"
    fi
}

# 初始化数据库
init_database() {
    log_info "初始化数据库..."
    docker-compose --env-file docker.env exec backend python -c "
from app.db.database import engine
from app.models import Base
Base.metadata.create_all(bind=engine)
print('数据库初始化完成')
"
    log_success "数据库初始化完成"
}

# 清理数据
cleanup() {
    log_warning "这将删除所有容器和数据，确定要继续吗？"
    read -p "输入 'yes' 确认: " -r
    if [[ $REPLY == "yes" ]]; then
        log_info "清理Docker资源..."
        docker-compose --env-file docker.env down -v --remove-orphans
        docker system prune -f
        log_success "清理完成"
    else
        log_info "取消清理操作"
    fi
}

# 显示帮助信息
show_help() {
    echo "Molly Bill Docker部署脚本"
    echo ""
    echo "用法: $0 [命令]"
    echo ""
    echo "命令:"
    echo "  build     构建Docker镜像"
    echo "  start     启动所有服务"
    echo "  stop      停止所有服务"
    echo "  restart   重启所有服务"
    echo "  status    查看服务状态"
    echo "  logs      查看日志 (可选服务名)"
    echo "  init-db   初始化数据库"
    echo "  cleanup   清理所有数据"
    echo "  help      显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 start              # 启动所有服务"
    echo "  $0 logs backend       # 查看后端日志"
    echo "  $0 status             # 查看服务状态"
}

# 主函数
main() {
    check_docker
    check_env_file
    
    case "${1:-help}" in
        "build")
            build_images
            ;;
        "start")
            build_images
            start_services
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            restart_services
            ;;
        "status")
            check_services
            ;;
        "logs")
            view_logs "$2"
            ;;
        "init-db")
            init_database
            ;;
        "cleanup")
            cleanup
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# 执行主函数
main "$@" 