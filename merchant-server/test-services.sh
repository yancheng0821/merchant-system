#!/bin/bash

echo "🧪 测试微服务连接..."

# 测试Eureka服务注册中心
echo "📡 测试Eureka服务注册中心..."
curl -s http://localhost:8761/actuator/health || echo "❌ Eureka服务未启动"

# 测试认证服务
echo "🔐 测试认证服务..."
curl -s http://localhost:8081/api/auth/health || echo "❌ 认证服务未启动"

# 测试网关服务
echo "🚪 测试网关服务..."
curl -s http://localhost:8080/actuator/health || echo "❌ 网关服务未启动"

# 测试通过网关访问认证服务
echo "🔗 测试通过网关访问认证服务..."
curl -s http://localhost:8080/api/auth/health || echo "❌ 网关路由失败"

echo ""
echo "✅ 测试完成！"
echo ""
echo "📋 服务状态："
echo "  📡 Eureka: http://localhost:8761"
echo "  🔐 认证服务: http://localhost:8081"
echo "  🚪 网关服务: http://localhost:8080"
echo ""
echo "🔗 通过网关访问: http://localhost:8080/api/auth/health" 