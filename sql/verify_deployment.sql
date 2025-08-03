-- =====================================================
-- 商户管理系统 - 数据库部署验证脚本
-- 用于验证生产环境数据库部署是否成功
-- =====================================================

-- 设置输出格式
SET @old_sql_mode = @@sql_mode;
SET sql_mode = '';

SELECT '=== 数据库部署验证开始 ===' as status;

-- 1. 检查数据库是否存在
SELECT '1. 检查数据库' as step;
SELECT 
    SCHEMA_NAME as database_name,
    DEFAULT_CHARACTER_SET_NAME as charset,
    DEFAULT_COLLATION_NAME as collation
FROM information_schema.SCHEMATA 
WHERE SCHEMA_NAME IN ('merchant_auth', 'merchant_management', 'merchant_business', 'merchant_analytics', 'merchant_notification')
ORDER BY SCHEMA_NAME;

-- 2. 检查时区设置
SELECT '2. 检查时区设置' as step;
SELECT 
    @@time_zone as current_timezone,
    @@system_time_zone as system_timezone,
    NOW() as current_time,
    UTC_TIMESTAMP() as utc_time;

-- 3. 检查字符集设置
SELECT '3. 检查字符集设置' as step;
SELECT 
    VARIABLE_NAME,
    VARIABLE_VALUE
FROM information_schema.SESSION_VARIABLES 
WHERE VARIABLE_NAME IN ('character_set_client', 'character_set_connection', 'character_set_results', 'collation_connection')
ORDER BY VARIABLE_NAME;

-- 4. 检查认证数据库表
SELECT '4. 检查认证数据库表' as step;
USE merchant_auth;
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    DATA_LENGTH,
    INDEX_LENGTH,
    TABLE_COLLATION
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'merchant_auth' 
ORDER BY TABLE_NAME;

-- 5. 检查默认数据
SELECT '5. 检查默认租户数据' as step;
SELECT id, tenant_code, tenant_name, tenant_type, status FROM tenants LIMIT 5;

SELECT '6. 检查默认用户数据' as step;
SELECT id, username, email, full_name, status FROM users LIMIT 5;

SELECT '7. 检查默认角色数据' as step;
SELECT id, role_name, role_code, description, status FROM roles LIMIT 5;

-- 8. 检查业务数据库
SELECT '8. 检查业务数据库表' as step;
USE merchant_business;
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    DATA_LENGTH,
    INDEX_LENGTH
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'merchant_business' 
ORDER BY TABLE_NAME;

SELECT '9. 检查服务分类数据' as step;
SELECT id, category_name, category_code, description, status FROM service_categories LIMIT 10;

SELECT '10. 检查服务项目数据' as step;
SELECT id, name, price, duration, resource_type, is_active FROM services LIMIT 10;

SELECT '11. 检查资源数据' as step;
SELECT id, name, type, description, status FROM resource LIMIT 10;

-- 12. 检查商户管理数据库
SELECT '12. 检查商户管理数据库' as step;
USE merchant_management;
SELECT id, merchant_name, business_type, contact_person, status FROM merchants LIMIT 5;

SELECT '13. 检查商户设置' as step;
SELECT setting_key, setting_value, setting_type, description FROM merchant_settings LIMIT 10;

-- 14. 检查通知数据库
SELECT '14. 检查通知数据库' as step;
USE merchant_notification;
SELECT id, template_name, template_type, is_system, status FROM notification_templates LIMIT 10;

-- 15. 检查分析数据库
SELECT '15. 检查分析数据库表' as step;
USE merchant_analytics;
SELECT 
    TABLE_NAME,
    TABLE_ROWS
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'merchant_analytics' 
ORDER BY TABLE_NAME;

-- 16. 检查外键约束
SELECT '16. 检查外键约束' as step;
SELECT 
    TABLE_SCHEMA,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_SCHEMA,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE 
WHERE REFERENCED_TABLE_SCHEMA IN ('merchant_auth', 'merchant_business', 'merchant_management', 'merchant_analytics', 'merchant_notification')
ORDER BY TABLE_SCHEMA, TABLE_NAME;

-- 17. 检查索引
SELECT '17. 检查重要索引' as step;
SELECT 
    TABLE_SCHEMA,
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    SEQ_IN_INDEX
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA IN ('merchant_auth', 'merchant_business', 'merchant_management', 'merchant_analytics', 'merchant_notification')
AND INDEX_NAME != 'PRIMARY'
ORDER BY TABLE_SCHEMA, TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

-- 18. 检查权限配置
SELECT '18. 检查权限配置' as step;
USE merchant_auth;
SELECT 
    r.role_name,
    COUNT(rp.permission_id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.role_name
ORDER BY r.id;

-- 19. 检查用户角色分配
SELECT '19. 检查用户角色分配' as step;
SELECT 
    u.username,
    u.email,
    r.role_name,
    r.role_code
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
ORDER BY u.username;

-- 20. 性能检查
SELECT '20. 检查表大小和性能' as step;
SELECT 
    TABLE_SCHEMA,
    TABLE_NAME,
    ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) as size_mb,
    TABLE_ROWS,
    ROUND((DATA_LENGTH / 1024 / 1024), 2) as data_mb,
    ROUND((INDEX_LENGTH / 1024 / 1024), 2) as index_mb
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA IN ('merchant_auth', 'merchant_business', 'merchant_management', 'merchant_analytics', 'merchant_notification')
ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC;

-- 21. 最终验证
SELECT '21. 最终验证结果' as step;

-- 统计各数据库的表数量
SELECT 
    'merchant_auth' as database_name,
    COUNT(*) as table_count
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'merchant_auth'
UNION ALL
SELECT 
    'merchant_business' as database_name,
    COUNT(*) as table_count
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'merchant_business'
UNION ALL
SELECT 
    'merchant_management' as database_name,
    COUNT(*) as table_count
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'merchant_management'
UNION ALL
SELECT 
    'merchant_analytics' as database_name,
    COUNT(*) as table_count
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'merchant_analytics'
UNION ALL
SELECT 
    'merchant_notification' as database_name,
    COUNT(*) as table_count
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'merchant_notification';

-- 检查是否有初始数据
SELECT 
    'tenants' as table_name,
    COUNT(*) as record_count
FROM merchant_auth.tenants
UNION ALL
SELECT 
    'users' as table_name,
    COUNT(*) as record_count
FROM merchant_auth.users
UNION ALL
SELECT 
    'services' as table_name,
    COUNT(*) as record_count
FROM merchant_business.services
UNION ALL
SELECT 
    'resources' as table_name,
    COUNT(*) as record_count
FROM merchant_business.resource
UNION ALL
SELECT 
    'notification_templates' as table_name,
    COUNT(*) as record_count
FROM merchant_notification.notification_templates;

-- 恢复SQL模式
SET sql_mode = @old_sql_mode;

SELECT '=== 数据库部署验证完成 ===' as status;
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.SCHEMATA WHERE SCHEMA_NAME IN ('merchant_auth', 'merchant_business', 'merchant_management', 'merchant_analytics', 'merchant_notification')) = 5
        AND (SELECT COUNT(*) FROM merchant_auth.tenants) > 0
        AND (SELECT COUNT(*) FROM merchant_auth.users) > 0
        AND (SELECT COUNT(*) FROM merchant_business.services) > 0
        THEN '✅ 部署成功！所有数据库和初始数据都已正确创建。'
        ELSE '❌ 部署可能存在问题，请检查上述输出结果。'
    END as deployment_result;