#!/bin/bash
# EC2用户数据脚本 - 自动安装Docker和Docker Compose

set -e

# 更新系统
apt-get update
apt-get upgrade -y

# 安装基础工具
apt-get install -y curl wget git unzip mysql-client redis-tools

# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 将ubuntu用户添加到docker组
usermod -aG docker ubuntu

# 安装Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 创建部署目录
mkdir -p /opt/merchant-system
chown ubuntu:ubuntu /opt/merchant-system

# 创建日志目录
mkdir -p /var/log/{auth-service,merchant-service,business-service,notification-service,gateway-service}
chown -R ubuntu:ubuntu /var/log/{auth-service,merchant-service,business-service,notification-service,gateway-service}

# 创建上传目录
mkdir -p /var/uploads
chown ubuntu:ubuntu /var/uploads

# 设置时区为UTC
timedatectl set-timezone UTC

# 启用Docker服务
systemctl enable docker
systemctl start docker

# 安装AWS CLI (如果需要访问ECR)
apt-get install -y awscli

echo "EC2初始化完成" > /home/ubuntu/init-complete.txt
chown ubuntu:ubuntu /home/ubuntu/init-complete.txt
