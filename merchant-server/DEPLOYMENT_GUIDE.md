# 商户系统部署指南

## 头像存储配置

头像文件统一存储在服务器指定路径：
```bash
/opt/merchant-system/avatars/
```

## 部署步骤

### 1. 设置头像存储目录

#### 手动设置
```bash
sudo mkdir -p /opt/merchant-system/avatars
sudo chown $USER:$USER /opt/merchant-system/avatars
sudo chmod 755 /opt/merchant-system/avatars
```

#### 使用脚本设置
```bash
./setup-avatar-dir.sh
```

### 2. 配置文件

```yaml
app:
  avatar:
    upload:
      path: /opt/merchant-system/avatars
    url:
      prefix: /api/users/avatar/
```

### 3. Docker部署

#### 使用Docker Compose
```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs auth-service
```

#### 手动Docker部署
```bash
# 构建镜像
docker build -t merchant-auth-service ./auth-service

# 运行容器（包含头像目录挂载）
docker run -d \
  --name merchant-auth \
  -p 8081:8081 \
  -v /opt/merchant-system/avatars:/opt/merchant-system/avatars \
  merchant-auth-service
```

### 4. AWS EC2部署

#### 创建目录
```bash
# 连接到EC2实例
ssh -i your-key.pem ec2-user@your-ec2-ip

# 创建头像目录
sudo mkdir -p /opt/merchant-system/avatars
sudo chown ec2-user:ec2-user /opt/merchant-system/avatars
sudo chmod 755 /opt/merchant-system/avatars
```

#### 部署应用
```bash
# 上传应用文件
scp -i your-key.pem -r merchant-server ec2-user@your-ec2-ip:~/

# 在EC2上运行
cd merchant-server
./setup-avatar-dir.sh
docker-compose up -d
```

## 文件管理

### 头像文件特性
- **存储位置**: `/opt/merchant-system/avatars/`
- **文件命名**: UUID + 原始扩展名
- **访问URL**: `http://your-domain:8081/api/users/avatar/filename`
- **文件大小**: 最大5MB
- **支持格式**: JPG, PNG, GIF等图片格式

### 备份策略
```bash
# 备份头像文件
tar -czf avatar-backup-$(date +%Y%m%d).tar.gz /opt/merchant-system/avatars/

# 恢复头像文件
tar -xzf avatar-backup-20240720.tar.gz -C /
```

### 清理策略
```bash
# 查看文件大小
du -sh /opt/merchant-system/avatars/

# 清理30天前的文件（可选）
find /opt/merchant-system/avatars/ -type f -mtime +30 -delete
```

## 监控和维护

### 磁盘空间监控
```bash
# 检查磁盘使用情况
df -h /opt/merchant-system/

# 检查头像目录大小
du -sh /opt/merchant-system/avatars/
```

### 日志监控
```bash
# 查看应用日志
docker-compose logs -f auth-service

# 查看文件访问日志
tail -f /var/log/nginx/access.log | grep avatar
```

## 故障排除

### 常见问题

#### 1. 权限问题
```bash
# 错误：Permission denied
sudo chown -R $USER:$USER /opt/merchant-system/avatars
sudo chmod -R 755 /opt/merchant-system/avatars
```

#### 2. 目录不存在
```bash
# 错误：Directory not found
sudo mkdir -p /opt/merchant-system/avatars
./setup-avatar-dir.sh prod
```

#### 3. 磁盘空间不足
```bash
# 检查磁盘空间
df -h

# 清理旧文件
find /opt/merchant-system/avatars/ -type f -mtime +30 -delete
```

## 扩展建议

### 未来升级到云存储
当用户量增长时，可以考虑升级到云存储：

1. **AWS S3**
2. **阿里云OSS**
3. **腾讯云COS**

这样可以获得更好的：
- 可扩展性
- 高可用性
- 成本效益
- 备份和恢复

### 当前方案的优势
- **简单易用** - 无需额外配置
- **成本低** - 使用现有服务器存储
- **快速部署** - 立即可用
- **易于维护** - 文件管理简单 