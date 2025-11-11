#!/bin/bash

# ============================================
# RDS MySQL连接脚本 - 通过SSH隧道
# ============================================

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SSH_KEY="$SCRIPT_DIR/merchant-system-key.pem"
EC2_HOST="35.182.43.233"
RDS_HOST="merchant-prod-db.cr88isi8scoc.ca-central-1.rds.amazonaws.com"
LOCAL_PORT=3307
RDS_PORT=3306

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  RDS MySQL SSH隧道连接${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 检查是否已有隧道在运行
if lsof -Pi :$LOCAL_PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}检测到端口 $LOCAL_PORT 已被占用${NC}"
    PID=$(lsof -Pi :$LOCAL_PORT -sTCP:LISTEN -t)
    echo -e "${YELLOW}进程 PID: $PID${NC}"

    read -p "是否关闭现有隧道？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill $PID
        echo -e "${GREEN}已关闭现有隧道${NC}"
        sleep 1
    else
        echo -e "${YELLOW}隧道已在运行，可直接使用${NC}"
        echo ""
        echo -e "${GREEN}连接信息：${NC}"
        echo "  Host: 127.0.0.1"
        echo "  Port: $LOCAL_PORT"
        echo "  User: admin"
        echo "  Pass: MerchantDB2024!Secure"
        echo ""
        echo -e "${GREEN}MySQL命令行连接：${NC}"
        echo "  mysql -h 127.0.0.1 -P $LOCAL_PORT -u admin -p'MerchantDB2024!Secure'"
        echo ""
        echo -e "${GREEN}MySQL Workbench连接：${NC}"
        echo "  Connection Method: Standard TCP/IP"
        echo "  Hostname: 127.0.0.1"
        echo "  Port: $LOCAL_PORT"
        echo "  Username: admin"
        echo "  Password: MerchantDB2024!Secure"
        exit 0
    fi
fi

# 建立SSH隧道
echo -e "${GREEN}正在建立SSH隧道...${NC}"
ssh -i "$SSH_KEY" \
  -L $LOCAL_PORT:$RDS_HOST:$RDS_PORT \
  -N -f \
  -o StrictHostKeyChecking=no \
  -o ServerAliveInterval=60 \
  -o ServerAliveCountMax=3 \
  ubuntu@$EC2_HOST

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ SSH隧道已建立${NC}"
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  连接信息${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${GREEN}本地连接地址：${NC}"
    echo "  Host: 127.0.0.1"
    echo "  Port: $LOCAL_PORT"
    echo "  User: admin"
    echo "  Pass: MerchantDB2024!Secure"
    echo ""
    echo -e "${GREEN}MySQL命令行连接：${NC}"
    echo "  mysql -h 127.0.0.1 -P $LOCAL_PORT -u admin -p'MerchantDB2024!Secure'"
    echo ""
    echo -e "${GREEN}MySQL Workbench连接配置：${NC}"
    echo "  Connection Method: Standard TCP/IP"
    echo "  Hostname: 127.0.0.1"
    echo "  Port: $LOCAL_PORT"
    echo "  Username: admin"
    echo "  Password: MerchantDB2024!Secure"
    echo ""
    echo -e "${GREEN}DataGrip / DBeaver连接配置：${NC}"
    echo "  Host: 127.0.0.1"
    echo "  Port: $LOCAL_PORT"
    echo "  Database: merchant_auth (或其他数据库)"
    echo "  User: admin"
    echo "  Password: MerchantDB2024!Secure"
    echo ""
    echo -e "${YELLOW}关闭隧道：${NC}"
    echo "  ./disconnect-rds.sh"
    echo "  或手动: kill \$(lsof -Pi :$LOCAL_PORT -sTCP:LISTEN -t)"
    echo ""
else
    echo -e "${RED}✗ SSH隧道建立失败${NC}"
    exit 1
fi
