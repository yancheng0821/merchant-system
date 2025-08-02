-- =====================================================
-- 商户管理系统数据库初始化脚本
-- 创建时间: 2024-07-19
-- 描述: 创建所有必需的数据库
-- =====================================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS merchant_auth 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS merchant_management 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS merchant_business 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS merchant_ai 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS merchant_analytics 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS merchant_notification 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

-- 显示创建的数据库
SHOW DATABASES LIKE 'merchant_%'; 