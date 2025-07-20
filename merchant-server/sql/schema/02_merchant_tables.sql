-- =====================================================
-- 商户管理服务数据库表结构
-- 数据库: merchant_management
-- 创建时间: 2024-07-19
-- 描述: 商户基础信息、分店管理相关表
-- =====================================================

USE merchant_management;

-- 商户基础信息表
CREATE TABLE IF NOT EXISTS merchants (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '商户ID',
    tenant_id BIGINT NOT NULL COMMENT '租户ID',
    merchant_code VARCHAR(50) NOT NULL UNIQUE COMMENT '商户编码',
    merchant_name VARCHAR(100) NOT NULL COMMENT '商户名称',
    merchant_type ENUM('CHAIN_HEADQUARTERS', 'CHAIN_BRANCH', 'INDEPENDENT') NOT NULL COMMENT '商户类型',
    parent_merchant_id BIGINT NULL COMMENT '父商户ID（分店关联总部）',
    business_category VARCHAR(100) COMMENT '经营类别',
    business_license VARCHAR(100) COMMENT '营业执照号',
    legal_person VARCHAR(50) COMMENT '法人代表',
    contact_person VARCHAR(50) COMMENT '联系人',
    contact_phone VARCHAR(20) COMMENT '联系电话',
    contact_email VARCHAR(100) COMMENT '联系邮箱',
    address TEXT COMMENT '详细地址',
    province VARCHAR(50) COMMENT '省份',
    city VARCHAR(50) COMMENT '城市',
    district VARCHAR(50) COMMENT '区县',
    longitude DECIMAL(10, 7) COMMENT '经度',
    latitude DECIMAL(10, 7) COMMENT '纬度',
    status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_merchant_code (merchant_code),
    INDEX idx_parent_merchant (parent_merchant_id),
    INDEX idx_status (status),
    INDEX idx_location (longitude, latitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商户基础信息表';

-- 营业时间表
CREATE TABLE IF NOT EXISTS business_hours (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID',
    merchant_id BIGINT NOT NULL COMMENT '商户ID',
    day_of_week TINYINT NOT NULL COMMENT '星期几（1-7，1=周一）',
    open_time TIME NOT NULL COMMENT '开始时间',
    close_time TIME NOT NULL COMMENT '结束时间',
    is_open BOOLEAN DEFAULT TRUE COMMENT '是否营业',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_merchant_day (merchant_id, day_of_week),
    INDEX idx_merchant_id (merchant_id),
    FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='营业时间表';

-- 商户设置表
CREATE TABLE IF NOT EXISTS merchant_settings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID',
    merchant_id BIGINT NOT NULL COMMENT '商户ID',
    setting_key VARCHAR(100) NOT NULL COMMENT '设置键',
    setting_value TEXT COMMENT '设置值',
    setting_type ENUM('STRING', 'NUMBER', 'BOOLEAN', 'JSON') DEFAULT 'STRING' COMMENT '设置类型',
    description TEXT COMMENT '设置描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_merchant_key (merchant_id, setting_key),
    INDEX idx_merchant_id (merchant_id),
    INDEX idx_setting_key (setting_key),
    FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商户设置表';

-- 商户图片表
CREATE TABLE IF NOT EXISTS merchant_images (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID',
    merchant_id BIGINT NOT NULL COMMENT '商户ID',
    image_type ENUM('LOGO', 'BANNER', 'INTERIOR', 'EXTERIOR', 'OTHER') NOT NULL COMMENT '图片类型',
    image_url VARCHAR(500) NOT NULL COMMENT '图片URL',
    image_name VARCHAR(100) COMMENT '图片名称',
    sort_order INT DEFAULT 0 COMMENT '排序',
    is_primary BOOLEAN DEFAULT FALSE COMMENT '是否主图',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_merchant_id (merchant_id),
    INDEX idx_image_type (image_type),
    INDEX idx_sort_order (sort_order),
    FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商户图片表';

-- 商户评价表
CREATE TABLE IF NOT EXISTS merchant_reviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID',
    merchant_id BIGINT NOT NULL COMMENT '商户ID',
    customer_id BIGINT NOT NULL COMMENT '客户ID',
    rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5) COMMENT '评分（1-5）',
    review_content TEXT COMMENT '评价内容',
    review_images JSON COMMENT '评价图片',
    reply_content TEXT COMMENT '回复内容',
    reply_time TIMESTAMP NULL COMMENT '回复时间',
    status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_merchant_id (merchant_id),
    INDEX idx_customer_id (customer_id),
    INDEX idx_rating (rating),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商户评价表';

-- 连锁店管理表
CREATE TABLE IF NOT EXISTS chain_management (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID',
    chain_id BIGINT NOT NULL COMMENT '连锁店ID',
    branch_id BIGINT NOT NULL COMMENT '分店ID',
    management_type ENUM('FINANCIAL', 'OPERATIONAL', 'MARKETING', 'HR') NOT NULL COMMENT '管理类型',
    is_centralized BOOLEAN DEFAULT FALSE COMMENT '是否集中管理',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_chain_branch_type (chain_id, branch_id, management_type),
    INDEX idx_chain_id (chain_id),
    INDEX idx_branch_id (branch_id),
    FOREIGN KEY (chain_id) REFERENCES merchants(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES merchants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='连锁店管理表'; 