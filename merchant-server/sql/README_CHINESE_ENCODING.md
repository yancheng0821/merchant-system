# MySQL中文编码问题解决方案

## 问题描述

在MySQL数据库中插入或查询中文数据时出现乱码问题，这通常是由于字符集配置不正确导致的。

## 解决方案

### 1. 数据库连接配置

在应用程序的数据库连接URL中添加字符集参数：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/merchant_auth?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true&useLegacyDatetimeCode=false&characterSetResults=utf8&connectionCollation=utf8_unicode_ci&zeroDateTimeBehavior=convertToNull
    hikari:
      connection-init-sql: SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci
```

### 2. SQL文件字符集设置

在所有包含中文数据的SQL文件开头添加字符集设置：

```sql
-- 设置字符集，解决中文乱码问题
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET character_set_connection = utf8mb4;
SET character_set_client = utf8mb4;
SET character_set_results = utf8mb4;
```

### 3. 数据库表字符集设置

确保所有表都使用正确的字符集：

```sql
CREATE TABLE table_name (
    -- 字段定义
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 4. 执行SQL脚本时的字符集设置

#### 本地MySQL
```bash
mysql -u username -p --default-character-set=utf8mb4 < script.sql
```

#### Docker MySQL
```bash
docker exec -i container_name mysql -u username -p --default-character-set=utf8mb4 < script.sql
```

### 5. 已修改的文件

以下文件已经包含了字符集设置：

- `sql/data/01_init_data.sql` - 初始数据脚本
- `sql/setup_database.sh` - 数据库设置脚本（本地版）
- `sql/setup_database_docker.sh` - 数据库设置脚本（Docker版）

### 6. 验证字符集设置

执行以下SQL命令验证字符集设置：

```sql
-- 查看数据库字符集
SHOW CREATE DATABASE merchant_auth;

-- 查看表字符集
SHOW CREATE TABLE users;

-- 查看当前会话字符集
SHOW VARIABLES LIKE 'character_set%';
```

### 7. 常见问题排查

#### 问题1：插入中文数据后显示乱码
**解决方案：**
1. 检查数据库连接URL中的字符集参数
2. 确认表使用utf8mb4字符集
3. 检查SQL文件是否包含字符集设置

#### 问题2：查询中文数据时显示乱码
**解决方案：**
1. 检查应用程序的数据库连接配置
2. 确认Hikari连接池的初始化SQL
3. 验证数据库和表的字符集设置

#### 问题3：Docker环境中中文乱码
**解决方案：**
1. 确保Docker容器使用正确的字符集
2. 在docker exec命令中添加字符集参数
3. 检查MySQL容器的配置文件

### 8. 最佳实践

1. **统一字符集**：所有数据库、表、字段都使用utf8mb4字符集
2. **连接参数**：在数据库连接URL中包含完整的字符集参数
3. **SQL文件**：在所有包含中文的SQL文件开头设置字符集
4. **脚本执行**：执行SQL脚本时指定字符集参数
5. **测试验证**：部署后测试中文数据的插入和查询

### 9. 字符集说明

- **utf8mb4**：支持4字节UTF-8编码，可以存储emoji等特殊字符
- **utf8mb4_unicode_ci**：不区分大小写的Unicode排序规则
- **utf8mb4_general_ci**：通用排序规则，性能更好但准确性稍差

推荐使用utf8mb4_unicode_ci以获得更好的排序准确性。 