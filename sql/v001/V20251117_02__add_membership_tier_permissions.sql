-- 添加会员等级管理权限
-- Author: System
-- Date: 2025-11-17
-- Character Set: UTF-8

-- 注意：此脚本使用 UTF-8 编码，执行时需要确保客户端字符集正确
-- 执行方式：mysql --default-character-set=utf8mb4 -u your_user -p merchant_auth < thisfile.sql

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

-- 2. 为MANAGER角色（店长）分配会员等级权限
INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
SELECT r.id, p.id, NOW(), NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.role_code = 'MANAGER'
  AND p.permission_code IN ('membership_tiers:view', 'membership_tiers:create', 'membership_tiers:update', 'membership_tiers:delete')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- 3. 为SUPER_ADMIN角色（超级管理员）分配会员等级权限
INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
SELECT r.id, p.id, NOW(), NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.role_code = 'SUPER_ADMIN'
  AND p.permission_code IN ('membership_tiers:view', 'membership_tiers:create', 'membership_tiers:update', 'membership_tiers:delete')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );
