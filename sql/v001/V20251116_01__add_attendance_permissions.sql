-- 添加员工考勤管理相关权限
-- V20251116_01__add_attendance_permissions.sql

USE merchant_auth;

-- 插入员工签到签退权限
INSERT INTO `permissions` (
  `permission_name`,
  `permission_code`,
  `display_name`,
  `resource`,
  `action`,
  `scope`,
  `resource_type`,
  `module`,
  `resource_path`,
  `http_method`,
  `description`,
  `status`
) VALUES
(
  'Adjust Staff Attendance',
  'schedule:adjust_attendance',
  '调整员工签到签退',
  'schedule',
  'adjust_attendance',
  'all',
  'staff_attendance',
  'schedule',
  '/api/business/staff-attendance/*',
  'PUT',
  '调整员工签到签退时间，管理实际工作时间记录',
  'ACTIVE'
),
(
  'Send Attendance Summary',
  'schedule:send_summary',
  '发送考勤汇总',
  'schedule',
  'send_summary',
  'all',
  'staff_attendance',
  'schedule',
  '/api/business/staff-attendance/summary/send',
  'POST',
  '手动发送员工考勤汇总邮件',
  'ACTIVE'
);

