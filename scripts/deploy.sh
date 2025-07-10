#!/bin/bash

# Molly Bill Docker 部署脚本

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

# 检查 Docker 是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    log_success "Docker 环境检查通过"
}

# 检查环境变量文件
check_env() {
    if [ ! -f ".env" ]; then
        log_warning ".env 文件不存在，正在创建..."
        if [ -f "env.example" ]; then
            cp env.example .env
            log_info "已从 env.example 创建 .env 文件"
            log_warning "请编辑 .env 文件配置必要的环境变量"
        else
            log_error "env.example 文件不存在"
            exit 1
        fi
    else
        log_success ".env 文件已存在"
    fi
}

# 停止现有服务
stop_services() {
    log_info "停止现有服务..."
    docker-compose down --remove-orphans
    log_success "服务已停止"
}

# 清理资源
cleanup() {
    log_info "清理 Docker 资源..."
    docker system prune -f
    log_success "资源清理完成"
}

# 构建镜像
build_images() {
    log_info "构建 Docker 镜像..."
    docker-compose build --no-cache
    log_success "镜像构建完成"
}

# 启动服务
start_services() {
    log_info "启动服务..."
    docker-compose up -d
    log_success "服务启动完成"
}

# 检查服务状态
check_services() {
    log_info "检查服务状态..."
    sleep 10
    
    # 检查容器状态
    if docker-compose ps | grep -q "Up"; then
        log_success "所有服务运行正常"
    else
        log_error "部分服务启动失败"
        docker-compose ps
        exit 1
    fi
    
    # 检查健康状态
    log_info "检查服务健康状态..."
    
    # 检查后端健康状态
    if curl -f http://localhost:8000/health &> /dev/null; then
        log_success "后端服务健康检查通过"
    else
        log_warning "后端服务健康检查失败"
    fi
    
    # 检查前端访问
    if curl -f http://localhost:3000 &> /dev/null; then
        log_success "前端服务访问正常"
    else
        log_warning "前端服务访问失败"
    fi
}

# 显示服务信息
show_info() {
    log_info "服务信息："
    echo "=================================="
    echo "前端地址: http://localhost:3000"
    echo "后端地址: http://localhost:8000"
    echo "数据库地址: localhost:5432"
    echo "=================================="
    
    log_info "查看服务状态："
    docker-compose ps
    
    log_info "查看服务日志："
    echo "docker-compose logs -f"
}

# 生产环境部署
deploy_prod() {
    log_info "开始生产环境部署..."
    
    # 检查 SSL 证书
    if [ ! -d "ssl" ]; then
        log_warning "SSL 证书目录不存在，创建中..."
        mkdir -p ssl
        log_warning "请将 SSL 证书文件放入 ssl 目录"
        log_warning "需要文件：ssl/cert.pem 和 ssl/key.pem"
    fi
    
    # 停止现有服务
    docker-compose -f docker-compose.prod.yml down --remove-orphans
    
    # 构建生产镜像
    log_info "构建生产环境镜像..."
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    # 启动生产服务
    log_info "启动生产环境服务..."
    docker-compose -f docker-compose.prod.yml up -d
    
    log_success "生产环境部署完成"
    log_info "服务信息："
    echo "=================================="
    echo "前端地址: https://your-domain.com"
    echo "后端地址: https://your-domain.com/api/"
    echo "=================================="
}

# 备份数据库
backup_db() {
    log_info "备份数据库..."
    timestamp=$(date +%Y%m%d_%H%M%S)
    backup_file="backup_${timestamp}.sql"
    
    docker-compose exec -T postgres pg_dump -U molly_user molly_bill > "backups/${backup_file}"
    
    if [ $? -eq 0 ]; then
        log_success "数据库备份完成: backups/${backup_file}"
    else
        log_error "数据库备份失败"
        exit 1
    fi
}

# 恢复数据库
restore_db() {
    if [ -z "$1" ]; then
        log_error "请指定备份文件路径"
        echo "用法: $0 restore <backup_file>"
        exit 1
    fi
    
    log_info "恢复数据库..."
    docker-compose exec -T postgres psql -U molly_user molly_bill < "$1"
    
    if [ $? -eq 0 ]; then
        log_success "数据库恢复完成"
    else
        log_error "数据库恢复失败"
        exit 1
    fi
}

# 主函数
main() {
    case "${1:-dev}" in
        "dev")
            log_info "开始开发环境部署..."
            check_docker
            check_env
            stop_services
            cleanup
            build_images
            start_services
            check_services
            show_info
            ;;
        "prod")
            deploy_prod
            ;;
        "stop")
            log_info "停止服务..."
            docker-compose down
            log_success "服务已停止"
            ;;
        "restart")
            log_info "重启服务..."
            docker-compose restart
            log_success "服务已重启"
            ;;
        "logs")
            log_info "查看服务日志..."
            docker-compose logs -f
            ;;
        "backup")
            mkdir -p backups
            backup_db
            ;;
        "restore")
            restore_db "$2"
            ;;
        "clean")
            log_info "清理所有资源..."
            docker-compose down --rmi all -v
            docker system prune -af
            log_success "清理完成"
            ;;
        *)
            echo "用法: $0 {dev|prod|stop|restart|logs|backup|restore|clean}"
            echo ""
            echo "命令说明："
            echo "  dev     - 部署开发环境"
            echo "  prod    - 部署生产环境"
            echo "  stop    - 停止服务"
            echo "  restart - 重启服务"
            echo "  logs    - 查看日志"
            echo "  backup  - 备份数据库"
            echo "  restore - 恢复数据库"
            echo "  clean   - 清理所有资源"
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@" 