#!/bin/bash
# 测试部署脚本的功能

set -e

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "========================================"
echo "    部署脚本功能测试"
echo "========================================"
echo ""

# 检查脚本是否存在
if [[ ! -f "./rapid-deploy.sh" ]]; then
    echo -e "${RED}错误: rapid-deploy.sh 不存在${NC}"
    exit 1
fi

if [[ ! -f "./fix-efs-structure.sh" ]]; then
    echo -e "${YELLOW}警告: fix-efs-structure.sh 不存在${NC}"
fi

echo -e "${GREEN}✓ 部署脚本文件存在${NC}"

# 检查脚本是否可执行
if [[ ! -x "./rapid-deploy.sh" ]]; then
    chmod +x ./rapid-deploy.sh
    echo -e "${YELLOW}已设置 rapid-deploy.sh 为可执行${NC}"
fi

if [[ -f "./fix-efs-structure.sh" ]] && [[ ! -x "./fix-efs-structure.sh" ]]; then
    chmod +x ./fix-efs-structure.sh
    echo -e "${YELLOW}已设置 fix-efs-structure.sh 为可执行${NC}"
fi

echo -e "${GREEN}✓ 脚本具有执行权限${NC}"

# 检查脚本语法
bash -n ./rapid-deploy.sh
if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✓ rapid-deploy.sh 语法正确${NC}"
else
    echo -e "${RED}✗ rapid-deploy.sh 语法错误${NC}"
    exit 1
fi

if [[ -f "./fix-efs-structure.sh" ]]; then
    bash -n ./fix-efs-structure.sh
    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}✓ fix-efs-structure.sh 语法正确${NC}"
    else
        echo -e "${RED}✗ fix-efs-structure.sh 语法错误${NC}"
    fi
fi

echo ""
echo "========================================"
echo -e "${GREEN}测试通过！${NC}"
echo ""
echo "可用的部署命令:"
echo "  ./rapid-deploy.sh        - 主部署脚本（交互式）"
echo "  ./fix-efs-structure.sh   - 修复EFS文件目录结构"
echo ""
echo "rapid-deploy.sh 部署选项说明:"
echo "  1) 全部服务 (前端 + 后端 + AI)"
echo "  2) 仅前端 (merchant-admin)"
echo "  3) 前端 + 业务服务"
echo "  4) 前端 + Auth + 业务服务 (最常用)"
echo "  5) 仅业务服务"
echo "  6) 仅后端 (所有Java服务)"
echo "  7) 仅AI服务"
echo "  8) 自定义选择"
echo "========================================"