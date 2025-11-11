#!/bin/bash

# ============================================
# 前端快速部署脚本
# ============================================
# 用途：构建前端并上传到EC2
# 使用场景：日常前端代码更新部署
# 前提条件：已运行过 setup-nginx.sh
# ============================================

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
EC2_HOST="35.182.43.233"
SSH_KEY="/Users/aisenyc/merchant-system/deployment/merchant-system-key.pem"
EC2_USER="ubuntu"
FRONTEND_DIR="/Users/aisenyc/merchant-system/merchant-admin"
DOMAIN="vamerchant.app"

# Function to print step header
print_step() {
    echo ""
    echo -e "${BLUE}==========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}==========================================${NC}"
    echo ""
}

# Function to print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Function to print info
print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Step 1: Build frontend locally
build_frontend() {
    print_step "步骤 1/3: 本地构建前端"

    cd "$FRONTEND_DIR"

    print_info "清理旧的构建文件..."
    rm -rf build/

    print_info "开始构建生产版本..."
    npm run build

    if [ $? -eq 0 ] && [ -f "build/index.html" ]; then
        print_success "前端构建成功"

        # 显示构建大小
        BUILD_SIZE=$(du -sh build/ | awk '{print $1}')
        print_info "构建大小: $BUILD_SIZE"

        # 显示主要文件
        echo ""
        echo "主要构建文件："
        ls -lh build/static/js/*.js 2>/dev/null | head -5
    else
        print_error "前端构建失败"
        exit 1
    fi
}

# Step 2: Upload frontend files
upload_frontend() {
    print_step "步骤 2/3: 上传前端文件到EC2"

    cd "$FRONTEND_DIR"

    # 检查nginx目录是否存在
    print_info "检查EC2环境..."
    NGINX_DIR_EXISTS=$(ssh -i "$SSH_KEY" ${EC2_USER}@${EC2_HOST} "[ -d /var/www/merchant-admin ] && echo 'yes' || echo 'no'")

    if [ "$NGINX_DIR_EXISTS" = "no" ]; then
        print_error "EC2上未找到 /var/www/merchant-admin 目录"
        print_warning "请先运行 ./setup-nginx.sh 初始化Nginx配置"
        exit 1
    fi

    # 创建临时目录
    print_info "准备上传..."
    ssh -i "$SSH_KEY" ${EC2_USER}@${EC2_HOST} "rm -rf /tmp/frontend && mkdir -p /tmp/frontend"

    # 上传build目录
    print_info "上传前端文件（这可能需要几秒钟）..."
    scp -i "$SSH_KEY" -r build/* ${EC2_USER}@${EC2_HOST}:/tmp/frontend/

    if [ $? -eq 0 ]; then
        print_success "文件上传成功"
    else
        print_error "文件上传失败"
        exit 1
    fi

    # 移动到nginx目录（原子操作）
    print_info "部署新版本..."
    ssh -i "$SSH_KEY" ${EC2_USER}@${EC2_HOST} "
        sudo rm -rf /var/www/merchant-admin.old && \
        sudo mv /var/www/merchant-admin /var/www/merchant-admin.old && \
        sudo mv /tmp/frontend /var/www/merchant-admin && \
        sudo chown -R www-data:www-data /var/www/merchant-admin && \
        sudo chmod -R 755 /var/www/merchant-admin
    "

    if [ $? -eq 0 ]; then
        print_success "新版本部署成功"
        print_info "旧版本已备份到 /var/www/merchant-admin.old"
    else
        print_error "部署失败"
        # 尝试回滚
        print_warning "尝试回滚到旧版本..."
        ssh -i "$SSH_KEY" ${EC2_USER}@${EC2_HOST} "
            sudo rm -rf /var/www/merchant-admin && \
            sudo mv /var/www/merchant-admin.old /var/www/merchant-admin
        "
        exit 1
    fi
}

# Step 3: Reload Nginx and verify
reload_and_verify() {
    print_step "步骤 3/3: 重载Nginx并验证"

    # 测试nginx配置
    print_info "测试Nginx配置..."
    ssh -i "$SSH_KEY" ${EC2_USER}@${EC2_HOST} "sudo nginx -t" 2>&1

    if [ $? -eq 0 ]; then
        print_success "Nginx配置正确"
    else
        print_error "Nginx配置错误"
        exit 1
    fi

    # 重载nginx
    print_info "重载Nginx..."
    ssh -i "$SSH_KEY" ${EC2_USER}@${EC2_HOST} "sudo systemctl reload nginx"

    if [ $? -eq 0 ]; then
        print_success "Nginx已重载"
    else
        print_error "Nginx重载失败"
        exit 1
    fi

    # 验证部署
    echo ""
    print_info "验证部署..."

    # 测试HTTP访问
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://${EC2_HOST} 2>/dev/null)
    if [ "$HTTP_CODE" = "200" ]; then
        print_success "HTTP访问正常 (${HTTP_CODE})"
    else
        print_warning "HTTP访问返回 ${HTTP_CODE}"
    fi

    # 检查index.html
    INDEX_EXISTS=$(ssh -i "$SSH_KEY" ${EC2_USER}@${EC2_HOST} "[ -f /var/www/merchant-admin/index.html ] && echo 'yes' || echo 'no'")
    if [ "$INDEX_EXISTS" = "yes" ]; then
        print_success "index.html 已部署"
    else
        print_error "index.html 未找到"
    fi

    # 显示部署时间
    DEPLOY_TIME=$(ssh -i "$SSH_KEY" ${EC2_USER}@${EC2_HOST} "stat -c '%y' /var/www/merchant-admin/index.html 2>/dev/null" | cut -d'.' -f1)
    if [ -n "$DEPLOY_TIME" ]; then
        print_info "部署时间: $DEPLOY_TIME"
    fi
}

# Show deployment info
show_deployment_info() {
    echo ""
    echo -e "${BLUE}==========================================${NC}"
    echo -e "${GREEN}✓ 前端部署成功！${NC}"
    echo -e "${BLUE}==========================================${NC}"
    echo ""
    echo "访问地址:"
    echo -e "${BLUE}  IP访问:   http://${EC2_HOST}${NC}"
    echo -e "${BLUE}  域名访问: http://${DOMAIN}${NC}"
    echo -e "${BLUE}  HTTPS:    https://${DOMAIN}${NC} (Cloudflare)"
    echo ""
    echo "部署信息:"
    BUILD_SIZE=$(du -sh "$FRONTEND_DIR/build/" 2>/dev/null | awk '{print $1}')
    echo "  构建大小: $BUILD_SIZE"
    echo "  部署位置: /var/www/merchant-admin"
    echo "  备份位置: /var/www/merchant-admin.old"
    echo ""
    echo "常用命令:"
    echo "  # 查看访问日志"
    echo "  ssh -i $SSH_KEY ${EC2_USER}@${EC2_HOST} 'sudo tail -f /var/log/nginx/merchant-admin.access.log'"
    echo ""
    echo "  # 查看错误日志"
    echo "  ssh -i $SSH_KEY ${EC2_USER}@${EC2_HOST} 'sudo tail -f /var/log/nginx/merchant-admin.error.log'"
    echo ""
    echo "  # 回滚到上一版本"
    echo "  ssh -i $SSH_KEY ${EC2_USER}@${EC2_HOST} 'sudo rm -rf /var/www/merchant-admin && sudo mv /var/www/merchant-admin.old /var/www/merchant-admin && sudo systemctl reload nginx'"
    echo ""
}

# Main deployment function
deploy() {
    echo -e "${BLUE}==========================================${NC}"
    echo -e "${BLUE}        前端快速部署${NC}"
    echo -e "${BLUE}==========================================${NC}"
    echo ""
    echo "EC2地址: ${EC2_HOST}"
    echo "前端目录: ${FRONTEND_DIR}"
    echo ""

    # 检查是否需要确认
    if [ "$1" != "--yes" ] && [ "$1" != "-y" ]; then
        read -p "确认开始部署? (y/n): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "部署已取消"
            exit 0
        fi
    fi

    # 记录开始时间
    START_TIME=$(date +%s)

    build_frontend
    upload_frontend
    reload_and_verify

    # 计算耗时
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))

    show_deployment_info

    echo "部署耗时: ${DURATION}秒"
    echo ""
}

# Main script entry
deploy "$@"

exit 0
