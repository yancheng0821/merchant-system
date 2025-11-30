-- V20241129_03__rename_tax_settings_to_operations.sql
-- 将 Tax Settings 权限重命名为 Operations Settings

USE merchant_auth;

-- 更新权限记录：将 tax_settings 改为 operations
UPDATE permissions
SET
    permission_code = 'settings:update_operations',
    permission_name = 'Update Operations Settings',
    display_name = '修改运营设置',
    resource_type = 'operations',
    description = '修改运营设置（包括税率配置、营业时间等）',
    updated_at = NOW()
WHERE permission_code = 'settings:update_tax';

