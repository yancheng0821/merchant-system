-- 创建所有需要的数据库
CREATE DATABASE IF NOT EXISTS merchant_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS merchant_business CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS merchant_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS merchant_notification CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS merchant_analytics CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 授予 merchant_app 用户所有数据库的权限
GRANT ALL PRIVILEGES ON merchant_auth.* TO 'merchant_app'@'%';
GRANT ALL PRIVILEGES ON merchant_business.* TO 'merchant_app'@'%';
GRANT ALL PRIVILEGES ON merchant_management.* TO 'merchant_app'@'%';
GRANT ALL PRIVILEGES ON merchant_notification.* TO 'merchant_app'@'%';
GRANT ALL PRIVILEGES ON merchant_analytics.* TO 'merchant_app'@'%';

FLUSH PRIVILEGES;
