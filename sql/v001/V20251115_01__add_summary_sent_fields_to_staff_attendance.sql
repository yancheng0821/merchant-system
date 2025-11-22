-- 添加员工考勤汇总发送状态字段
-- 用于记录每日工作汇总邮件的发送情况，避免重复发送

use merchant_business;

ALTER TABLE staff_attendance
ADD COLUMN summary_sent TINYINT(1) DEFAULT 0 COMMENT '是否已发送汇总 0-未发送 1-已发送',
ADD COLUMN summary_sent_at DATETIME NULL COMMENT '汇总发送时间',
ADD COLUMN summary_sent_by VARCHAR(20) NULL COMMENT '发送方式: manual-手动发送 scheduled-定时任务发送';

-- 为查询优化添加索引
CREATE INDEX idx_staff_attendance_summary
ON staff_attendance(tenant_id, attendance_date, summary_sent);

-- 说明：
-- 1. summary_sent: 标记是否已发送当日汇总，默认0（未发送）
-- 2. summary_sent_at: 记录汇总发送的具体时间
-- 3. summary_sent_by: 区分是手动发送(manual)还是定时任务发送(scheduled)
-- 4. 索引用于定时任务快速查询未发送汇总的员工
