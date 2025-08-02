-- =====================================================
-- 商户管理系统用户创建脚本
-- 创建时间: 2024-07-19
-- 描述: 创建数据库用户并分配权限
-- =====================================================

-- 创建应用用户
CREATE USER IF NOT EXISTS 'merchant_app'@'localhost' IDENTIFIED BY 'MerchantApp@2024';
CREATE USER IF NOT EXISTS 'merchant_app'@'%' IDENTIFIED BY 'MerchantApp@2024';

-- 创建只读用户（用于报表查询）
CREATE USER IF NOT EXISTS 'merchant_readonly'@'localhost' IDENTIFIED BY 'MerchantRead@2024';
CREATE USER IF NOT EXISTS 'merchant_readonly'@'%' IDENTIFIED BY 'MerchantRead@2024';

-- 为应用用户分配权限
-- 认证数据库权限
GRANT ALL PRIVILEGES ON merchant_auth.* TO 'merchant_app'@'localhost';
GRANT ALL PRIVILEGES ON merchant_auth.* TO 'merchant_app'@'%';

-- 商户管理数据库权限
GRANT ALL PRIVILEGES ON merchant_management.* TO 'merchant_app'@'localhost';
GRANT ALL PRIVILEGES ON merchant_management.* TO 'merchant_app'@'%';

-- 业务数据库权限
GRANT ALL PRIVILEGES ON merchant_business.* TO 'merchant_app'@'localhost';
GRANT ALL PRIVILEGES ON merchant_business.* TO 'merchant_app'@'%';

-- AI数据库权限
GRANT ALL PRIVILEGES ON merchant_ai.* TO 'merchant_app'@'localhost';
GRANT ALL PRIVILEGES ON merchant_ai.* TO 'merchant_app'@'%';

-- 分析数据库权限
GRANT ALL PRIVILEGES ON merchant_analytics.* TO 'merchant_app'@'localhost';
GRANT ALL PRIVILEGES ON merchant_analytics.* TO 'merchant_app'@'%';

-- 通知数据库权限
GRANT ALL PRIVILEGES ON merchant_notification.* TO 'merchant_app'@'localhost';
GRANT ALL PRIVILEGES ON merchant_notification.* TO 'merchant_app'@'%';

-- 为只读用户分配权限
GRANT SELECT ON merchant_auth.* TO 'merchant_readonly'@'localhost';
GRANT SELECT ON merchant_auth.* TO 'merchant_readonly'@'%';
GRANT SELECT ON merchant_management.* TO 'merchant_readonly'@'localhost';
GRANT SELECT ON merchant_management.* TO 'merchant_readonly'@'%';
GRANT SELECT ON merchant_business.* TO 'merchant_readonly'@'localhost';
GRANT SELECT ON merchant_business.* TO 'merchant_readonly'@'%';
GRANT SELECT ON merchant_ai.* TO 'merchant_readonly'@'localhost';
GRANT SELECT ON merchant_ai.* TO 'merchant_readonly'@'%';
GRANT SELECT ON merchant_analytics.* TO 'merchant_readonly'@'localhost';
GRANT SELECT ON merchant_analytics.* TO 'merchant_readonly'@'%';
GRANT SELECT ON merchant_notification.* TO 'merchant_readonly'@'localhost';
GRANT SELECT ON merchant_notification.* TO 'merchant_readonly'@'%';

-- 刷新权限
FLUSH PRIVILEGES;

-- 显示用户
SELECT User, Host FROM mysql.user WHERE User LIKE 'merchant_%'; 