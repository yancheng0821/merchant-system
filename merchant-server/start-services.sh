#!/bin/bash

echo "🚀 启动商户管理系统微服务..."

# 检查Java版本
echo "📋 检查Java版本..."
java -version

# 检查Maven版本
echo "📋 检查Maven版本..."
mvn -version

# 构建整个项目
echo "🔨 构建项目..."
mvn clean install -DskipTests

# 启动各个服务
echo "🌟 启动微服务..."

# 启动认证服务
echo "🔐 启动认证服务 (端口: 8081)..."
cd auth-service
mvn spring-boot:run &
AUTH_PID=$!
cd ..

# 等待认证服务启动
sleep 10

# 启动商户服务
echo "🏪 启动商户服务 (端口: 8082)..."
cd merchant-service
mvn spring-boot:run &
MERCHANT_PID=$!
cd ..

# 启动业务服务
echo "💼 启动业务服务 (端口: 8083)..."
cd business-service
mvn spring-boot:run &
BUSINESS_PID=$!
cd ..

# 启动AI服务
echo "🤖 启动AI服务 (端口: 8084)..."
cd ai-service
mvn spring-boot:run &
AI_PID=$!
cd ..

# 启动分析服务
echo "📊 启动分析服务 (端口: 8085)..."
cd analytics-service
mvn spring-boot:run &
ANALYTICS_PID=$!
cd ..

# 启动通知服务
echo "📧 启动通知服务 (端口: 8086)..."
cd notification-service
mvn spring-boot:run &
NOTIFICATION_PID=$!
cd ..

# 启动网关服务
echo "🚪 启动网关服务 (端口: 8080)..."
cd gateway-service
mvn spring-boot:run &
GATEWAY_PID=$!
cd ..

echo "✅ 所有服务启动完成！"
echo ""
echo "📋 服务状态："
echo "  🔐 认证服务: http://localhost:8081"
echo "  🏪 商户服务: http://localhost:8082"
echo "  💼 业务服务: http://localhost:8083"
echo "  🤖 AI服务: http://localhost:8084"
echo "  📊 分析服务: http://localhost:8085"
echo "  📧 通知服务: http://localhost:8086"
echo "  🚪 网关服务: http://localhost:8080"
echo ""
echo "🔗 API网关统一入口: http://localhost:8080"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
wait 