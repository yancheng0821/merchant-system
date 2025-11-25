use merchant_management;

-- ============================================================================
-- 账单税费字段添加
-- 版本: v002
-- 创建日期: 2025-11-24
-- 描述: 为账单表添加税费相关字段，支持按省份计算税率
-- ============================================================================

-- 添加税费相关字段
ALTER TABLE invoices
    ADD COLUMN subtotal DECIMAL(10, 2) COMMENT '税前金额（CAD）' AFTER subscription_id,
    ADD COLUMN tax_rate DECIMAL(5, 4) COMMENT '税率（如0.12表示12%）' AFTER subtotal,
    ADD COLUMN tax_amount DECIMAL(10, 2) COMMENT '税额（CAD）' AFTER tax_rate,
    ADD COLUMN tax_region VARCHAR(50) COMMENT '税区（省份/国家代码）' AFTER currency;

-- 更新现有数据：将现有的amount作为含税总额，计算税前金额
-- 假设现有数据没有税（国际客户或旧数据）
UPDATE invoices
SET subtotal = amount,
    tax_rate = 0,
    tax_amount = 0,
    tax_region = 'INTERNATIONAL'
WHERE subtotal IS NULL;

-- 添加注释
ALTER TABLE invoices
    MODIFY COLUMN amount DECIMAL(10, 2) NOT NULL COMMENT '含税总额（CAD）';

-- 为tax_region字段添加索引
CREATE INDEX idx_tax_region ON invoices(tax_region);
