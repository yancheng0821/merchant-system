use merchant_management;

-- ============================================================================
-- 添加 Stripe Price ID 字段到订阅计划表
-- 版本: v003
-- 创建日期: 2024-12-03
-- 描述: 存储 Stripe 上对应的价格 ID，用于自动订阅扣款
-- ============================================================================

-- 添加 Stripe Product ID
ALTER TABLE subscription_plans
ADD COLUMN stripe_product_id VARCHAR(100) NULL COMMENT 'Stripe Product ID' AFTER features;

-- 添加月付价格 ID
ALTER TABLE subscription_plans
ADD COLUMN stripe_monthly_price_id VARCHAR(100) NULL COMMENT 'Stripe 月付 Price ID' AFTER stripe_product_id;

-- 添加年付价格 ID
ALTER TABLE subscription_plans
ADD COLUMN stripe_yearly_price_id VARCHAR(100) NULL COMMENT 'Stripe 年付 Price ID' AFTER stripe_monthly_price_id;
