#!/bin/bash

# ==============================
# 配置
# ==============================
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
# 检查Pod状态
# ==============================
check_pod_status() {
    log_info "检查 Pod 状态..."
    
    echo ""
    echo "📊 Pod 状态:"
    echo "=================="
    kubectl get pods -n ${NAMESPACE} -o wide
    
    # 检查是否有失败的Pod
    FAILED_PODS=$(kubectl get pods -n ${NAMESPACE} --field-selector=status.phase!=Running --no-headers | wc -l)
    if [ $FAILED_PODS -gt 0 ]; then
        log_warning "发现 ${FAILED_PODS} 个非运行状态的 Pod"
        kubectl get pods -n ${NAMESPACE} --field-selector=status.phase!=Running
    else
        log_success "所有 Pod 运行正常"
    fi
}

# ==============================
# 检查镜像版本
# ==============================
check_image_versions() {
    log_info "检查镜像版本..."
    
    echo ""
    echo "📦 镜像版本信息:"
    echo "=================="
    
    SERVICES=("merchant-admin" "auth-service" "business-service" "merchant-service" "analytics-service" "notification-service" "ai-service-python")
    
    for service in "${SERVICES[@]}"; do
        IMAGE=$(kubectl get deployment ${service} -n ${NAMESPACE} -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null)
        if [ ! -z "$IMAGE" ]; then
            echo "${service}: ${IMAGE}"
        else
            log_warning "${service} 镜像信息获取失败"
        fi
    done
}

# ==============================
# 检查服务状态
# ==============================
check_service_status() {
    log_info "检查服务状态..."
    
    echo ""
    echo "🔗 服务状态:"
    echo "=================="
    kubectl get services -n ${NAMESPACE}
    
    # 检查服务端点
    echo ""
    echo "📍 服务端点:"
    echo "=================="
    kubectl get endpoints -n ${NAMESPACE}
}

# ==============================
# 检查Ingress状态
# ==============================
check_ingress_status() {
    log_info "检查 Ingress 状态..."
    
    echo ""
    echo "🌐 Ingress 状态:"
    echo "=================="
    kubectl get ingress -n ${NAMESPACE}
    
    # 检查Ingress地址
    INGRESS_ADDRESS=$(kubectl get ingress -n ${NAMESPACE} -o jsonpath='{.items[0].status.loadBalancer.ingress[0].hostname}' 2>/dev/null)
    if [ ! -z "$INGRESS_ADDRESS" ]; then
        echo ""
        echo "🌍 访问地址:"
        echo "=================="
        echo "前端: https://swiftmindsystems.com"
        echo "API: https://api.swiftmindsystems.com"
        echo "负载均衡器: ${INGRESS_ADDRESS}"
    fi
}

# ==============================
# 检查服务日志
# ==============================
check_service_logs() {
    log_info "检查关键服务日志..."
    
    echo ""
    echo "📋 服务日志摘要:"
    echo "=================="
    
    # 检查business-service日志
    echo "business-service 日志:"
    if kubectl logs -n ${NAMESPACE} deployment/business-service --tail=3 2>/dev/null | grep -q "Started BusinessServiceApplication"; then
        log_success "  ✅ 启动成功"
    else
        log_warning "  ⚠️  可能未完全启动"
    fi
    
    # 检查auth-service日志
    echo "auth-service 日志:"
    if kubectl logs -n ${NAMESPACE} deployment/auth-service --tail=3 2>/dev/null | grep -q "Started AuthServiceApplication"; then
        log_success "  ✅ 启动成功"
    else
        log_warning "  ⚠️  可能未完全启动"
    fi
    
    # 检查ai-service日志
    echo "ai-service 日志:"
    if kubectl logs -n ${NAMESPACE} deployment/ai-service-python --tail=3 2>/dev/null | grep -q "INFO.*Uvicorn running"; then
        log_success "  ✅ 启动成功"
    else
        log_warning "  ⚠️  可能未完全启动"
    fi
}

# ==============================
# API健康检查
# ==============================
check_api_health() {
    log_info "执行 API 健康检查..."
    
    echo ""
    echo "🔍 API 健康检查:"
    echo "=================="
    
    local API_BASE="https://api.swiftmindsystems.com"
    local FRONTEND_URL="https://swiftmindsystems.com"
    
    # 测试前端可访问性
    echo "前端可访问性:"
    if curl -s -I "${FRONTEND_URL}" --insecure | grep -q "200"; then
        log_success "  ✅ 前端可访问"
    else
        log_warning "  ⚠️  前端访问失败"
    fi
    
    # 测试AI服务
    echo "AI 服务:"
    if curl -s -X POST "${API_BASE}/api/ai/recommend-appointment" \
        -H "Content-Type: application/json" \
        -d '{"customerId":"test","customerName":"Test","orders":[]}' \
        --insecure | grep -q "success"; then
        log_success "  ✅ AI 服务正常"
    else
        log_warning "  ⚠️  AI 服务异常"
    fi
    
    # 测试头像API
    echo "头像 API:"
    if curl -s -I "${API_BASE}/api/auth/users/avatar/test.jpg" --insecure | grep -q "404\|200"; then
        log_success "  ✅ 头像 API 正常"
    else
        log_warning "  ⚠️  头像 API 异常"
    fi
}

# ==============================
# 检查资源使用情况
# ==============================
check_resource_usage() {
    log_info "检查资源使用情况..."
    
    echo ""
    echo "💾 资源使用情况:"
    echo "=================="
    
    # 检查CPU和内存使用
    kubectl top pods -n ${NAMESPACE} 2>/dev/null || echo "无法获取资源使用情况（需要安装 metrics-server）"
    
    # 检查节点资源
    echo ""
    echo "🖥️  节点资源:"
    echo "=================="
    kubectl top nodes 2>/dev/null || echo "无法获取节点资源使用情况"
}

# ==============================
# 检查最近的事件
# ==============================
check_recent_events() {
    log_info "检查最近的事件..."
    
    echo ""
    echo "📅 最近事件:"
    echo "=================="
    kubectl get events -n ${NAMESPACE} --sort-by='.lastTimestamp' | tail -10
}

# ==============================
# 生成部署报告
# ==============================
generate_report() {
    log_info "生成部署报告..."
    
    echo ""
    echo "📊 部署报告摘要:"
    echo "=================="
    
    # 统计信息
    TOTAL_PODS=$(kubectl get pods -n ${NAMESPACE} --no-headers | wc -l | tr -d ' ')
    RUNNING_PODS=$(kubectl get pods -n ${NAMESPACE} --field-selector=status.phase=Running --no-headers | wc -l | tr -d ' ')
    TOTAL_SERVICES=$(kubectl get services -n ${NAMESPACE} --no-headers | wc -l | tr -d ' ')
    
    echo "总 Pod 数量: ${TOTAL_PODS}"
    echo "运行中 Pod 数量: ${RUNNING_PODS}"
    echo "服务数量: ${TOTAL_SERVICES}"
    
    if [ $TOTAL_PODS -eq $RUNNING_PODS ]; then
        log_success "🎉 所有服务运行正常！"
    else
        log_warning "⚠️  有 ${TOTAL_PODS} - ${RUNNING_PODS} = $((TOTAL_PODS - RUNNING_PODS)) 个 Pod 未正常运行"
    fi
    
    echo ""
    echo "🌐 访问地址:"
    echo "=================="
    echo "前端: https://swiftmindsystems.com"
    echo "API: https://api.swiftmindsystems.com"
}

# ==============================
# 主函数
# ==============================
main() {
    log_info "开始部署状态检查..."
    
    # 检查kubectl连接
    if ! kubectl cluster-info &> /dev/null; then
        log_error "无法连接到 Kubernetes 集群"
        exit 1
    fi
    
    # 执行各项检查
    check_pod_status
    check_image_versions
    check_service_status
    check_ingress_status
    check_service_logs
    check_api_health
    check_resource_usage
    check_recent_events
    generate_report
    
    log_success "部署状态检查完成！"
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 