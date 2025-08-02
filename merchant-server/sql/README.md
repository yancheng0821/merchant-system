# 数据库结构说明

## 文件夹结构

```
sql/
├── init/                    # 数据库初始化脚本
│   ├── 01_create_databases.sql
│   └── 02_create_users.sql
├── schema/                  # 数据库表结构
│   ├── 01_auth_tables.sql
│   ├── 02_merchant_tables.sql
│   ├── 03_appointments_tables.sql
│   ├── 04_customer_tables.sql
│   ├── 05_notification_tables.sql
│   ├── 06_resource_tables.sql
│   └── 07_merchant_config.sql
└── data/                    # 测试数据
    ├── 01_init_data.sql
    ├── appointments_test_data.sql
    ├── appointments_test_data_tenant4.sql
    ├── customer_test_data.sql
    ├── customer_test_data_tenant4.sql
    ├── notification_templates_data.sql
    ├── notification_logs_test_data_tenant4.sql
    └── resource_test_data_tenant4.sql
```

## 使用说明

### 1. 数据库初始化
按顺序执行以下脚本：

```bash
# 1. 创建数据库和用户
mysql -u root -p < init/01_create_databases.sql
mysql -u root -p < init/02_create_users.sql

# 2. 创建表结构
mysql -u merchant_user -p merchant_management < schema/01_auth_tables.sql
mysql -u merchant_user -p merchant_management < schema/02_merchant_tables.sql
mysql -u merchant_user -p merchant_management < schema/03_appointments_tables.sql
mysql -u merchant_user -p merchant_management < schema/04_customer_tables.sql
mysql -u merchant_user -p merchant_management < schema/05_notification_tables.sql
mysql -u merchant_user -p merchant_management < schema/06_resource_tables.sql
mysql -u merchant_user -p merchant_management < schema/07_merchant_config.sql
```

### 2. 插入测试数据（可选）
```bash
# 插入基础数据
mysql -u merchant_user -p merchant_management < data/01_init_data.sql

# 插入测试数据
mysql -u merchant_user -p merchant_management < data/notification_templates_data.sql
mysql -u merchant_user -p merchant_management < data/customer_test_data.sql
mysql -u merchant_user -p merchant_management < data/appointments_test_data.sql
mysql -u merchant_user -p merchant_management < data/resource_test_data_tenant4.sql

# 或者插入特定租户的测试数据
mysql -u merchant_user -p merchant_management < data/customer_test_data_tenant4.sql
mysql -u merchant_user -p merchant_management < data/appointments_test_data_tenant4.sql
mysql -u merchant_user -p merchant_management < data/notification_logs_test_data_tenant4.sql
```

## 表结构说明

### 核心表
- **merchants**: 商户基础信息
- **merchant_settings**: 商户配置信息
- **customers**: 客户信息
- **appointments**: 预约信息
- **resource**: 统一资源管理（员工/场地）
- **notification_template**: 通知模板
- **notification_log**: 通知日志

### 关系说明
- 所有业务表通过 `tenant_id` 进行租户隔离
- 商户配置通过 `merchant_settings` 表存储JSON格式配置
- 资源管理统一使用 `resource` 表，通过 `type` 字段区分员工和场地

## 注意事项

1. **执行顺序**: 必须按照编号顺序执行schema文件
2. **字符编码**: 所有SQL文件使用UTF-8编码
3. **测试数据**: data文件夹中的数据仅用于开发测试
4. **租户隔离**: 生产环境中注意tenant_id的正确设置