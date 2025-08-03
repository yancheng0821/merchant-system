# 商户管理系统 - 数据库部署指南

## 📋 概述

本文档提供了商户管理系统在AWS RDS MySQL生产环境的完整数据库部署方案。

## 🗄️ 数据库结构

### 数据库列表
- `merchant_auth` - 认证服务数据库
- `merchant_management` - 商户管理数据库  
- `merchant_business` - 业务服务数据库
- `merchant_analytics` - 数据分析数据库
- `merchant_notification` - 通知服务数据库

### 主要特性
- ✅ 温哥华时区设置 (America/Vancouver)
- ✅ UTF8MB4字符集支持中文
- ✅ 完整的外键约束
- ✅ 优化的索引设计
- ✅ 默认配置数据
- ✅ 示例测试数据

## 🚀 部署步骤

### 1. 准备工作

确保你有以下信息：
- AWS RDS MySQL实例端点
- 数据库管理员用户名和密码
- 网络连接权限

### 2. 连接到RDS实例

```bash
mysql -h your-rds-endpoint.amazonaws.com -P 3306 -u admin -p
```

### 3. 执行初始化脚本

```sql
-- 执行完整的初始化脚本
source /path/to/production_database_setup.sql;

-- 或者直接导入
mysql -h your-rds-endpoint.amazonaws.com -P 3306 -u admin -p < production_database_setup.sql
```

### 4. 验证部署

```sql
-- 检查数据库
SHOW DATABASES;

-- 检查时区设置
SELECT @@time_zone, NOW();

-- 检查表结构
USE merchant_auth;
SHOW TABLES;

-- 检查初始数据
SELECT * FROM tenants;
SELECT * FROM users;
```

## 👥 默认账户信息

### 系统管理员
- **用户名**: `admin`
- **密码**: `admin123` (BCrypt加密后存储)
- **邮箱**: `admin@merchant.com`
- **角色**: 系统管理员 (拥有所有权限)

### 店长账户
- **用户名**: `manager`  
- **密码**: `manager123` (BCrypt加密后存储)
- **邮箱**: `manager@merchant.com`
- **角色**: 店长 (管理权限)

## 🏪 默认商户数据

### 商户信息
- **商户名称**: 默认美容院
- **商户编码**: MERCHANT_001
- **业务类型**: 美容美发
- **地址**: 温哥华市中心123号

### 服务分类
1. **面部护理** - 各种面部护理服务
2. **身体护理** - 身体护理和SPA服务  
3. **美发服务** - 洗剪吹染烫等美发服务
4. **美甲服务** - 美甲护甲服务

### 示例服务项目
- 基础面部护理 ($88, 60分钟)
- 高级面部护理 ($288, 90分钟)
- 全身SPA护理 ($388, 120分钟)
- 身体按摩 ($268, 90分钟)
- 洗剪吹 ($188, 90分钟)
- 染发服务 ($388, 180分钟)
- 基础美甲 ($68, 45分钟)
- 美甲艺术 ($128, 90分钟)

### 资源配置
**员工资源**:
- 李美容师 (面部护理、身体按摩)
- 王发型师 (洗剪吹、染发、烫发)  
- 张美甲师 (美甲、护甲)

**房间资源**:
- VIP护理室 (单人，配备按摩床、美容仪器)
- 双人SPA室 (双人，配备双人按摩床、香薰设备)

### 营业时间
- **周一至周五**: 09:00 - 18:00
- **周六**: 10:00 - 17:00  
- **周日**: 休息

## 📧 通知模板

系统预置了以下通知模板：
1. **预约确认通知** (SMS)
2. **预约提醒通知** (SMS)
3. **预约确认邮件** (EMAIL)
4. **预约取消通知** (SMS)

## ⚙️ 系统配置

### 默认设置
- **时区**: America/Vancouver
- **货币**: CAD (加拿大元)
- **语言**: zh-CN (中文)
- **预约提前天数**: 30天
- **默认预约时长**: 60分钟
- **短信通知**: 启用
- **邮件通知**: 启用
- **自动确认预约**: 禁用
- **在线预约**: 启用

## 🔧 性能优化

### 索引策略
- 主键和外键自动索引
- 查询频繁的字段添加复合索引
- 时间相关字段的范围查询索引
- 状态字段的枚举索引

### 分区建议
对于大数据量表，建议按时间分区：
```sql
-- 示例：按月分区预约表
ALTER TABLE appointments 
PARTITION BY RANGE (YEAR(appointment_date) * 100 + MONTH(appointment_date)) (
    PARTITION p202501 VALUES LESS THAN (202502),
    PARTITION p202502 VALUES LESS THAN (202503),
    -- 继续添加分区...
);
```

## 🔒 安全建议

### 1. 修改默认密码
```sql
-- 修改管理员密码
UPDATE merchant_auth.users 
SET password = '$2a$10$your_new_bcrypt_hash' 
WHERE username = 'admin';
```

### 2. 创建应用专用用户
```sql
-- 为每个微服务创建专用数据库用户
CREATE USER 'auth_service'@'%' IDENTIFIED BY 'strong_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON merchant_auth.* TO 'auth_service'@'%';

CREATE USER 'business_service'@'%' IDENTIFIED BY 'strong_password';  
GRANT SELECT, INSERT, UPDATE, DELETE ON merchant_business.* TO 'business_service'@'%';
```

### 3. 启用SSL连接
确保应用程序使用SSL连接到RDS：
```yaml
spring:
  datasource:
    url: jdbc:mysql://your-rds-endpoint:3306/merchant_auth?useSSL=true&requireSSL=true
```

## 📊 监控建议

### 1. 关键指标监控
- 连接数使用率
- CPU和内存使用率
- 慢查询日志
- 锁等待时间
- 复制延迟（如果使用读副本）

### 2. 日志配置
```sql
-- 启用慢查询日志
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;
SET GLOBAL log_queries_not_using_indexes = 'ON';
```

## 🔄 备份策略

### 1. 自动备份
- 启用RDS自动备份
- 设置备份保留期（建议7-30天）
- 配置备份窗口（业务低峰期）

### 2. 手动快照
```bash
# 创建手动快照
aws rds create-db-snapshot \
    --db-instance-identifier merchant-system-db \
    --db-snapshot-identifier merchant-system-snapshot-$(date +%Y%m%d)
```

## 🚨 故障排查

### 常见问题

1. **字符集问题**
```sql
-- 检查字符集设置
SHOW VARIABLES LIKE 'character_set%';
SHOW VARIABLES LIKE 'collation%';
```

2. **时区问题**  
```sql
-- 检查时区设置
SELECT @@time_zone, @@system_time_zone;
SELECT NOW(), UTC_TIMESTAMP();
```

3. **连接问题**
```sql
-- 检查连接数
SHOW STATUS LIKE 'Threads_connected';
SHOW VARIABLES LIKE 'max_connections';
```

4. **性能问题**
```sql
-- 检查慢查询
SELECT * FROM mysql.slow_log ORDER BY start_time DESC LIMIT 10;

-- 检查锁等待
SELECT * FROM information_schema.INNODB_LOCKS;
```

## 📞 支持

如遇到问题，请检查：
1. RDS实例状态和配置
2. 安全组和网络ACL设置
3. 数据库参数组配置
4. 应用程序连接字符串

更多详细信息请参考：
- [AWS RDS MySQL文档](https://docs.aws.amazon.com/rds/latest/userguide/CHAP_MySQL.html)
- [MySQL 8.0参考手册](https://dev.mysql.com/doc/refman/8.0/en/)