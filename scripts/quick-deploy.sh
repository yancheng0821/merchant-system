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
    GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    VERSION="v${TIMESTAMP}_${GIT_COMMIT}"
    echo $VERSION
}

# ==============================
# 检测修改的文件
# ==============================
detect_changes() {
    local VERSION=$1
    local CHANGED_SERVICES=()
    
    log_info "检测代码变更..."
    
    # 检查前端变更
    if git diff --name-only HEAD~1 | grep -q "merchant-admin/"; then
        CHANGED_SERVICES+=("merchant-admin")
        log_info "检测到前端代码变更"
    fi
    
    # 检查后端服务变更
    if git diff --name-only HEAD~1 | grep -q "merchant-server/auth-service/"; then
        CHANGED_SERVICES+=("auth-service")
        log_info "检测到 auth-service 代码变更"
    fi
    
    if git diff --name-only HEAD~1 | grep -q "merchant-server/business-service/"; then
        CHANGED_SERVICES+=("business-service")
        log_info "检测到 business-service 代码变更"
    fi
    
    if git diff --name-only HEAD~1 | grep -q "merchant-server/merchant-service/"; then
        CHANGED_SERVICES+=("merchant-service")
        log_info "检测到 merchant-service 代码变更"
    fi
    
    if git diff --name-only HEAD~1 | grep -q "merchant-server/analytics-service/"; then
        CHANGED_SERVICES+=("analytics-service")
        log_info "检测到 analytics-service 代码变更"
    fi
    
    if git diff --name-only HEAD~1 | grep -q "merchant-server/notification-service/"; then
        CHANGED_SERVICES+=("notification-service")
        log_info "检测到 notification-service 代码变更"
    fi
    
    # 检查AI服务变更
    if git diff --name-only HEAD~1 | grep -q "ai-service-python/"; then
        CHANGED_SERVICES+=("ai-service-python")
        log_info "检测到 AI 服务代码变更"
    fi
    
    # 如果没有检测到变更，默认更新所有服务
    if [ ${#CHANGED_SERVICES[@]} -eq 0 ]; then
        log_warning "未检测到具体变更，将更新所有服务"
        CHANGED_SERVICES=("merchant-admin" "auth-service" "business-service" "merchant-service" "analytics-service" "notification-service" "ai-service-python")
    fi
    
    echo "${CHANGED_SERVICES[@]}"
}

# ==============================
# 构建指定服务
# ==============================
build_service() {
    local SERVICE=$1
    local VERSION=$2
    
    log_info "构建 ${SERVICE}:${VERSION}..."
    
    case $SERVICE in
        "merchant-admin")
            docker build -f docker/Dockerfile.merchant-admin -t merchant-admin:${VERSION} .
            docker tag merchant-admin:${VERSION} ${ECR_REGISTRY}/merchant-admin:${VERSION}
            docker push ${ECR_REGISTRY}/merchant-admin:${VERSION}
            ;;
        "ai-service-python")
            docker build -f docker/Dockerfile.ai-service-python -t ai-service-python:${VERSION} .
            docker tag ai-service-python:${VERSION} ${ECR_REGISTRY}/ai-service-python:${VERSION}
            docker push ${ECR_REGISTRY}/ai-service-python:${VERSION}
            ;;
        *)
            # 后端服务需要先构建Maven项目
            if [[ " ${CHANGED_SERVICES[@]} " =~ " ${SERVICE} " ]]; then
                log_info "构建 Maven 项目..."
                cd merchant-server
                mvn clean package -DskipTests
                cd ..
            fi
            
            docker build -f docker/Dockerfile.${SERVICE} -t ${SERVICE}:${VERSION} .
            docker tag ${SERVICE}:${VERSION} ${ECR_REGISTRY}/${SERVICE}:${VERSION}
            docker push ${ECR_REGISTRY}/${SERVICE}:${VERSION}
            ;;
    esac
    
    log_success "${SERVICE} 构建完成"
}

# ==============================
# 更新K8s配置
# ==============================
update_k8s_config() {
    local VERSION=$1
    local SERVICES=("${@:2}")
    
    log_info "更新 Kubernetes 配置文件..."
    
    for service in "${SERVICES[@]}"; do
        case $service in
            "merchant-admin")
                sed -i '' "s/:v[0-9]\+\.[0-9]\+\.[0-9]\+/:${VERSION}/g" k8s-deployment/merchant-admin.yaml
                sed -i '' "s/:latest/:${VERSION}/g" k8s-deployment/merchant-admin.yaml
                ;;
            "ai-service-python")
                sed -i '' "s/:v[0-9]\+\.[0-9]\+\.[0-9]\+/:${VERSION}/g" k8s-deployment/ai-service.yaml
                sed -i '' "s/:latest/:${VERSION}/g" k8s-deployment/ai-service.yaml
                ;;
            *)
                sed -i '' "s/:v[0-9]\+\.[0-9]\+\.[0-9]\+/:${VERSION}/g" k8s-deployment/${service}.yaml
                sed -i '' "s/:latest/:${VERSION}/g" k8s-deployment/${service}.yaml
                ;;
        esac
    done
    
    log_success "Kubernetes 配置文件更新完成"
}

# ==============================
# 部署指定服务
# ==============================
deploy_service() {
    local SERVICE=$1
    
    log_info "部署 ${SERVICE}..."
    
    case $SERVICE in
        "merchant-admin")
            kubectl apply -f k8s-deployment/merchant-admin.yaml
            kubectl rollout restart deployment/merchant-admin -n ${NAMESPACE}
            kubectl wait --for=condition=ready pod -l app=merchant-admin -n ${NAMESPACE} --timeout=300s
            ;;
        "ai-service-python")
            kubectl apply -f k8s-deployment/ai-service.yaml
            kubectl rollout restart deployment/ai-service-python -n ${NAMESPACE}
            kubectl wait --for=condition=ready pod -l app=ai-service-python -n ${NAMESPACE} --timeout=300s
            ;;
        *)
            kubectl apply -f k8s-deployment/${SERVICE}.yaml
            kubectl rollout restart deployment/${SERVICE} -n ${NAMESPACE}
            kubectl wait --for=condition=ready pod -l app=${SERVICE} -n ${NAMESPACE} --timeout=300s
            ;;
    esac
    
    log_success "${SERVICE} 部署完成"
}

# ==============================
# 快速测试
# ==============================
quick_test() {
    log_info "执行快速测试..."
    
    local API_BASE="https://api.swiftmindsystems.com"
    local FRONTEND_URL="https://swiftmindsystems.com"
    
    # 测试前端可访问性
    if curl -s -I "${FRONTEND_URL}" --insecure | grep -q "200"; then
        log_success "前端可访问性测试通过"
    else
        log_warning "前端可访问性测试失败"
    fi
    
    # 测试AI服务
    if curl -s -X POST "${API_BASE}/api/ai/recommend-appointment" \
        -H "Content-Type: application/json" \
        -d '{"customerId":"test","customerName":"Test","orders":[]}' \
        --insecure | grep -q "success"; then
        log_success "AI 服务测试通过"
    else
        log_warning "AI 服务测试失败"
    fi
}

# ==============================
# 主函数
# ==============================
main() {
    local VERSION=${1:-$(generate_version)}
    
    log_info "开始快速部署..."
    log_info "部署版本: ${VERSION}"
    
    # 登录 ECR
    log_info "登录 ECR..."
    aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}
    
    # 检测变更
    CHANGED_SERVICES=($(detect_changes $VERSION))
    
    log_info "需要更新的服务: ${CHANGED_SERVICES[*]}"
    
    # 构建和推送变更的服务
    for service in "${CHANGED_SERVICES[@]}"; do
        build_service $service $VERSION
    done
    
    # 更新K8s配置
    update_k8s_config $VERSION "${CHANGED_SERVICES[@]}"
    
    # 部署变更的服务
    for service in "${CHANGED_SERVICES[@]}"; do
        deploy_service $service
    done
    
    # 快速测试
    quick_test
    
    log_success "🚀 快速部署完成！"
    log_info "版本: ${VERSION}"
    log_info "更新的服务: ${CHANGED_SERVICES[*]}"
    
    # 显示部署摘要
    echo ""
    echo "📊 部署摘要:"
    echo "=================="
    kubectl get pods -n ${NAMESPACE} --no-headers | wc -l | xargs echo "运行中的 Pod 数量:"
    echo "部署版本: ${VERSION}"
    echo "更新服务: ${CHANGED_SERVICES[*]}"
    echo "=================="
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 