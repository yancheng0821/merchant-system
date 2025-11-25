use merchant_management;

-- ============================================================================
-- 账单管理系统
-- 版本: v002
-- 创建日期: 2025-11-22
-- 描述: 商户账单记录
-- ============================================================================

-- ============================================================================
-- 账单表 (invoices)
-- 描述: 记录商户的账单信息
-- ============================================================================
CREATE TABLE IF NOT EXISTS invoices (
                                        id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '账单ID',
                                        invoice_number VARCHAR(50) NOT NULL UNIQUE COMMENT '账单号',
    tenant_id BIGINT NOT NULL COMMENT '商户ID',
    tenant_name VARCHAR(200) NOT NULL COMMENT '商户名称',
    subscription_id BIGINT NULL COMMENT '关联的订阅ID（可选）',

    -- 账单金额
    amount DECIMAL(10, 2) NOT NULL COMMENT '账单金额（CAD）',
    currency VARCHAR(3) DEFAULT 'CAD' COMMENT '货币代码',

    -- 账单周期
    billing_period_start DATE NOT NULL COMMENT '账单周期开始日期',
    billing_period_end DATE NOT NULL COMMENT '账单周期结束日期',

    -- 状态
    status ENUM('PENDING', 'PAID', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'PENDING' COMMENT '账单状态',

    -- 支付信息
    payment_method VARCHAR(50) COMMENT '支付方式（如：Credit Card, PayPal等）',
    payment_date TIMESTAMP NULL COMMENT '支付日期',

    -- Stripe集成
    stripe_invoice_id VARCHAR(100) COMMENT 'Stripe账单ID',
    stripe_payment_intent_id VARCHAR(100) COMMENT 'Stripe支付意向ID',

    -- 备注
    description VARCHAR(500) COMMENT '账单描述',
    notes TEXT COMMENT '备注',

    -- 审计字段
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    FOREIGN KEY (tenant_id) REFERENCES merchant_auth.tenants(id) ON DELETE CASCADE,

    INDEX idx_tenant_id (tenant_id),
    INDEX idx_subscription_id (subscription_id),
    INDEX idx_status (status),
    INDEX idx_invoice_number (invoice_number),
    INDEX idx_payment_date (payment_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='账单表';
