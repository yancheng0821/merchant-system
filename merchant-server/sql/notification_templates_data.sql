-- 通知模板初始数据
-- 预约确认通知模板

-- 预约确认 - 短信模板
INSERT INTO notification_templates (tenant_id, template_code, template_name, type, subject, content, status, created_at, updated_at) VALUES
(1, 'APPOINTMENT_CONFIRMED', '预约确认短信模板', 'SMS', NULL, 
'【${businessName}】尊敬的${customerName}，您的预约已确认！预约时间：${appointmentDate} ${appointmentTime}，服务项目：${serviceName}，服务人员：${staffName}，预计时长：${duration}。如需取消或修改，请致电${businessPhone}。', 
'ACTIVE', NOW(), NOW());

-- 预约确认 - 邮件模板
INSERT INTO notification_templates (tenant_id, template_code, template_name, type, subject, content, status, created_at, updated_at) VALUES
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
'ACTIVE', NOW(), NOW());

-- 预约取消 - 短信模板
INSERT INTO notification_templates (tenant_id, template_code, template_name, type, subject, content, status, created_at, updated_at) VALUES
(1, 'APPOINTMENT_CANCELLED', '预约取消短信模板', 'SMS', NULL, 
'【${businessName}】尊敬的${customerName}，您的预约已取消。原预约时间：${appointmentDate} ${appointmentTime}，服务项目：${serviceName}。如有疑问请致电${businessPhone}。期待您的再次光临！', 
'ACTIVE', NOW(), NOW());

-- 预约取消 - 邮件模板
INSERT INTO notification_templates (tenant_id, template_code, template_name, type, subject, content, status, created_at, updated_at) VALUES
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
'ACTIVE', NOW(), NOW());

-- 预约完成 - 短信模板
INSERT INTO notification_templates (tenant_id, template_code, template_name, type, subject, content, status, created_at, updated_at) VALUES
(1, 'APPOINTMENT_COMPLETED', '预约完成短信模板', 'SMS', NULL, 
'【${businessName}】尊敬的${customerName}，您的预约已完成！服务时间：${appointmentDate} ${appointmentTime}，服务项目：${serviceName}，服务人员：${staffName}。感谢您的光临，期待下次为您服务！如需评价请致电${businessPhone}。', 
'ACTIVE', NOW(), NOW());

-- 预约完成 - 邮件模板
INSERT INTO notification_templates (tenant_id, template_code, template_name, type, subject, content, status, created_at, updated_at) VALUES
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
'ACTIVE', NOW(), NOW());

-- 预约提醒 - 短信模板
INSERT INTO notification_templates (tenant_id, template_code, template_name, type, subject, content, status, created_at, updated_at) VALUES
(1, 'APPOINTMENT_REMINDER', '预约提醒短信模板', 'SMS', NULL, 
'【${businessName}】温馨提醒：${customerName}，您有一个预约即将到来。预约时间：${appointmentDate} ${appointmentTime}，服务项目：${serviceName}，服务人员：${staffName}。请准时到达，如需调整请致电${businessPhone}。', 
'ACTIVE', NOW(), NOW());

-- 预约提醒 - 邮件模板
INSERT INTO notification_templates (tenant_id, template_code, template_name, type, subject, content, status, created_at, updated_at) VALUES
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
'ACTIVE', NOW(), NOW());

-- 为其他租户创建相同的模板（租户ID 2-5）
INSERT INTO notification_templates (tenant_id, template_code, template_name, type, subject, content, status, created_at, updated_at)
SELECT 2, template_code, template_name, type, subject, content, status, created_at, updated_at
FROM notification_templates WHERE tenant_id = 1;

INSERT INTO notification_templates (tenant_id, template_code, template_name, type, subject, content, status, created_at, updated_at)
SELECT 3, template_code, template_name, type, subject, content, status, created_at, updated_at
FROM notification_templates WHERE tenant_id = 1;

INSERT INTO notification_templates (tenant_id, template_code, template_name, type, subject, content, status, created_at, updated_at)
SELECT 4, template_code, template_name, type, subject, content, status, created_at, updated_at
FROM notification_templates WHERE tenant_id = 1;

INSERT INTO notification_templates (tenant_id, template_code, template_name, type, subject, content, status, created_at, updated_at)
SELECT 5, template_code, template_name, type, subject, content, status, created_at, updated_at
FROM notification_templates WHERE tenant_id = 1;