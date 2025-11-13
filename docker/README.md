# Merchant System Docker 环境

本目录包含了项目所需的所有中间件的 Docker 配置。

## 包含的服务

- **MySQL 8.0**: 数据库服务
  - 端口: 3306
  - Root 密码: `root123456`
  - 应用用户: `merchant_app`
  - 应用密码: `MerchantApp@2024`
  - 数据库:
    - merchant_auth
    - merchant_business
    - merchant_management
    - merchant_notification
    - merchant_analytics

- **Redis 7**: 缓存服务
  - 端口: 6379
  - 无密码

- **RabbitMQ 3.12**: 消息队列服务
  - AMQP 端口: 5672
  - 管理界面: http://localhost:15672
  - 用户名: `merchant_app`
  - 密码: `MerchantApp@2024`
  - 虚拟主机: `merchant_vhost`

## 快速开始

### 1. 启动所有服务

在项目根目录 `/Users/aisenyc/merchant-system` 执行：

```bash
docker-compose up -d
```

### 2. 查看服务状态

```bash
docker-compose ps
```

### 3. 查看服务日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f mysql
docker-compose logs -f redis
docker-compose logs -f rabbitmq
```

### 4. 停止所有服务

```bash
docker-compose down
```

### 5. 停止并删除数据卷（慎用！）

```bash
docker-compose down -v
```

## 服务访问信息

### MySQL
```bash
# 使用 Docker 连接
docker exec -it merchant-system-mysql mysql -u merchant_app -pMerchantApp@2024

# 使用本地客户端连接
mysql -h localhost -P 3306 -u merchant_app -pMerchantApp@2024 -D merchant_auth
```

### Redis
```bash
# 使用 Docker 连接
docker exec -it merchant-system-redis redis-cli

# 使用本地客户端连接
redis-cli -h localhost -p 6379
```

### RabbitMQ 管理界面
访问: http://localhost:15672
- 用户名: `merchant_app`
- 密码: `MerchantApp@2024`

## 数据持久化

所有数据都通过 Docker volumes 持久化存储：

- `merchant-system_mysql-data`: MySQL 数据
- `merchant-system_redis-data`: Redis 数据
- `merchant-system_rabbitmq-data`: RabbitMQ 数据

## 初始化脚本

### MySQL 初始化
- 位置: `./mysql-init/01-init-databases.sql`
- 作用: 自动创建所有需要的数据库并授权

### RabbitMQ 初始化
- 位置: `./rabbitmq-init/` (可选)
- 作用: 可以放置自定义的 RabbitMQ 配置文件

## 故障排查

### MySQL 无法启动
```bash
# 查看日志
docker-compose logs mysql

# 重新初始化（会删除所有数据）
docker-compose down -v
docker-compose up -d
```

### 端口冲突
如果端口已被占用，修改 `docker-compose.yml` 中的端口映射：
```yaml
ports:
  - "13306:3306"  # 将 MySQL 映射到本地 13306 端口
```

### 连接被拒绝
确保服务已完全启动：
```bash
# 等待所有服务健康检查通过
docker-compose ps
```

## 环境变量

可以通过创建 `.env` 文件来覆盖默认配置：

```bash
# .env 文件示例
MYSQL_ROOT_PASSWORD=your_root_password
MYSQL_USER=your_app_user
MYSQL_PASSWORD=your_app_password
RABBITMQ_USER=your_mq_user
RABBITMQ_PASSWORD=your_mq_password
```
