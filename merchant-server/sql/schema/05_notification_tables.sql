-- 创建通知服务数据库
CREATE DATABASE IF NOT EXISTS merchant_notification CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE merchant_notification;

-- 通知模板表
CREATE TABLE IF NOT EXISTS notification_templates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL COMMENT '租户ID',
    template_code VARCHAR(100) NOT NULL COMMENT '模板代码',
    template_name VARCHAR(200) NOT NULL COMMENT '模板名称',
    type ENUM('SMS', 'EMAIL') NOT NULL COMMENT '通知类型',
    subject VARCHAR(500) COMMENT '邮件主题（短信不需要）',
    content TEXT NOT NULL COMMENT '模板内容，支持变量替换',
    status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE' COMMENT '模板状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_tenant_code_type (tenant_id, template_code, type),
    INDEX idx_tenant_status (tenant_id, status)
) COMMENT='通知模板表';

-- 通知日志表
CREATE TABLE IF NOT EXISTS notification_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL COMMENT '租户ID',
    template_code VARCHAR(100) NOT NULL COMMENT '模板代码',
    type ENUM('SMS', 'EMAIL') NOT NULL COMMENT '通知类型',
    recipient VARCHAR(200) NOT NULL COMMENT '接收者（手机号或邮箱）',
    subject VARCHAR(500) COMMENT '邮件主题',
    content TEXT NOT NULL COMMENT '发送内容',
    status ENUM('SENT', 'FAILED', 'PENDING') DEFAULT 'PENDING' COMMENT '发送状态',
    business_id VARCHAR(100) COMMENT '业务ID',
    business_type VARCHAR(50) COMMENT '业务类型',
    error_message TEXT COMMENT '错误信息',
    retry_count INT DEFAULT 0 COMMENT '重试次数',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    sent_at TIMESTAMP NULL COMMENT '发送时间',
    INDEX idx_tenant_status (tenant_id, status),
    INDEX idx_business (business_id, business_type),
    INDEX idx_recipient (recipient),
    INDEX idx_created_at (created_at)
) COMMENT='通知发送日志表';

-- 插入默认的通知模板数据
INSERT INTO notification_templates (tenant_id, template_code, template_name, type, subject, content, status) VALUES
-- 预约确认模板
(1, 'APPOINTMENT_CONFIRMED', '预约确认短信模板', 'SMS', NULL, 
'【${businessName}】尊敬的${customerName}，您的预约已确认！预约时间：${appointmentDate} ${appointmentTime}，服务项目：${serviceName}，服务人员：${staffName}，预计时长：${duration}。如需取消或修改，请致电${businessPhone}。', 
'ACTIVE'),

(1, 'APPOINTMENT_CONFIRMED', '预约确认邮件模板', 'EMAIL', '预约确认通知 - ${businessName}', 
'<html><body>
<h2>预约确认通知</h2>
<p>尊敬的 ${customerName}，</p>
<p>您的预约已成功确认，详情如下：</p>
<table border="1" style="border-collapse: collapse; width: 100%;">
<tr><td><strong>预约时间</strong></td><td>${appointmentDate} ${appointmentTime}</td></tr>
<tr><td><strong>服务项目</strong></td><td>${serviceName}</td></tr>
<tr><td><strong>服务人员</strong></td><td>${staffName}</td></tr>
<tr><td><strong>预计时长</strong></td><td>${duration}</td></tr>
<tr><td><strong>费用</strong></td><td>${totalAmount}</td></tr>
</table>
<p><strong>商家信息：</strong></p>
<p>名称：${businessName}<br/>
地址：${businessAddress}<br/>
电话：${businessPhone}</p>
<p>如需取消或修改预约，请及时联系我们。</p>
<p>感谢您的信任！</p>
</body></html>', 
'ACTIVE'),

-- 预约取消模板
(1, 'APPOINTMENT_CANCELLED', '预约取消短信模板', 'SMS', NULL, 
'【${businessName}】尊敬的${customerName}，您的预约已取消。原预约时间：${appointmentDate} ${appointmentTime}，服务项目：${serviceName}。如有疑问请致电${businessPhone}。期待您的再次光临！', 
'ACTIVE'),

(1, 'APPOINTMENT_CANCELLED', '预约取消邮件模板', 'EMAIL', '预约取消通知 - ${businessName}', 
'<html><body>
<h2>预约取消通知</h2>
<p>尊敬的 ${customerName}，</p>
<p>您的预约已被取消，详情如下：</p>
<table border="1" style="border-collapse: collapse; width: 100%;">
<tr><td><strong>原预约时间</strong></td><td>${appointmentDate} ${appointmentTime}</td></tr>
<tr><td><strong>服务项目</strong></td><td>${serviceName}</td></tr>
<tr><td><strong>服务人员</strong></td><td>${staffName}</td></tr>
</table>
<p><strong>商家信息：</strong></p>
<p>名称：${businessName}<br/>
地址：${businessAddress}<br/>
电话：${businessPhone}</p>
<p>如有任何疑问，请随时联系我们。期待您的再次光临！</p>
</body></html>', 
'ACTIVE'),

-- 预约完成模板
(1, 'APPOINTMENT_COMPLETED', '预约完成短信模板', 'SMS', NULL, 
'【${businessName}】尊敬的${customerName}，您的预约已完成！服务时间：${appointmentDate} ${appointmentTime}，服务项目：${serviceName}，服务人员：${staffName}。感谢您的光临，期待下次为您服务！如需评价请致电${businessPhone}。', 
'ACTIVE'),

(1, 'APPOINTMENT_COMPLETED', '预约完成邮件模板', 'EMAIL', '服务完成通知 - ${businessName}', 
'<html><body>
<h2>服务完成通知</h2>
<p>尊敬的 ${customerName}，</p>
<p>您的预约服务已完成，详情如下：</p>
<table border="1" style="border-collapse: collapse; width: 100%;">
<tr><td><strong>服务时间</strong></td><td>${appointmentDate} ${appointmentTime}</td></tr>
<tr><td><strong>服务项目</strong></td><td>${serviceName}</td></tr>
<tr><td><strong>服务人员</strong></td><td>${staffName}</td></tr>
<tr><td><strong>服务时长</strong></td><td>${duration}</td></tr>
<tr><td><strong>费用</strong></td><td>${totalAmount}</td></tr>
</table>
<p><strong>商家信息：</strong></p>
<p>名称：${businessName}<br/>
地址：${businessAddress}<br/>
电话：${businessPhone}</p>
<p>感谢您选择我们的服务！如果您对本次服务满意，欢迎给我们评价和推荐。</p>
<p>期待下次为您服务！</p>
</body></html>', 
'ACTIVE'),

-- 预约提醒模板
(1, 'APPOINTMENT_REMINDER', '预约提醒短信模板', 'SMS', NULL, 
'【${businessName}】温馨提醒：${customerName}，您有一个预约即将到来。预约时间：${appointmentDate} ${appointmentTime}，服务项目：${serviceName}，服务人员：${staffName}。请准时到达，如需调整请致电${businessPhone}。', 
'ACTIVE'),

(1, 'APPOINTMENT_REMINDER', '预约提醒邮件模板', 'EMAIL', '预约提醒 - ${businessName}', 
'<html><body>
<h2>预约提醒</h2>
<p>尊敬的 ${customerName}，</p>
<p>温馨提醒您有一个预约即将到来：</p>
<table border="1" style="border-collapse: collapse; width: 100%;">
<tr><td><strong>预约时间</strong></td><td>${appointmentDate} ${appointmentTime}</td></tr>
<tr><td><strong>服务项目</strong></td><td>${serviceName}</td></tr>
<tr><td><strong>服务人员</strong></td><td>${staffName}</td></tr>
<tr><td><strong>预计时长</strong></td><td>${duration}</td></tr>
</table>
<p><strong>商家信息：</strong></p>
<p>名称：${businessName}<br/>
地址：${businessAddress}<br/>
电话：${businessPhone}</p>
<p>请准时到达，如需调整预约时间，请提前联系我们。</p>
<p>期待为您服务！</p>
</body></html>', 
'ACTIVE');

-- 为其他租户创建相同的模板（租户ID 2-5）
INSERT INTO notification_templates (tenant_id, template_code, template_name, type, subject, content, status)
SELECT 2, template_code, template_name, type, subject, content, status
FROM notification_templates WHERE tenant_id = 1;

INSERT INTO notification_templates (tenant_id, template_code, template_name, type, subject, content, status)
SELECT 3, template_code, template_name, type, subject, content, status
FROM notification_templates WHERE tenant_id = 1;

INSERT INTO notification_templates (tenant_id, template_code, template_name, type, subject, content, status)
SELECT 4, template_code, template_name, type, subject, content, status
FROM notification_templates WHERE tenant_id = 1;

INSERT INTO notification_templates (tenant_id, template_code, template_name, type, subject, content, status)
SELECT 5, template_code, template_name, type, subject, content, status
FROM notification_templates WHERE tenant_id = 1;