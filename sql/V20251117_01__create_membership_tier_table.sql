-- 创建会员等级表
CREATE TABLE IF NOT EXISTS membership_tier (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '等级ID',
    tenant_id BIGINT NOT NULL COMMENT '租户ID',
    name VARCHAR(50) NOT NULL COMMENT '等级名称（英文）',
    code VARCHAR(20) NOT NULL COMMENT '等级代码（REGULAR, SILVER, GOLD, PLATINUM等）',
    required_points INT NOT NULL DEFAULT 0 COMMENT '所需积分',
    discount_rate DECIMAL(5,2) NOT NULL DEFAULT 100.00 COMMENT '折扣比例（100表示无折扣，95表示95折）',
    color VARCHAR(20) COMMENT '显示颜色（十六进制或颜色名）',
    icon VARCHAR(100) COMMENT '图标',
    benefits TEXT COMMENT '会员权益说明',
    sort_order INT NOT NULL DEFAULT 0 COMMENT '排序序号',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT '是否启用',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    INDEX idx_tenant_id (tenant_id),
    INDEX idx_code (code),
    UNIQUE KEY uk_tenant_code (tenant_id, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='会员等级表';

-- 插入默认会员等级数据（示例，每个租户需要自己配置）
-- 这里仅作为参考，实际使用时可根据需要调整
INSERT INTO membership_tier (tenant_id, name, code, required_points, discount_rate, color, sort_order)
VALUES
    (1, 'Regular', 'REGULAR', 0, 100.00, '#9CA3AF', 1),
    (1, 'Silver', 'SILVER', 1000, 95.00, '#C0C0C0', 2),
    (1, 'Gold', 'GOLD', 5000, 90.00, '#FFD700', 3),
    (1, 'Platinum', 'PLATINUM', 10000, 85.00, '#E5E4E2', 4)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;


-- Drop sort_order column from membership_tier table
-- This field is no longer needed as tiers are sorted by required_points

ALTER TABLE membership_tier DROP COLUMN sort_order;
