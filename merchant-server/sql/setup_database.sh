#!/bin/bash

# =====================================================
# 商户管理系统数据库一键设置脚本
# 创建时间: 2024-07-19
# 描述: 自动创建数据库、用户、表结构和初始数据
# 支持: 本地MySQL、Docker MySQL
# =====================================================

echo "🚀 开始设置商户管理系统数据库..."

# 检查MySQL是否运行（支持本地和Docker）
echo "📋 检查MySQL服务状态..."

# 方法1：检查本地MySQL进程
if pgrep -x "mysqld" > /dev/null; then
    echo "✅ 本地MySQL进程正在运行"
    MYSQL_HOST="localhost"
    USE_DOCKER_CLIENT=false
elif pgrep -x "mysql" > /dev/null; then
    echo "✅ 本地MySQL进程正在运行"
    MYSQL_HOST="localhost"
    USE_DOCKER_CLIENT=false
else
    echo "🔍 本地MySQL未运行，检查Docker..."
    
    # 方法2：检查Docker中的MySQL
    if docker ps | grep -q mysql; then
        echo "✅ Docker中的MySQL正在运行"
        MYSQL_HOST="localhost"
        USE_DOCKER_CLIENT=true
        # 获取MySQL容器名称
        MYSQL_CONTAINER=$(docker ps | grep mysql | awk '{print $NF}')
        echo "📦 MySQL容器: $MYSQL_CONTAINER"
    elif docker ps -a | grep -q mysql; then
        echo "⚠️  Docker中的MySQL容器存在但未运行"
        echo "💡 启动命令：docker start <mysql_container_name>"
        echo "🔍 查看容器：docker ps -a | grep mysql"
        exit 1
    else
        echo "❌ 未找到MySQL服务"
        echo "💡 启动选项："
        echo "   1. 本地MySQL: brew services start mysql"
        echo "   2. Docker MySQL: docker run --name mysql -e MYSQL_ROOT_PASSWORD=your_password -p 3306:3306 -d mysql:8.0"
        exit 1
    fi
fi

# 方法3：尝试连接MySQL（不要求密码）
echo "🔍 尝试连接MySQL..."
if [ "$USE_DOCKER_CLIENT" = true ]; then
    # 使用Docker中的MySQL客户端
    if docker exec $MYSQL_CONTAINER mysql -u root -e "SELECT 1;" > /dev/null 2>&1; then
        echo "✅ MySQL连接成功（无密码）"
        MYSQL_CMD="docker exec $MYSQL_CONTAINER mysql -u root --default-character-set=utf8mb4"
        SKIP_PASSWORD=true
    else
        echo "🔐 MySQL需要密码认证"
        SKIP_PASSWORD=false
    fi
else
    # 使用本地MySQL客户端
    if mysql -h $MYSQL_HOST -u root -e "SELECT 1;" > /dev/null 2>&1; then
        echo "✅ MySQL连接成功（无密码）"
        MYSQL_CMD="mysql -h $MYSQL_HOST -u root --default-character-set=utf8mb4"
        SKIP_PASSWORD=true
    else
        echo "🔐 MySQL需要密码认证"
        SKIP_PASSWORD=false
    fi
fi

# 如果需要密码，提示用户输入
if [ "$SKIP_PASSWORD" = false ]; then
    echo "🔐 请输入MySQL root密码:"
    read -s MYSQL_ROOT_PASSWORD
    
    # 设置MySQL连接参数
    if [ "$USE_DOCKER_CLIENT" = true ]; then
        MYSQL_CMD="docker exec $MYSQL_CONTAINER mysql -u root -p${MYSQL_ROOT_PASSWORD} --default-character-set=utf8mb4"
    else
        MYSQL_CMD="mysql -h $MYSQL_HOST -u root -p${MYSQL_ROOT_PASSWORD} --default-character-set=utf8mb4"
    fi
    
    # 检查连接
    if ! $MYSQL_CMD -e "SELECT 1;" > /dev/null 2>&1; then
        echo "❌ MySQL连接失败，请检查密码"
        echo "💡 如果是Docker MySQL，请检查："
        echo "   1. 容器是否运行: docker ps | grep mysql"
        echo "   2. 端口是否正确: docker port <mysql_container_name>"
        echo "   3. 密码是否正确"
        exit 1
    fi
    
    echo "✅ MySQL连接成功"
fi

# 检查当前目录
if [ ! -f "init/01_create_databases.sql" ]; then
    echo "❌ 请在sql目录下运行此脚本"
    echo "💡 运行命令：cd sql && ./setup_database.sh"
    exit 1
fi

echo "📁 当前工作目录: $(pwd)"
echo "🔗 MySQL连接: $MYSQL_HOST"
if [ "$USE_DOCKER_CLIENT" = true ]; then
    echo "🐳 使用Docker客户端: $MYSQL_CONTAINER"
fi

# 执行初始化脚本
echo "🗄️  创建数据库..."
if [ "$USE_DOCKER_CLIENT" = true ]; then
    docker exec -i $MYSQL_CONTAINER mysql -u root ${MYSQL_ROOT_PASSWORD:+-p$MYSQL_ROOT_PASSWORD} --default-character-set=utf8mb4 < init/01_create_databases.sql
else
    $MYSQL_CMD < init/01_create_databases.sql
fi

if [ $? -eq 0 ]; then
    echo "✅ 数据库创建成功"
else
    echo "❌ 数据库创建失败"
    exit 1
fi

echo "👤 创建用户和权限..."
if [ "$USE_DOCKER_CLIENT" = true ]; then
    docker exec -i $MYSQL_CONTAINER mysql -u root ${MYSQL_ROOT_PASSWORD:+-p$MYSQL_ROOT_PASSWORD} --default-character-set=utf8mb4 < init/02_create_users.sql
else
    $MYSQL_CMD < init/02_create_users.sql
fi

if [ $? -eq 0 ]; then
    echo "✅ 用户创建成功"
else
    echo "❌ 用户创建失败"
    exit 1
fi

# 执行表结构脚本
echo "📊 创建认证服务表结构..."
if [ "$USE_DOCKER_CLIENT" = true ]; then
    docker exec -i $MYSQL_CONTAINER mysql -u root ${MYSQL_ROOT_PASSWORD:+-p$MYSQL_ROOT_PASSWORD} --default-character-set=utf8mb4 < schema/01_auth_tables.sql
else
    $MYSQL_CMD < schema/01_auth_tables.sql
fi

if [ $? -eq 0 ]; then
    echo "✅ 认证服务表结构创建成功"
else
    echo "❌ 认证服务表结构创建失败"
    exit 1
fi

echo "🏪 创建商户管理表结构..."
if [ "$USE_DOCKER_CLIENT" = true ]; then
    docker exec -i $MYSQL_CONTAINER mysql -u root ${MYSQL_ROOT_PASSWORD:+-p$MYSQL_ROOT_PASSWORD} --default-character-set=utf8mb4 < schema/02_merchant_tables.sql
else
    $MYSQL_CMD < schema/02_merchant_tables.sql
fi

if [ $? -eq 0 ]; then
    echo "✅ 商户管理表结构创建成功"
else
    echo "❌ 商户管理表结构创建失败"
    exit 1
fi

echo "💼 创建业务核心表结构..."
if [ "$USE_DOCKER_CLIENT" = true ]; then
    docker exec -i $MYSQL_CONTAINER mysql -u root ${MYSQL_ROOT_PASSWORD:+-p$MYSQL_ROOT_PASSWORD} --default-character-set=utf8mb4 < schema/03_business_tables.sql
else
    $MYSQL_CMD < schema/03_business_tables.sql
fi

if [ $? -eq 0 ]; then
    echo "✅ 业务核心表结构创建成功"
else
    echo "❌ 业务核心表结构创建失败"
    exit 1
fi

# 执行初始数据脚本
echo "📝 插入初始数据..."
if [ "$USE_DOCKER_CLIENT" = true ]; then
    docker exec -i $MYSQL_CONTAINER mysql -u root ${MYSQL_ROOT_PASSWORD:+-p$MYSQL_ROOT_PASSWORD} --default-character-set=utf8mb4 < data/01_init_data.sql
else
    $MYSQL_CMD < data/01_init_data.sql
fi

if [ $? -eq 0 ]; then
    echo "✅ 初始数据插入成功"
else
    echo "❌ 初始数据插入失败"
    exit 1
fi

echo ""
echo "�� 数据库设置完成！"
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
if [ "$USE_DOCKER_CLIENT" = true ]; then
    echo "  docker exec $MYSQL_CONTAINER mysql -u merchant_app -p merchant_auth"
    echo "  docker exec $MYSQL_CONTAINER mysql -u merchant_readonly -p merchant_analytics"
else
    echo "  mysql -h $MYSQL_HOST -u merchant_app -p merchant_auth"
    echo "  mysql -h $MYSQL_HOST -u merchant_readonly -p merchant_analytics"
fi 