-- V20241129_06__insert_test_marketing_rule.sql
-- 插入测试营销提醒规则

USE merchant_business;

-- 插入一条测试规则：3个月未到店客户提醒（美甲定期维护）
INSERT INTO marketing_rules (
    tenant_id,
    name,
    enabled,
    trigger_type,
    trigger_days,
    notification_type,
    custom_subject,
    custom_content,
    schedule_type,
    schedule_time,
    cooldown_days,
    created_by
) VALUES (
    1,
    '美甲定期维护提醒',
    1,
    'LAST_VISIT_DAYS',
    90,
    'EMAIL',
    '亲爱的{{customerName}}，是时候为您的美甲做个维护啦！',
    '亲爱的 {{customerName}}，\n\n我们注意到您已经有一段时间没有来店里了。为了保持您美甲的最佳状态，建议每3个月进行一次专业维护哦！\n\n现在预约还可享受老客户专属优惠：\n✨ 全场美甲服务 9折\n✨ 免费指甲护理一次\n\n期待您的光临！\n\n{{merchantName}}\n{{merchantPhone}}',
    'WEEKLY',
    '10:00:00',
    30,
    'system'
);
