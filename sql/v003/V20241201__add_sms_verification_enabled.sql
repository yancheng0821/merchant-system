-- Add sms_verification_enabled field to users table
-- This field controls whether the user needs SMS 2FA when logging in
-- Default is TRUE (enabled), users can disable it in their profile settings

ALTER TABLE `users`
ADD COLUMN `sms_verification_enabled` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否开启登录短信验证' AFTER `updated_at`;
