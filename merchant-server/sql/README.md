# 📊 数据库脚本管理

## 📁 目录结构

```
sql/
├── init/                    # 初始化脚本
│   ├── 01_create_databases.sql    # 创建数据库
│   └── 02_create_users.sql        # 创建用户和权限
├── schema/                  # 表结构脚本
│   ├── 01_auth_tables.sql         # 认证服务表结构
│   ├── 02_merchant_tables.sql     # 商户管理表结构
│   ├── 03_business_tables.sql     # 业务核心表结构
│   ├── 04_ai_tables.sql           # AI服务表结构（待创建）
│   ├── 05_analytics_tables.sql    # 数据分析表结构（待创建）
│   └── 06_notification_tables.sql # 通知服务表结构（待创建）
├── data/                    # 数据脚本
│   ├── 01_init_data.sql           # 初始数据
│   ├── 02_test_data.sql           # 测试数据（待创建）
│   └── 03_sample_data.sql         # 示例数据（待创建）
└── migration/               # 数据库迁移脚本
    ├── V1.0.0__initial.sql        # 初始版本
    ├── V1.1.0__add_ai_features.sql # AI功能版本（待创建）
    └── V1.2.0__add_analytics.sql  # 分析功能版本（待创建）
```

## 🚀 快速开始

### 1. 执行初始化脚本

```bash
# 登录MySQL
mysql -u root -p

# 执行数据库创建脚本
source sql/init/01_create_databases.sql

# 执行用户创建脚本
source sql/init/02_create_users.sql
```

### 2. 创建表结构

```bash
# 执行认证服务表结构
source sql/schema/01_auth_tables.sql

# 执行商户管理表结构
source sql/schema/02_merchant_tables.sql

# 执行业务核心表结构
source sql/schema/03_business_tables.sql
```

### 3. 插入初始数据

```bash
# 执行初始数据脚本
source sql/data/01_init_data.sql
```

## 📋 数据库说明

### 数据库列表

| 数据库名 | 服务 | 描述 |
|---------|------|------|
| merchant_auth | 认证服务 | 用户认证、权限管理 |
| merchant_management | 商户管理 | 商户信息、分店管理 |
| merchant_business | 业务核心 | 服务、员工、客户、预约、订单 |
| merchant_ai | AI服务 | AI智能功能 |
| merchant_analytics | 数据分析 | 数据统计、报表 |
| merchant_notification | 通知服务 | 消息通知、通信 |

### 用户权限

| 用户名 | 权限 | 用途 |
|--------|------|------|
| merchant_app | 所有权限 | 应用程序连接 |
| merchant_readonly | 只读权限 | 报表查询 |

## 🔧 开发指南

### 添加新表

1. 在对应的 `schema/` 目录下创建新的SQL文件
2. 文件名格式：`XX_service_tables.sql`
3. 包含完整的表结构、索引、外键约束

### 添加新数据

1. 在 `data/` 目录下创建新的SQL文件
2. 文件名格式：`XX_description.sql`
3. 包含INSERT语句和必要的注释

### 数据库迁移

1. 在 `migration/` 目录下创建迁移脚本
2. 文件名格式：`V版本号__描述.sql`
3. 包含ALTER、ADD、DROP等DDL语句

## 📝 命名规范

### 表命名
- 使用小写字母和下划线
- 表名使用复数形式
- 例如：`users`, `service_categories`, `appointment_services`

### 字段命名
- 使用小写字母和下划线
- 主键统一使用 `id`
- 外键格式：`表名_id`
- 时间字段：`created_at`, `updated_at`

### 索引命名
- 主键：`PRIMARY`
- 唯一索引：`uk_字段名`
- 普通索引：`idx_字段名`
- 复合索引：`idx_字段1_字段2`

## 🔍 常用查询

### 查看表结构
```sql
DESCRIBE table_name;
SHOW CREATE TABLE table_name;
```

### 查看索引
```sql
SHOW INDEX FROM table_name;
```

### 查看外键
```sql
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE REFERENCED_TABLE_SCHEMA = 'database_name';
```

## ⚠️ 注意事项

1. **备份数据**：执行脚本前请备份现有数据
2. **版本控制**：所有SQL脚本都要纳入版本控制
3. **测试环境**：先在测试环境验证脚本
4. **事务处理**：重要操作使用事务包装
5. **性能考虑**：大量数据操作时注意性能影响

## 🔄 版本管理

### 当前版本：V1.0.0
- ✅ 基础表结构
- ✅ 用户认证
- ✅ 商户管理
- ✅ 业务核心

### 计划版本
- 🔄 V1.1.0：AI功能表结构
- 🔄 V1.2.0：数据分析表结构
- 🔄 V1.3.0：通知服务表结构 