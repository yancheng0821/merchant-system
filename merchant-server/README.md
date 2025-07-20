# Merchant Server - 微服务架构后端

## 项目概述

这是一个基于Spring Boot 3.x和Spring Cloud的微服务架构项目，为商户管理系统提供后端服务支持。

## 架构设计

### 模块划分

```
merchant-server/
├── auth-service/          # 认证授权服务 (端口: 8081)
├── merchant-service/      # 商户管理服务 (端口: 8082)
├── business-service/      # 业务核心服务 (端口: 8083)
├── ai-service/           # AI智能服务 (端口: 8084) - 核心卖点
├── analytics-service/     # 数据分析服务 (端口: 8085)
├── notification-service/  # 通知通信服务 (端口: 8086)
├── gateway-service/       # API网关服务 (端口: 8080)
└── common/               # 公共模块
```

### 技术栈

- **Spring Boot 3.2.0** - 基础框架
- **Spring Cloud 2023.0.0** - 微服务框架
- **Spring Security** - 安全认证
- **Spring Data JPA** - 数据持久化
- **MySQL 8.0** - 主数据库
- **Redis** - 缓存和会话存储
- **RabbitMQ** - 消息队列
- **Eureka** - 服务注册与发现
- **Spring Cloud Gateway** - API网关

## 核心特性

### 1. 多租户架构
- 支持多连锁店管理
- 租户数据隔离
- 分店统一管理

### 2. AI智能功能 (核心卖点)
- 智能预约推荐
- 客户行为分析
- 服务需求预测
- 智能定价建议
- 员工排班优化
- 客户流失预警

### 3. 权限管理
- 多级权限控制
- JWT Token认证
- 角色权限管理

## 快速开始

### 环境要求
- Java 17+
- Maven 3.6+
- MySQL 8.0+
- Redis 6.0+
- RabbitMQ 3.8+

### 数据库配置
创建以下数据库：
```sql
CREATE DATABASE merchant_auth;
CREATE DATABASE merchant_management;
CREATE DATABASE merchant_business;
CREATE DATABASE merchant_ai;
CREATE DATABASE merchant_analytics;
CREATE DATABASE merchant_notification;
```

### 启动顺序
1. 启动Eureka服务注册中心
2. 启动Redis和RabbitMQ
3. 启动各个微服务模块

### 构建和运行
```bash
# 构建整个项目
mvn clean install

# 启动各个服务
cd auth-service && mvn spring-boot:run
cd merchant-service && mvn spring-boot:run
cd business-service && mvn spring-boot:run
cd ai-service && mvn spring-boot:run
cd analytics-service && mvn spring-boot:run
cd notification-service && mvn spring-boot:run
cd gateway-service && mvn spring-boot:run
```

## API网关路由

- 认证服务: `http://localhost:8080/api/auth/**`
- 商户服务: `http://localhost:8080/api/merchant/**`
- 业务服务: `http://localhost:8080/api/business/**`
- AI服务: `http://localhost:8080/api/ai/**`
- 分析服务: `http://localhost:8080/api/analytics/**`
- 通知服务: `http://localhost:8080/api/notification/**`

## 开发计划

### 第一阶段 (MVP)
- [x] 项目架构搭建
- [ ] 基础认证功能
- [ ] 商户管理功能
- [ ] 基础业务功能

### 第二阶段 (AI核心)
- [ ] AI智能推荐
- [ ] 数据分析功能
- [ ] 智能定价

### 第三阶段 (企业级)
- [ ] 高级AI功能
- [ ] 性能优化
- [ ] 监控告警

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License 