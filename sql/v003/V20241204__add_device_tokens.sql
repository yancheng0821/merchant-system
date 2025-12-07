-- 设备推送Token表
-- 用于存储用户的移动设备推送通知Token (FCM/APNs)

CREATE TABLE IF NOT EXISTS `merchant_notification`.`device_tokens` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `tenant_id` BIGINT NOT NULL COMMENT '租户ID',
    `token` VARCHAR(500) NOT NULL COMMENT '设备推送Token (FCM/APNs)',
    `platform` VARCHAR(20) NOT NULL COMMENT '平台类型: ios, android',
    `device_info` JSON COMMENT '设备信息 (model, os version等)',
    `is_active` TINYINT(1) DEFAULT 1 COMMENT '是否有效 (1=有效, 0=失效)',
    `last_used_at` DATETIME COMMENT '最后使用时间',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_token` (`token`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_tenant_id` (`tenant_id`),
    KEY `idx_user_platform` (`user_id`, `platform`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备推送Token表';
