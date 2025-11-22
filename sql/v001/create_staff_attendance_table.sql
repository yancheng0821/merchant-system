-- ===================================================================
-- 员工签到签退表 (Staff Attendance)
-- 用于记录员工每日实际的签到签退时间
-- ===================================================================
use merchant_business;

CREATE TABLE IF NOT EXISTS `staff_attendance` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `tenant_id` BIGINT NOT NULL COMMENT '租户ID',
  `resource_id` BIGINT NOT NULL COMMENT '资源ID（员工ID）',
  `attendance_date` DATE NOT NULL COMMENT '考勤日期',
  `check_in_time` TIME NOT NULL COMMENT '签到时间',
  `check_out_time` TIME NOT NULL COMMENT '签退时间',
  `notes` VARCHAR(500) DEFAULT NULL COMMENT '备注信息',
  `created_by` BIGINT DEFAULT NULL COMMENT '创建人ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_resource_date` (`resource_id`, `attendance_date`),
  KEY `idx_tenant_date` (`tenant_id`, `attendance_date`),
  KEY `idx_resource_id` (`resource_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='员工签到签退记录表';

-- 添加外键约束（如果resource表存在）
-- ALTER TABLE `staff_attendance`
--   ADD CONSTRAINT `fk_attendance_resource`
--   FOREIGN KEY (`resource_id`)
--   REFERENCES `resource` (`id`)
--   ON DELETE CASCADE;
