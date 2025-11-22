-- 添加会员等级管理权限
-- Author: System
-- Date: 2025-11-17
-- Character Set: UTF-8

-- 注意：此脚本使用 UTF-8 编码，执行时需要确保客户端字符集正确
-- 执行方式：mysql --default-character-set=utf8mb4 -u your_user -p merchant_auth < thisfile.sql
USE merchant_auth;

-- 1. 插入会员等级权限
INSERT INTO permissions (
    permission_code,
    permission_name,
    display_name,
    resource,
    action,
    scope,
    resource_type,
    module,
    resource_path,
    http_method,
    description,
    status,
    created_at,
    updated_at
)
SELECT
    'membership_tiers:view',
    'View Membership Tiers',
    '查看会员等级',
    'membership_tiers',
    'view',
    'all',
    'membership_tier',
    'customers',
    '/api/business/membership-tiers*',
    'GET',
    '允许查看会员等级列表和详情',
    'ACTIVE',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM permissions WHERE permission_code = 'membership_tiers:view'
);

INSERT INTO permissions (
    permission_code,
    permission_name,
    display_name,
    resource,
    action,
    scope,
    resource_type,
    module,
    resource_path,
    http_method,
    description,
    status,
    created_at,
    updated_at
)
SELECT
    'membership_tiers:create',
    'Create Membership Tier',
    '新增会员等级',
    'membership_tiers',
    'create',
    'all',
    'membership_tier',
    'customers',
    '/api/business/membership-tiers',
    'POST',
    '允许创建新的会员等级',
    'ACTIVE',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM permissions WHERE permission_code = 'membership_tiers:create'
);

INSERT INTO permissions (
    permission_code,
    permission_name,
    display_name,
    resource,
    action,
    scope,
    resource_type,
    module,
    resource_path,
    http_method,
    description,
    status,
    created_at,
    updated_at
)
SELECT
    'membership_tiers:update',
    'Update Membership Tier',
    '编辑会员等级',
    'membership_tiers',
    'update',
    'all',
    'membership_tier',
    'customers',
    '/api/business/membership-tiers/*',
    'PUT',
    '允许修改会员等级信息',
    'ACTIVE',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM permissions WHERE permission_code = 'membership_tiers:update'
);

INSERT INTO permissions (
    permission_code,
    permission_name,
    display_name,
    resource,
    action,
    scope,
    resource_type,
    module,
    resource_path,
    http_method,
    description,
    status,
    created_at,
    updated_at
)
SELECT
    'membership_tiers:delete',
    'Delete Membership Tier',
    '删除会员等级',
    'membership_tiers',
    'delete',
    'all',
    'membership_tier',
    'customers',
    '/api/business/membership-tiers/*',
    'DELETE',
    '允许删除会员等级',
    'ACTIVE',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM permissions WHERE permission_code = 'membership_tiers:delete'
);

