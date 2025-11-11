#!/bin/bash

# ============================================
# Nginx完整配置脚本 - HTTP + HTTPS
# ============================================
# 用途：在EC2上安装并配置Nginx（支持HTTP和HTTPS）
# 使用场景：首次部署或需要重新配置Nginx时运行
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
DOMAIN="vamerchant.app"
WWW_DOMAIN="www.vamerchant.app"
SECURITY_GROUP_ID="sg-0533a65edf91ffd93"
REGION="ca-central-1"

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

# Step 1: Install nginx on EC2
install_nginx() {
    print_step "步骤 1/5: 在EC2上安装Nginx"

    print_info "检查Nginx是否已安装..."
    NGINX_INSTALLED=$(ssh -i "$SSH_KEY" ${EC2_USER}@${EC2_HOST} "which nginx" 2>/dev/null)

    if [ -n "$NGINX_INSTALLED" ]; then
        print_success "Nginx已安装: $NGINX_INSTALLED"

        # 检查版本
        NGINX_VERSION=$(ssh -i "$SSH_KEY" ${EC2_USER}@${EC2_HOST} "nginx -v 2>&1")
        print_info "版本: $NGINX_VERSION"
    else
        print_info "安装Nginx..."
        ssh -i "$SSH_KEY" ${EC2_USER}@${EC2_HOST} "sudo apt update && sudo apt install -y nginx"

        if [ $? -eq 0 ]; then
            print_success "Nginx安装成功"
        else
            print_error "Nginx安装失败"
            exit 1
        fi
    fi

    # 启动并启用nginx
    print_info "启动Nginx服务..."
    ssh -i "$SSH_KEY" ${EC2_USER}@${EC2_HOST} "sudo systemctl start nginx && sudo systemctl enable nginx"

    print_success "Nginx服务已启动并设置为开机自启"
}

# Step 2: Open ports in security group
open_ports() {
    print_step "步骤 2/5: 配置EC2安全组"

    # 检查80端口
    print_info "检查80端口状态..."
    PORT_80_OPEN=$(aws ec2 describe-security-groups \
        --group-ids $SECURITY_GROUP_ID \
        --region $REGION \
        --query 'SecurityGroups[0].IpPermissions[?FromPort==`80`]' \
        --output json)

    if [ "$PORT_80_OPEN" = "[]" ]; then
        print_info "80端口未开放，正在添加规则..."
        aws ec2 authorize-security-group-ingress \
            --group-id $SECURITY_GROUP_ID \
            --protocol tcp \
            --port 80 \
            --cidr 0.0.0.0/0 \
            --region $REGION > /dev/null 2>&1
        print_success "80端口已开放"
    else
        print_success "80端口已开放"
    fi

    # 检查443端口
    print_info "检查443端口状态..."
    PORT_443_OPEN=$(aws ec2 describe-security-groups \
        --group-ids $SECURITY_GROUP_ID \
        --region $REGION \
        --query 'SecurityGroups[0].IpPermissions[?FromPort==`443`]' \
        --output json)

    if [ "$PORT_443_OPEN" = "[]" ]; then
        print_info "443端口未开放，正在添加规则..."
        aws ec2 authorize-security-group-ingress \
            --group-id $SECURITY_GROUP_ID \
            --protocol tcp \
            --port 443 \
            --cidr 0.0.0.0/0 \
            --region $REGION > /dev/null 2>&1
        print_success "443端口已开放"
    else
        print_success "443端口已开放"
    fi
}

# Step 3: Generate SSL certificate
generate_ssl_cert() {
    print_step "步骤 3/5: 生成SSL证书"

    print_info "创建证书目录..."
    ssh -i "$SSH_KEY" ${EC2_USER}@${EC2_HOST} "sudo mkdir -p /etc/nginx/ssl"

    print_info "生成自签名SSL证书（10年有效期）..."
    ssh -i "$SSH_KEY" ${EC2_USER}@${EC2_HOST} "
        sudo openssl req -x509 -nodes -days 3650 \
            -newkey rsa:2048 \
            -keyout /etc/nginx/ssl/self-signed.key \
            -out /etc/nginx/ssl/self-signed.crt \
            -subj '/C=CA/ST=Ontario/L=Toronto/O=MerchantSystem/CN=vamerchant.app' \
            -addext 'subjectAltName=DNS:vamerchant.app,DNS:www.vamerchant.app,DNS:*.vamerchant.app,IP:35.182.43.233' \
            2>/dev/null
    " 2>/dev/null

    if [ $? -eq 0 ]; then
        print_success "SSL证书生成成功"
    else
        print_error "SSL证书生成失败"
        exit 1
    fi

    # 设置权限
    print_info "设置证书权限..."
    ssh -i "$SSH_KEY" ${EC2_USER}@${EC2_HOST} "
        sudo chmod 644 /etc/nginx/ssl/self-signed.crt && \
        sudo chmod 600 /etc/nginx/ssl/self-signed.key
    "

    print_success "证书权限已设置"

    # 显示证书信息
    print_info "证书有效期："
    ssh -i "$SSH_KEY" ${EC2_USER}@${EC2_HOST} "sudo openssl x509 -in /etc/nginx/ssl/self-signed.crt -noout -dates 2>/dev/null | grep notAfter"
}

# Step 4: Configure Nginx with HTTPS
configure_nginx() {
    print_step "步骤 4/5: 配置Nginx（HTTP + HTTPS）"

    print_info "创建前端文件目录..."
    ssh -i "$SSH_KEY" ${EC2_USER}@${EC2_HOST} "sudo mkdir -p /var/www/merchant-admin"

    print_info "上传Nginx配置文件..."
    # 获取脚本所在目录
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    NGINX_CONFIG="${SCRIPT_DIR}/nginx-merchant-admin.conf"

    # 检查配置文件是否存在
    if [ ! -f "$NGINX_CONFIG" ]; then
        print_error "Nginx配置文件不存在: $NGINX_CONFIG"
        exit 1
    fi

    # 上传配置文件到EC2
    scp -i "$SSH_KEY" "$NGINX_CONFIG" ${EC2_USER}@${EC2_HOST}:/tmp/nginx-merchant-admin.conf

    # 将配置文件移动到正确位置
    ssh -i "$SSH_KEY" ${EC2_USER}@${EC2_HOST} "sudo mv /tmp/nginx-merchant-admin.conf /etc/nginx/sites-available/merchant-admin"

    # 启用配置
    print_info "启用Nginx配置..."
    ssh -i "$SSH_KEY" ${EC2_USER}@${EC2_HOST} "
        sudo ln -sf /etc/nginx/sites-available/merchant-admin /etc/nginx/sites-enabled/merchant-admin && \
        sudo rm -f /etc/nginx/sites-enabled/default
    "

    # 测试配置
    print_info "测试Nginx配置..."
    ssh -i "$SSH_KEY" ${EC2_USER}@${EC2_HOST} "sudo nginx -t" 2>&1 | grep -E "(successful|failed)"

    if [ $? -eq 0 ]; then
        print_success "Nginx配置正确"

        # 重载nginx
        print_info "重载Nginx..."
        ssh -i "$SSH_KEY" ${EC2_USER}@${EC2_HOST} "sudo systemctl reload nginx"
        print_success "Nginx已重载"
    else
        print_error "Nginx配置错误"
        exit 1
    fi
}

# Step 5: Verify setup
verify_setup() {
    print_step "步骤 5/5: 验证配置"

    # 等待nginx完全重载
    sleep 2

    print_info "检查Nginx状态..."
    ssh -i "$SSH_KEY" ${EC2_USER}@${EC2_HOST} "sudo systemctl status nginx --no-pager | head -3"

    echo ""
    print_info "检查监听端口..."
    ssh -i "$SSH_KEY" ${EC2_USER}@${EC2_HOST} "sudo ss -tlnp | grep nginx"

    echo ""
    print_info "测试HTTPS访问..."
    HTTPS_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" https://${EC2_HOST} 2>/dev/null)
    if [ "$HTTPS_CODE" = "200" ]; then
        print_success "HTTPS访问正常 (${HTTPS_CODE})"
    else
        print_warning "HTTPS访问返回 ${HTTPS_CODE}"
    fi

    print_info "测试HTTP重定向..."
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://${EC2_HOST} 2>/dev/null)
    if [ "$HTTP_CODE" = "301" ]; then
        print_success "HTTP自动重定向到HTTPS (${HTTP_CODE})"
    else
        print_warning "HTTP返回 ${HTTP_CODE}"
    fi
}

# Show final instructions
show_final_instructions() {
    echo ""
    echo -e "${BLUE}==========================================${NC}"
    echo -e "${GREEN}✓ Nginx配置完成！${NC}"
    echo -e "${BLUE}==========================================${NC}"
    echo ""
    echo -e "${YELLOW}重要：在Cloudflare控制台完成最后配置${NC}"
    echo ""
    echo "1. 登录 Cloudflare → 选择 vamerchant.app"
    echo "2. 进入 SSL/TLS → Overview"
    echo "3. 将加密模式设置为 'Full'"
    echo ""
    echo -e "${GREEN}选择 'Full' 模式（不是 Flexible 或 Full Strict）${NC}"
    echo ""
    echo "配置说明："
    echo "  - Flexible: Cloudflare↔EC2 使用HTTP（不安全）"
    echo "  - Full: Cloudflare↔EC2 使用HTTPS（推荐）✅"
    echo "  - Full (Strict): 需要CA签名证书（不适用）"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "下一步："
    echo "  1. 在Cloudflare设置SSL模式为'Full'"
    echo "  2. 运行 ./deploy-frontend.sh 部署前端应用"
    echo "  3. 访问 https://${DOMAIN} 验证"
    echo ""
    echo "当前配置："
    echo "  - 监听端口: 80 (HTTP → HTTPS), 443 (HTTPS)"
    echo "  - SSL证书: 自签名（10年有效期）"
    echo "  - 证书位置: /etc/nginx/ssl/"
    echo "  - 配置文件: /etc/nginx/sites-available/merchant-admin"
    echo ""
    echo "常用命令："
    echo "  # 查看访问日志"
    echo "  ssh -i $SSH_KEY ${EC2_USER}@${EC2_HOST} 'sudo tail -f /var/log/nginx/merchant-admin.access.log'"
    echo ""
    echo "  # 编辑Nginx配置"
    echo "  ssh -i $SSH_KEY ${EC2_USER}@${EC2_HOST} 'sudo nano /etc/nginx/sites-available/merchant-admin'"
    echo ""
    echo "  # 测试配置"
    echo "  ssh -i $SSH_KEY ${EC2_USER}@${EC2_HOST} 'sudo nginx -t'"
    echo ""
    echo "  # 重新加载配置"
    echo "  ssh -i $SSH_KEY ${EC2_USER}@${EC2_HOST} 'sudo systemctl reload nginx'"
    echo ""
}

# Main setup function
setup_all() {
    echo -e "${BLUE}==========================================${NC}"
    echo -e "${BLUE}   Nginx完整配置 (HTTP + HTTPS)${NC}"
    echo -e "${BLUE}==========================================${NC}"
    echo ""
    echo "EC2地址: ${EC2_HOST}"
    echo "域名: ${DOMAIN}, ${WWW_DOMAIN}"
    echo ""
    echo "此脚本将执行以下操作："
    echo "  1. 安装Nginx（如果未安装）"
    echo "  2. 开放80和443端口"
    echo "  3. 生成自签名SSL证书（10年有效期）"
    echo "  4. 配置Nginx支持HTTP和HTTPS"
    echo "  5. 配置HTTP自动重定向到HTTPS"
    echo "  6. 验证配置"
    echo ""
    echo "完成后需要："
    echo "  - 在Cloudflare控制台将SSL模式设置为'Full'"
    echo ""

    read -p "确认开始设置? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "设置已取消"
        exit 0
    fi

    install_nginx
    open_ports
    generate_ssl_cert
    configure_nginx
    verify_setup
    show_final_instructions
}

# Main script entry
setup_all

exit 0
