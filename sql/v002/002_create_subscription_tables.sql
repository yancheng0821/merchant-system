use merchant_management;

-- ============================================================================
-- 订阅管理系统
-- 版本: v002
-- 创建日期: 2025-11-24
-- 描述: 订阅计划和商户订阅记录
-- ============================================================================

-- ============================================================================
-- 订阅计划表 (subscription_plans)
-- 描述: 定义不同的订阅计划（如免费试用、基础版、专业版、企业版）
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '计划ID',
    plan_code VARCHAR(50) NOT NULL UNIQUE COMMENT '计划代码（如：FREE, BASIC, PRO, ENTERPRISE）',
    plan_name_en VARCHAR(100) NOT NULL COMMENT '计划名称（英文）',
    plan_name_zh VARCHAR(100) NOT NULL COMMENT '计划名称（中文）',

    -- 定价信息
    monthly_price DECIMAL(10, 2) NOT NULL COMMENT '月付价格（CAD）',
    yearly_price DECIMAL(10, 2) NOT NULL COMMENT '年付价格（CAD）',

    -- 计划限制
    max_users INT DEFAULT 5 COMMENT '最大用户数（-1表示无限制）',
    max_staff INT DEFAULT 10 COMMENT '最大员工数（-1表示无限制）',
    max_appointments_per_month INT DEFAULT 1000 COMMENT '每月最大预约数（-1表示无限制）',

    -- 试用期
    trial_days INT DEFAULT 14 COMMENT '试用期天数',

    -- 状态
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否激活',

    -- 审计字段
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    INDEX idx_plan_code (plan_code),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订阅计划表';

-- ============================================================================
-- 商户订阅表 (tenant_subscriptions)
-- 描述: 记录每个商户的订阅信息
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '订阅ID',
    tenant_id BIGINT NOT NULL COMMENT '商户ID',
    plan_id BIGINT NOT NULL COMMENT '订阅计划ID',

    -- 订阅周期
    billing_cycle ENUM('MONTHLY', 'YEARLY') DEFAULT 'MONTHLY' COMMENT '计费周期',

    -- 订阅状态
    status ENUM('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'TRIAL' COMMENT '订阅状态',

    -- 时间信息
    trial_start_date DATE COMMENT '试用开始日期',
    trial_end_date DATE COMMENT '试用结束日期',
    current_period_start DATE NOT NULL COMMENT '当前周期开始日期',
    current_period_end DATE NOT NULL COMMENT '当前周期结束日期',

    -- Stripe集成（预留）
    stripe_subscription_id VARCHAR(100) COMMENT 'Stripe订阅ID',
    stripe_customer_id VARCHAR(100) COMMENT 'Stripe客户ID',

    -- 审计字段
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    -- 注意：在微服务架构中，跨数据库的外键约束会导致分布式事务死锁
    -- 因此不使用跨数据库外键，依赖应用层保证数据一致性
    -- FOREIGN KEY (tenant_id) REFERENCES merchant_auth.tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id),

    INDEX idx_tenant_id (tenant_id),
    INDEX idx_status (status),
    INDEX idx_plan_id (plan_id),
    INDEX idx_tenant_status (tenant_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商户订阅表';

-- ============================================================================
-- 初始化订阅计划数据
-- ============================================================================
INSERT INTO subscription_plans (
    plan_code,
    plan_name_en,
    plan_name_zh,
    monthly_price,
    yearly_price,
    max_users,
    max_staff,
    max_appointments_per_month,
    trial_days,
    is_active
) VALUES
(
    'FREE',
    'Free Trial',
    '免费试用',
    0.00,
    0.00,
    3,
    5,
    100,
    14,
    TRUE
),
(
    'BASIC',
    'Basic Plan',
    '基础版',
    29.99,
    299.99,
    5,
    10,
    500,
    14,
    TRUE
),
(
    'PRO',
    'Professional Plan',
    '专业版',
    79.99,
    799.99,
    15,
    50,
    2000,
    14,
    TRUE
),
(
    'ELITE',
    'Elite Plan',
    '精英版',
    199.99,
    1999.99,
    -1,
    -1,
    -1,
    30,
    TRUE
);
