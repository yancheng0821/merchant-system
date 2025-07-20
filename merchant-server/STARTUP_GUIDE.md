# 🚀 商户管理系统启动指南

## 📋 环境要求

### 必需软件
- **Java 17+**
- **Maven 3.6+**
- **MySQL 8.0+**
- **Redis 6.0+** (可选，用于缓存)

### 检查环境
```bash
# 检查Java版本
java -version

# 检查Maven版本
mvn -version

# 检查MySQL
mysql --version
```

## 🗄️ 数据库准备

### 1. 启动MySQL
```bash
# macOS (使用Homebrew)
brew services start mysql

# 或者手动启动
mysql.server start
```

### 2. 创建数据库
```sql
CREATE DATABASE merchant_auth;
CREATE DATABASE merchant_management;
CREATE DATABASE merchant_business;
CREATE DATABASE merchant_ai;
CREATE DATABASE merchant_analytics;
CREATE DATABASE merchant_notification;
```

## 🔧 项目构建

### 1. 构建整个项目
```bash
# 在merchant-server目录下
mvn clean install -DskipTests
```

### 2. 检查构建结果
```bash
# 查看构建的jar文件
find . -name "*.jar" -type f
```

## 🚀 服务启动

### 方式一：手动启动（推荐用于开发）

#### 1. 启动认证服务
```bash
cd auth-service
mvn spring-boot:run
```
**端口**: 8081
**访问**: http://localhost:8081

#### 2. 启动商户服务
```bash
cd merchant-service
mvn spring-boot:run
```
**端口**: 8082
**访问**: http://localhost:8082

#### 3. 启动业务服务
```bash
cd business-service
mvn spring-boot:run
```
**端口**: 8083
**访问**: http://localhost:8083

#### 4. 启动AI服务
```bash
cd ai-service
mvn spring-boot:run
```
**端口**: 8084
**访问**: http://localhost:8084

#### 5. 启动分析服务
```bash
cd analytics-service
mvn spring-boot:run
```
**端口**: 8085
**访问**: http://localhost:8085

#### 6. 启动通知服务
```bash
cd notification-service
mvn spring-boot:run
```
**端口**: 8086
**访问**: http://localhost:8086

#### 7. 启动网关服务
```bash
cd gateway-service
mvn spring-boot:run
```
**端口**: 8080
**访问**: http://localhost:8080

### 方式二：使用启动脚本
```bash
# 给脚本执行权限
chmod +x start-services.sh

# 运行启动脚本
./start-services.sh
```

## 🔗 服务间调用

### 1. 通过API网关调用
所有外部请求都通过网关服务 (端口: 8080) 进行路由：

```
http://localhost:8080/api/auth/**     → 认证服务
http://localhost:8080/api/merchant/** → 商户服务
http://localhost:8080/api/business/** → 业务服务
http://localhost:8080/api/ai/**       → AI服务
http://localhost:8080/api/analytics/** → 分析服务
http://localhost:8080/api/notification/** → 通知服务
```

### 2. 服务间直接调用
服务间可以通过服务名进行调用：

```java
// 在业务服务中调用认证服务
@Autowired
private RestTemplate restTemplate;

public UserInfo getUserInfo(String userId) {
    return restTemplate.getForObject(
        "http://auth-service/api/users/" + userId, 
        UserInfo.class
    );
}
```

### 3. 使用Feign客户端（推荐）
```java
@FeignClient(name = "auth-service")
public interface AuthServiceClient {
    
    @GetMapping("/api/users/{userId}")
    UserInfo getUserInfo(@PathVariable String userId);
}
```

## 📊 服务监控

### 1. 健康检查
每个服务都提供健康检查端点：
```
http://localhost:8081/actuator/health  # 认证服务
http://localhost:8082/actuator/health  # 商户服务
http://localhost:8083/actuator/health  # 业务服务
http://localhost:8084/actuator/health  # AI服务
http://localhost:8085/actuator/health  # 分析服务
http://localhost:8086/actuator/health  # 通知服务
http://localhost:8080/actuator/health  # 网关服务
```

### 2. 应用信息
```
http://localhost:8081/actuator/info
http://localhost:8082/actuator/info
# ... 其他服务
```

## 🛠️ 开发调试

### 1. 日志查看
```bash
# 查看特定服务的日志
tail -f auth-service/logs/application.log
```

### 2. 数据库连接测试
```bash
# 测试数据库连接
mysql -u root -p merchant_auth
```

### 3. 端口占用检查
```bash
# 检查端口是否被占用
lsof -i :8081
lsof -i :8082
# ... 其他端口
```

## 🚨 常见问题

### 1. 端口被占用
```bash
# 查找占用端口的进程
lsof -i :8081

# 杀死进程
kill -9 <PID>
```

### 2. 数据库连接失败
- 检查MySQL是否启动
- 检查数据库用户名密码
- 检查数据库是否创建

### 3. 服务启动失败
- 检查Java版本是否为17+
- 检查Maven依赖是否下载完成
- 查看启动日志中的错误信息

## 📝 开发建议

### 1. 开发环境
- 使用IDE（如IntelliJ IDEA）进行开发
- 配置多个运行配置，方便同时启动多个服务
- 使用Docker Compose管理基础设施服务

### 2. 调试技巧
- 使用断点调试
- 查看服务间调用的日志
- 使用Postman测试API接口

### 3. 性能优化
- 启用Redis缓存
- 配置数据库连接池
- 使用异步处理提高响应速度 