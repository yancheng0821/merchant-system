#!/bin/bash

# ============================================
# 前端快速部署脚本 (CloudFront + S3)
# ============================================
# 用途：构建前端并部署到 S3 + CloudFront
# 使用场景：日常前端代码更新部署
# ============================================

# 设置 Node.js 路径（使用 Homebrew 安装的版本）
export PATH="/usr/local/Cellar/node/25.2.1/bin:$PATH"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_DIR="/Users/aisenyc/merchant-system/merchant-admin"
S3_BUCKET="vamerchant-frontend"
CLOUDFRONT_DISTRIBUTION_ID="ERNJRMBE6WRQN"
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

    # 加载生产环境配置
    print_info "加载生产环境配置..."
    if [ -f "/Users/aisenyc/merchant-system/deployment/.env" ]; then
        # 导出前端相关的环境变量
        export REACT_APP_GOOGLE_MAPS_API_KEY=$(grep REACT_APP_GOOGLE_MAPS_API_KEY /Users/aisenyc/merchant-system/deployment/.env | cut -d '=' -f2)
        print_info "Google Maps API Key已设置"
    else
        print_warning "未找到生产环境配置文件"
    fi

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

# Step 2: Upload to S3
upload_to_s3() {
    print_step "步骤 2/3: 上传到 S3"

    cd "$FRONTEND_DIR"

    print_info "同步静态资源到 S3（长期缓存）..."
    # 静态资源（JS/CSS/图片）有hash，可以长期缓存（1年）
    aws s3 sync ./build s3://${S3_BUCKET} \
        --exclude "index.html" \
        --exclude "*.json" \
        --cache-control "public, max-age=31536000, immutable" \
        --delete

    print_info "上传 index.html（禁止缓存）..."
    # index.html 不缓存，每次都从服务器获取最新版本
    aws s3 cp ./build/index.html s3://${S3_BUCKET}/index.html \
        --cache-control "no-cache, no-store, must-revalidate"

    # 上传其他JSON配置文件（短期缓存）
    if ls ./build/*.json 1> /dev/null 2>&1; then
        print_info "上传配置文件..."
        for file in ./build/*.json; do
            aws s3 cp "$file" s3://${S3_BUCKET}/$(basename "$file") \
                --cache-control "no-cache, no-store, must-revalidate"
        done
    fi

    if [ $? -eq 0 ]; then
        print_success "文件上传成功"

        # 显示 S3 文件数量
        FILE_COUNT=$(aws s3 ls s3://${S3_BUCKET} --recursive | wc -l)
        print_info "S3 文件数量: $FILE_COUNT"
    else
        print_error "文件上传失败"
        exit 1
    fi
}

# Step 3: Invalidate CloudFront cache
invalidate_cloudfront() {
    print_step "步骤 3/3: 刷新 CloudFront 缓存"

    print_info "创建缓存失效请求..."
    INVALIDATION_OUTPUT=$(aws cloudfront create-invalidation \
        --distribution-id ${CLOUDFRONT_DISTRIBUTION_ID} \
        --paths "/*" "/index.html" "/static/*" "/legal/*" 2>&1)

    if [ $? -eq 0 ]; then
        INVALIDATION_ID=$(echo "$INVALIDATION_OUTPUT" | jq -r '.Invalidation.Id')
        print_success "缓存失效请求已创建"
        print_info "Invalidation ID: $INVALIDATION_ID"

        # 等待缓存刷新完成
        print_info "等待缓存刷新完成..."
        while true; do
            STATUS=$(aws cloudfront get-invalidation \
                --distribution-id ${CLOUDFRONT_DISTRIBUTION_ID} \
                --id $INVALIDATION_ID \
                --query 'Invalidation.Status' \
                --output text 2>/dev/null)

            if [ "$STATUS" = "Completed" ]; then
                print_success "缓存刷新已完成！"
                break
            fi

            echo -n "."
            sleep 5
        done
    else
        print_warning "缓存失效请求可能失败: $INVALIDATION_OUTPUT"
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
    echo -e "${BLUE}  CloudFront: https://d3iuivehbbqzii.cloudfront.net${NC}"
    echo -e "${BLUE}  域名访问:   https://${DOMAIN}${NC}"
    echo ""
    echo "部署信息:"
    BUILD_SIZE=$(du -sh "$FRONTEND_DIR/build/" 2>/dev/null | awk '{print $1}')
    echo "  构建大小: $BUILD_SIZE"
    echo "  S3 桶:    s3://${S3_BUCKET}"
    echo "  分发 ID:  ${CLOUDFRONT_DISTRIBUTION_ID}"
    echo ""
    echo "常用命令:"
    echo "  # 查看 S3 文件"
    echo "  aws s3 ls s3://${S3_BUCKET} --recursive"
    echo ""
    echo "  # 手动刷新缓存"
    echo "  aws cloudfront create-invalidation --distribution-id ${CLOUDFRONT_DISTRIBUTION_ID} --paths '/*'"
    echo ""
    echo "  # 查看分发状态"
    echo "  aws cloudfront get-distribution --id ${CLOUDFRONT_DISTRIBUTION_ID} --query 'Distribution.Status'"
    echo ""
}

# Main deployment function
deploy() {
    echo -e "${BLUE}==========================================${NC}"
    echo -e "${BLUE}     前端部署 (CloudFront + S3)${NC}"
    echo -e "${BLUE}==========================================${NC}"
    echo ""
    echo "S3 桶:     ${S3_BUCKET}"
    echo "CloudFront: ${CLOUDFRONT_DISTRIBUTION_ID}"
    echo "前端目录:  ${FRONTEND_DIR}"
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
    upload_to_s3
    invalidate_cloudfront

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
