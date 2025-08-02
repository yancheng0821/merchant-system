-- 初始化测试邀请码（仅用于开发环境）
-- 注意：生产环境请删除此文件或确保不执行

-- 为默认租户创建一个测试邀请码
INSERT INTO tenant_invitations (
    tenant_id, 
    invitation_code, 
    created_by, 
    max_uses, 
    used_count, 
    expires_at, 
    status, 
    created_at, 
    updated_at
) VALUES (
    1,  -- 假设租户ID为1
    'TEST2024',  -- 测试邀请码
    1,  -- 假设创建者用户ID为1
    10,  -- 最多使用10次
    0,   -- 已使用0次
    DATE_ADD(NOW(), INTERVAL 30 DAY),  -- 30天后过期
    'ACTIVE',
    NOW(),
    NOW()
) ON DUPLICATE KEY UPDATE invitation_code = invitation_code;

-- 创建一个永不过期的测试邀请码
INSERT INTO tenant_invitations (
    tenant_id, 
    invitation_code, 
    created_by, 
    max_uses, 
    used_count, 
    expires_at, 
    status, 
    created_at, 
    updated_at
) VALUES (
    4,  -- 假设租户ID为1
    'DEMO2025',  -- 演示邀请码
    1,  -- 假设创建者用户ID为1
    100,  -- 最多使用100次
    0,   -- 已使用0次
    NULL,  -- 永不过期
    'ACTIVE',
    NOW(),
    NOW()
) ON DUPLICATE KEY UPDATE invitation_code = invitation_code;