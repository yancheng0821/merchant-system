#!/bin/bash

# =====================================================
# 商户管理系统数据库设置脚本（Docker版本）
# 创建时间: 2024-07-19
# 描述: 自动创建数据库、用户、表结构和初始数据
# 适用于: Docker MySQL
# =====================================================

echo "🚀 开始设置商户管理系统数据库（Docker版本）..."

# 检查Docker中的MySQL
echo "📋 检查Docker MySQL服务状态..."

if docker ps | grep -q mysql; then
    echo "✅ Docker中的MySQL正在运行"
    MYSQL_CONTAINER=$(docker ps | grep mysql | awk '{print $NF}')
    echo "📦 MySQL容器: $MYSQL_CONTAINER"
else
    echo "❌ Docker中的MySQL未运行"
    echo "💡 请先启动MySQL容器"
    exit 1
fi

# 设置MySQL连接参数（使用密码123456）
MYSQL_ROOT_PASSWORD="123456"
echo "🔐 使用默认密码: $MYSQL_ROOT_PASSWORD"

# 检查连接
echo "🔍 测试MySQL连接..."
if docker exec $MYSQL_CONTAINER mysql -u root -p$MYSQL_ROOT_PASSWORD -e "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ MySQL连接成功"
else
    echo "❌ MySQL连接失败，请检查密码"
    exit 1
fi

# 检查当前目录
if [ ! -f "init/01_create_databases.sql" ]; then
    echo "❌ 请在sql目录下运行此脚本"
    echo "💡 运行命令：cd sql && ./setup_database_docker.sh"
    exit 1
fi

echo "📁 当前工作目录: $(pwd)"
echo "🐳 使用Docker客户端: $MYSQL_CONTAINER"

# 执行初始化脚本
echo "🗄️  创建数据库..."
docker exec -i $MYSQL_CONTAINER mysql -u root -p$MYSQL_ROOT_PASSWORD --default-character-set=utf8mb4 < init/01_create_databases.sql
if [ $? -eq 0 ]; then
    echo "✅ 数据库创建成功"
else
    echo "❌ 数据库创建失败"
    exit 1
fi

echo "👤 创建用户和权限..."
docker exec -i $MYSQL_CONTAINER mysql -u root -p$MYSQL_ROOT_PASSWORD --default-character-set=utf8mb4 < init/02_create_users.sql
if [ $? -eq 0 ]; then
    echo "✅ 用户创建成功"
else
    echo "❌ 用户创建失败"
    exit 1
fi

# 执行表结构脚本
echo "📊 创建认证服务表结构..."
docker exec -i $MYSQL_CONTAINER mysql -u root -p$MYSQL_ROOT_PASSWORD --default-character-set=utf8mb4 < schema/01_auth_tables.sql
if [ $? -eq 0 ]; then
    echo "✅ 认证服务表结构创建成功"
else
    echo "❌ 认证服务表结构创建失败"
    exit 1
fi

echo "🏪 创建商户管理表结构..."
docker exec -i $MYSQL_CONTAINER mysql -u root -p$MYSQL_ROOT_PASSWORD --default-character-set=utf8mb4 < schema/02_merchant_tables.sql
if [ $? -eq 0 ]; then
    echo "✅ 商户管理表结构创建成功"
else
    echo "❌ 商户管理表结构创建失败"
    exit 1
fi

echo "💼 创建业务核心表结构..."
docker exec -i $MYSQL_CONTAINER mysql -u root -p$MYSQL_ROOT_PASSWORD --default-character-set=utf8mb4 < schema/03_business_tables.sql
if [ $? -eq 0 ]; then
    echo "✅ 业务核心表结构创建成功"
else
    echo "❌ 业务核心表结构创建失败"
    exit 1
fi

# 执行初始数据脚本
echo "📝 插入初始数据..."
docker exec -i $MYSQL_CONTAINER mysql -u root -p$MYSQL_ROOT_PASSWORD --default-character-set=utf8mb4 < data/01_init_data.sql
if [ $? -eq 0 ]; then
    echo "✅ 初始数据插入成功"
else
    echo "❌ 初始数据插入失败"
    exit 1
fi

echo ""
echo "🎉 数据库设置完成！"
echo ""
echo "📋 数据库信息："
echo "  🔐 认证数据库: merchant_auth"
echo "  🏪 商户数据库: merchant_management"
echo "  💼 业务数据库: merchant_business"
echo "  🤖 AI数据库: merchant_ai"
echo "  📊 分析数据库: merchant_analytics"
echo "  📧 通知数据库: merchant_notification"
echo ""
echo "👤 用户信息："
echo "  应用用户: merchant_app / MerchantApp@2024"
echo "  只读用户: merchant_readonly / MerchantRead@2024"
echo ""
echo "🧪 测试用户："
echo "  管理员: admin / 123456"
echo "  连锁店管理员: manager / 123456"
echo "  分店管理员: branch_manager / 123456"
echo "  员工: staff1 / 123456"
echo ""
echo "🔗 连接示例："
echo "  docker exec $MYSQL_CONTAINER mysql -u merchant_app -p merchant_auth"
echo "  docker exec $MYSQL_CONTAINER mysql -u merchant_readonly -p merchant_analytics"
echo ""
echo "🔗 直接连接："
echo "  docker exec -it $MYSQL_CONTAINER mysql -u root -p" 