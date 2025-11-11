# 生产环境部署指南

## 目录结构

```
deployment/
├── README.md                          # 本文件
├── docker-compose.production.yml      # Docker Compose生产配置
├── .env.template                      # 环境变量模板
├── deploy.sh                          # 自动部署脚本
├── init-databases.sql                 # 数据库初始化脚本（需创建）
└── migration-guide.md                 # 服务迁移指南（需创建）
```

## 快速开始

### 1. 准备工作

#### 1.1 创建AWS资源

**创建RDS MySQL实例：**
```bash
aws rds create-db-instance \
  --db-instance-identifier merchant-prod-db \
  --db-instance-class db.t3.micro \
  --engine mysql \
  --engine-version 8.0.35 \
  --master-username admin \
  --master-user-password "YourStrongPassword123!" \
  --allocated-storage 20 \
  --storage-type gp3 \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --db-subnet-group-name your-db-subnet-group \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "mon:04:00-mon:05:00" \
  --region ca-central-1
```

**创建ElastiCache Redis：**
```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id merchant-prod-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-nodes 1 \
  --security-group-ids sg-xxxxxxxxx \
  --cache-subnet-group-name your-cache-subnet-group \
  --region ca-central-1
```

**获取端点地址：**
```bash
# RDS端点
aws rds describe-db-instances \
  --db-instance-identifier merchant-prod-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text

# Redis端点
aws elasticache describe-cache-clusters \
  --cache-cluster-id merchant-prod-redis \
  --show-cache-node-info \
  --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' \
  --output text
```

#### 1.2 启动EC2实例

**启动实例：**
```bash
aws ec2 run-instances \
  --image-id ami-xxxxxxxxx \
  --instance-type t3.medium \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxxxxxx \
  --subnet-id subnet-xxxxxxxxx \
  --iam-instance-profile Name=MerchantNotificationServiceRole \
  --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":30,"VolumeType":"gp3"}}]' \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=merchant-prod-server}]' \
  --region ca-central-1
```

**安全组配置：**
- 22 (SSH) - 仅限管理IP
- 8080 (Gateway) - 0.0.0.0/0
- 8761 (Eureka) - 仅限内网（可选）
- 15672 (RabbitMQ管理) - 仅限管理IP

#### 1.3 配置IAM Role（用于AWS SES/SNS）

参考：`/merchant-server/notification-service/AWS_IAM_POLICY.md`

```bash
# 创建IAM策略
aws iam create-policy \
  --policy-name MerchantNotificationServicePolicy \
  --policy-document file://notification-service-policy.json

# 创建IAM角色
aws iam create-role \
  --role-name MerchantNotificationServiceRole \
  --assume-role-policy-document file://ec2-trust-policy.json

# 附加策略到角色
aws iam attach-role-policy \
  --role-name MerchantNotificationServiceRole \
  --policy-arn arn:aws:iam::ACCOUNT-ID:policy/MerchantNotificationServicePolicy

# 创建实例配置文件
aws iam create-instance-profile \
  --instance-profile-name MerchantNotificationServiceRole

# 添加角色到实例配置文件
aws iam add-role-to-instance-profile \
  --instance-profile-name MerchantNotificationServiceRole \
  --role-name MerchantNotificationServiceRole
```

### 2. 部署到EC2

#### 2.1 连接到EC2

```bash
ssh -i your-key.pem ubuntu@<EC2-PUBLIC-IP>
```

#### 2.2 安装Docker和Docker Compose

```bash
# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu
newgrp docker

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

#### 2.3 安装AWS CLI（可选，用于ECR）

```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# 验证安装
aws --version
```

#### 2.4 上传部署文件

```bash
# 在本地执行
scp -i your-key.pem -r deployment ubuntu@<EC2-PUBLIC-IP>:~/
```

或者使用Git：
```bash
# 在EC2上执行
git clone https://github.com/your-repo/merchant-system.git
cd merchant-system/deployment
```

#### 2.5 配置环境变量

```bash
# 复制模板
cp .env.template .env

# 编辑配置
vim .env

# 填写以下必要配置：
# - DOCKER_REGISTRY（如果使用ECR）
# - DB_HOST, DB_USERNAME, DB_PASSWORD
# - REDIS_HOST, REDIS_PASSWORD
# - RABBITMQ_USERNAME, RABBITMQ_PASSWORD
# - JWT_SECRET
```

生成JWT密钥：
```bash
openssl rand -hex 64
```

#### 2.6 初始化数据库

```bash
# 方式1: 使用mysql命令行
mysql -h <RDS-ENDPOINT> -u admin -p < init-databases.sql

# 方式2: 使用Docker临时容器
docker run -it --rm mysql:8.0 \
  mysql -h <RDS-ENDPOINT> -u admin -p < init-databases.sql
```

#### 2.7 执行部署

```bash
# 给脚本添加执行权限
chmod +x deploy.sh

# 执行部署
./deploy.sh
```

部署脚本会自动完成：
1. 环境检查
2. 连接性测试
3. 拉取Docker镜像
4. 启动所有服务
5. 健康检查
6. Eureka注册验证

### 3. 验证部署

#### 3.1 检查服务状态

```bash
# 查看所有容器状态
docker-compose -f docker-compose.production.yml ps

# 应该看到所有服务都是 Up 状态
```

#### 3.2 访问服务

```bash
# 获取EC2公网IP
curl ifconfig.me

# 访问Eureka Dashboard
http://<EC2-PUBLIC-IP>:8761

# 测试API Gateway
curl http://<EC2-PUBLIC-IP>:8080/actuator/health

# RabbitMQ管理界面（仅限管理IP）
http://<EC2-PUBLIC-IP>:15672
# 用户名/密码：参考.env文件中的RABBITMQ_USERNAME和RABBITMQ_PASSWORD
```

#### 3.3 查看日志

```bash
# 查看所有服务日志
docker-compose -f docker-compose.production.yml logs -f

# 查看特定服务日志
docker logs -f business-service
docker logs -f notification-service

# 查看最近100行日志
docker logs --tail 100 business-service
```

#### 3.4 测试API

```bash
# 测试登录
curl -X POST http://<EC2-PUBLIC-IP>:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123",
    "tenantId": "1"
  }'

# 测试健康检查
curl http://<EC2-PUBLIC-IP>:8080/actuator/health
```

## 常用操作

### 服务管理

```bash
# 启动所有服务
docker-compose -f docker-compose.production.yml up -d

# 停止所有服务
docker-compose -f docker-compose.production.yml down

# 重启特定服务
docker-compose -f docker-compose.production.yml restart business-service

# 重启所有服务
docker-compose -f docker-compose.production.yml restart

# 停止特定服务
docker-compose -f docker-compose.production.yml stop business-service

# 启动特定服务
docker-compose -f docker-compose.production.yml start business-service
```

### 日志查看

```bash
# 实时查看所有日志
docker-compose -f docker-compose.production.yml logs -f

# 查看特定服务日志（最近100行）
docker logs --tail 100 business-service

# 查看特定服务实时日志
docker logs -f business-service

# 导出日志到文件
docker logs business-service > business-service.log 2>&1
```

### 资源监控

```bash
# 查看容器资源使用
docker stats

# 查看特定容器资源使用
docker stats business-service

# 查看磁盘使用
docker system df

# 清理未使用的资源
docker system prune -a
```

### 更新部署

```bash
# 1. 拉取最新镜像
docker-compose -f docker-compose.production.yml pull

# 2. 滚动更新（推荐）
docker-compose -f docker-compose.production.yml up -d --no-deps --build business-service

# 3. 全部重启（会有短暂停机）
docker-compose -f docker-compose.production.yml up -d

# 4. 重新运行部署脚本
./deploy.sh
```

### 数据库管理

```bash
# 连接到RDS
mysql -h <RDS-ENDPOINT> -u admin -p

# 备份数据库
mysqldump -h <RDS-ENDPOINT> -u admin -p \
  --databases merchant_auth merchant_merchant merchant_business merchant_notification \
  > backup-$(date +%Y%m%d).sql

# 恢复数据库
mysql -h <RDS-ENDPOINT> -u admin -p < backup-20250115.sql
```

### RabbitMQ管理

```bash
# 进入RabbitMQ容器
docker exec -it rabbitmq bash

# 查看队列
rabbitmqadmin list queues

# 清空队列
rabbitmqadmin purge queue name=notification.email

# 查看连接
rabbitmqadmin list connections
```

## 故障排查

### 服务无法启动

```bash
# 1. 查看容器日志
docker logs business-service

# 2. 检查容器状态
docker inspect business-service

# 3. 查看资源使用
docker stats

# 4. 检查网络
docker network inspect deployment_merchant-network
```

### 数据库连接失败

```bash
# 1. 检查RDS安全组（必须允许EC2安全组访问3306端口）

# 2. 测试连接
mysql -h <RDS-ENDPOINT> -u admin -p

# 3. 检查环境变量
docker exec business-service env | grep DB_

# 4. 查看连接池状态
curl http://localhost:8083/actuator/metrics/hikaricp.connections.active
```

### Redis连接失败

```bash
# 1. 检查ElastiCache安全组（必须允许EC2安全组访问6379端口）

# 2. 测试连接
redis-cli -h <REDIS-ENDPOINT> -p 6379 -a <REDIS-PASSWORD> ping

# 3. 检查环境变量
docker exec business-service env | grep REDIS_
```

### Eureka注册失败

```bash
# 1. 检查Eureka服务是否运行
curl http://localhost:8761/actuator/health

# 2. 查看服务日志中的Eureka相关错误
docker logs business-service | grep -i eureka

# 3. 检查EUREKA_HOST环境变量
docker exec business-service env | grep EUREKA_

# 4. 手动测试Eureka连接
curl http://eureka-server:8761/eureka/apps
```

### 内存不足

```bash
# 1. 查看内存使用
free -h

# 2. 查看容器内存限制
docker stats

# 3. 调整容器内存限制（在docker-compose.production.yml中）
deploy:
  resources:
    limits:
      memory: 512M  # 降低内存限制

# 4. 升级EC2实例类型
# t3.medium (4GB) -> t3.large (8GB)
```

## 性能优化

### JVM参数调优

在docker-compose.production.yml中添加JAVA_OPTS：

```yaml
business-service:
  environment:
    - JAVA_OPTS=-Xms256m -Xmx512m -XX:MaxMetaspaceSize=128m
```

### 数据库连接池调优

调整application-prod.yml中的HikariCP配置：

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 5   # 单实例不需要太多连接
      minimum-idle: 2
      connection-timeout: 30000
      idle-timeout: 600000
```

### Redis缓存优化

```yaml
spring:
  cache:
    type: redis
    redis:
      time-to-live: 600000  # 10分钟
```

## 安全加固

### 1. 限制端口访问

只对外开放必要端口：
- 8080 (Gateway) - 公网访问
- 22 (SSH) - 仅管理IP

其他端口仅内网访问。

### 2. 配置防火墙

```bash
# 使用ufw
sudo ufw allow 22/tcp
sudo ufw allow 8080/tcp
sudo ufw enable
```

### 3. 定期更新

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 更新Docker镜像
docker-compose -f docker-compose.production.yml pull
```

### 4. 启用HTTPS

推荐使用AWS Application Load Balancer配置SSL证书，参考：
`/Users/aisenyc/merchant-system/ZERO_DOWNTIME_SCALING_GUIDE.md`

## 成本优化

### 当前配置成本（月）

| 资源 | 规格 | 成本 |
|------|------|------|
| EC2 | t3.medium | $30 |
| EBS | 30GB gp3 | $3 |
| RDS | db.t3.micro | $15 |
| ElastiCache | cache.t3.micro | $12 |
| 数据传输 | 估算 | $5 |
| **总计** | | **~$65/月** |

### 成本优化建议

1. **使用预留实例**：节省30-40%
2. **使用Savings Plans**：更灵活的成本节省
3. **定期清理未使用的快照和镜像**
4. **使用Spot实例**（仅适用于非关键服务）

## 扩展迁移

当需要扩展时，参考以下文档：

1. `/Users/aisenyc/merchant-system/SINGLE_EC2_DEPLOYMENT.md` - 单EC2部署详细指南
2. `/Users/aisenyc/merchant-system/ZERO_DOWNTIME_SCALING_GUIDE.md` - 零停机扩展指南
3. `/Users/aisenyc/merchant-system/AWS_DEPLOYMENT_ARCHITECTURE.md` - AWS部署架构

迁移步骤概览：
```
当前: 单EC2 ($65/月)
  ↓ 添加ALB
阶段1: 单EC2 + ALB ($81/月)
  ↓ 迁出business-service
阶段2: 双EC2 ($111/月)
  ↓ 完全服务独立
阶段3: 完全独立部署 ($200-300/月)
```

## 支持

如遇问题：

1. 查看日志：`docker-compose -f docker-compose.production.yml logs -f`
2. 检查健康状态：`curl http://localhost:8080/actuator/health`
3. 查看Eureka Dashboard：`http://<EC2-IP>:8761`
4. 参考故障排查章节
