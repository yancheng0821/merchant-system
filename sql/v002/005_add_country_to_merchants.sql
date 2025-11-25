use merchant_management;

-- ============================================================================
-- 商户表添加国家字段
-- 版本: v002
-- 创建日期: 2025-11-24
-- 描述: 为商户表添加国家字段，用于税率计算和国际化支持
-- ============================================================================

-- 添加国家字段到 merchants 表
ALTER TABLE merchants
    ADD COLUMN country VARCHAR(100) COMMENT '国家' AFTER address;

-- 更新现有数据：将现有商户的国家设置为加拿大（基于省份判断）
UPDATE merchants
SET country = 'Canada'
WHERE province IN ('BC', 'British Columbia', 'AB', 'Alberta', 'ON', 'Ontario',
                   'QC', 'Quebec', 'MB', 'Manitoba', 'SK', 'Saskatchewan',
                   'NS', 'Nova Scotia', 'NB', 'New Brunswick',
                   'PE', 'Prince Edward Island', 'NL', 'Newfoundland and Labrador',
                   'NT', 'Northwest Territories', 'YT', 'Yukon', 'NU', 'Nunavut')
  AND country IS NULL;

-- 为国家字段添加索引（用于查询统计）
CREATE INDEX idx_country ON merchants(country);
