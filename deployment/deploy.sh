#!/bin/bash

# ============================================
# 一键部署脚本 - 支持选择性部署服务
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
DEPLOY_DIR="/home/ubuntu/merchant-system"
IMAGES_DIR="/Users/aisenyc/merchant-system/deployment/images"
SERVER_DIR="/Users/aisenyc/merchant-system/merchant-server"

# All available services
ALL_SERVICES=("eureka-server" "gateway-service" "auth-service" "merchant-service" "business-service" "notification-service")

# Services to deploy (will be set based on arguments)
DEPLOY_SERVICES=()

# Flags
SKIP_BUILD=false
BUILD_ONLY=false
DEPLOY_ONLY=false

# Function to show usage
show_usage() {
    echo -e "${BLUE}=========================================="
    echo "一键部署脚本 - 支持选择性部署"
    echo -e "==========================================${NC}"
    echo ""
    echo "用法: $0 [选项] [服务名...]"
    echo ""
    echo "选项:"
    echo "  --all           部署所有服务（默认）"
    echo "  --skip-build    跳过编译和构建镜像步骤"
    echo "  --build-only    只编译和构建镜像，不上传部署"
    echo "  --deploy-only   只上传和部署（使用已有镜像）"
    echo "  --help          显示此帮助信息"
    echo ""
    echo "服务名:"
    echo "  eureka-server       - 服务注册中心"
    echo "  gateway-service     - API网关"
    echo "  auth-service        - 认证服务"
    echo "  merchant-service    - 商户服务"
    echo "  business-service    - 业务服务"
    echo "  notification-service - 通知服务"
    echo ""
    echo "示例:"
    echo "  $0                                    # 部署所有服务"
    echo "  $0 --all                              # 部署所有服务"
    echo "  $0 auth-service business-service      # 只部署认证和业务服务"
    echo "  $0 --skip-build gateway-service       # 跳过编译，只部署网关"
    echo "  $0 --build-only eureka-server         # 只编译构建Eureka"
    echo ""
    echo "部署流程:"
    echo "  1. 本地编译JAR文件（在merchant-server目录下执行mvn）"
    echo "  2. 构建Docker镜像"
    echo "  3. 保存镜像为tar文件"
    echo "  4. 上传到EC2服务器"
    echo "  5. 在EC2上加载镜像"
    echo "  6. 重启指定的服务"
    echo "  7. 验证服务健康状态"
    echo ""
}

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

# Function to validate service name
is_valid_service() {
    local service=$1
    for s in "${ALL_SERVICES[@]}"; do
        if [ "$s" = "$service" ]; then
            return 0
        fi
    done
    return 1
}

# Step 1: Build JARs (only for selected services)
build_jars() {
    print_step "步骤 1/7: 编译JAR文件（本地编译）"
    
    print_info "编译目录: $SERVER_DIR"
    print_info "编译方式: Maven本地构建"
    echo ""

    cd "$SERVER_DIR"

    if [ ${#DEPLOY_SERVICES[@]} -eq ${#ALL_SERVICES[@]} ]; then
        # 编译所有服务
        echo "编译所有服务..."
        echo "执行: mvn clean package -DskipTests"
        mvn clean package -DskipTests
    else
        # 只编译选中的服务
        echo "只编译选中的服务: ${DEPLOY_SERVICES[*]}"
        
        # 构建Maven项目列表
        local maven_projects=""
        for service in "${DEPLOY_SERVICES[@]}"; do
            maven_projects="${maven_projects} -pl ${service}"
        done
        
        echo "执行: mvn clean package -DskipTests $maven_projects -am"
        mvn clean package -DskipTests $maven_projects -am
    fi

    if [ $? -eq 0 ]; then
        print_success "JAR编译成功"
        echo ""
        echo "编译的JAR文件:"
        for service in "${DEPLOY_SERVICES[@]}"; do
            ls -lh ${service}/target/*.jar 2>/dev/null | grep -v sources | grep -v javadoc | head -1
        done
    else
        print_error "编译失败"
        exit 1
    fi
}

# Step 2: Build Docker images
build_images() {
    print_step "步骤 2/7: 构建Docker镜像"

    cd "$SERVER_DIR"

    for SERVICE in "${DEPLOY_SERVICES[@]}"; do
        echo -e "${YELLOW}构建: $SERVICE${NC}"
        docker build -t merchant/${SERVICE}:latest -f ${SERVICE}/Dockerfile .

        if [ $? -eq 0 ]; then
            print_success "$SERVICE 构建成功"
        else
            print_error "$SERVICE 构建失败"
            exit 1
        fi
    done

    echo ""
    echo "构建的镜像:"
    for SERVICE in "${DEPLOY_SERVICES[@]}"; do
        docker images | grep "merchant/${SERVICE}"
    done
}

# Step 3: Save images
save_images() {
    print_step "步骤 3/7: 保存镜像为tar文件"

    mkdir -p "$IMAGES_DIR"

    for SERVICE in "${DEPLOY_SERVICES[@]}"; do
        echo -e "${YELLOW}保存: $SERVICE${NC}"
        docker save -o "${IMAGES_DIR}/${SERVICE}.tar" merchant/${SERVICE}:latest

        if [ $? -eq 0 ]; then
            FILE_SIZE=$(ls -lh "${IMAGES_DIR}/${SERVICE}.tar" | awk '{print $5}')
            print_success "$SERVICE 保存成功 ($FILE_SIZE)"
        else
            print_error "$SERVICE 保存失败"
            exit 1
        fi
    done

    if [ ${#DEPLOY_SERVICES[@]} -gt 0 ]; then
        TOTAL_SIZE=$(du -sh "$IMAGES_DIR" | awk '{print $1}')
        echo ""
        print_success "镜像已保存，总大小: $TOTAL_SIZE"
    fi
}

# Step 4: Upload to EC2
upload_to_ec2() {
    print_step "步骤 4/7: 上传到EC2服务器"

    # 创建远程目录
    echo "创建远程目录..."
    ssh -i "$SSH_KEY" ${EC2_USER}@${EC2_HOST} "mkdir -p ${DEPLOY_DIR}/images"

    # 创建日志目录（为日志持久化准备）
    echo "创建日志目录..."
    ssh -i "$SSH_KEY" ${EC2_USER}@${EC2_HOST} "mkdir -p ${DEPLOY_DIR}/logs/{eureka-server,gateway-service,auth-service,merchant-service,business-service,analytics-service,notification-service} && chmod -R 777 ${DEPLOY_DIR}/logs"

    # 上传镜像tar文件
    echo ""
    echo -e "${YELLOW}上传镜像文件...${NC}"
    for SERVICE in "${DEPLOY_SERVICES[@]}"; do
        echo "上传: ${SERVICE}.tar"
        scp -i "$SSH_KEY" ${IMAGES_DIR}/${SERVICE}.tar ${EC2_USER}@${EC2_HOST}:${DEPLOY_DIR}/images/
        
        if [ $? -eq 0 ]; then
            print_success "${SERVICE}.tar 上传成功"
        else
            print_error "${SERVICE}.tar 上传失败"
            exit 1
        fi
    done

    # 始终上传配置文件（确保环境变量是最新的）
    echo ""
    echo -e "${YELLOW}上传配置文件...${NC}"
    scp -i "$SSH_KEY" /Users/aisenyc/merchant-system/deployment/.env ${EC2_USER}@${EC2_HOST}:${DEPLOY_DIR}/
    scp -i "$SSH_KEY" /Users/aisenyc/merchant-system/deployment/docker-compose.production.yml ${EC2_USER}@${EC2_HOST}:${DEPLOY_DIR}/docker-compose.yml

    if [ $? -eq 0 ]; then
        print_success "配置文件上传成功"
    else
        print_error "配置文件上传失败"
        exit 1
    fi
}

# Step 5: Load images on EC2
load_images() {
    print_step "步骤 5/7: 在EC2上加载Docker镜像"

    for SERVICE in "${DEPLOY_SERVICES[@]}"; do
        echo -e "${YELLOW}加载: $SERVICE${NC}"
        ssh -i "$SSH_KEY" ${EC2_USER}@${EC2_HOST} "docker load -i ${DEPLOY_DIR}/images/${SERVICE}.tar"

        if [ $? -eq 0 ]; then
            print_success "$SERVICE 加载成功"
        else
            print_error "$SERVICE 加载失败"
            exit 1
        fi
    done

    echo ""
    echo "EC2上的镜像:"
    for SERVICE in "${DEPLOY_SERVICES[@]}"; do
        ssh -i "$SSH_KEY" ${EC2_USER}@${EC2_HOST} "docker images | grep merchant/${SERVICE}"
    done
}

# Step 6: Start/Restart services
start_services() {
    print_step "步骤 6/7: 重启服务"

    if [ ${#DEPLOY_SERVICES[@]} -eq ${#ALL_SERVICES[@]} ]; then
        # 重启所有服务
        echo "停止所有服务..."
        ssh -i "$SSH_KEY" ${EC2_USER}@${EC2_HOST} "cd ${DEPLOY_DIR} && docker-compose down 2>/dev/null || true"

        echo ""
        echo "启动所有服务..."
        ssh -i "$SSH_KEY" ${EC2_USER}@${EC2_HOST} "cd ${DEPLOY_DIR} && docker-compose up -d"
    else
        # 只重启指定的服务
        echo "重启指定的服务: ${DEPLOY_SERVICES[*]}"
        for SERVICE in "${DEPLOY_SERVICES[@]}"; do
            echo -e "${YELLOW}重启: $SERVICE${NC}"
            # 停止并删除容器，然后重新创建（确保环境变量从.env重新读取）
            ssh -i "$SSH_KEY" ${EC2_USER}@${EC2_HOST} "cd ${DEPLOY_DIR} && docker-compose stop ${SERVICE} && docker-compose rm -f ${SERVICE} && docker-compose up -d ${SERVICE}"

            if [ $? -eq 0 ]; then
                print_success "$SERVICE 重启成功"
            else
                print_error "$SERVICE 重启失败"
            fi
        done
    fi

    echo ""
    echo "服务状态:"
    ssh -i "$SSH_KEY" ${EC2_USER}@${EC2_HOST} "cd ${DEPLOY_DIR} && docker-compose ps"
}

# Step 7: Verify services
verify_services() {
    print_step "步骤 7/7: 验证服务健康状态"

    print_warning "等待服务启动... (30秒)"
    sleep 30

    echo ""
    echo "检查服务健康状态..."

    # 检查Eureka（如果部署了）
    if [[ " ${DEPLOY_SERVICES[*]} " =~ " eureka-server " ]]; then
        echo -e "${YELLOW}检查 Eureka Server...${NC}"
        EUREKA_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://${EC2_HOST}:8761/actuator/health)
        if [ "$EUREKA_STATUS" = "200" ]; then
            print_success "Eureka Server: 健康"
        else
            print_warning "Eureka Server: 可能还在启动中 (HTTP $EUREKA_STATUS)"
        fi
    fi

    # 检查Gateway（如果部署了）
    if [[ " ${DEPLOY_SERVICES[*]} " =~ " gateway-service " ]]; then
        echo -e "${YELLOW}检查 API Gateway...${NC}"
        GATEWAY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://${EC2_HOST}:8080/actuator/health)
        if [ "$GATEWAY_STATUS" = "200" ]; then
            print_success "API Gateway: 健康"
        else
            print_warning "API Gateway: 可能还在启动中 (HTTP $GATEWAY_STATUS)"
        fi
    fi

    echo ""
    echo "查看部署服务的日志（最后15行）:"
    for SERVICE in "${DEPLOY_SERVICES[@]}"; do
        echo ""
        echo -e "${BLUE}=== $SERVICE ===${NC}"
        ssh -i "$SSH_KEY" ${EC2_USER}@${EC2_HOST} "cd ${DEPLOY_DIR} && docker-compose logs --tail=15 ${SERVICE}"
    done
}

# Parse arguments
parse_arguments() {
    local deploy_all=false
    
    for arg in "$@"; do
        case $arg in
            --all)
                deploy_all=true
                ;;
            --skip-build)
                SKIP_BUILD=true
                ;;
            --build-only)
                BUILD_ONLY=true
                ;;
            --deploy-only)
                DEPLOY_ONLY=true
                ;;
            --help)
                show_usage
                exit 0
                ;;
            -*)
                print_error "未知选项: $arg"
                show_usage
                exit 1
                ;;
            *)
                # 服务名
                if is_valid_service "$arg"; then
                    DEPLOY_SERVICES+=("$arg")
                else
                    print_error "无效的服务名: $arg"
                    echo ""
                    echo "有效的服务名: ${ALL_SERVICES[*]}"
                    exit 1
                fi
                ;;
        esac
    done

    # 如果没有指定服务，默认部署所有
    if [ ${#DEPLOY_SERVICES[@]} -eq 0 ] || [ "$deploy_all" = true ]; then
        DEPLOY_SERVICES=("${ALL_SERVICES[@]}")
    fi
}

# Main deployment function
deploy_all() {
    echo -e "${BLUE}==========================================${NC}"
    echo -e "${BLUE}      商户系统部署到AWS EC2${NC}"
    echo -e "${BLUE}==========================================${NC}"
    echo ""
    echo "EC2地址: ${EC2_HOST}"
    echo "部署目录: ${DEPLOY_DIR}"
    echo "编译目录: ${SERVER_DIR}"
    echo "编译方式: Maven本地构建"
    echo ""
    echo "部署服务: ${DEPLOY_SERVICES[*]}"
    echo ""

    if [ "$DEPLOY_ONLY" = true ]; then
        # 只部署
        upload_to_ec2
        load_images
        start_services
        verify_services
    elif [ "$BUILD_ONLY" = true ]; then
        # 只构建
        build_jars
        build_images
        save_images
    else
        # 完整流程
        if [ "$SKIP_BUILD" = false ]; then
            build_jars
            build_images
            save_images
        else
            print_warning "跳过构建步骤，使用已有镜像"
        fi

        upload_to_ec2
        load_images
        start_services
        verify_services
    fi

    echo ""
    echo -e "${BLUE}==========================================${NC}"
    echo -e "${GREEN}✓ 部署完成！${NC}"
    echo -e "${BLUE}==========================================${NC}"
    echo ""
    echo "访问地址:"
    echo -e "${BLUE}  Eureka: http://${EC2_HOST}:8761${NC}"
    echo -e "${BLUE}  Gateway: http://${EC2_HOST}:8080${NC}"
    echo ""
    echo "常用命令:"
    echo "  # 查看所有服务日志（Docker输出）"
    echo "  ssh -i $SSH_KEY ${EC2_USER}@${EC2_HOST} 'cd ${DEPLOY_DIR} && docker-compose logs -f'"
    echo ""
    echo "  # 查看单个服务日志（Docker输出）"
    echo "  ssh -i $SSH_KEY ${EC2_USER}@${EC2_HOST} 'cd ${DEPLOY_DIR} && docker-compose logs -f auth-service'"
    echo ""
    echo "  # 查看持久化日志文件"
    echo "  ssh -i $SSH_KEY ${EC2_USER}@${EC2_HOST} 'tail -f ${DEPLOY_DIR}/logs/business-service/business-service.log'"
    echo ""
    echo "  # 重启单个服务"
    echo "  ssh -i $SSH_KEY ${EC2_USER}@${EC2_HOST} 'cd ${DEPLOY_DIR} && docker-compose restart auth-service'"
    echo ""
    echo "  # 停止所有服务"
    echo "  ssh -i $SSH_KEY ${EC2_USER}@${EC2_HOST} 'cd ${DEPLOY_DIR} && docker-compose down'"
    echo ""
}

# Main script entry
parse_arguments "$@"
deploy_all

exit 0
