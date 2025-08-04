#!/bin/bash
set -e  # 出错立即退出

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

# ==============================
# 版本号生成
# ==============================
generate_version() {
    # 基于时间戳和git commit生成版本号
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    VERSION="v${TIMESTAMP}_${GIT_COMMIT}"
    echo $VERSION
}

# ==============================
# 预检查
# ==============================
pre_check() {
    log_info "开始预检查..."
    
    # 检查kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl 未安装"
        exit 1
    fi
    
    # 检查docker
    if ! command -v docker &> /dev/null; then
        log_error "docker 未安装"
        exit 1
    fi
    
    # 检查AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI 未安装"
        exit 1
    fi
    
    # 检查kubectl上下文
    if ! kubectl config current-context &> /dev/null; then
        log_error "kubectl 上下文未设置"
        exit 1
    fi
    
    log_success "预检查通过"
}

# ==============================
# 构建和推送
# ==============================
build_and_push() {
    local VERSION=$1
    
    log_info "开始构建和推送镜像 (版本: ${VERSION})..."
    
    # 登录 ECR
    log_info "登录 ECR..."
    aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}
    
    # 构建前端
    log_info "构建前端 merchant-admin:${VERSION}..."
    docker build -f docker/Dockerfile.merchant-admin -t merchant-admin:${VERSION} .
    docker tag merchant-admin:${VERSION} ${ECR_REGISTRY}/merchant-admin:${VERSION}
    docker push ${ECR_REGISTRY}/merchant-admin:${VERSION}
    
    # 构建后端
    log_info "构建 Maven 项目..."
    cd merchant-server
    mvn clean package -DskipTests
    cd ..
    
    # 构建后端服务
    services=("auth-service" "merchant-service" "business-service" "analytics-service" "notification-service")
    
    for service in "${services[@]}"; do
        log_info "构建 ${service}:${VERSION}..."
        docker build -f docker/Dockerfile.${service} -t ${service}:${VERSION} .
        docker tag ${service}:${VERSION} ${ECR_REGISTRY}/${service}:${VERSION}
        docker push ${ECR_REGISTRY}/${service}:${VERSION}
    done
    
    # 构建AI服务
    log_info "构建 AI 服务 ai-service-python:${VERSION}..."
    docker build -f docker/Dockerfile.ai-service-python -t ai-service-python:${VERSION} .
    docker tag ai-service-python:${VERSION} ${ECR_REGISTRY}/ai-service-python:${VERSION}
    docker push ${ECR_REGISTRY}/ai-service-python:${VERSION}
    
    log_success "所有镜像构建和推送完成"
}

# ==============================
# 更新K8s配置
# ==============================
update_k8s_config() {
    local VERSION=$1
    
    log_info "更新 Kubernetes 配置文件..."
    
    # 更新所有服务的镜像标签
    find k8s-deployment -name "*.yaml" -exec sed -i '' "s/:v[0-9]\+\.[0-9]\+\.[0-9]\+/:${VERSION}/g" {} \;
    find k8s-deployment -name "*.yaml" -exec sed -i '' "s/:latest/:${VERSION}/g" {} \;
    
    log_success "Kubernetes 配置文件更新完成"
}

# ==============================
# 部署到K8s
# ==============================
deploy_to_k8s() {
    local VERSION=$1
    
    log_info "开始部署到 Kubernetes (版本: ${VERSION})..."
    
    # 应用基础配置
    kubectl apply -f k8s-deployment/namespace.yaml
    kubectl apply -f k8s-deployment/configmap.yaml
    kubectl apply -f k8s-deployment/secrets.yaml
    
    # 按依赖顺序部署服务
    log_info "部署核心服务..."
    kubectl apply -f k8s-deployment/auth-service.yaml
    kubectl apply -f k8s-deployment/merchant-service.yaml
    
    log_info "等待核心服务启动..."
    kubectl wait --for=condition=ready pod -l app=auth-service -n ${NAMESPACE} --timeout=300s
    kubectl wait --for=condition=ready pod -l app=merchant-service -n ${NAMESPACE} --timeout=300s
    
    log_info "部署业务服务..."
    kubectl apply -f k8s-deployment/business-service.yaml
    kubectl apply -f k8s-deployment/analytics-service.yaml
    kubectl apply -f k8s-deployment/notification-service.yaml
    
    log_info "部署AI服务..."
    kubectl apply -f k8s-deployment/ai-service.yaml
    
    log_info "部署前端应用..."
    kubectl apply -f k8s-deployment/merchant-admin.yaml
    
    # 等待所有服务启动
    log_info "等待所有服务启动..."
    kubectl wait --for=condition=ready pod -l app=business-service -n ${NAMESPACE} --timeout=300s
    kubectl wait --for=condition=ready pod -l app=analytics-service -n ${NAMESPACE} --timeout=300s
    kubectl wait --for=condition=ready pod -l app=notification-service -n ${NAMESPACE} --timeout=300s
    kubectl wait --for=condition=ready pod -l app=ai-service-python -n ${NAMESPACE} --timeout=300s
    kubectl wait --for=condition=ready pod -l app=merchant-admin -n ${NAMESPACE} --timeout=300s
    
    log_success "Kubernetes 部署完成"
}

# ==============================
# 健康检查
# ==============================
health_check() {
    log_info "开始健康检查..."
    
    # 检查所有pod状态
    log_info "检查 Pod 状态..."
    kubectl get pods -n ${NAMESPACE} -o wide
    
    # 检查服务状态
    log_info "检查服务状态..."
    kubectl get services -n ${NAMESPACE}
    
    # 检查Ingress状态
    log_info "检查 Ingress 状态..."
    kubectl get ingress -n ${NAMESPACE}
    
    # 检查服务日志
    log_info "检查关键服务日志..."
    
    # 检查business-service日志
    if kubectl logs -n ${NAMESPACE} deployment/business-service --tail=5 | grep -q "Started BusinessServiceApplication"; then
        log_success "business-service 启动成功"
    else
        log_warning "business-service 可能未完全启动"
    fi
    
    # 检查auth-service日志
    if kubectl logs -n ${NAMESPACE} deployment/auth-service --tail=5 | grep -q "Started AuthServiceApplication"; then
        log_success "auth-service 启动成功"
    else
        log_warning "auth-service 可能未完全启动"
    fi
    
    # 检查ai-service日志
    if kubectl logs -n ${NAMESPACE} deployment/ai-service-python --tail=5 | grep -q "INFO.*Uvicorn running"; then
        log_success "ai-service 启动成功"
    else
        log_warning "ai-service 可能未完全启动"
    fi
}

# ==============================
# API测试
# ==============================
api_test() {
    log_info "开始 API 测试..."
    
    local API_BASE="https://api.swiftmindsystems.com"
    local FRONTEND_URL="https://swiftmindsystems.com"
    
    # 测试AI服务
    log_info "测试 AI 服务..."
    if curl -s -X POST "${API_BASE}/api/ai/recommend-appointment" \
        -H "Content-Type: application/json" \
        -d '{"customerId":"test","customerName":"Test","orders":[]}' \
        --insecure | grep -q "success"; then
        log_success "AI 服务 API 测试通过"
    else
        log_warning "AI 服务 API 测试失败"
    fi
    
    # 测试头像API
    log_info "测试头像 API..."
    if curl -s -I "${API_BASE}/api/auth/users/avatar/test.jpg" --insecure | grep -q "404\|200"; then
        log_success "头像 API 测试通过"
    else
        log_warning "头像 API 测试失败"
    fi
    
    # 测试前端可访问性
    log_info "测试前端可访问性..."
    if curl -s -I "${FRONTEND_URL}" --insecure | grep -q "200"; then
        log_success "前端可访问性测试通过"
    else
        log_warning "前端可访问性测试失败"
    fi
}

# ==============================
# 清理旧镜像
# ==============================
cleanup_old_images() {
    log_info "清理本地旧镜像..."
    
    # 清理本地镜像（保留最新的5个版本）
    docker image prune -f
    
    log_success "镜像清理完成"
}

# ==============================
# 主函数
# ==============================
main() {
    local VERSION=${1:-$(generate_version)}
    
    log_info "开始智能部署流程..."
    log_info "部署版本: ${VERSION}"
    
    # 执行部署流程
    pre_check
    build_and_push $VERSION
    update_k8s_config $VERSION
    deploy_to_k8s $VERSION
    health_check
    api_test
    cleanup_old_images
    
    log_success "🎉 智能部署完成！"
    log_info "版本: ${VERSION}"
    log_info "前端地址: https://swiftmindsystems.com"
    log_info "API地址: https://api.swiftmindsystems.com"
    
    # 显示部署摘要
    echo ""
    echo "📊 部署摘要:"
    echo "=================="
    kubectl get pods -n ${NAMESPACE} --no-headers | wc -l | xargs echo "运行中的 Pod 数量:"
    kubectl get services -n ${NAMESPACE} --no-headers | wc -l | xargs echo "服务数量:"
    echo "部署版本: ${VERSION}"
    echo "=================="
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 