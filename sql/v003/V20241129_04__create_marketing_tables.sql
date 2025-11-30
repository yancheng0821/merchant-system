-- V20241129_04__create_marketing_tables.sql
-- 创建营销模块相关表

USE merchant_business;

-- 1. 营销规则表
CREATE TABLE IF NOT EXISTS marketing_rules (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '租户ID',
    name VARCHAR(100) NOT NULL COMMENT '规则名称',
    enabled TINYINT(1) DEFAULT 1 COMMENT '是否启用',

    -- 触发条件
    trigger_type VARCHAR(50) NOT NULL COMMENT '触发类型: INACTIVE_DAYS, LAST_VISIT_DAYS, NO_BOOKING_DAYS',
    trigger_days INT NOT NULL COMMENT '天数阈值',

    -- 客户筛选条件 (JSON格式)
    customer_filter JSON COMMENT '客户筛选条件',

    -- 通知设置
    notification_type VARCHAR(20) NOT NULL COMMENT '通知类型: EMAIL, SMS, BOTH',
    template_id BIGINT COMMENT '使用的模板ID',
    custom_subject VARCHAR(200) COMMENT '自定义邮件主题',
    custom_content TEXT COMMENT '自定义内容',

    -- 调度设置
    schedule_type VARCHAR(20) NOT NULL DEFAULT 'MANUAL' COMMENT '调度类型: MANUAL, DAILY, WEEKLY',
    schedule_time TIME COMMENT '执行时间',
    schedule_day_of_week TINYINT COMMENT '周几执行 (1-7)',

    -- 防重复发送
    cooldown_days INT DEFAULT 30 COMMENT '冷却天数（同一客户多少天内不重复发送）',

    -- 统计信息
    last_run_at DATETIME COMMENT '上次执行时间',
    total_sent_count INT DEFAULT 0 COMMENT '总发送次数',

    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(50) COMMENT '创建人',
    updated_by VARCHAR(50) COMMENT '更新人',

    INDEX idx_tenant (tenant_id),
    INDEX idx_enabled (tenant_id, enabled),
    INDEX idx_schedule (schedule_type, enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='营销规则表';

-- 2. 营销发送记录表
CREATE TABLE IF NOT EXISTS marketing_send_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '租户ID',
    rule_id BIGINT NOT NULL COMMENT '规则ID',
    rule_name VARCHAR(100) COMMENT '规则名称（冗余字段）',

    -- 客户信息
    customer_id BIGINT NOT NULL COMMENT '客户ID',
    customer_name VARCHAR(100) COMMENT '客户名称',
    customer_email VARCHAR(100) COMMENT '客户邮箱',
    customer_phone VARCHAR(50) COMMENT '客户电话',

    -- 发送信息
    notification_type VARCHAR(20) NOT NULL COMMENT '通知类型: EMAIL, SMS',
    subject VARCHAR(200) COMMENT '邮件主题',
    content TEXT COMMENT '发送内容',

    -- 发送状态
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT '状态: PENDING, SENT, FAILED',
    error_message TEXT COMMENT '错误信息',

    -- 时间戳
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '发送时间',

    INDEX idx_tenant_time (tenant_id, sent_at),
    INDEX idx_rule (rule_id),
    INDEX idx_customer (customer_id),
    INDEX idx_status (tenant_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='营销发送记录表';
