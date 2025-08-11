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
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
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

log_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

# ==============================
# 版本号生成
# ==============================
generate_version() {
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    # 使用local标记表示这是本地未提交的代码
    VERSION="v${TIMESTAMP}_local"
    echo $VERSION
}

# ==============================
# 预检查
# ==============================
pre_check() {
    log_step "执行预检查..."
    
    local failed=false
    
    # 检查必要工具
    for tool in kubectl docker aws mvn npm; do
        if ! command -v $tool &> /dev/null; then
            log_error "$tool 未安装"
            failed=true
        else
            log_info "✓ $tool 已安装"
        fi
    done
    
    # 检查kubectl上下文
    if ! kubectl config current-context &> /dev/null; then
        log_error "kubectl 上下文未设置"
        failed=true
    else
        log_info "✓ kubectl 上下文: $(kubectl config current-context)"
    fi
    
    # 检查AWS凭证
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS 凭证未配置"
        failed=true
    else
        log_info "✓ AWS账号: ${AWS_ACCOUNT_ID}"
    fi
    
    if [ "$failed" = true ]; then
        log_error "预检查失败，请修复以上问题后重试"
        exit 1
    fi
    
    log_success "预检查通过"
}

# ==============================
# 选择部署服务
# ==============================
select_services() {
    echo ""
    log_step "选择要部署的服务:"
    echo "  1) 全部服务 (前端 + 后端 + AI)"
    echo "  2) 仅前端 (merchant-admin)"
    echo "  3) 前端 + 业务服务 (merchant-admin + business-service)"
    echo "  4) 前端 + Auth + 业务服务 (merchant-admin + auth-service + business-service)"
    echo "  5) 仅业务服务 (business-service)"
    echo "  6) 仅后端 (所有Java服务)"
    echo "  7) 仅AI服务"
    echo "  8) Auth + 文件服务 (auth-service + file-service)"
    echo "  9) 自定义选择"
    echo ""
    read -p "请选择 (1-9): " choice
    
    case $choice in
        1)
            DEPLOY_FRONTEND=true
            DEPLOY_BACKEND=true
            DEPLOY_AI=true
            DEPLOY_FILE_SERVICE=false
            SELECTED_SERVICES=("auth-service" "merchant-service" "business-service" "analytics-service" "notification-service")
            ;;
        2)
            DEPLOY_FRONTEND=true
            DEPLOY_BACKEND=false
            DEPLOY_AI=false
            DEPLOY_FILE_SERVICE=false
            SELECTED_SERVICES=()
            ;;
        3)
            DEPLOY_FRONTEND=true
            DEPLOY_BACKEND=true
            DEPLOY_AI=false
            DEPLOY_FILE_SERVICE=false
            SELECTED_SERVICES=("business-service")
            ;;
        4)
            DEPLOY_FRONTEND=true
            DEPLOY_BACKEND=true
            DEPLOY_AI=false
            DEPLOY_FILE_SERVICE=false
            SELECTED_SERVICES=("auth-service" "business-service")
            ;;
        5)
            DEPLOY_FRONTEND=false
            DEPLOY_BACKEND=true
            DEPLOY_AI=false
            DEPLOY_FILE_SERVICE=false
            SELECTED_SERVICES=("business-service")
            ;;
        6)
            DEPLOY_FRONTEND=false
            DEPLOY_BACKEND=true
            DEPLOY_AI=false
            DEPLOY_FILE_SERVICE=false
            SELECTED_SERVICES=("auth-service" "merchant-service" "business-service" "analytics-service" "notification-service")
            ;;
        7)
            DEPLOY_FRONTEND=false
            DEPLOY_BACKEND=false
            DEPLOY_AI=true
            DEPLOY_FILE_SERVICE=false
            SELECTED_SERVICES=()
            ;;
        8)
            log_info "部署 Auth + 文件服务"
            DEPLOY_FRONTEND=false
            DEPLOY_BACKEND=true
            DEPLOY_AI=false
            DEPLOY_FILE_SERVICE=true
            SELECTED_SERVICES=("auth-service")
            ;;
        9)
            echo "请选择要部署的服务（用空格分隔）:"
            echo "可选: frontend auth-service merchant-service business-service analytics-service notification-service ai-service file-service"
            read -a custom_services
            
            DEPLOY_FRONTEND=false
            DEPLOY_BACKEND=false
            DEPLOY_AI=false
            DEPLOY_FILE_SERVICE=false
            SELECTED_SERVICES=()
            
            for service in "${custom_services[@]}"; do
                case $service in
                    frontend)
                        DEPLOY_FRONTEND=true
                        ;;
                    ai-service)
                        DEPLOY_AI=true
                        ;;
                    file-service)
                        DEPLOY_FILE_SERVICE=true
                        ;;
                    *)
                        DEPLOY_BACKEND=true
                        SELECTED_SERVICES+=("$service")
                        ;;
                esac
            done
            ;;
        *)
            log_error "无效选择"
            exit 1
            ;;
    esac
    
    log_info "将部署以下服务:"
    [ "$DEPLOY_FRONTEND" = true ] && log_info "  - 前端 (merchant-admin)"
    [ "$DEPLOY_AI" = true ] && log_info "  - AI服务 (ai-service-python)"
    [ "$DEPLOY_FILE_SERVICE" = true ] && log_info "  - 文件服务 (file-service)"
    for service in "${SELECTED_SERVICES[@]}"; do
        log_info "  - $service"
    done
}

# ==============================
# 构建前端
# ==============================
build_frontend() {
    local VERSION=$1
    
    log_step "构建前端 merchant-admin:${VERSION}..."
    
    # 保存当前目录
    local CURRENT_DIR=$(pwd)
    
    # 确保从项目根目录开始
    if [[ ! -d "merchant-admin" ]]; then
        if [[ -d "../merchant-admin" ]]; then
            cd ..
        else
            log_error "找不到merchant-admin目录"
            return 1
        fi
    fi
    
    # 先在本地构建前端（确保使用本地代码）
    log_info "本地构建前端..."
    cd merchant-admin
    rm -rf build  # 清理旧的构建
    npm install
    # 使用生产环境变量构建
    REACT_APP_API_BASE_URL=https://api.swiftmindsystems.com npm run build
    
    # 验证构建结果包含正确的API URL
    if grep -q "https://api.swiftmindsystems.com" build/static/js/*.js 2>/dev/null; then
        log_success "✓ 构建包含正确的API域名 (api.swiftmindsystems.com)"
    else
        log_error "✗ 构建未包含正确的API域名！"
        log_error "  期望: https://api.swiftmindsystems.com"
        log_error "  请检查环境变量配置"
        exit 1
    fi
    
    cd ..
    
    # 确保在正确的目录下构建Docker镜像
    log_info "当前目录: $(pwd)"
    log_info "构建Docker镜像（使用本地构建）..."
    docker build --no-cache -f docker/Dockerfile.merchant-admin.local -t merchant-admin:${VERSION} .
    
    # 标记并推送
    docker tag merchant-admin:${VERSION} ${ECR_REGISTRY}/merchant-admin:${VERSION}
    docker tag merchant-admin:${VERSION} ${ECR_REGISTRY}/merchant-admin:latest
    docker push ${ECR_REGISTRY}/merchant-admin:${VERSION}
    docker push ${ECR_REGISTRY}/merchant-admin:latest
    
    log_success "前端构建完成"
}

# ==============================
# 构建后端服务
# ==============================
build_backend() {
    local VERSION=$1
    local SERVICE=$2
    
    log_step "构建 ${SERVICE}:${VERSION}..."
    
    # 保存当前目录
    local CURRENT_DIR=$(pwd)
    
    # 打包Java服务
    log_info "打包 ${SERVICE}..."
    cd merchant-server
    ./mvnw clean package -pl ${SERVICE} -am -DskipTests
    cd ${CURRENT_DIR}
    
    # 构建Docker镜像（使用--no-cache确保重新构建）
    docker build --no-cache -f docker/Dockerfile.${SERVICE} -t ${SERVICE}:${VERSION} .
    
    # 标记并推送
    docker tag ${SERVICE}:${VERSION} ${ECR_REGISTRY}/${SERVICE}:${VERSION}
    docker tag ${SERVICE}:${VERSION} ${ECR_REGISTRY}/${SERVICE}:latest
    docker push ${ECR_REGISTRY}/${SERVICE}:${VERSION}
    docker push ${ECR_REGISTRY}/${SERVICE}:latest
    
    log_success "${SERVICE} 构建完成"
}

# ==============================
# 构建AI服务
# ==============================
build_ai_service() {
    local VERSION=$1
    
    log_step "构建 AI 服务 ai-service-python:${VERSION}..."
    
    # 构建Docker镜像
    docker build -f docker/Dockerfile.ai-service-python -t ai-service-python:${VERSION} .
    
    # 标记并推送
    docker tag ai-service-python:${VERSION} ${ECR_REGISTRY}/ai-service-python:${VERSION}
    docker tag ai-service-python:${VERSION} ${ECR_REGISTRY}/ai-service-python:latest
    docker push ${ECR_REGISTRY}/ai-service-python:${VERSION}
    docker push ${ECR_REGISTRY}/ai-service-python:latest
    
    log_success "AI服务构建完成"
}

# ==============================
# 构建和推送镜像
# ==============================
build_and_push() {
    local VERSION=$1
    
    log_step "开始构建和推送镜像 (版本: ${VERSION})..."
    
    # 登录 ECR
    log_info "登录 ECR..."
    aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}
    
    # 构建Maven项目（如果需要）
    if [ "$DEPLOY_BACKEND" = true ]; then
        log_info "构建 Maven 项目..."
        cd merchant-server
        
        # 检查是否只构建business-service
        if [ ${#SELECTED_SERVICES[@]} -eq 1 ] && [ "${SELECTED_SERVICES[0]}" = "business-service" ]; then
            log_info "只构建 business-service..."
            mvn clean package -pl business-service -am -DskipTests
        elif [ ${#SELECTED_SERVICES[@]} -gt 0 ]; then
            # 构建所有需要的模块
            log_info "构建所有后端服务..."
            mvn clean package -DskipTests
        fi
        
        cd ..
    fi
    
    # 并行构建镜像
    local pids=()
    
    # 构建前端
    if [ "$DEPLOY_FRONTEND" = true ]; then
        build_frontend $VERSION &
        pids+=($!)
    fi
    
    # 构建后端服务
    if [ "$DEPLOY_BACKEND" = true ]; then
        for service in "${SELECTED_SERVICES[@]}"; do
            build_backend $VERSION $service &
            pids+=($!)
        done
    fi
    
    # 构建AI服务
    if [ "$DEPLOY_AI" = true ]; then
        build_ai_service $VERSION &
        pids+=($!)
    fi
    
    # 等待所有构建完成
    for pid in "${pids[@]}"; do
        wait $pid
    done
    
    log_success "所有镜像构建和推送完成"
}

# ==============================
# 部署到K8s
# ==============================
deploy_to_k8s() {
    local VERSION=$1
    
    log_step "开始部署到 Kubernetes (版本: ${VERSION})..."
    
    # 确保命名空间存在
    kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -
    
    # 应用基础配置（如果不存在）
    if kubectl get configmap -n ${NAMESPACE} &> /dev/null; then
        log_info "ConfigMap 已存在，跳过"
    else
        kubectl apply -f k8s-deployment/configmap.yaml
    fi
    
    if kubectl get secret -n ${NAMESPACE} &> /dev/null; then
        log_info "Secrets 已存在，跳过"
    else
        kubectl apply -f k8s-deployment/secrets.yaml
    fi
    
    # 部署服务
    local deployments=()
    
    if [ "$DEPLOY_FRONTEND" = true ]; then
        log_info "部署前端..."
        if kubectl get deployment merchant-admin -n ${NAMESPACE} &> /dev/null; then
            log_info "强制更新前端镜像..."
            # 使用patch确保镜像拉取策略为Always
            kubectl patch deployment merchant-admin -n ${NAMESPACE} -p \
                '{"spec":{"template":{"spec":{"containers":[{"name":"merchant-admin","imagePullPolicy":"Always"}]}}}}'
            # 设置新镜像
            kubectl set image deployment/merchant-admin merchant-admin=${ECR_REGISTRY}/merchant-admin:${VERSION} -n ${NAMESPACE}
            # 强制重启以确保使用最新镜像
            kubectl rollout restart deployment/merchant-admin -n ${NAMESPACE}
        else
            log_info "创建前端部署..."
            kubectl apply -f k8s-deployment/merchant-admin.yaml
            kubectl set image deployment/merchant-admin merchant-admin=${ECR_REGISTRY}/merchant-admin:${VERSION} -n ${NAMESPACE}
        fi
        deployments+=("merchant-admin")
    fi
    
    if [ "$DEPLOY_BACKEND" = true ]; then
        for service in "${SELECTED_SERVICES[@]}"; do
            log_info "部署 ${service}..."
            if kubectl get deployment ${service} -n ${NAMESPACE} &> /dev/null; then
                log_info "更新 ${service} 镜像..."
                kubectl set image deployment/${service} ${service}=${ECR_REGISTRY}/${service}:${VERSION} -n ${NAMESPACE}
            else
                log_info "创建 ${service} 部署..."
                kubectl apply -f k8s-deployment/${service}.yaml
                kubectl set image deployment/${service} ${service}=${ECR_REGISTRY}/${service}:${VERSION} -n ${NAMESPACE}
            fi
            deployments+=("${service}")
        done
    fi
    
    if [ "$DEPLOY_AI" = true ]; then
        log_info "部署 AI 服务..."
        if kubectl get deployment ai-service-python -n ${NAMESPACE} &> /dev/null; then
            log_info "更新 AI 服务镜像..."
            kubectl set image deployment/ai-service-python ai-service-python=${ECR_REGISTRY}/ai-service-python:${VERSION} -n ${NAMESPACE}
        else
            log_info "创建 AI 服务部署..."
            kubectl apply -f k8s-deployment/ai-service.yaml
            kubectl set image deployment/ai-service-python ai-service-python=${ECR_REGISTRY}/ai-service-python:${VERSION} -n ${NAMESPACE}
        fi
        deployments+=("ai-service-python")
    fi
    
    if [ "$DEPLOY_FILE_SERVICE" = true ]; then
        log_info "部署文件服务..."
        # file-service 使用nginx镜像，不需要构建
        kubectl apply -f k8s-deployment/file-service.yaml
        deployments+=("file-service")
    fi
    
    # 等待部署完成
    log_info "等待部署完成..."
    for deployment in "${deployments[@]}"; do
        kubectl rollout status deployment/${deployment} -n ${NAMESPACE} --timeout=300s
        log_success "${deployment} 部署完成"
    done
    
    # 如果部署了auth-service或file-service，修复EFS目录结构
    if [[ " ${deployments[@]} " =~ " auth-service " ]] || [[ " ${deployments[@]} " =~ " file-service " ]]; then
        log_info "修复EFS目录结构..."
        if [ -f "scripts/fix-efs-structure.sh" ]; then
            bash scripts/fix-efs-structure.sh
        else
            log_warning "未找到EFS修复脚本，跳过"
        fi
    fi
    
    log_success "Kubernetes 部署完成"
}

# ==============================
# 快速健康检查
# ==============================
quick_health_check() {
    log_step "执行快速健康检查..."
    
    # 检查Pod状态
    log_info "Pod 状态:"
    kubectl get pods -n ${NAMESPACE} | grep -E "(merchant-admin|auth-service|business-service|ai-service)" || true
    
    # 检查最近的事件
    log_info "最近的事件:"
    kubectl get events -n ${NAMESPACE} --sort-by='.lastTimestamp' | tail -5
    
    log_success "健康检查完成"
}

# ==============================
# 显示访问信息
# ==============================
show_access_info() {
    echo ""
    echo "========================================"
    echo -e "${GREEN}🎉 部署成功！${NC}"
    echo "========================================"
    echo ""
    echo "📊 部署信息:"
    echo "  版本: ${VERSION}"
    echo "  命名空间: ${NAMESPACE}"
    echo ""
    echo "🌐 访问地址:"
    echo "  前端: https://swiftmindsystems.com"
    echo "  API: https://api.swiftmindsystems.com"
    echo ""
    echo "🔍 查看日志:"
    echo "  kubectl logs -n ${NAMESPACE} deployment/business-service -f"
    echo "  kubectl logs -n ${NAMESPACE} deployment/ai-service-python -f"
    echo ""
    echo "📝 查看Pod状态:"
    echo "  kubectl get pods -n ${NAMESPACE}"
    echo "========================================"
}

# ==============================
# 清理旧镜像
# ==============================
cleanup_images() {
    log_info "清理本地Docker镜像..."
    docker image prune -f
    log_success "清理完成"
}

# ==============================
# 主函数
# ==============================
main() {
    clear
    echo "========================================"
    echo -e "${MAGENTA}🚀 Merchant System 快速部署工具${NC}"
    echo "========================================"
    echo ""
    
    # 生成版本号
    VERSION=$(generate_version)
    log_info "部署版本: ${VERSION}"
    
    # 执行部署流程
    pre_check
    select_services
    
    echo ""
    read -p "确认开始部署？(y/n): " confirm
    if [ "$confirm" != "y" ]; then
        log_warning "部署已取消"
        exit 0
    fi
    
    # 记录开始时间
    START_TIME=$(date +%s)
    
    # 执行部署
    build_and_push $VERSION
    deploy_to_k8s $VERSION
    quick_health_check
    
    # 计算耗时
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    MINUTES=$((DURATION / 60))
    SECONDS=$((DURATION % 60))
    
    # 显示结果
    show_access_info
    echo ""
    log_success "部署耗时: ${MINUTES}分${SECONDS}秒"
    
    # 询问是否清理
    read -p "是否清理本地Docker镜像？(y/n): " cleanup
    if [ "$cleanup" = "y" ]; then
        cleanup_images
    fi
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi