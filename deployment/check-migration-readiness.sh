#!/bin/bash

# ============================================
# 迁移前配置检查脚本
# ============================================
# 此脚本检查代码是否已为无痛迁移做好准备

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}       迁移前配置检查${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# 切换到项目根目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SERVER_ROOT="$PROJECT_ROOT/merchant-server"

if [ ! -d "$SERVER_ROOT" ]; then
    echo -e "${RED}❌ 错误：找不到merchant-server目录${NC}"
    exit 1
fi

cd "$SERVER_ROOT"
echo -e "检查目录: ${BLUE}$SERVER_ROOT${NC}"
echo ""

errors=0
warnings=0

# ============================================
# 1. 检查硬编码localhost
# ============================================
echo -e "${YELLOW}[1/10]${NC} 检查硬编码localhost..."

hardcoded_localhost=$(grep -r "localhost:80" --include="*.yml" --include="*.properties" . | grep -v "EUREKA_HOST" | grep -v "defaultZone" | grep -v "#" || true)

if [ -n "$hardcoded_localhost" ]; then
    echo -e "${RED}❌ 发现硬编码localhost:${NC}"
    echo "$hardcoded_localhost"
    errors=$((errors+1))
else
    echo -e "${GREEN}✅ 通过${NC}"
fi

# ============================================
# 2. 检查FeignClient硬编码URL
# ============================================
echo ""
echo -e "${YELLOW}[2/10]${NC} 检查FeignClient配置..."

feign_urls=$(grep -r "@FeignClient.*url\s*=" --include="*.java" . || true)

if [ -n "$feign_urls" ]; then
    echo -e "${RED}❌ 发现FeignClient硬编码URL:${NC}"
    echo "$feign_urls"
    errors=$((errors+1))
else
    echo -e "${GREEN}✅ 通过${NC}"
fi

# ============================================
# 3. 检查数据库配置
# ============================================
echo ""
echo -e "${YELLOW}[3/10]${NC} 检查数据库配置..."

hardcoded_db=$(find . -name "application*.yml" -exec grep -H "jdbc:mysql://localhost" {} \; 2>/dev/null | grep -v "DB_HOST" || true)

if [ -n "$hardcoded_db" ]; then
    echo -e "${RED}❌ 发现硬编码数据库地址:${NC}"
    echo "$hardcoded_db"
    errors=$((errors+1))
else
    echo -e "${GREEN}✅ 通过${NC}"
fi

# ============================================
# 4. 检查Redis配置
# ============================================
echo ""
echo -e "${YELLOW}[4/10]${NC} 检查Redis配置..."

hardcoded_redis=$(find . -name "application*.yml" -exec grep -B2 -A2 "redis:" {} \; | grep "host: localhost" | grep -v "REDIS_HOST" || true)

if [ -n "$hardcoded_redis" ]; then
    echo -e "${YELLOW}⚠️  发现硬编码Redis地址:${NC}"
    echo "$hardcoded_redis"
    warnings=$((warnings+1))
else
    echo -e "${GREEN}✅ 通过${NC}"
fi

# ============================================
# 5. 检查RabbitMQ配置
# ============================================
echo ""
echo -e "${YELLOW}[5/10]${NC} 检查RabbitMQ配置..."

hardcoded_rabbitmq=$(find . -name "application*.yml" -exec grep -B2 -A2 "rabbitmq:" {} \; | grep "host: localhost" | grep -v "RABBITMQ_HOST" || true)

if [ -n "$hardcoded_rabbitmq" ]; then
    echo -e "${YELLOW}⚠️  发现硬编码RabbitMQ地址:${NC}"
    echo "$hardcoded_rabbitmq"
    warnings=$((warnings+1))
else
    echo -e "${GREEN}✅ 通过${NC}"
fi

# ============================================
# 6. 检查Gateway路由配置
# ============================================
echo ""
echo -e "${YELLOW}[6/10]${NC} 检查Gateway路由配置..."

gateway_hardcoded=$(find gateway-service -name "application*.yml" -exec grep -A5 "routes:" {} \; | grep "uri: http://" | grep -v "lb://" || true)

if [ -n "$gateway_hardcoded" ]; then
    echo -e "${RED}❌ Gateway路由发现硬编码URI:${NC}"
    echo "$gateway_hardcoded"
    echo -e "${YELLOW}提示: 应使用 lb://服务名 格式${NC}"
    errors=$((errors+1))
else
    echo -e "${GREEN}✅ 通过${NC}"
fi

# ============================================
# 7. 检查健康检查端点配置
# ============================================
echo ""
echo -e "${YELLOW}[7/10]${NC} 检查健康检查配置..."

services=("auth-service" "merchant-service" "business-service" "notification-service" "gateway-service")
health_check_missing=()

for service in "${services[@]}"; do
    if [ -d "$service" ]; then
        if grep -q "management:" "$service/src/main/resources/application.yml" 2>/dev/null; then
            if grep -A10 "management:" "$service/src/main/resources/application.yml" | grep -q "health"; then
                echo -e "  ${GREEN}✅${NC} $service"
            else
                echo -e "  ${YELLOW}⚠️${NC}  $service (配置了management但未包含health)"
                health_check_missing+=("$service")
                warnings=$((warnings+1))
            fi
        else
            echo -e "  ${RED}❌${NC} $service (缺少management配置)"
            health_check_missing+=("$service")
            errors=$((errors+1))
        fi
    fi
done

# ============================================
# 8. 检查Eureka配置
# ============================================
echo ""
echo -e "${YELLOW}[8/10]${NC} 检查Eureka客户端配置..."

eureka_issues=()

for service in "${services[@]}"; do
    if [ -d "$service" ] && [ "$service" != "gateway-service" ]; then
        if [ -f "$service/src/main/resources/application.yml" ]; then
            if ! grep -A5 "eureka:" "$service/src/main/resources/application.yml" | grep -q "EUREKA_HOST"; then
                eureka_issues+=("$service")
            fi
        fi
    fi
done

if [ ${#eureka_issues[@]} -ne 0 ]; then
    echo -e "${RED}❌ 以下服务未使用EUREKA_HOST环境变量:${NC}"
    for service in "${eureka_issues[@]}"; do
        echo "  - $service"
    done
    errors=$((errors+1))
else
    echo -e "${GREEN}✅ 通过${NC}"
fi

# ============================================
# 9. 检查数据库连接池配置
# ============================================
echo ""
echo -e "${YELLOW}[9/10]${NC} 检查数据库连接池配置..."

large_pool_services=()

for service in "${services[@]}"; do
    if [ -f "$service/src/main/resources/application.yml" ]; then
        pool_size=$(grep "maximum-pool-size:" "$service/src/main/resources/application.yml" | awk '{print $2}' || echo "")
        if [ -n "$pool_size" ] && [ "$pool_size" -gt 10 ]; then
            large_pool_services+=("$service: $pool_size")
        fi
    fi
done

if [ ${#large_pool_services[@]} -ne 0 ]; then
    echo -e "${YELLOW}⚠️  以下服务连接池配置较大（扩展时需调整）:${NC}"
    for item in "${large_pool_services[@]}"; do
        echo "  - $item"
    done
    warnings=$((warnings+1))
else
    echo -e "${GREEN}✅ 通过${NC}"
fi

# ============================================
# 10. 检查Spring Session配置
# ============================================
echo ""
echo -e "${YELLOW}[10/10]${NC} 检查Session共享配置..."

session_redis_count=0

for service in auth-service gateway-service; do
    if [ -f "$service/pom.xml" ]; then
        if grep -q "spring-session-data-redis" "$service/pom.xml"; then
            session_redis_count=$((session_redis_count+1))
        fi
    fi
done

if [ $session_redis_count -ge 1 ]; then
    echo -e "${GREEN}✅ 已配置Spring Session Redis${NC}"
else
    echo -e "${YELLOW}⚠️  未检测到Spring Session Redis配置（多实例时可能需要）${NC}"
    warnings=$((warnings+1))
fi

# ============================================
# 总结
# ============================================
echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}           检查结果总结${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

if [ $errors -eq 0 ] && [ $warnings -eq 0 ]; then
    echo -e "${GREEN}✅ 所有检查通过！${NC}"
    echo -e "${GREEN}你的系统已为无痛迁移做好准备${NC}"
    echo ""
    exit 0
elif [ $errors -eq 0 ]; then
    echo -e "${YELLOW}⚠️  发现 $warnings 个警告${NC}"
    echo -e "${YELLOW}建议修复警告项，但不影响基本部署${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}❌ 发现 $errors 个错误和 $warnings 个警告${NC}"
    echo -e "${RED}请修复错误后再进行部署${NC}"
    echo ""
    echo -e "${YELLOW}修复建议：${NC}"
    echo "1. 所有服务间通信使用 lb://服务名"
    echo "2. 数据库/Redis/RabbitMQ使用环境变量"
    echo "3. 配置健康检查端点 (/actuator/health)"
    echo "4. Eureka配置使用 \${EUREKA_HOST}"
    echo ""
    echo -e "${YELLOW}详细文档：${NC}"
    echo "$SCRIPT_DIR/PRE_MIGRATION_CHECKLIST.md"
    echo ""
    exit 1
fi
