-- =====================================================
-- 商户管理系统 - 生产环境数据库初始化脚本
-- 版本: 1.0
-- 创建时间: 2025-01-02
-- 说明: 用于AWS RDS MySQL生产环境的数据库和表结构创建
-- 时区: America/Vancouver (温哥华时间)
-- =====================================================

-- 设置字符集和时区
SET NAMES utf8mb4;
SET CHARACTER_SET_CLIENT = utf8mb4;
SET CHARACTER_SET_CONNECTION = utf8mb4;
SET CHARACTER_SET_RESULTS = utf8mb4;
SET COLLATION_CONNECTION = utf8mb4_unicode_ci;
SET FOREIGN_KEY_CHECKS = 0;

-- 设置温哥华时区
SET time_zone = 'America/Vancouver';

-- =====================================================
-- 1. 创建数据库
-- =====================================================

-- 认证服务数据库
CREATE DATABASE IF NOT EXISTS `merchant_auth` 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 商户管理数据库
CREATE DATABASE IF NOT EXISTS `merchant_management` 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 业务服务数据库
CREATE DATABASE IF NOT EXISTS `merchant_business` 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 数据分析数据库
CREATE DATABASE IF NOT EXISTS `merchant_analytics` 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 通知服务数据库
CREATE DATABASE IF NOT EXISTS `merchant_notification` 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
-- ==
===================================================
-- 2. 认证服务数据库 (merchant_auth)
-- =====================================================

USE `merchant_auth`;

-- 租户表
CREATE TABLE IF NOT EXISTS `tenants` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '租户ID',
  `tenant_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '租户编码',
  `tenant_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '租户名称',
  `tenant_type` enum('CHAIN','BRANCH','INDEPENDENT') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '租户类型：连锁店/分店/独立商户',
  `parent_tenant_id` bigint DEFAULT NULL COMMENT '父租户ID（分店关联总部）',
  `status` enum('ACTIVE','INACTIVE','SUSPENDED') COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVE' COMMENT '状态',
  `contact_person` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '联系人',
  `contact_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '联系电话',
  `contact_email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '联系邮箱',
  `address` text COLLATE utf8mb4_unicode_ci COMMENT '地址',
  `business_license` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '营业执照号',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `tenant_code` (`tenant_code`),
  KEY `idx_tenant_code` (`tenant_code`),
  KEY `idx_parent_tenant` (`parent_tenant_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='租户表';

-- 用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `tenant_id` bigint NOT NULL COMMENT '租户ID',
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '用户名',
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '密码',
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '邮箱',
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '手机号',
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '真实姓名',
  `avatar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '头像URL',
  `status` enum('ACTIVE','INACTIVE','LOCKED') COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVE' COMMENT '状态',
  `last_login_time` timestamp NULL DEFAULT NULL COMMENT '最后登录时间',
  `last_login_ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '最后登录IP',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username_tenant` (`username`,`tenant_id`),
  UNIQUE KEY `uk_email_tenant` (`email`,`tenant_id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_username` (`username`),
  KEY `idx_email` (`email`),
  KEY `idx_status` (`status`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 角色表
CREATE TABLE IF NOT EXISTS `roles` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '角色ID',
  `tenant_id` bigint NOT NULL COMMENT '租户ID',
  `role_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '角色名称',
  `role_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '角色编码',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '角色描述',
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVE' COMMENT '状态',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_code_tenant` (`role_code`,`tenant_id`),
  KEY `idx_tenant_id` (`tenant_id`),
  CONSTRAINT `roles_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表';

-- 权限表
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '权限ID',
  `permission_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '权限名称',
  `permission_code` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '权限编码',
  `resource_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '资源类型',
  `resource_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '资源路径',
  `http_method` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'HTTP方法',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '权限描述',
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVE' COMMENT '状态',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `permission_code` (`permission_code`),
  KEY `idx_permission_code` (`permission_code`),
  KEY `idx_resource_type` (`resource_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限表';

-- 用户角色关联表
CREATE TABLE IF NOT EXISTS `user_roles` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `role_id` bigint NOT NULL COMMENT '角色ID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_role` (`user_id`,`role_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_role_id` (`role_id`),
  CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_roles_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户角色关联表';

-- 角色权限关联表
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `role_id` bigint NOT NULL COMMENT '角色ID',
  `permission_id` bigint NOT NULL COMMENT '权限ID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_permission` (`role_id`,`permission_id`),
  KEY `idx_role_id` (`role_id`),
  KEY `idx_permission_id` (`permission_id`),
  CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色权限关联表';

-- 租户邀请表
CREATE TABLE IF NOT EXISTS `tenant_invitations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `invitation_code` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by` bigint NOT NULL,
  `max_uses` int DEFAULT '1',
  `used_count` int DEFAULT '0',
  `expires_at` datetime DEFAULT NULL,
  `status` enum('ACTIVE','EXPIRED','DISABLED') COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVE',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invitation_code` (`invitation_code`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_created_by` (`created_by`),
  KEY `idx_status` (`status`),
  CONSTRAINT `tenant_invitations_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`),
  CONSTRAINT `tenant_invitations_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 邀请使用日志表
CREATE TABLE IF NOT EXISTS `invitation_usage_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `invitation_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `used_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_invitation_id` (`invitation_id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `invitation_usage_logs_ibfk_1` FOREIGN KEY (`invitation_id`) REFERENCES `tenant_invitations` (`id`),
  CONSTRAINT `invitation_usage_logs_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 登录日志表
CREATE TABLE IF NOT EXISTS `login_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `login_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '登录时间',
  `login_ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '登录IP',
  `user_agent` text COLLATE utf8mb4_unicode_ci COMMENT '用户代理',
  `login_status` enum('SUCCESS','FAILED') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '登录状态',
  `failure_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '失败原因',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_login_time` (`login_time`),
  KEY `idx_login_status` (`login_status`),
  CONSTRAINT `login_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户登录日志表';

-- Token黑名单表
CREATE TABLE IF NOT EXISTS `token_blacklist` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `token_hash` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Token哈希值',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `expires_at` timestamp NOT NULL COMMENT '过期时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_hash` (`token_hash`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_expires_at` (`expires_at`),
  CONSTRAINT `token_blacklist_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Token黑名单表';-- =
====================================================
-- 3. 商户管理数据库 (merchant_management)
-- =====================================================

USE `merchant_management`;

-- 商户表
CREATE TABLE IF NOT EXISTS `merchants` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '商户ID',
  `tenant_id` bigint NOT NULL COMMENT '租户ID',
  `merchant_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '商户编码',
  `merchant_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '商户名称',
  `business_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '业务类型',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '商户描述',
  `logo_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Logo URL',
  `contact_person` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '联系人',
  `contact_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '联系电话',
  `contact_email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '联系邮箱',
  `address` text COLLATE utf8mb4_unicode_ci COMMENT '地址',
  `latitude` decimal(10,8) DEFAULT NULL COMMENT '纬度',
  `longitude` decimal(11,8) DEFAULT NULL COMMENT '经度',
  `business_license` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '营业执照号',
  `status` enum('ACTIVE','INACTIVE','SUSPENDED') COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVE' COMMENT '状态',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_merchant_code` (`merchant_code`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_merchant_code` (`merchant_code`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商户表';

-- 商户设置表
CREATE TABLE IF NOT EXISTS `merchant_settings` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `tenant_id` bigint NOT NULL COMMENT '租户ID',
  `setting_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '设置键',
  `setting_value` text COLLATE utf8mb4_unicode_ci COMMENT '设置值',
  `setting_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'STRING' COMMENT '设置类型',
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '描述',
  `is_system` tinyint(1) DEFAULT '0' COMMENT '是否系统设置',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tenant_setting` (`tenant_id`,`setting_key`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商户设置表';

-- 营业时间表
CREATE TABLE IF NOT EXISTS `business_hours` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `tenant_id` bigint NOT NULL COMMENT '租户ID',
  `day_of_week` tinyint NOT NULL COMMENT '星期几(1-7)',
  `is_open` tinyint(1) DEFAULT '1' COMMENT '是否营业',
  `open_time` time DEFAULT NULL COMMENT '开始时间',
  `close_time` time DEFAULT NULL COMMENT '结束时间',
  `break_start_time` time DEFAULT NULL COMMENT '休息开始时间',
  `break_end_time` time DEFAULT NULL COMMENT '休息结束时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tenant_day` (`tenant_id`,`day_of_week`),
  KEY `idx_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='营业时间表';

-- 商户图片表
CREATE TABLE IF NOT EXISTS `merchant_images` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `tenant_id` bigint NOT NULL COMMENT '租户ID',
  `image_url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '图片URL',
  `image_type` enum('LOGO','BANNER','GALLERY','OTHER') COLLATE utf8mb4_unicode_ci DEFAULT 'GALLERY' COMMENT '图片类型',
  `title` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '图片标题',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '图片描述',
  `sort_order` int DEFAULT '0' COMMENT '排序',
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVE' COMMENT '状态',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_image_type` (`image_type`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商户图片表';

-- 商户评价表
CREATE TABLE IF NOT EXISTS `merchant_reviews` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `tenant_id` bigint NOT NULL COMMENT '租户ID',
  `customer_id` bigint DEFAULT NULL COMMENT '客户ID',
  `customer_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '客户姓名',
  `rating` tinyint NOT NULL COMMENT '评分(1-5)',
  `review_content` text COLLATE utf8mb4_unicode_ci COMMENT '评价内容',
  `reply_content` text COLLATE utf8mb4_unicode_ci COMMENT '回复内容',
  `status` enum('PENDING','APPROVED','REJECTED') COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING' COMMENT '状态',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_rating` (`rating`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商户评价表';

-- 连锁管理表
CREATE TABLE IF NOT EXISTS `chain_management` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `parent_tenant_id` bigint NOT NULL COMMENT '总部租户ID',
  `child_tenant_id` bigint NOT NULL COMMENT '分店租户ID',
  `relationship_type` enum('DIRECT','FRANCHISE') COLLATE utf8mb4_unicode_ci DEFAULT 'DIRECT' COMMENT '关系类型',
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVE' COMMENT '状态',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_parent_child` (`parent_tenant_id`,`child_tenant_id`),
  KEY `idx_parent_tenant` (`parent_tenant_id`),
  KEY `idx_child_tenant` (`child_tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='连锁管理表';

-- 商户资源类型表
CREATE TABLE IF NOT EXISTS `merchant_resource_types` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `tenant_id` bigint NOT NULL COMMENT '租户ID',
  `type_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '资源类型名称',
  `type_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '资源类型编码',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '描述',
  `is_default` tinyint(1) DEFAULT '0' COMMENT '是否默认类型',
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVE' COMMENT '状态',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tenant_type_code` (`tenant_id`,`type_code`),
  KEY `idx_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商户资源类型表';

-- 商户资源统计表
CREATE TABLE IF NOT EXISTS `merchant_resource_stats` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `tenant_id` bigint NOT NULL COMMENT '租户ID',
  `resource_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '资源类型',
  `total_count` int DEFAULT '0' COMMENT '总数量',
  `active_count` int DEFAULT '0' COMMENT '活跃数量',
  `utilization_rate` decimal(5,2) DEFAULT '0.00' COMMENT '利用率',
  `stats_date` date NOT NULL COMMENT '统计日期',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tenant_type_date` (`tenant_id`,`resource_type`,`stats_date`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_stats_date` (`stats_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商户资源统计表';-
- =====================================================
-- 4. 业务服务数据库 (merchant_business)
-- =====================================================

USE `merchant_business`;

-- 客户表
CREATE TABLE IF NOT EXISTS `customers` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '客户ID',
  `tenant_id` bigint NOT NULL COMMENT '租户ID',
  `customer_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '客户编码',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '客户姓名',
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '手机号',
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '邮箱',
  `gender` enum('MALE','FEMALE','OTHER') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '性别',
  `birth_date` date DEFAULT NULL COMMENT '生日',
  `address` text COLLATE utf8mb4_unicode_ci COMMENT '地址',
  `notes` text COLLATE utf8mb4_unicode_ci COMMENT '备注',
  `tags` json DEFAULT NULL COMMENT '标签',
  `communication_preference` enum('SMS','EMAIL','BOTH','NONE') COLLATE utf8mb4_unicode_ci DEFAULT 'SMS' COMMENT '沟通偏好',
  `status` enum('ACTIVE','INACTIVE','BLACKLISTED') COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVE' COMMENT '状态',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tenant_phone` (`tenant_id`,`phone`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_phone` (`phone`),
  KEY `idx_email` (`email`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='客户表';

-- 服务分类表
CREATE TABLE IF NOT EXISTS `service_categories` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '分类ID',
  `tenant_id` bigint NOT NULL COMMENT '租户ID',
  `category_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '分类名称',
  `category_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '分类编码',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '分类描述',
  `parent_id` bigint DEFAULT NULL COMMENT '父分类ID',
  `sort_order` int DEFAULT '0' COMMENT '排序',
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVE' COMMENT '状态',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='服务分类表';

-- 服务表
CREATE TABLE IF NOT EXISTS `services` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '服务ID',
  `tenant_id` bigint NOT NULL COMMENT '租户ID',
  `category_id` bigint DEFAULT NULL COMMENT '分类ID',
  `service_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '服务编码',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '服务名称',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '服务描述',
  `price` decimal(10,2) NOT NULL COMMENT '价格',
  `duration` int DEFAULT '60' COMMENT '时长(分钟)',
  `resource_type` enum('STAFF','ROOM','BOTH') COLLATE utf8mb4_unicode_ci DEFAULT 'STAFF' COMMENT '资源类型',
  `image_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '服务图片',
  `is_active` tinyint(1) DEFAULT '1' COMMENT '是否启用',
  `sort_order` int DEFAULT '0' COMMENT '排序',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_is_active` (`is_active`),
  CONSTRAINT `services_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `service_categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='服务表';

-- 资源表
CREATE TABLE IF NOT EXISTS `resource` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '资源ID',
  `tenant_id` bigint NOT NULL COMMENT '租户ID',
  `resource_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '资源编码',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '资源名称',
  `type` enum('STAFF','ROOM') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '资源类型',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '描述',
  `skills` json DEFAULT NULL COMMENT '技能标签(员工)',
  `capacity` int DEFAULT '1' COMMENT '容量(房间)',
  `facilities` json DEFAULT NULL COMMENT '设施(房间)',
  `hourly_rate` decimal(10,2) DEFAULT NULL COMMENT '小时费率',
  `image_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '图片URL',
  `status` enum('ACTIVE','INACTIVE','MAINTENANCE') COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVE' COMMENT '状态',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资源表';

-- 资源可用性表
CREATE TABLE IF NOT EXISTS `resource_availability` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `tenant_id` bigint NOT NULL COMMENT '租户ID',
  `resource_id` bigint NOT NULL COMMENT '资源ID',
  `day_of_week` tinyint NOT NULL COMMENT '星期几(1-7)',
  `start_time` time NOT NULL COMMENT '开始时间',
  `end_time` time NOT NULL COMMENT '结束时间',
  `is_available` tinyint(1) DEFAULT '1' COMMENT '是否可用',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_resource_id` (`resource_id`),
  KEY `idx_day_of_week` (`day_of_week`),
  CONSTRAINT `resource_availability_ibfk_1` FOREIGN KEY (`resource_id`) REFERENCES `resource` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资源可用性表';

-- 预约表
CREATE TABLE IF NOT EXISTS `appointments` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '预约ID',
  `tenant_id` bigint NOT NULL COMMENT '租户ID',
  `customer_id` bigint NOT NULL COMMENT '客户ID',
  `resource_id` bigint DEFAULT NULL COMMENT '资源ID',
  `appointment_date` date NOT NULL COMMENT '预约日期',
  `appointment_time` time NOT NULL COMMENT '预约时间',
  `duration` int DEFAULT '60' COMMENT '时长(分钟)',
  `total_amount` decimal(10,2) DEFAULT '0.00' COMMENT '总金额',
  `status` enum('PENDING','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW') COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING' COMMENT '状态',
  `notes` text COLLATE utf8mb4_unicode_ci COMMENT '备注',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_resource_id` (`resource_id`),
  KEY `idx_appointment_date` (`appointment_date`),
  KEY `idx_status` (`status`),
  CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`resource_id`) REFERENCES `resource` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预约表';

-- 预约服务关联表
CREATE TABLE IF NOT EXISTS `appointment_services` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `appointment_id` bigint NOT NULL COMMENT '预约ID',
  `service_id` bigint NOT NULL COMMENT '服务ID',
  `quantity` int DEFAULT '1' COMMENT '数量',
  `unit_price` decimal(10,2) NOT NULL COMMENT '单价',
  `total_price` decimal(10,2) NOT NULL COMMENT '总价',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_appointment_id` (`appointment_id`),
  KEY `idx_service_id` (`service_id`),
  CONSTRAINT `appointment_services_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `appointment_services_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预约服务关联表';

-- 资源预约时段表
CREATE TABLE IF NOT EXISTS `resource_booking_slots` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `tenant_id` bigint NOT NULL COMMENT '租户ID',
  `resource_id` bigint NOT NULL COMMENT '资源ID',
  `appointment_id` bigint DEFAULT NULL COMMENT '预约ID',
  `booking_date` date NOT NULL COMMENT '预约日期',
  `start_time` time NOT NULL COMMENT '开始时间',
  `end_time` time NOT NULL COMMENT '结束时间',
  `status` enum('AVAILABLE','BOOKED','BLOCKED') COLLATE utf8mb4_unicode_ci DEFAULT 'AVAILABLE' COMMENT '状态',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_resource_id` (`resource_id`),
  KEY `idx_appointment_id` (`appointment_id`),
  KEY `idx_booking_date` (`booking_date`),
  KEY `idx_status` (`status`),
  CONSTRAINT `resource_booking_slots_ibfk_1` FOREIGN KEY (`resource_id`) REFERENCES `resource` (`id`) ON DELETE CASCADE,
  CONSTRAINT `resource_booking_slots_ibfk_2` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资源预约时段表';

-- 订单表
CREATE TABLE IF NOT EXISTS `orders` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '订单ID',
  `tenant_id` bigint NOT NULL COMMENT '租户ID',
  `order_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '订单号',
  `customer_id` bigint NOT NULL COMMENT '客户ID',
  `appointment_id` bigint DEFAULT NULL COMMENT '预约ID',
  `total_amount` decimal(10,2) NOT NULL COMMENT '总金额',
  `discount_amount` decimal(10,2) DEFAULT '0.00' COMMENT '折扣金额',
  `final_amount` decimal(10,2) NOT NULL COMMENT '最终金额',
  `payment_status` enum('PENDING','PAID','PARTIAL','REFUNDED','CANCELLED') COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING' COMMENT '支付状态',
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '支付方式',
  `order_status` enum('PENDING','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED') COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING' COMMENT '订单状态',
  `notes` text COLLATE utf8mb4_unicode_ci COMMENT '备注',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_number` (`order_number`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_appointment_id` (`appointment_id`),
  KEY `idx_payment_status` (`payment_status`),
  KEY `idx_order_status` (`order_status`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表';

-- 订单服务关联表
CREATE TABLE IF NOT EXISTS `order_services` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `order_id` bigint NOT NULL COMMENT '订单ID',
  `service_id` bigint NOT NULL COMMENT '服务ID',
  `quantity` int DEFAULT '1' COMMENT '数量',
  `unit_price` decimal(10,2) NOT NULL COMMENT '单价',
  `total_price` decimal(10,2) NOT NULL COMMENT '总价',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_service_id` (`service_id`),
  CONSTRAINT `order_services_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_services_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单服务关联表';

-- 客户偏好服务表
CREATE TABLE IF NOT EXISTS `customer_preferred_services` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `customer_id` bigint NOT NULL COMMENT '客户ID',
  `service_id` bigint NOT NULL COMMENT '服务ID',
  `preference_score` decimal(3,2) DEFAULT '1.00' COMMENT '偏好分数',
  `last_used_at` timestamp NULL DEFAULT NULL COMMENT '最后使用时间',
  `usage_count` int DEFAULT '0' COMMENT '使用次数',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_customer_service` (`customer_id`,`service_id`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_service_id` (`service_id`),
  CONSTRAINT `customer_preferred_services_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `customer_preferred_services_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='客户偏好服务表';

-- POS终端表
CREATE TABLE IF NOT EXISTS `pos_terminals` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '终端ID',
  `tenant_id` bigint NOT NULL COMMENT '租户ID',
  `terminal_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '终端编号',
  `terminal_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '终端名称',
  `location` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '位置',
  `status` enum('ACTIVE','INACTIVE','MAINTENANCE') COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVE' COMMENT '状态',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tenant_terminal` (`tenant_id`,`terminal_id`),
  KEY `idx_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='POS终端表';

-- POS交易表
CREATE TABLE IF NOT EXISTS `pos_transactions` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '交易ID',
  `tenant_id` bigint NOT NULL COMMENT '租户ID',
  `terminal_id` bigint NOT NULL COMMENT '终端ID',
  `order_id` bigint DEFAULT NULL COMMENT '订单ID',
  `transaction_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '交易流水号',
  `amount` decimal(10,2) NOT NULL COMMENT '交易金额',
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '支付方式',
  `transaction_type` enum('PAYMENT','REFUND','VOID') COLLATE utf8mb4_unicode_ci DEFAULT 'PAYMENT' COMMENT '交易类型',
  `status` enum('PENDING','SUCCESS','FAILED','CANCELLED') COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING' COMMENT '交易状态',
  `response_code` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '响应码',
  `response_message` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '响应消息',
  `transaction_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '交易时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `transaction_id` (`transaction_id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_terminal_id` (`terminal_id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `pos_transactions_ibfk_1` FOREIGN KEY (`terminal_id`) REFERENCES `pos_terminals` (`id`),
  CONSTRAINT `pos_transactions_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='POS交易表';

-- 支付回调表
CREATE TABLE IF NOT EXISTS `payment_callbacks` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `tenant_id` bigint NOT NULL COMMENT '租户ID',
  `order_id` bigint DEFAULT NULL COMMENT '订单ID',
  `transaction_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '交易ID',
  `callback_data` json DEFAULT NULL COMMENT '回调数据',
  `callback_status` enum('PENDING','SUCCESS','FAILED','PROCESSED') COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING' COMMENT '回调状态',
  `processed_at` timestamp NULL DEFAULT NULL COMMENT '处理时间',
  `error_message` text COLLATE utf8mb4_unicode_ci COMMENT '错误信息',
  `retry_count` int DEFAULT '0' COMMENT '重试次数',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_transaction_id` (`transaction_id`),
  KEY `idx_callback_status` (`callback_status`),
  CONSTRAINT `payment_callbacks_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='支付回调表';

-- 客户导入日志表
CREATE TABLE IF NOT EXISTS `customer_import_log` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `tenant_id` bigint NOT NULL COMMENT '租户ID',
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '文件名',
  `total_records` int DEFAULT '0' COMMENT '总记录数',
  `success_records` int DEFAULT '0' COMMENT '成功记录数',
  `failed_records` int DEFAULT '0' COMMENT '失败记录数',
  `status` enum('PROCESSING','COMPLETED','FAILED') COLLATE utf8mb4_unicode_ci DEFAULT 'PROCESSING' COMMENT '状态',
  `error_message` text COLLATE utf8mb4_unicode_ci COMMENT '错误信息',
  `created_by` bigint DEFAULT NULL COMMENT '创建人',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='客户导入日志表';

-- 客户导入临时表
CREATE TABLE IF NOT EXISTS `customer_import_temp` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `import_log_id` bigint NOT NULL COMMENT '导入日志ID',
  `row_number` int NOT NULL COMMENT '行号',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '姓名',
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '手机号',
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '邮箱',
  `gender` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '性别',
  `birth_date` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '生日',
  `address` text COLLATE utf8mb4_unicode_ci COMMENT '地址',
  `notes` text COLLATE utf8mb4_unicode_ci COMMENT '备注',
  `import_status` enum('PENDING','SUCCESS','FAILED') COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING' COMMENT '导入状态',
  `error_message` text COLLATE utf8mb4_unicode_ci COMMENT '错误信息',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_import_log_id` (`import_log_id`),
  KEY `idx_import_status` (`import_status`),
  CONSTRAINT `customer_import_temp_ibfk_1` FOREIGN KEY (`import_log_id`) REFERENCES `customer_import_log` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='客户导入临时表';-- 
=====================================================
-- 5. 数据分析数据库 (merchant_analytics)
-- =====================================================

USE `merchant_analytics`;

-- 每日收入统计表
CREATE TABLE IF NOT EXISTS `daily_revenue_stats` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `tenant_id` bigint NOT NULL COMMENT '租户ID',
  `stats_date` date NOT NULL COMMENT '统计日期',
  `total_revenue` decimal(12,2) DEFAULT '0.00' COMMENT '总收入',
  `cash_revenue` decimal(12,2) DEFAULT '0.00' COMMENT '现金收入',
  `card_revenue` decimal(12,2) DEFAULT '0.00' COMMENT '刷卡收入',
  `online_revenue` decimal(12,2) DEFAULT '0.00' COMMENT '在线支付收入',
  `refund_amount` decimal(12,2) DEFAULT '0.00' COMMENT '退款金额',
  `net_revenue` decimal(12,2) DEFAULT '0.00' COMMENT '净收入',
  `order_count` int DEFAULT '0' COMMENT '订单数量',
  `avg_order_value` decimal(10,2) DEFAULT '0.00' COMMENT '平均订单价值',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tenant_date` (`tenant_id`,`stats_date`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_stats_date` (`stats_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='每日收入统计表';

-- 每日服务统计表
CREATE TABLE IF NOT EXISTS `daily_service_stats` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `tenant_id` bigint NOT NULL COMMENT '租户ID',
  `service_id` bigint NOT NULL COMMENT '服务ID',
  `service_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '服务名称',
  `stats_date` date NOT NULL COMMENT '统计日期',
  `booking_count` int DEFAULT '0' COMMENT '预约次数',
  `completed_count` int DEFAULT '0' COMMENT '完成次数',
  `cancelled_count` int DEFAULT '0' COMMENT '取消次数',
  `no_show_count` int DEFAULT '0' COMMENT '爽约次数',
  `total_revenue` decimal(10,2) DEFAULT '0.00' COMMENT '总收入',
  `avg_rating` decimal(3,2) DEFAULT '0.00' COMMENT '平均评分',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tenant_service_date` (`tenant_id`,`service_id`,`stats_date`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_service_id` (`service_id`),
  KEY `idx_stats_date` (`stats_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='每日服务统计表';

-- 每日资源统计表
CREATE TABLE IF NOT EXISTS `daily_resource_stats` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `tenant_id` bigint NOT NULL COMMENT '租户ID',
  `resource_id` bigint NOT NULL COMMENT '资源ID',
  `resource_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '资源名称',
  `resource_type` enum('STAFF','ROOM') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '资源类型',
  `stats_date` date NOT NULL COMMENT '统计日期',
  `total_hours` decimal(5,2) DEFAULT '0.00' COMMENT '总工作时间',
  `booked_hours` decimal(5,2) DEFAULT '0.00' COMMENT '预约时间',
  `utilization_rate` decimal(5,2) DEFAULT '0.00' COMMENT '利用率',
  `booking_count` int DEFAULT '0' COMMENT '预约次数',
  `revenue` decimal(10,2) DEFAULT '0.00' COMMENT '收入',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tenant_resource_date` (`tenant_id`,`resource_id`,`stats_date`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_resource_id` (`resource_id`),
  KEY `idx_stats_date` (`stats_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='每日资源统计表';

-- 每日客户统计表
CREATE TABLE IF NOT EXISTS `daily_customer_stats` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `tenant_id` bigint NOT NULL COMMENT '租户ID',
  `stats_date` date NOT NULL COMMENT '统计日期',
  `new_customers` int DEFAULT '0' COMMENT '新客户数',
  `returning_customers` int DEFAULT '0' COMMENT '回头客数',
  `total_customers` int DEFAULT '0' COMMENT '总客户数',
  `active_customers` int DEFAULT '0' COMMENT '活跃客户数',
  `customer_retention_rate` decimal(5,2) DEFAULT '0.00' COMMENT '客户留存率',
  `avg_customer_value` decimal(10,2) DEFAULT '0.00' COMMENT '平均客户价值',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tenant_date` (`tenant_id`,`stats_date`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_stats_date` (`stats_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='每日客户统计表';

-- 每日预约统计表
CREATE TABLE IF NOT EXISTS `daily_appointment_stats` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `tenant_id` bigint NOT NULL COMMENT '租户ID',
  `stats_date` date NOT NULL COMMENT '统计日期',
  `total_appointments` int DEFAULT '0' COMMENT '总预约数',
  `confirmed_appointments` int DEFAULT '0' COMMENT '确认预约数',
  `completed_appointments` int DEFAULT '0' COMMENT '完成预约数',
  `cancelled_appointments` int DEFAULT '0' COMMENT '取消预约数',
  `no_show_appointments` int DEFAULT '0' COMMENT '爽约预约数',
  `completion_rate` decimal(5,2) DEFAULT '0.00' COMMENT '完成率',
  `cancellation_rate` decimal(5,2) DEFAULT '0.00' COMMENT '取消率',
  `no_show_rate` decimal(5,2) DEFAULT '0.00' COMMENT '爽约率',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tenant_date` (`tenant_id`,`stats_date`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_stats_date` (`stats_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='每日预约统计表';

-- 数据同步日志表
CREATE TABLE IF NOT EXISTS `data_sync_log` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `tenant_id` bigint NOT NULL COMMENT '租户ID',
  `sync_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '同步类型',
  `sync_date` date NOT NULL COMMENT '同步日期',
  `status` enum('PENDING','RUNNING','SUCCESS','FAILED') COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING' COMMENT '状态',
  `start_time` timestamp NULL DEFAULT NULL COMMENT '开始时间',
  `end_time` timestamp NULL DEFAULT NULL COMMENT '结束时间',
  `records_processed` int DEFAULT '0' COMMENT '处理记录数',
  `error_message` text COLLATE utf8mb4_unicode_ci COMMENT '错误信息',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tenant_type_date` (`tenant_id`,`sync_type`,`sync_date`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_sync_type` (`sync_type`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据同步日志表';

-- 实时统计缓存表
CREATE TABLE IF NOT EXISTS `realtime_stats_cache` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `tenant_id` bigint NOT NULL COMMENT '租户ID',
  `cache_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '缓存键',
  `cache_value` json DEFAULT NULL COMMENT '缓存值',
  `expires_at` timestamp NOT NULL COMMENT '过期时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tenant_key` (`tenant_id`,`cache_key`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='实时统计缓存表';

-- =====================================================
-- 6. 通知服务数据库 (merchant_notification)
-- =====================================================

USE `merchant_notification`;

-- 通知模板表
CREATE TABLE IF NOT EXISTS `notification_templates` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `tenant_id` bigint NOT NULL COMMENT '租户ID',
  `template_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '模板编码',
  `template_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '模板名称',
  `template_type` enum('SMS','EMAIL','PUSH') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '模板类型',
  `subject` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '邮件主题',
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '模板内容',
  `variables` json DEFAULT NULL COMMENT '变量定义',
  `is_system` tinyint(1) DEFAULT '0' COMMENT '是否系统模板',
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVE' COMMENT '状态',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tenant_code` (`tenant_id`,`template_code`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_template_type` (`template_type`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知模板表';

-- 通知日志表
CREATE TABLE IF NOT EXISTS `notification_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `tenant_id` bigint NOT NULL COMMENT '租户ID',
  `template_id` bigint DEFAULT NULL COMMENT '模板ID',
  `notification_type` enum('SMS','EMAIL','PUSH') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '通知类型',
  `recipient` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '接收者',
  `subject` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '主题',
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '内容',
  `status` enum('PENDING','SENT','FAILED','DELIVERED','READ') COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING' COMMENT '状态',
  `error_message` text COLLATE utf8mb4_unicode_ci COMMENT '错误信息',
  `sent_at` timestamp NULL DEFAULT NULL COMMENT '发送时间',
  `delivered_at` timestamp NULL DEFAULT NULL COMMENT '送达时间',
  `read_at` timestamp NULL DEFAULT NULL COMMENT '阅读时间',
  `retry_count` int DEFAULT '0' COMMENT '重试次数',
  `external_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '外部ID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_template_id` (`template_id`),
  KEY `idx_notification_type` (`notification_type`),
  KEY `idx_recipient` (`recipient`),
  KEY `idx_status` (`status`),
  KEY `idx_sent_at` (`sent_at`),
  CONSTRAINT `notification_logs_ibfk_1` FOREIGN KEY (`template_id`) REFERENCES `notification_templates` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知日志表';-- ======
===============================================
-- 7. 初始数据插入
-- =====================================================

-- 插入默认租户
USE `merchant_auth`;

INSERT INTO `tenants` (`id`, `tenant_code`, `tenant_name`, `tenant_type`, `status`, `contact_person`, `contact_phone`, `contact_email`, `address`) VALUES
(1, 'DEFAULT', '默认商户', 'INDEPENDENT', 'ACTIVE', '系统管理员', '1234567890', 'admin@merchant.com', '默认地址');

-- 插入默认用户
INSERT INTO `users` (`id`, `tenant_id`, `username`, `password`, `email`, `full_name`, `status`) VALUES
(1, 1, 'admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDi', 'admin@merchant.com', '系统管理员', 'ACTIVE'),
(2, 1, 'manager', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDi', 'manager@merchant.com', '店长', 'ACTIVE');

-- 插入默认角色
INSERT INTO `roles` (`id`, `tenant_id`, `role_name`, `role_code`, `description`, `status`) VALUES
(1, 1, '系统管理员', 'SYSTEM_ADMIN', '系统超级管理员，拥有所有权限', 'ACTIVE'),
(2, 1, '店长', 'MANAGER', '店长，管理店铺日常运营', 'ACTIVE'),
(3, 1, '员工', 'STAFF', '普通员工，基础操作权限', 'ACTIVE');

-- 插入默认权限
INSERT INTO `permissions` (`id`, `permission_name`, `permission_code`, `resource_type`, `resource_path`, `http_method`, `description`, `status`) VALUES
(1, '用户查看', 'USER:VIEW', 'USER', '/api/users/**', 'GET', '查看用户信息', 'ACTIVE'),
(2, '用户创建', 'USER:CREATE', 'USER', '/api/users', 'POST', '创建用户', 'ACTIVE'),
(3, '用户编辑', 'USER:UPDATE', 'USER', '/api/users/**', 'PUT', '编辑用户信息', 'ACTIVE'),
(4, '用户删除', 'USER:DELETE', 'USER', '/api/users/**', 'DELETE', '删除用户', 'ACTIVE'),
(5, '商户查看', 'MERCHANT:VIEW', 'MERCHANT', '/api/merchants/**', 'GET', '查看商户信息', 'ACTIVE'),
(6, '商户创建', 'MERCHANT:CREATE', 'MERCHANT', '/api/merchants', 'POST', '创建商户', 'ACTIVE'),
(7, '商户编辑', 'MERCHANT:UPDATE', 'MERCHANT', '/api/merchants/**', 'PUT', '编辑商户信息', 'ACTIVE'),
(8, '商户删除', 'MERCHANT:DELETE', 'MERCHANT', '/api/merchants/**', 'DELETE', '删除商户', 'ACTIVE'),
(9, '服务查看', 'SERVICE:VIEW', 'SERVICE', '/api/services/**', 'GET', '查看服务信息', 'ACTIVE'),
(10, '服务创建', 'SERVICE:CREATE', 'SERVICE', '/api/services', 'POST', '创建服务', 'ACTIVE'),
(11, '服务编辑', 'SERVICE:UPDATE', 'SERVICE', '/api/services/**', 'PUT', '编辑服务信息', 'ACTIVE'),
(12, '服务删除', 'SERVICE:DELETE', 'SERVICE', '/api/services/**', 'DELETE', '删除服务', 'ACTIVE'),
(13, '预约查看', 'APPOINTMENT:VIEW', 'APPOINTMENT', '/api/appointments/**', 'GET', '查看预约信息', 'ACTIVE'),
(14, '预约创建', 'APPOINTMENT:CREATE', 'APPOINTMENT', '/api/appointments', 'POST', '创建预约', 'ACTIVE'),
(15, '预约编辑', 'APPOINTMENT:UPDATE', 'APPOINTMENT', '/api/appointments/**', 'PUT', '编辑预约信息', 'ACTIVE'),
(16, '预约删除', 'APPOINTMENT:DELETE', 'APPOINTMENT', '/api/appointments/**', 'DELETE', '删除预约', 'ACTIVE'),
(17, '订单查看', 'ORDER:VIEW', 'ORDER', '/api/orders/**', 'GET', '查看订单信息', 'ACTIVE'),
(18, '订单创建', 'ORDER:CREATE', 'ORDER', '/api/orders', 'POST', '创建订单', 'ACTIVE'),
(19, '订单编辑', 'ORDER:UPDATE', 'ORDER', '/api/orders/**', 'PUT', '编辑订单信息', 'ACTIVE'),
(20, '订单删除', 'ORDER:DELETE', 'ORDER', '/api/orders/**', 'DELETE', '删除订单', 'ACTIVE'),
(21, '客户查看', 'CUSTOMER:VIEW', 'CUSTOMER', '/api/customers/**', 'GET', '查看客户信息', 'ACTIVE'),
(22, '客户创建', 'CUSTOMER:CREATE', 'CUSTOMER', '/api/customers', 'POST', '创建客户', 'ACTIVE'),
(23, '客户编辑', 'CUSTOMER:UPDATE', 'CUSTOMER', '/api/customers/**', 'PUT', '编辑客户信息', 'ACTIVE'),
(24, '客户删除', 'CUSTOMER:DELETE', 'CUSTOMER', '/api/customers/**', 'DELETE', '删除客户', 'ACTIVE'),
(25, '数据分析查看', 'ANALYTICS:VIEW', 'ANALYTICS', '/api/analytics/**', 'GET', '查看数据分析', 'ACTIVE'),
(26, '报表导出', 'REPORT:EXPORT', 'REPORT', '/api/reports/export', 'POST', '导出报表', 'ACTIVE'),
(27, 'AI推荐查看', 'AI:RECOMMENDATION:VIEW', 'AI', '/api/ai/recommendations/**', 'GET', '查看AI推荐', 'ACTIVE'),
(28, 'AI分析查看', 'AI:ANALYSIS:VIEW', 'AI', '/api/ai/analysis/**', 'GET', '查看AI分析', 'ACTIVE');

-- 插入用户角色关联
INSERT INTO `user_roles` (`user_id`, `role_id`) VALUES
(1, 1),  -- admin -> 系统管理员
(2, 2);  -- manager -> 店长

-- 插入角色权限关联（系统管理员拥有所有权限）
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8), (1, 9), (1, 10),
(1, 11), (1, 12), (1, 13), (1, 14), (1, 15), (1, 16), (1, 17), (1, 18), (1, 19), (1, 20),
(1, 21), (1, 22), (1, 23), (1, 24), (1, 25), (1, 26), (1, 27), (1, 28);

-- 店长权限（除了用户管理外的大部分权限）
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(2, 5), (2, 6), (2, 7), (2, 9), (2, 10), (2, 11), (2, 13), (2, 14), (2, 15),
(2, 17), (2, 18), (2, 19), (2, 21), (2, 22), (2, 23), (2, 25), (2, 26), (2, 27), (2, 28);

-- 员工权限（基础查看和操作权限）
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(3, 9), (3, 13), (3, 15), (3, 17), (3, 19), (3, 21);

-- 插入商户管理数据
USE `merchant_management`;

INSERT INTO `merchants` (`id`, `tenant_id`, `merchant_code`, `merchant_name`, `business_type`, `description`, `contact_person`, `contact_phone`, `contact_email`, `address`, `status`) VALUES
(1, 1, 'MERCHANT_001', '默认美容院', '美容美发', '提供专业的美容美发服务', '店长', '1234567890', 'manager@merchant.com', '温哥华市中心123号', 'ACTIVE');

-- 插入默认商户设置
INSERT INTO `merchant_settings` (`tenant_id`, `setting_key`, `setting_value`, `setting_type`, `description`, `is_system`) VALUES
(1, 'business_name', '默认美容院', 'STRING', '商户名称', 0),
(1, 'timezone', 'America/Vancouver', 'STRING', '时区设置', 1),
(1, 'currency', 'CAD', 'STRING', '货币单位', 1),
(1, 'language', 'zh-CN', 'STRING', '默认语言', 1),
(1, 'appointment_advance_days', '30', 'INTEGER', '预约提前天数', 0),
(1, 'appointment_duration_default', '60', 'INTEGER', '默认预约时长(分钟)', 0),
(1, 'notification_sms_enabled', 'true', 'BOOLEAN', '短信通知开关', 0),
(1, 'notification_email_enabled', 'true', 'BOOLEAN', '邮件通知开关', 0),
(1, 'auto_confirm_appointment', 'false', 'BOOLEAN', '自动确认预约', 0),
(1, 'allow_online_booking', 'true', 'BOOLEAN', '允许在线预约', 0);

-- 插入营业时间
INSERT INTO `business_hours` (`tenant_id`, `day_of_week`, `is_open`, `open_time`, `close_time`) VALUES
(1, 1, 1, '09:00:00', '18:00:00'),  -- 周一
(1, 2, 1, '09:00:00', '18:00:00'),  -- 周二
(1, 3, 1, '09:00:00', '18:00:00'),  -- 周三
(1, 4, 1, '09:00:00', '18:00:00'),  -- 周四
(1, 5, 1, '09:00:00', '18:00:00'),  -- 周五
(1, 6, 1, '10:00:00', '17:00:00'),  -- 周六
(1, 7, 0, NULL, NULL);              -- 周日休息

-- 插入业务数据
USE `merchant_business`;

-- 插入服务分类
INSERT INTO `service_categories` (`id`, `tenant_id`, `category_name`, `category_code`, `description`, `sort_order`, `status`) VALUES
(1, 1, '面部护理', 'FACIAL', '各种面部护理服务', 1, 'ACTIVE'),
(2, 1, '身体护理', 'BODY', '身体护理和SPA服务', 2, 'ACTIVE'),
(3, 1, '美发服务', 'HAIR', '洗剪吹染烫等美发服务', 3, 'ACTIVE'),
(4, 1, '美甲服务', 'NAIL', '美甲护甲服务', 4, 'ACTIVE');

-- 插入服务项目
INSERT INTO `services` (`id`, `tenant_id`, `category_id`, `service_code`, `name`, `description`, `price`, `duration`, `resource_type`, `is_active`, `sort_order`) VALUES
(1, 1, 1, 'FACIAL_BASIC', '基础面部护理', '深层清洁、补水保湿', 88.00, 60, 'STAFF', 1, 1),
(2, 1, 1, 'FACIAL_PREMIUM', '高级面部护理', '深层护理、抗衰老', 288.00, 90, 'STAFF', 1, 2),
(3, 1, 2, 'BODY_SPA', '全身SPA护理', '全身放松按摩护理', 388.00, 120, 'BOTH', 1, 1),
(4, 1, 2, 'BODY_MASSAGE', '身体按摩', '专业按摩放松', 268.00, 90, 'STAFF', 1, 2),
(5, 1, 3, 'HAIR_CUT', '洗剪吹', '专业洗剪吹造型', 188.00, 90, 'STAFF', 1, 1),
(6, 1, 3, 'HAIR_COLOR', '染发服务', '专业染发护色', 388.00, 180, 'STAFF', 1, 2),
(7, 1, 4, 'NAIL_BASIC', '基础美甲', '修甲涂色', 68.00, 45, 'STAFF', 1, 1),
(8, 1, 4, 'NAIL_ART', '美甲艺术', '创意美甲设计', 128.00, 90, 'STAFF', 1, 2);

-- 插入资源（员工和房间）
INSERT INTO `resource` (`id`, `tenant_id`, `resource_code`, `name`, `type`, `description`, `skills`, `capacity`, `facilities`, `hourly_rate`, `status`) VALUES
(1, 1, 'STAFF_001', '李美容师', 'STAFF', '资深美容师，擅长面部护理', '["面部护理", "身体按摩"]', 1, NULL, 50.00, 'ACTIVE'),
(2, 1, 'STAFF_002', '王发型师', 'STAFF', '专业发型师，擅长染烫', '["洗剪吹", "染发", "烫发"]', 1, NULL, 60.00, 'ACTIVE'),
(3, 1, 'STAFF_003', '张美甲师', 'STAFF', '专业美甲师', '["美甲", "护甲"]', 1, NULL, 40.00, 'ACTIVE'),
(4, 1, 'ROOM_001', 'VIP护理室', 'ROOM', 'VIP单人护理室', NULL, 1, '["按摩床", "美容仪器", "音响"]', 30.00, 'ACTIVE'),
(5, 1, 'ROOM_002', '双人SPA室', 'ROOM', '双人SPA护理室', NULL, 2, '["双人按摩床", "香薰设备", "音响"]', 50.00, 'ACTIVE');

-- 插入资源可用性（工作时间）
INSERT INTO `resource_availability` (`tenant_id`, `resource_id`, `day_of_week`, `start_time`, `end_time`, `is_available`) VALUES
-- 李美容师工作时间
(1, 1, 1, '09:00:00', '18:00:00', 1), (1, 1, 2, '09:00:00', '18:00:00', 1), (1, 1, 3, '09:00:00', '18:00:00', 1),
(1, 1, 4, '09:00:00', '18:00:00', 1), (1, 1, 5, '09:00:00', '18:00:00', 1), (1, 1, 6, '10:00:00', '17:00:00', 1),
-- 王发型师工作时间
(1, 2, 1, '09:00:00', '18:00:00', 1), (1, 2, 2, '09:00:00', '18:00:00', 1), (1, 2, 3, '09:00:00', '18:00:00', 1),
(1, 2, 4, '09:00:00', '18:00:00', 1), (1, 2, 5, '09:00:00', '18:00:00', 1), (1, 2, 6, '10:00:00', '17:00:00', 1),
-- 张美甲师工作时间
(1, 3, 1, '09:00:00', '18:00:00', 1), (1, 3, 2, '09:00:00', '18:00:00', 1), (1, 3, 3, '09:00:00', '18:00:00', 1),
(1, 3, 4, '09:00:00', '18:00:00', 1), (1, 3, 5, '09:00:00', '18:00:00', 1), (1, 3, 6, '10:00:00', '17:00:00', 1),
-- VIP护理室可用时间
(1, 4, 1, '09:00:00', '18:00:00', 1), (1, 4, 2, '09:00:00', '18:00:00', 1), (1, 4, 3, '09:00:00', '18:00:00', 1),
(1, 4, 4, '09:00:00', '18:00:00', 1), (1, 4, 5, '09:00:00', '18:00:00', 1), (1, 4, 6, '10:00:00', '17:00:00', 1),
-- 双人SPA室可用时间
(1, 5, 1, '09:00:00', '18:00:00', 1), (1, 5, 2, '09:00:00', '18:00:00', 1), (1, 5, 3, '09:00:00', '18:00:00', 1),
(1, 5, 4, '09:00:00', '18:00:00', 1), (1, 5, 5, '09:00:00', '18:00:00', 1), (1, 5, 6, '10:00:00', '17:00:00', 1);

-- 插入示例客户
INSERT INTO `customers` (`id`, `tenant_id`, `customer_code`, `name`, `phone`, `email`, `gender`, `communication_preference`, `status`) VALUES
(1, 1, 'CUST_001', '张女士', '604-123-4567', 'zhang@example.com', 'FEMALE', 'SMS', 'ACTIVE'),
(2, 1, 'CUST_002', '李先生', '604-234-5678', 'li@example.com', 'MALE', 'EMAIL', 'ACTIVE'),
(3, 1, 'CUST_003', '王女士', '604-345-6789', 'wang@example.com', 'FEMALE', 'BOTH', 'ACTIVE');

-- 插入通知模板
USE `merchant_notification`;

INSERT INTO `notification_templates` (`id`, `tenant_id`, `template_code`, `template_name`, `template_type`, `subject`, `content`, `variables`, `is_system`, `status`) VALUES
(1, 1, 'APPOINTMENT_CONFIRMATION', '预约确认通知', 'SMS', NULL, '您好 {{customerName}}，您的预约已确认。时间：{{appointmentDate}} {{appointmentTime}}，服务：{{serviceName}}。地址：{{merchantAddress}}。如需取消请提前24小时联系我们。', '["customerName", "appointmentDate", "appointmentTime", "serviceName", "merchantAddress"]', 1, 'ACTIVE'),
(2, 1, 'APPOINTMENT_REMINDER', '预约提醒通知', 'SMS', NULL, '您好 {{customerName}}，提醒您明天 {{appointmentTime}} 有预约，服务：{{serviceName}}。请准时到达，如需调整请联系我们。', '["customerName", "appointmentTime", "serviceName"]', 1, 'ACTIVE'),
(3, 1, 'APPOINTMENT_CONFIRMATION_EMAIL', '预约确认邮件', 'EMAIL', '预约确认 - {{merchantName}}', '亲爱的 {{customerName}}，\n\n您的预约已成功确认！\n\n预约详情：\n时间：{{appointmentDate}} {{appointmentTime}}\n服务：{{serviceName}}\n地址：{{merchantAddress}}\n\n如需取消或修改预约，请提前24小时联系我们。\n\n谢谢！\n{{merchantName}}', '["customerName", "merchantName", "appointmentDate", "appointmentTime", "serviceName", "merchantAddress"]', 1, 'ACTIVE'),
(4, 1, 'APPOINTMENT_CANCELLATION', '预约取消通知', 'SMS', NULL, '您好 {{customerName}}，您的预约已取消。原定时间：{{appointmentDate}} {{appointmentTime}}。如需重新预约请联系我们。', '["customerName", "appointmentDate", "appointmentTime"]', 1, 'ACTIVE');

-- =====================================================
-- 8. 设置外键约束和索引优化
-- =====================================================

SET FOREIGN_KEY_CHECKS = 1;

-- 创建额外的索引以优化查询性能
USE `merchant_business`;

-- 预约相关索引
CREATE INDEX `idx_appointments_date_time` ON `appointments` (`appointment_date`, `appointment_time`);
CREATE INDEX `idx_appointments_tenant_date` ON `appointments` (`tenant_id`, `appointment_date`);
CREATE INDEX `idx_resource_booking_slots_date_time` ON `resource_booking_slots` (`booking_date`, `start_time`, `end_time`);

-- 订单相关索引
CREATE INDEX `idx_orders_tenant_date` ON `orders` (`tenant_id`, `created_at`);
CREATE INDEX `idx_orders_payment_status` ON `orders` (`payment_status`, `created_at`);

-- 客户相关索引
CREATE INDEX `idx_customers_tenant_phone` ON `customers` (`tenant_id`, `phone`);
CREATE INDEX `idx_customers_tenant_email` ON `customers` (`tenant_id`, `email`);

USE `merchant_analytics`;

-- 统计表索引
CREATE INDEX `idx_daily_revenue_stats_tenant_date` ON `daily_revenue_stats` (`tenant_id`, `stats_date`);
CREATE INDEX `idx_daily_service_stats_tenant_date` ON `daily_service_stats` (`tenant_id`, `stats_date`);
CREATE INDEX `idx_daily_resource_stats_tenant_date` ON `daily_resource_stats` (`tenant_id`, `stats_date`);

USE `merchant_notification`;

-- 通知日志索引
CREATE INDEX `idx_notification_logs_tenant_type` ON `notification_logs` (`tenant_id`, `notification_type`);
CREATE INDEX `idx_notification_logs_status_created` ON `notification_logs` (`status`, `created_at`);

-- =====================================================
-- 9. 完成设置
-- =====================================================

-- 重置时区为温哥华时间
SET time_zone = 'America/Vancouver';

-- 显示完成信息
SELECT 'Database initialization completed successfully!' as message,
       'Timezone set to America/Vancouver' as timezone_info,
       'Default tenant and users created' as user_info,
       'Sample data inserted' as data_info;