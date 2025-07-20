#!/bin/bash

echo "正在初始化数据库..."

# 检查MySQL是否运行
if ! pgrep -x "mysqld" > /dev/null; then
    echo "MySQL服务未运行，请先启动MySQL服务"
    exit 1
fi

# 执行数据库初始化脚本
echo "执行数据库初始化脚本..."
mysql -u merchant_app -p'MerchantApp@2024' < database-init.sql

if [ $? -eq 0 ]; then
    echo "数据库初始化成功！"
    echo "字符集设置："
    mysql -u merchant_app -p'MerchantApp@2024' -e "SHOW VARIABLES LIKE 'character_set%';"
else
    echo "数据库初始化失败，请检查MySQL连接和权限"
    exit 1
fi 