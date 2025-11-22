-- 添加 time_periods JSON 列用于存储调整后的多个时间段
-- 这样可以保留员工排班中的休息时间
ALTER TABLE `staff_attendance`
ADD COLUMN `time_periods` JSON COMMENT '调整后的时间段数组，格式：[{"start":"09:00","end":"12:00"},{"start":"14:00","end":"20:00"}]' AFTER `check_out_time`;
