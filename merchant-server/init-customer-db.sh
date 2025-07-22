#!/bin/bash

# Customer Management Database Initialization Script
# 客户管理数据库初始化脚本

echo "Initializing Customer Management Database..."

# 数据库连接参数
DB_HOST="localhost"
DB_PORT="3306"
DB_NAME="merchant_business"
DB_USER="root"
DB_PASSWORD="password"

# 检查MySQL是否运行
if ! docker ps | grep -q mysql; then
    echo "Starting MySQL container..."
    docker-compose up -d mysql
    sleep 10
fi

# 创建数据库（如果不存在）
echo "Creating database if not exists..."
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 执行表结构SQL
echo "Creating tables..."
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD $DB_NAME < sql/customer_management.sql

# 插入测试数据
echo "Inserting test data..."
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD $DB_NAME < sql/customer_test_data.sql

echo "Customer Management Database initialization completed!"
echo "You can now start the business-service:"
echo "cd business-service && mvn spring-boot:run"