-- V20241129_05__add_marketing_permissions.sql
-- 添加营销模块权限

USE merchant_auth;

-- 营销模块权限
INSERT INTO merchant_auth.permissions (
    permission_name, permission_code, display_name, resource, action,
    scope, resource_type, module, resource_path, http_method,
    description, status
) VALUES
-- 查看营销规则
('View Marketing Rules', 'marketing:view_rules', '查看营销规则',
 'marketing', 'view_rules', 'all', 'marketing_rules', 'marketing',
 '/api/business/marketing/rules', 'GET',
 '查看营销自动化规则列表', 'ACTIVE'),

-- 管理营销规则（创建、编辑、删除）
('Manage Marketing Rules', 'marketing:manage_rules', '管理营销规则',
 'marketing', 'manage_rules', 'all', 'marketing_rules', 'marketing',
 '/api/business/marketing/rules', 'POST',
 '创建、编辑、删除营销规则', 'ACTIVE'),

-- 发送营销消息
('Send Marketing Messages', 'marketing:send', '发送营销消息',
 'marketing', 'send', 'all', 'marketing_rules', 'marketing',
 '/api/business/marketing/rules/*/send', 'POST',
 '手动触发发送营销消息', 'ACTIVE'),

-- 查看发送记录
('View Marketing Logs', 'marketing:view_logs', '查看发送记录',
 'marketing', 'view_logs', 'all', 'marketing_logs', 'marketing',
 '/api/business/marketing/logs', 'GET',
 '查看营销消息发送历史和状态', 'ACTIVE');

