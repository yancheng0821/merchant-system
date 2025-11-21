-- 拆分 card_amount 为 credit_card_amount 和 debit_card_amount
-- 这样统计时可以直接 SUM 对应字段，无需复杂判断

-- 1. 添加新字段
ALTER TABLE merchant_business.orders
ADD COLUMN credit_card_amount DECIMAL(10, 2) DEFAULT 0.00 COMMENT '信用卡支付金额' AFTER cash_amount,
ADD COLUMN debit_card_amount DECIMAL(10, 2) DEFAULT 0.00 COMMENT '借记卡支付金额' AFTER credit_card_amount;

-- -- 2. 将现有 card_amount 数据迁移到对应字段
-- -- 根据 payment_method 判断迁移到哪个字段
-- UPDATE merchant_business.orders
-- SET credit_card_amount = card_amount
-- WHERE payment_method = 'credit_card' AND card_amount IS NOT NULL;
--
-- UPDATE merchant_business.orders
-- SET debit_card_amount = card_amount
-- WHERE payment_method = 'debit_card' AND card_amount IS NOT NULL;

-- 3. 删除旧字段（可选，如果确定不需要了）
ALTER TABLE merchant_business.orders DROP COLUMN card_amount;
