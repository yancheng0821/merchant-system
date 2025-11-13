# Docker 环境快速搭建指南

本项目使用 Docker Compose 来管理所有的中间件服务，让团队成员可以快速搭建与生产环境一致的本地开发环境。

## 前置要求

- Docker Desktop (Mac/Windows) 或 Docker Engine (Linux)
- Docker Compose (通常随 Docker Desktop 一起安装)

## 一键启动

在项目根目录执行：

```bash
docker-compose up -d
```

这将启动以下服务：
- MySQL 8.0 (端口 3306)
- Redis 7 (端口 6379)
- RabbitMQ 3.12 (端口 5672, 管理界面 15672)

## 验证服务状态

```bash
# 查看所有服务运行状态
docker-compose ps

# 应该看到类似输出：
# NAME                        IMAGE                              STATUS
# merchant-system-mysql       mysql:8.0                          Up (healthy)
# merchant-system-redis       redis:7-alpine                     Up (healthy)
# merchant-system-rabbitmq    rabbitmq:3.12-management-alpine   Up (healthy)
```

## 服务连接信息

### MySQL
```
Host: localhost
Port: 3306
Username: merchant_app
Password: MerchantApp@2024
Databases:
  - merchant_auth
  - merchant_business
  - merchant_management
  - merchant_notification
  - merchant_analytics
```

### Redis
```
Host: localhost
Port: 6379
Password: (无)
```

### RabbitMQ
```
AMQP Host: localhost
AMQP Port: 5672
Management UI: http://localhost:15672
Username: merchant_app
Password: MerchantApp@2024
Virtual Host: merchant_vhost
```

## 常用命令

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose stop

# 停止并删除容器（数据保留）
docker-compose down

# 停止并删除容器和数据卷（慎用！）
docker-compose down -v

# 查看日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f mysql

# 重启特定服务
docker-compose restart mysql

# 进入容器内部
docker exec -it merchant-system-mysql bash
docker exec -it merchant-system-redis sh
docker exec -it merchant-system-rabbitmq sh
```

## 数据备份与恢复

### MySQL 备份
```bash
# 备份所有数据库
docker exec merchant-system-mysql mysqldump -u root -proot123456 --all-databases > backup.sql

# 备份特定数据库
docker exec merchant-system-mysql mysqldump -u root -proot123456 merchant_business > merchant_business.sql
```

### MySQL 恢复
```bash
# 恢复数据库
docker exec -i merchant-system-mysql mysql -u root -proot123456 < backup.sql
```

### Redis 备份
```bash
# Redis 数据会自动持久化到 Docker volume: merchant-system_redis-data
docker run --rm -v merchant-system_redis-data:/data -v $(pwd):/backup alpine tar czf /backup/redis-backup.tar.gz -C /data .
```

## 环境配置

如需自定义配置，复制 `.env.example` 为 `.env` 并修改：

```bash
cp .env.example .env
# 编辑 .env 文件修改密码、端口等配置
```

## 故障排查

### 1. 端口冲突
如果端口已被占用，有两种解决方案：

**方案一：停止占用端口的服务**
```bash
# 查找占用端口的进程
lsof -i :3306
# 停止该进程
kill -9 <PID>
```

**方案二：修改映射端口**
编辑 `docker-compose.yml`，修改端口映射：
```yaml
ports:
  - "13306:3306"  # 改为映射到本地 13306 端口
```

### 2. 服务启动失败
```bash
# 查看错误日志
docker-compose logs <service-name>

# 完全重置（会删除所有数据）
docker-compose down -v
docker-compose up -d
```

### 3. 权限问题
```bash
# MySQL 权限问题
docker exec -it merchant-system-mysql mysql -u root -proot123456
# 在 MySQL 中执行：
GRANT ALL PRIVILEGES ON *.* TO 'merchant_app'@'%';
FLUSH PRIVILEGES;
```

## 团队协作

### 新成员加入项目

1. 克隆项目仓库
2. 安装 Docker Desktop
3. 在项目根目录执行：
   ```bash
   docker-compose up -d
   ```
4. 等待所有服务启动（约 30 秒）
5. 验证服务状态：
   ```bash
   docker-compose ps
   ```
6. 启动应用服务

### 配置版本控制

以下文件已加入版本控制：
- `docker-compose.yml` - Docker Compose 配置
- `docker/mysql-init/*.sql` - MySQL 初始化脚本
- `docker/README.md` - Docker 详细说明
- `.env.example` - 环境变量示例

以下文件不应提交到 Git：
- `.env` - 本地环境变量（包含敏感信息）
- `docker/rabbitmq-init/*.conf` - RabbitMQ 运行时配置

## 生产环境注意事项

⚠️ **此配置仅用于开发和测试环境！**

生产环境部署需要：
1. 修改所有默认密码
2. 配置 SSL/TLS 加密
3. 限制网络访问（不要暴露所有端口到 0.0.0.0）
4. 配置数据备份策略
5. 使用外部数据卷或云存储
6. 配置监控和告警
7. 使用 Docker Swarm 或 Kubernetes 进行编排

## 更多信息

详细的 Docker 配置说明请查看：`docker/README.md`
