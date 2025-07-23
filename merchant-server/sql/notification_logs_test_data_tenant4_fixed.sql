-- 租户4的通知日志测试数据 (修复版)
-- Notification Logs Test Data for Tenant 4 (Fixed Version)

USE merchant_notification;

-- 插入通知日志测试数据
-- 基于租户4的客户和预约数据创建相关的通知记录

INSERT INTO notification_logs (tenant_id, template_code, type, recipient, subject, content, status, business_id, business_type, error_message, retry_count, created_at, sent_at) VALUES

-- 张小明的通知记录 - 预约确认通知 (已发送成功)
(4, 'APPOINTMENT_CONFIRMED', 'SMS', '13900139001', NULL, 
'【美丽人生美容院】尊敬的张小明，您的预约已确认！预约时间：2024-02-05 15:30，服务项目：精致理发，服务人员：李师傅，预计时长：60分钟。如需取消或修改，请致电010-88888888。', 
'SENT', 'APT_001', 'APPOINTMENT', NULL, 0, '2024-02-03 16:00:00', '2024-02-03 16:01:00'),

(4, 'APPOINTMENT_CONFIRMED', 'EMAIL', 'zhangxiaoming@tenant4.com', '预约确认通知 - 美丽人生美容院', 
'<html><body><h2>预约确认通知</h2><p>尊敬的 张小明，</p><p>您的预约已成功确认，详情如下：</p><table border="1" style="border-collapse: collapse; width: 100%;"><tr><td><strong>预约时间</strong></td><td>2024-02-05 15:30</td></tr><tr><td><strong>服务项目</strong></td><td>精致理发</td></tr><tr><td><strong>服务人员</strong></td><td>李师傅</td></tr><tr><td><strong>预计时长</strong></td><td>60分钟</td></tr><tr><td><strong>费用</strong></td><td>88.00元</td></tr></table><p><strong>商家信息：</strong></p><p>名称：美丽人生美容院<br/>地址：北京市朝阳区建国路168号<br/>电话：010-88888888</p><p>如需取消或修改预约，请及时联系我们。</p><p>感谢您的信任！</p></body></html>', 
'SENT', 'APT_001', 'APPOINTMENT', NULL, 0, '2024-02-03 16:00:00', '2024-02-03 16:01:30'),

-- 张小明的预约提醒通知 (已发送成功)
(4, 'APPOINTMENT_REMINDER', 'SMS', '13900139001', NULL, 
'【美丽人生美容院】温馨提醒：张小明，您有一个预约即将到来。预约时间：2024-02-05 15:30，服务项目：精致理发，服务人员：李师傅。请准时到达，如需调整请致电010-88888888。', 
'SENT', 'APT_001', 'APPOINTMENT', NULL, 0, '2024-02-05 13:30:00', '2024-02-05 13:31:00'),

-- 张小明的预约取消通知 (已发送成功)
(4, 'APPOINTMENT_CANCELLED', 'SMS', '13900139001', NULL, 
'【美丽人生美容院】尊敬的张小明，您的预约已取消。原预约时间：2024-01-05 11:00，服务项目：精致理发。如有疑问请致电010-88888888。期待您的再次光临！', 
'SENT', 'APT_002', 'APPOINTMENT', NULL, 0, '2024-01-05 10:30:00', '2024-01-05 10:31:00'),

-- 张小明的预约完成通知 (已发送成功)
(4, 'APPOINTMENT_COMPLETED', 'EMAIL', 'zhangxiaoming@tenant4.com', '服务完成通知 - 美丽人生美容院', 
'<html><body><h2>服务完成通知</h2><p>尊敬的 张小明，</p><p>您的预约服务已完成，详情如下：</p><table border="1" style="border-collapse: collapse; width: 100%;"><tr><td><strong>服务时间</strong></td><td>2024-01-22 14:00</td></tr><tr><td><strong>服务项目</strong></td><td>精致理发+造型设计</td></tr><tr><td><strong>服务人员</strong></td><td>李师傅</td></tr><tr><td><strong>服务时长</strong></td><td>90分钟</td></tr><tr><td><strong>费用</strong></td><td>188.00元</td></tr></table><p><strong>商家信息：</strong></p><p>名称：美丽人生美容院<br/>地址：北京市朝阳区建国路168号<br/>电话：010-88888888</p><p>感谢您选择我们的服务！如果您对本次服务满意，欢迎给我们评价和推荐。</p><p>期待下次为您服务！</p></body></html>', 
'SENT', 'APT_003', 'APPOINTMENT', NULL, 0, '2024-01-22 15:30:00', '2024-01-22 15:31:00'),

-- 李小红的通知记录 (VIP客户) - 预约确认通知 (已发送成功)
(4, 'APPOINTMENT_CONFIRMED', 'EMAIL', 'lixiaohong@tenant4.com', '预约确认通知 - 美丽人生美容院', 
'<html><body><h2>预约确认通知</h2><p>尊敬的 李小红，</p><p>您的预约已成功确认，详情如下：</p><table border="1" style="border-collapse: collapse; width: 100%;"><tr><td><strong>预约时间</strong></td><td>2024-02-08 14:00</td></tr><tr><td><strong>服务项目</strong></td><td>深层护理SPA+香薰按摩</td></tr><tr><td><strong>服务人员</strong></td><td>王小姐</td></tr><tr><td><strong>预计时长</strong></td><td>150分钟</td></tr><tr><td><strong>费用</strong></td><td>456.00元</td></tr></table><p><strong>商家信息：</strong></p><p>名称：美丽人生美容院<br/>地址：北京市朝阳区建国路168号<br/>电话：010-88888888</p><p>如需取消或修改预约，请及时联系我们。</p><p>感谢您的信任！</p></body></html>', 
'SENT', 'APT_004', 'APPOINTMENT', NULL, 0, '2024-02-06 10:30:00', '2024-02-06 10:31:00'),

(4, 'APPOINTMENT_CONFIRMED', 'SMS', '13900139002', NULL, 
'【美丽人生美容院】尊敬的李小红，您的预约已确认！预约时间：2024-02-08 14:00，服务项目：月度VIP护理套餐，服务人员：王小姐，预计时长：150分钟。如需取消或修改，请致电010-88888888。', 
'SENT', 'APT_004', 'APPOINTMENT', NULL, 0, '2024-02-06 10:30:00', '2024-02-06 10:32:00'),

-- 李小红的预约完成通知 (已发送成功)
(4, 'APPOINTMENT_COMPLETED', 'EMAIL', 'lixiaohong@tenant4.com', '服务完成通知 - 美丽人生美容院', 
'<html><body><h2>服务完成通知</h2><p>尊敬的 李小红，</p><p>您的预约服务已完成，详情如下：</p><table border="1" style="border-collapse: collapse; width: 100%;"><tr><td><strong>服务时间</strong></td><td>2024-01-18 10:00</td></tr><tr><td><strong>服务项目</strong></td><td>深层护理SPA</td></tr><tr><td><strong>服务人员</strong></td><td>王小姐</td></tr><tr><td><strong>服务时长</strong></td><td>120分钟</td></tr><tr><td><strong>费用</strong></td><td>388.00元</td></tr></table><p><strong>商家信息：</strong></p><p>名称：美丽人生美容院<br/>地址：北京市朝阳区建国路168号<br/>电话：010-88888888</p><p>感谢您选择我们的服务！如果您对本次服务满意，欢迎给我们评价和推荐。</p><p>期待下次为您服务！</p></body></html>', 
'SENT', 'APT_005', 'APPOINTMENT', NULL, 0, '2024-01-18 12:00:00', '2024-01-18 12:01:00'),

-- 李小红的预约取消通知 (已发送成功)
(4, 'APPOINTMENT_CANCELLED', 'EMAIL', 'lixiaohong@tenant4.com', '预约取消通知 - 美丽人生美容院', 
'<html><body><h2>预约取消通知</h2><p>尊敬的 李小红，</p><p>您的预约已被取消，详情如下：</p><table border="1" style="border-collapse: collapse; width: 100%;"><tr><td><strong>原预约时间</strong></td><td>2024-01-12 09:30</td></tr><tr><td><strong>服务项目</strong></td><td>深层护理SPA</td></tr><tr><td><strong>服务人员</strong></td><td>王小姐</td></tr></table><p><strong>商家信息：</strong></p><p>名称：美丽人生美容院<br/>地址：北京市朝阳区建国路168号<br/>电话：010-88888888</p><p>如有任何疑问，请随时联系我们。期待您的再次光临！</p></body></html>', 
'SENT', 'APT_006', 'APPOINTMENT', NULL, 0, '2024-01-12 08:30:00', '2024-01-12 08:31:00'),

-- 王小华的通知记录 - 预约确认通知 (已发送成功)
(4, 'APPOINTMENT_CONFIRMED', 'SMS', '13900139003', NULL, 
'【美丽人生美容院】尊敬的王小华，您的预约已确认！预约时间：2024-01-29 15:00，服务项目：艺术美甲，服务人员：刘小姐，预计时长：75分钟。如需取消或修改，请致电010-88888888。', 
'SENT', 'APT_007', 'APPOINTMENT', NULL, 0, '2024-01-27 13:20:00', '2024-01-27 13:21:00'),

-- 王小华的预约完成通知 (已发送成功)
(4, 'APPOINTMENT_COMPLETED', 'SMS', '13900139003', NULL, 
'【美丽人生美容院】尊敬的王小华，您的预约已完成！服务时间：2024-01-15 16:45，服务项目：法式美甲，服务人员：刘小姐。感谢您的光临，期待下次为您服务！如需评价请致电010-88888888。', 
'SENT', 'APT_008', 'APPOINTMENT', NULL, 0, '2024-01-15 17:45:00', '2024-01-15 17:46:00'),

-- 刘小强的通知记录 (新客户) - 预约确认通知 (已发送成功)
(4, 'APPOINTMENT_CONFIRMED', 'SMS', '13900139004', NULL, 
'【美丽人生美容院】尊敬的刘小强，您的预约已确认！预约时间：2024-01-22 11:20，服务项目：基础理发，服务人员：李师傅，预计时长：45分钟。如需取消或修改，请致电010-88888888。', 
'SENT', 'APT_009', 'APPOINTMENT', NULL, 0, '2024-01-20 15:00:00', '2024-01-20 15:01:00'),

-- 刘小强的预约完成通知 (已发送成功)
(4, 'APPOINTMENT_COMPLETED', 'SMS', '13900139004', NULL, 
'【美丽人生美容院】尊敬的刘小强，您的预约已完成！服务时间：2024-01-22 11:20，服务项目：基础理发，服务人员：李师傅。感谢您的光临，期待下次为您服务！如需评价请致电010-88888888。', 
'SENT', 'APT_009', 'APPOINTMENT', NULL, 0, '2024-01-22 12:05:00', '2024-01-22 12:06:00'),

-- 陈小美的通知记录 - 预约确认通知 (已发送成功)
(4, 'APPOINTMENT_CONFIRMED', 'EMAIL', 'chenxiaomei@tenant4.com', '预约确认通知 - 美丽人生美容院', 
'<html><body><h2>预约确认通知</h2><p>尊敬的 陈小美，</p><p>您的预约已成功确认，详情如下：</p><table border="1" style="border-collapse: collapse; width: 100%;"><tr><td><strong>预约时间</strong></td><td>2024-02-03 14:30</td></tr><tr><td><strong>服务项目</strong></td><td>抗衰老护理</td></tr><tr><td><strong>服务人员</strong></td><td>张师傅</td></tr><tr><td><strong>预计时长</strong></td><td>120分钟</td></tr><tr><td><strong>费用</strong></td><td>328.00元</td></tr></table><p><strong>商家信息：</strong></p><p>名称：美丽人生美容院<br/>地址：北京市朝阳区建国路168号<br/>电话：010-88888888</p><p>如需取消或修改预约，请及时联系我们。</p><p>感谢您的信任！</p></body></html>', 
'SENT', 'APT_010', 'APPOINTMENT', NULL, 0, '2024-02-01 16:45:00', '2024-02-01 16:46:00'),

-- 陈小美的预约完成通知 (已发送成功)
(4, 'APPOINTMENT_COMPLETED', 'EMAIL', 'chenxiaomei@tenant4.com', '服务完成通知 - 美丽人生美容院', 
'<html><body><h2>服务完成通知</h2><p>尊敬的 陈小美，</p><p>您的预约服务已完成，详情如下：</p><table border="1" style="border-collapse: collapse; width: 100%;"><tr><td><strong>服务时间</strong></td><td>2024-01-20 15:15</td></tr><tr><td><strong>服务项目</strong></td><td>焕颜面部护理</td></tr><tr><td><strong>服务人员</strong></td><td>张师傅</td></tr><tr><td><strong>服务时长</strong></td><td>90分钟</td></tr><tr><td><strong>费用</strong></td><td>188.00元</td></tr></table><p><strong>商家信息：</strong></p><p>名称：美丽人生美容院<br/>地址：北京市朝阳区建国路168号<br/>电话：010-88888888</p><p>感谢您选择我们的服务！如果您对本次服务满意，欢迎给我们评价和推荐。</p><p>期待下次为您服务！</p></body></html>', 
'SENT', 'APT_011', 'APPOINTMENT', NULL, 0, '2024-01-20 16:45:00', '2024-01-20 16:46:00'),

-- 赵小刚的通知记录 - 预约完成通知 (已发送成功)
(4, 'APPOINTMENT_COMPLETED', 'SMS', '13900139006', NULL, 
'【美丽人生美容院】尊敬的赵小刚，您的预约已完成！服务时间：2024-01-12 09:30，服务项目：染发护理+造型设计，服务人员：李师傅。感谢您的光临，期待下次为您服务！如需评价请致电010-88888888。', 
'SENT', 'APT_012', 'APPOINTMENT', NULL, 0, '2024-01-12 11:30:00', '2024-01-12 11:31:00'),

-- 孙小丽的通知记录 (学生客户) - 预约确认通知 (已发送成功)
(4, 'APPOINTMENT_CONFIRMED', 'SMS', '13900139007', NULL, 
'【美丽人生美容院】尊敬的孙小丽，您的预约已确认！预约时间：2024-01-28 13:45，服务项目：学生理发，服务人员：李师傅，预计时长：45分钟。如需取消或修改，请致电010-88888888。', 
'SENT', 'APT_013', 'APPOINTMENT', NULL, 0, '2024-01-26 11:00:00', '2024-01-26 11:01:00'),

-- 孙小丽的预约完成通知 (已发送成功)
(4, 'APPOINTMENT_COMPLETED', 'SMS', '13900139007', NULL, 
'【美丽人生美容院】尊敬的孙小丽，您的预约已完成！服务时间：2024-01-28 13:45，服务项目：学生理发，服务人员：李师傅。感谢您的光临，期待下次为您服务！如需评价请致电010-88888888。', 
'SENT', 'APT_013', 'APPOINTMENT', NULL, 0, '2024-01-28 14:30:00', '2024-01-28 14:31:00'),

-- 周小伟的通知记录 (商务客户) - 预约确认通知 (已发送成功)
(4, 'APPOINTMENT_CONFIRMED', 'EMAIL', 'zhouxiaowei@tenant4.com', '预约确认通知 - 美丽人生美容院', 
'<html><body><h2>预约确认通知</h2><p>尊敬的 周小伟，</p><p>您的预约已成功确认，详情如下：</p><table border="1" style="border-collapse: collapse; width: 100%;"><tr><td><strong>预约时间</strong></td><td>2024-01-30 17:00</td></tr><tr><td><strong>服务项目</strong></td><td>商务理发+造型整理</td></tr><tr><td><strong>服务人员</strong></td><td>李师傅</td></tr><tr><td><strong>预计时长</strong></td><td>60分钟</td></tr><tr><td><strong>费用</strong></td><td>108.00元</td></tr></table><p><strong>商家信息：</strong></p><p>名称：美丽人生美容院<br/>地址：北京市朝阳区建国路168号<br/>电话：010-88888888</p><p>如需取消或修改预约，请及时联系我们。</p><p>感谢您的信任！</p></body></html>', 
'SENT', 'APT_014', 'APPOINTMENT', NULL, 0, '2024-01-28 18:00:00', '2024-01-28 18:01:00'),

-- 周小伟的预约完成通知 (已发送成功)
(4, 'APPOINTMENT_COMPLETED', 'EMAIL', 'zhouxiaowei@tenant4.com', '服务完成通知 - 美丽人生美容院', 
'<html><body><h2>服务完成通知</h2><p>尊敬的 周小伟，</p><p>您的预约服务已完成，详情如下：</p><table border="1" style="border-collapse: collapse; width: 100%;"><tr><td><strong>服务时间</strong></td><td>2024-01-30 17:00</td></tr><tr><td><strong>服务项目</strong></td><td>商务理发+造型整理</td></tr><tr><td><strong>服务人员</strong></td><td>李师傅</td></tr><tr><td><strong>服务时长</strong></td><td>60分钟</td></tr><tr><td><strong>费用</strong></td><td>108.00元</td></tr></table><p><strong>商家信息：</strong></p><p>名称：美丽人生美容院<br/>地址：北京市朝阳区建国路168号<br/>电话：010-88888888</p><p>感谢您选择我们的服务！如果您对本次服务满意，欢迎给我们评价和推荐。</p><p>期待下次为您服务！</p></body></html>', 
'SENT', 'APT_014', 'APPOINTMENT', NULL, 0, '2024-01-30 18:00:00', '2024-01-30 18:01:00'),

-- 发送失败的通知记录 (用于测试失败状态)
-- 短信发送失败 (网络问题)
(4, 'APPOINTMENT_REMINDER', 'SMS', '13900139001', NULL, 
'【美丽人生美容院】温馨提醒：张小明，您有一个预约即将到来。预约时间：2024-02-18 10:30，服务项目：香薰按摩，服务人员：王小姐。请准时到达，如需调整请致电010-88888888。', 
'FAILED', 'APT_015', 'APPOINTMENT', '短信发送失败：网络连接超时', 2, '2024-02-18 08:30:00', NULL),

-- 邮件发送失败 (邮箱地址无效)
(4, 'APPOINTMENT_CONFIRMED', 'EMAIL', 'invalid@tenant4.com', '预约确认通知 - 美丽人生美容院', 
'<html><body><h2>预约确认通知</h2><p>尊敬的客户，</p><p>您的预约已成功确认...</p></body></html>', 
'FAILED', 'APT_016', 'APPOINTMENT', '邮件发送失败：收件人邮箱地址无效', 1, '2024-02-01 10:00:00', NULL),

-- 短信发送失败 (手机号码错误)
(4, 'APPOINTMENT_CANCELLED', 'SMS', '13900139999', NULL, 
'【美丽人生美容院】尊敬的客户，您的预约已取消。原预约时间：2024-01-10 14:00，服务项目：法式美甲。如有疑问请致电010-88888888。期待您的再次光临！', 
'FAILED', 'APT_017', 'APPOINTMENT', '短信发送失败：手机号码格式错误', 3, '2024-01-10 13:30:00', NULL),

-- 重试次数较多的失败记录
(4, 'APPOINTMENT_REMINDER', 'SMS', '13900139999', NULL, 
'【美丽人生美容院】温馨提醒：客户，您有一个预约即将到来...', 
'FAILED', 'APT_020', 'APPOINTMENT', '短信发送失败：手机号码不存在，已重试5次', 5, '2024-01-15 10:00:00', NULL),

-- 待发送的通知记录 (用于测试待发送状态)
-- 预约提醒待发送
(4, 'APPOINTMENT_REMINDER', 'SMS', '13900139002', NULL, 
'【美丽人生美容院】温馨提醒：李小红，您有一个预约即将到来。预约时间：2024-02-15 11:00，服务项目：焕颜面部护理，服务人员：张师傅。请准时到达，如需调整请致电010-88888888。', 
'PENDING', 'APT_018', 'APPOINTMENT', NULL, 0, '2024-02-15 09:00:00', NULL),

(4, 'APPOINTMENT_REMINDER', 'EMAIL', 'lixiaohong@tenant4.com', '预约提醒 - 美丽人生美容院', 
'<html><body><h2>预约提醒</h2><p>尊敬的 李小红，</p><p>温馨提醒您有一个预约即将到来：</p><table border="1" style="border-collapse: collapse; width: 100%;"><tr><td><strong>预约时间</strong></td><td>2024-02-15 11:00</td></tr><tr><td><strong>服务项目</strong></td><td>焕颜面部护理</td></tr><tr><td><strong>服务人员</strong></td><td>张师傅</td></tr><tr><td><strong>预计时长</strong></td><td>90分钟</td></tr></table><p><strong>商家信息：</strong></p><p>名称：美丽人生美容院<br/>地址：北京市朝阳区建国路168号<br/>电话：010-88888888</p><p>请准时到达，如需调整预约时间，请提前联系我们。</p><p>期待为您服务！</p></body></html>', 
'PENDING', 'APT_018', 'APPOINTMENT', NULL, 0, '2024-02-15 09:00:00', NULL),

-- 预约确认待发送
(4, 'APPOINTMENT_CONFIRMED', 'SMS', '13900139003', NULL, 
'【美丽人生美容院】尊敬的王小华，您的预约已确认！预约时间：2024-02-22 16:30，服务项目：法式美甲，服务人员：刘小姐，预计时长：60分钟。如需取消或修改，请致电010-88888888。', 
'PENDING', 'APT_019', 'APPOINTMENT', NULL, 0, '2024-02-20 14:00:00', NULL),

-- 系统通知 (非预约相关)
-- 系统维护通知
(4, 'SYSTEM_MAINTENANCE', 'EMAIL', 'lixiaohong@tenant4.com', '系统维护通知 - 美丽人生美容院', 
'<html><body><h2>系统维护通知</h2><p>尊敬的 李小红，</p><p>我们将于2024年2月10日凌晨2:00-4:00进行系统维护，期间可能影响在线预约功能。</p><p>如有紧急预约需求，请致电010-88888888。</p><p>给您带来的不便，敬请谅解！</p></body></html>', 
'SENT', 'SYS_001', 'SYSTEM', NULL, 0, '2024-02-08 18:00:00', '2024-02-08 18:01:00'),

-- 会员升级通知
(4, 'MEMBERSHIP_UPGRADE', 'SMS', '13900139001', NULL, 
'【美丽人生美容院】恭喜张小明，您的会员等级已升级为白金会员！享受更多专属优惠和服务。详情请致电010-88888888咨询。', 
'SENT', 'MEM_001', 'MEMBERSHIP', NULL, 0, '2024-01-25 10:00:00', '2024-01-25 10:01:00'),

-- 生日祝福通知
(4, 'BIRTHDAY_GREETING', 'EMAIL', 'chenxiaomei@tenant4.com', '生日快乐 - 美丽人生美容院', 
'<html><body><h2>生日快乐！</h2><p>亲爱的 陈小美，</p><p>美丽人生美容院全体员工祝您生日快乐！</p><p>特别为您准备了生日专享优惠，凭此邮件可享受8折优惠。</p><p>优惠有效期：2024-07-09 - 2024-07-16</p><p>预约电话：010-88888888</p><p>愿您永远美丽动人！</p></body></html>', 
'SENT', 'BIR_001', 'BIRTHDAY', NULL, 0, '2024-07-09 09:00:00', '2024-07-09 09:01:00'),

-- 营销推广通知
(4, 'PROMOTION', 'SMS', '13900139004', NULL, 
'【美丽人生美容院】春季护肤节开始啦！面部护理项目8折优惠，有效期至3月31日。预约热线：010-88888888。回复TD退订。', 
'SENT', 'PRO_001', 'PROMOTION', NULL, 0, '2024-03-01 10:00:00', '2024-03-01 10:01:00');

-- 查询验证数据
-- 按状态统计通知日志
SELECT 
    status,
    COUNT(*) as count,
    COUNT(CASE WHEN type = 'SMS' THEN 1 END) as sms_count,
    COUNT(CASE WHEN type = 'EMAIL' THEN 1 END) as email_count
FROM notification_logs 
WHERE tenant_id = 4 
GROUP BY status
ORDER BY count DESC;

-- 按模板类型统计
SELECT 
    template_code,
    COUNT(*) as count,
    COUNT(CASE WHEN status = 'SENT' THEN 1 END) as sent_count,
    COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed_count,
    COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_count
FROM notification_logs 
WHERE tenant_id = 4 
GROUP BY template_code
ORDER BY count DESC;

-- 按业务类型统计
SELECT 
    business_type,
    COUNT(*) as count,
    AVG(retry_count) as avg_retry_count
FROM notification_logs 
WHERE tenant_id = 4 
GROUP BY business_type
ORDER BY count DESC;

-- 最近的通知记录
SELECT 
    id,
    template_code,
    type,
    recipient,
    status,
    business_id,
    business_type,
    retry_count,
    created_at,
    sent_at,
    CASE 
        WHEN error_message IS NOT NULL THEN LEFT(error_message, 50)
        ELSE NULL 
    END as error_summary
FROM notification_logs 
WHERE tenant_id = 4 
ORDER BY created_at DESC 
LIMIT 20;

-- 失败的通知记录详情
SELECT 
    id,
    template_code,
    type,
    recipient,
    business_id,
    retry_count,
    error_message,
    created_at
FROM notification_logs 
WHERE tenant_id = 4 AND status = 'FAILED'
ORDER BY retry_count DESC, created_at DESC;