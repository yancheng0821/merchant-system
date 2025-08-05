#!/bin/bash
set -e

# ==============================
# 配置
# ==============================
AWS_REGION="ca-central-1"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
NAMESPACE="merchant-system"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# ==============================
# 版本号生成
# ==============================
generate_version() {
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    VERSION="v1.2.3_${TIMESTAMP}"
    echo $VERSION
}

# ==============================
# 构建前端
# ==============================
build_admin() {
    local VERSION=$1
    
    log_info "构建 merchant-admin:${VERSION}..."
    
    # 构建前端
    cd merchant-admin
    npm run build
    cd ..
    
    # 构建Docker镜像
    docker build -f docker/Dockerfile.merchant-admin -t merchant-admin:${VERSION} .
    docker tag merchant-admin:${VERSION} ${ECR_REGISTRY}/merchant-admin:${VERSION}
    docker push ${ECR_REGISTRY}/merchant-admin:${VERSION}
    
    log_success "merchant-admin 构建完成"
}

# ==============================
# 构建AI服务
# ==============================
build_ai() {
    local VERSION=$1
    
    log_info "构建 ai-service-python:${VERSION}..."
    
    # 构建Docker镜像
    docker build -f docker/Dockerfile.ai-service-python -t ai-service-python:${VERSION} .
    docker tag ai-service-python:${VERSION} ${ECR_REGISTRY}/ai-service-python:${VERSION}
    docker push ${ECR_REGISTRY}/ai-service-python:${VERSION}
    
    log_success "ai-service-python 构建完成"
}

# ==============================
# 更新K8s配置
# ==============================
update_k8s_config() {
    local VERSION=$1
    
    log_info "更新 Kubernetes 配置文件..."
    
    # 更新merchant-admin版本
    sed -i '' "s/:v[0-9]\+\.[0-9]\+\.[0-9]\+/:${VERSION}/g" k8s-deployment/merchant-admin.yaml
    sed -i '' "s/:latest/:${VERSION}/g" k8s-deployment/merchant-admin.yaml
    
    # 更新ai-service版本
    sed -i '' "s/:v[0-9]\+\.[0-9]\+\.[0-9]\+/:${VERSION}/g" k8s-deployment/ai-service.yaml
    sed -i '' "s/:latest/:${VERSION}/g" k8s-deployment/ai-service.yaml
    
    log_success "Kubernetes 配置文件更新完成"
}

# ==============================
# 部署服务
# ==============================
deploy_services() {
    local VERSION=$1
    
    log_info "部署服务到 Kubernetes..."
    
    # 部署merchant-admin
    log_info "部署 merchant-admin..."
    kubectl apply -f k8s-deployment/merchant-admin.yaml
    kubectl rollout restart deployment/merchant-admin -n ${NAMESPACE}
    kubectl wait --for=condition=ready pod -l app=merchant-admin -n ${NAMESPACE} --timeout=300s
    log_success "merchant-admin 部署完成"
    
    # 部署ai-service
    log_info "部署 ai-service-python..."
    kubectl apply -f k8s-deployment/ai-service.yaml
    kubectl rollout restart deployment/ai-service-python -n ${NAMESPACE}
    kubectl wait --for=condition=ready pod -l app=ai-service-python -n ${NAMESPACE} --timeout=300s
    log_success "ai-service-python 部署完成"
}

# ==============================
# 健康检查
# ==============================
health_check() {
    log_info "执行健康检查..."
    
    # 检查Pod状态
    log_info "检查 Pod 状态..."
    kubectl get pods -n ${NAMESPACE} -l app=merchant-admin
    kubectl get pods -n ${NAMESPACE} -l app=ai-service-python
    
    # 检查服务状态
    log_info "检查服务状态..."
    kubectl get services -n ${NAMESPACE} | grep -E "(merchant-admin|ai-service)"
    
    log_success "健康检查完成"
}

# ==============================
# 主函数
# ==============================
main() {
    local VERSION=${1:-$(generate_version)}
    
    log_info "开始部署 merchant-admin 和 ai-service..."
    log_info "部署版本: ${VERSION}"
    
    # 登录 ECR
    log_info "登录 ECR..."
    aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}
    
    # 构建服务
    build_admin $VERSION
    build_ai $VERSION
    
    # 更新K8s配置
    update_k8s_config $VERSION
    
    # 部署服务
    deploy_services $VERSION
    
    # 健康检查
    health_check
    
    log_success "🚀 部署完成！"
    log_info "版本: ${VERSION}"
    log_info "部署的服务: merchant-admin, ai-service-python"
    
    # 显示部署摘要
    echo ""
    echo "📊 部署摘要:"
    echo "=================="
    kubectl get pods -n ${NAMESPACE} --no-headers | wc -l | xargs echo "运行中的 Pod 数量:"
    echo "部署版本: ${VERSION}"
    echo "更新服务: merchant-admin, ai-service-python"
    echo "=================="
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 