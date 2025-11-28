-- =====================================================
-- 在线预约和Google Business集成字段扩展
-- 版本: V20241127
-- 描述: 为 online_booking_config 表添加 Google Business 集成字段
-- =====================================================

-- 添加 Google Business 相关字段到 online_booking_config 表
ALTER TABLE online_booking_config
    ADD COLUMN google_business_enabled BOOLEAN DEFAULT FALSE COMMENT '是否启用Google Business集成',
    ADD COLUMN google_place_id VARCHAR(100) COMMENT 'Google Place ID',
    ADD COLUMN google_merchant_id VARCHAR(100) COMMENT 'Google Merchant Center ID',
    ADD COLUMN booking_page_slug VARCHAR(50) COMMENT '预约页面短链接slug',
    ADD COLUMN welcome_message TEXT COMMENT '欢迎语',
    ADD COLUMN cancellation_policy TEXT COMMENT '取消政策说明',
    ADD COLUMN logo_url VARCHAR(500) COMMENT 'Logo URL',
    ADD COLUMN enabled BOOLEAN DEFAULT FALSE COMMENT '是否启用在线预约';

-- 为 booking_page_slug 添加唯一索引
CREATE UNIQUE INDEX idx_booking_page_slug_unique ON online_booking_config (booking_page_slug);

-- 为 appointments 表添加确认码和来源字段
ALTER TABLE appointments
    ADD COLUMN confirmation_code VARCHAR(20) COMMENT '预约确认码',
    ADD COLUMN booking_source VARCHAR(20) DEFAULT 'ADMIN' COMMENT '预约来源: ADMIN, ONLINE, GOOGLE';

-- 为确认码添加唯一索引
CREATE UNIQUE INDEX idx_appointment_confirmation_code ON appointments (confirmation_code);

-- 添加索引优化查询性能
CREATE INDEX idx_appointments_booking_source ON appointments (booking_source);

-- =====================================================
-- 公开预约访问日志表 (用于统计分析)
-- =====================================================
CREATE TABLE public_booking_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL COMMENT '租户ID',
    action VARCHAR(50) NOT NULL COMMENT '操作类型: VIEW, SELECT_SERVICE, SELECT_TIME, SUBMIT, CONFIRM, CANCEL',
    session_id VARCHAR(50) COMMENT '会话ID',
    booking_id BIGINT COMMENT '关联的预约ID',
    ip_address VARCHAR(45) COMMENT 'IP地址',
    user_agent TEXT COMMENT '用户代理',
    extra_data JSON COMMENT '额外数据',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

    INDEX idx_tenant_id (tenant_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at),
    INDEX idx_session_id (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公开预约访问日志表';

-- =====================================================
-- Reserve with Google 预约同步状态表
-- =====================================================
CREATE TABLE google_booking_sync (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL COMMENT '租户ID',
    appointment_id BIGINT NOT NULL COMMENT '本地预约ID',
    google_booking_id VARCHAR(100) NOT NULL COMMENT 'Google预约ID',
    idempotency_token VARCHAR(100) COMMENT '幂等性令牌（防止重复预约）',
    sync_status VARCHAR(20) DEFAULT 'SYNCED' COMMENT '同步状态: SYNCED, PENDING, FAILED',
    last_sync_at TIMESTAMP COMMENT '最后同步时间',
    error_message TEXT COMMENT '错误信息',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_appointment_id (appointment_id),
    UNIQUE KEY uk_google_booking_id (google_booking_id),
    UNIQUE KEY uk_idempotency_token (idempotency_token),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_sync_status (sync_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Google预约同步状态表';
