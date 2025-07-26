-- 租户4的预约测试数据
-- Appointment Test Data for Tenant 4

-- 首先确保我们有客户数据（这些客户应该已经存在）
-- 客户ID范围大概是从某个起始值开始，我们使用相对安全的方式来引用

-- 插入预约记录
INSERT INTO appointments (tenant_id, customer_id, staff_id, appointment_date, appointment_time, duration, total_amount, status, notes, rating, review, created_at, updated_at) VALUES

-- 张小明的预约记录 (GOLD会员) - 包含各种状态
-- 已完成的预约
(4, (SELECT id FROM customers WHERE tenant_id = 4 AND first_name = '小明' AND last_name = '张' LIMIT 1), 
 (SELECT id FROM staff WHERE tenant_id = 4 AND name = '李师傅' LIMIT 1), 
 '2024-01-22', '14:00:00', 90, 188.00, 'COMPLETED', '客户要求简约风格，效果很满意', 5, '李师傅技术很好，剪出来的发型很符合我的气质！', '2024-01-20 10:00:00', '2024-01-22 15:30:00'),

(4, (SELECT id FROM customers WHERE tenant_id = 4 AND first_name = '小明' AND last_name = '张' LIMIT 1), 
 (SELECT id FROM staff WHERE tenant_id = 4 AND name = '张师傅' LIMIT 1), 
 '2023-12-15', '16:00:00', 90, 188.00, 'COMPLETED', '年底聚会前护理', 4, '面部护理效果不错，皮肤状态好了很多', '2023-12-13 14:00:00', '2023-12-15 17:30:00'),

-- 即将到来的预约
(4, (SELECT id FROM customers WHERE tenant_id = 4 AND first_name = '小明' AND last_name = '张' LIMIT 1), 
 (SELECT id FROM staff WHERE tenant_id = 4 AND name = '李师傅' LIMIT 1), 
 '2024-02-05', '15:30:00', 60, 88.00, 'CONFIRMED', '定期理发预约', NULL, NULL, '2024-02-03 16:00:00', '2024-02-03 16:00:00'),

(4, (SELECT id FROM customers WHERE tenant_id = 4 AND first_name = '小明' AND last_name = '张' LIMIT 1), 
 (SELECT id FROM staff WHERE tenant_id = 4 AND name = '王小姐' LIMIT 1), 
 '2024-02-18', '10:30:00', 120, 268.00, 'CONFIRMED', '春节后放松护理', NULL, NULL, '2024-02-16 11:00:00', '2024-02-16 11:00:00'),

-- 取消的预约
(4, (SELECT id FROM customers WHERE tenant_id = 4 AND first_name = '小明' AND last_name = '张' LIMIT 1), 
 (SELECT id FROM staff WHERE tenant_id = 4 AND name = '李师傅' LIMIT 1), 
 '2024-01-05', '11:00:00', 60, 88.00, 'CANCELLED', '客户感冒，主动取消', NULL, NULL, '2024-01-03 09:00:00', '2024-01-05 10:30:00'),

-- 未到场记录
(4, (SELECT id FROM customers WHERE tenant_id = 4 AND first_name = '小明' AND last_name = '张' LIMIT 1), 
 (SELECT id FROM staff WHERE tenant_id = 4 AND name = '张师傅' LIMIT 1), 
 '2023-11-28', '14:30:00', 90, 188.00, 'NO_SHOW', '客户忘记预约时间，未到场', NULL, NULL, '2023-11-26 16:00:00', '2023-11-28 15:00:00'),

-- 李小红的预约记录 (PLATINUM会员) - 包含各种状态的完整记录
-- 已完成的预约记录
(4, (SELECT id FROM customers WHERE tenant_id = 4 AND first_name = '小红' AND last_name = '李' LIMIT 1), 
 (SELECT id FROM staff WHERE tenant_id = 4 AND name = '王小姐' LIMIT 1), 
 '2024-01-18', '10:00:00', 120, 388.00, 'COMPLETED', 'VIP客户，全套SPA护理', 5, '服务非常专业，环境很舒适，会继续选择这里', '2024-01-16 14:00:00', '2024-01-18 12:00:00'),

(4, (SELECT id FROM customers WHERE tenant_id = 4 AND first_name = '小红' AND last_name = '李' LIMIT 1), 
 (SELECT id FROM staff WHERE tenant_id = 4 AND name = '张师傅' LIMIT 1), 
 '2024-01-25', '11:30:00', 90, 188.00, 'COMPLETED', '面部深层护理', 4, '效果不错，皮肤感觉很好', '2024-01-23 09:00:00', '2024-01-25 13:00:00'),

(4, (SELECT id FROM customers WHERE tenant_id = 4 AND first_name = '小红' AND last_name = '李' LIMIT 1), 
 (SELECT id FROM staff WHERE tenant_id = 4 AND name = '刘小姐' LIMIT 1), 
 '2024-01-08', '15:30:00', 75, 168.00, 'COMPLETED', '艺术美甲，新年特别款式', 5, '刘小姐的手艺真的很棒，设计很有创意', '2024-01-06 10:00:00', '2024-01-08 16:45:00'),

(4, (SELECT id FROM customers WHERE tenant_id = 4 AND first_name = '小红' AND last_name = '李' LIMIT 1), 
 (SELECT id FROM staff WHERE tenant_id = 4 AND name = '李师傅' LIMIT 1), 
 '2023-12-20', '14:00:00', 90, 288.00, 'COMPLETED', '年底造型设计', 4, '染发颜色很自然，造型也很时尚', '2023-12-18 16:00:00', '2023-12-20 15:30:00'),

(4, (SELECT id FROM customers WHERE tenant_id = 4 AND first_name = '小红' AND last_name = '李' LIMIT 1), 
 (SELECT id FROM staff WHERE tenant_id = 4 AND name = '张师傅' LIMIT 1), 
 '2023-12-05', '10:30:00', 120, 328.00, 'COMPLETED', '抗衰老护理套餐', 5, '效果很明显，皮肤状态改善了很多', '2023-12-03 11:00:00', '2023-12-05 12:30:00'),

-- 即将到来的预约记录 (CONFIRMED)
(4, (SELECT id FROM customers WHERE tenant_id = 4 AND first_name = '小红' AND last_name = '李' LIMIT 1), 
 (SELECT id FROM staff WHERE tenant_id = 4 AND name = '王小姐' LIMIT 1), 
 '2024-02-08', '14:00:00', 150, 456.00, 'CONFIRMED', '月度VIP护理套餐', NULL, NULL, '2024-02-06 10:30:00', '2024-02-06 10:30:00'),

(4, (SELECT id FROM customers WHERE tenant_id = 4 AND first_name = '小红' AND last_name = '李' LIMIT 1), 
 (SELECT id FROM staff WHERE tenant_id = 4 AND name = '张师傅' LIMIT 1), 
 '2024-02-15', '11:00:00', 90, 188.00, 'CONFIRMED', '定期面部护理', NULL, NULL, '2024-02-13 15:20:00', '2024-02-13 15:20:00'),

(4, (SELECT id FROM customers WHERE tenant_id = 4 AND first_name = '小红' AND last_name = '李' LIMIT 1), 
 (SELECT id FROM staff WHERE tenant_id = 4 AND name = '刘小姐' LIMIT 1), 
 '2024-02-22', '16:30:00', 60, 128.00, 'CONFIRMED', '情人节后美甲维护', NULL, NULL, '2024-02-20 14:00:00', '2024-02-20 14:00:00'),

(4, (SELECT id FROM customers WHERE tenant_id = 4 AND first_name = '小红' AND last_name = '李' LIMIT 1), 
 (SELECT id FROM staff WHERE tenant_id = 4 AND name = '王小姐' LIMIT 1), 
 '2024-12-15', '10:30:00', 180, 588.00, 'CONFIRMED', '年底VIP豪华护理套餐', NULL, NULL, '2024-12-13 16:00:00', '2024-12-13 16:00:00'),

-- 取消的预约记录 (CANCELLED)
(4, (SELECT id FROM customers WHERE tenant_id = 4 AND first_name = '小红' AND last_name = '李' LIMIT 1), 
 (SELECT id FROM staff WHERE tenant_id = 4 AND name = '王小姐' LIMIT 1), 
 '2024-01-12', '09:30:00', 120, 388.00, 'CANCELLED', '客户临时出差取消', NULL, NULL, '2024-01-10 08:00:00', '2024-01-12 08:30:00'),

(4, (SELECT id FROM customers WHERE tenant_id = 4 AND first_name = '小红' AND last_name = '李' LIMIT 1), 
 (SELECT id FROM staff WHERE tenant_id = 4 AND name = '张师傅' LIMIT 1), 
 '2023-12-28', '15:00:00', 90, 188.00, 'CANCELLED', '年底太忙，客户主动取消', NULL, NULL, '2023-12-26 10:00:00', '2023-12-28 14:00:00'),

-- 未到场记录 (NO_SHOW)
(4, (SELECT id FROM customers WHERE tenant_id = 4 AND first_name = '小红' AND last_name = '李' LIMIT 1), 
 (SELECT id FROM staff WHERE tenant_id = 4 AND name = '刘小姐' LIMIT 1), 
 '2024-01-03', '13:00:00', 60, 128.00, 'NO_SHOW', '客户未到场，未提前通知', NULL, NULL, '2024-01-01 16:00:00', '2024-01-03 13:30:00'),

-- 王小华的预约记录 (SILVER会员)
(4, (SELECT id FROM customers WHERE tenant_id = 4 AND first_name = '小华' AND last_name = '王' LIMIT 1), 
 (SELECT id FROM staff WHERE tenant_id = 4 AND name = '刘小姐' LIMIT 1), 
 '2024-01-15', '16:45:00', 60, 128.00, 'COMPLETED', '法式美甲，客户很满意', 5, '刘小姐手艺很棒，法式美甲做得很精致', '2024-01-13 11:00:00', '2024-01-15 17:45:00'),

(4, (SELECT id FROM customers WHERE tenant_id = 4 AND first_name = '小华' AND last_name = '王' LIMIT 1), 
 (SELECT id FROM staff WHERE tenant_id = 4 AND name = '刘小姐' LIMIT 1), 
 '2024-01-29', '15:00:00', 75, 168.00, 'CONFIRMED', '艺术美甲预约', NULL, NULL, '2024-01-27 13:20:00', '2024-01-27 13:20:00'),

-- 刘小强的预约记录 (REGULAR会员)
(4, (SELECT id FROM customers WHERE tenant_id = 4 AND first_name = '小强' AND last_name = '刘' LIMIT 1), 
 (SELECT id FROM staff WHERE tenant_id = 4 AND name = '李师傅' LIMIT 1), 
 '2024-01-22', '11:20:00', 45, 88.00, 'COMPLETED', '第一次来店，基础理发', 4, '服务很好，会再来的', '2024-01-20 15:00:00', '2024-01-22 12:05:00'),

-- 陈小美的预约记录 (GOLD会员)
(4, (SELECT id FROM customers WHERE tenant_id = 4 AND first_name = '小美' AND last_name = '陈' LIMIT 1), 
 (SELECT id FROM staff WHERE tenant_id = 4 AND name = '张师傅' LIMIT 1), 
 '2024-01-20', '15:15:00', 90, 188.00, 'COMPLETED', '面部护理，客户对护肤很有研究', 5, '张师傅很专业，给了很多护肤建议', '2024-01-18 10:00:00', '2024-01-20 16:45:00'),

(4, (SELECT id FROM customers WHERE tenant_id = 4 AND first_name = '小美' AND last_name = '陈' LIMIT 1), 
 (SELECT id FROM staff WHERE tenant_id = 4 AND name = '张师傅' LIMIT 1), 
 '2024-02-03', '14:30:00', 120, 328.00, 'CONFIRMED', '抗衰老护理预约', NULL, NULL, '2024-02-01 16:45:00', '2024-02-01 16:45:00'),

-- 赵小刚的预约记录 (SILVER会员)
(4, (SELECT id FROM customers WHERE tenant_id = 4 AND first_name = '小刚' AND last_name = '赵' LIMIT 1), 
 (SELECT id FROM staff WHERE tenant_id = 4 AND name = '李师傅' LIMIT 1), 
 '2024-01-12', '09:30:00', 120, 368.00, 'COMPLETED', '染发+造型，尝试新发型', 4, '颜色很好看，造型也很时尚', '2024-01-10 14:00:00', '2024-01-12 11:30:00'),

-- 孙小丽的预约记录 (REGULAR会员，学生)
(4, (SELECT id FROM customers WHERE tenant_id = 4 AND first_name = '小丽' AND last_name = '孙' LIMIT 1), 
 (SELECT id FROM staff WHERE tenant_id = 4 AND name = '李师傅' LIMIT 1), 
 '2024-01-28', '13:45:00', 45, 68.00, 'COMPLETED', '学生客户，基础理发', 4, '价格实惠，服务也很好', '2024-01-26 11:00:00', '2024-01-28 14:30:00'),

-- 周小伟的预约记录 (GOLD会员，商务人士)
(4, (SELECT id FROM customers WHERE tenant_id = 4 AND first_name = '小伟' AND last_name = '周' LIMIT 1), 
 (SELECT id FROM staff WHERE tenant_id = 4 AND name = '李师傅' LIMIT 1), 
 '2024-01-30', '17:00:00', 60, 108.00, 'COMPLETED', '商务人士，要求效率和质量', 5, '服务效率很高，效果也很好，适合商务场合', '2024-01-28 18:00:00', '2024-01-30 18:00:00'),

-- 一些取消和未到场的记录
(4, (SELECT id FROM customers WHERE tenant_id = 4 AND first_name = '小华' AND last_name = '王' LIMIT 1), 
 (SELECT id FROM staff WHERE tenant_id = 4 AND name = '刘小姐' LIMIT 1), 
 '2024-01-10', '14:00:00', 60, 128.00, 'CANCELLED', '客户临时有事取消', NULL, NULL, '2024-01-08 16:00:00', '2024-01-10 13:30:00'),

(4, (SELECT id FROM customers WHERE tenant_id = 4 AND first_name = '小强' AND last_name = '刘' LIMIT 1), 
 (SELECT id FROM staff WHERE tenant_id = 4 AND name = '张师傅' LIMIT 1), 
 '2024-01-05', '10:00:00', 90, 188.00, 'NO_SHOW', '客户未到场', NULL, NULL, '2024-01-03 15:00:00', '2024-01-05 10:30:00');

-- 插入预约服务关联数据
INSERT INTO appointment_services (appointment_id, service_id, service_name, price, duration) VALUES

-- 张小明的预约服务详情 (包含各种状态)
-- 已完成预约的服务
((SELECT id FROM appointments WHERE tenant_id = 4 AND appointment_date = '2024-01-22' AND appointment_time = '14:00:00' LIMIT 1), 
 (SELECT id FROM services WHERE tenant_id = 4 AND name = '精致理发' LIMIT 1), '精致理发', 88.00, 60),
((SELECT id FROM appointments WHERE tenant_id = 4 AND appointment_date = '2024-01-22' AND appointment_time = '14:00:00' LIMIT 1), 
 (SELECT id FROM services WHERE tenant_id = 4 AND name = '染发护理' LIMIT 1), '造型设计', 100.00, 30),

((SELECT id FROM appointments WHERE tenant_id = 4 AND appointment_date = '2023-12-15' AND appointment_time = '16:00:00' LIMIT 1), 
 (SELECT id FROM services WHERE tenant_id = 4 AND name = '焕颜面部护理' LIMIT 1), '焕颜面部护理', 188.00, 90),

-- 即将到来预约的服务
((SELECT id FROM appointments WHERE tenant_id = 4 AND appointment_date = '2024-02-05' AND appointment_time = '15:30:00' LIMIT 1), 
 (SELECT id FROM services WHERE tenant_id = 4 AND name = '精致理发' LIMIT 1), '精致理发', 88.00, 60),

((SELECT id FROM appointments WHERE tenant_id = 4 AND appointment_date = '2024-02-18' AND appointment_time = '10:30:00' LIMIT 1), 
 (SELECT id FROM services WHERE tenant_id = 4 AND name = '香薰按摩' LIMIT 1), '香薰按摩', 268.00, 120),

-- 取消预约的服务
((SELECT id FROM appointments WHERE tenant_id = 4 AND appointment_date = '2024-01-05' AND appointment_time = '11:00:00' LIMIT 1), 
 (SELECT id FROM services WHERE tenant_id = 4 AND name = '精致理发' LIMIT 1), '精致理发', 88.00, 60),

-- 未到场预约的服务
((SELECT id FROM appointments WHERE tenant_id = 4 AND appointment_date = '2023-11-28' AND appointment_time = '14:30:00' LIMIT 1), 
 (SELECT id FROM services WHERE tenant_id = 4 AND name = '焕颜面部护理' LIMIT 1), '焕颜面部护理', 188.00, 90),

-- 李小红的预约服务详情 (包含各种状态的完整记录)

-- 已完成预约的服务
((SELECT id FROM appointments WHERE tenant_id = 4 AND appointment_date = '2024-01-18' AND appointment_time = '10:00:00' LIMIT 1), 
 (SELECT id FROM services WHERE tenant_id = 4 AND name = '深层护理SPA' LIMIT 1), '深层护理SPA', 388.00, 120),

((SELECT id FROM appointments WHERE tenant_id = 4 AND appointment_date = '2024-01-25' AND appointment_time = '11:30:00' LIMIT 1), 
 (SELECT id FROM services WHERE tenant_id = 4 AND name = '焕颜面部护理' LIMIT 1), '焕颜面部护理', 188.00, 90),

((SELECT id FROM appointments WHERE tenant_id = 4 AND appointment_date = '2024-01-08' AND appointment_time = '15:30:00' LIMIT 1), 
 (SELECT id FROM services WHERE tenant_id = 4 AND name = '艺术美甲' LIMIT 1), '艺术美甲', 168.00, 75),

((SELECT id FROM appointments WHERE tenant_id = 4 AND appointment_date = '2023-12-20' AND appointment_time = '14:00:00' LIMIT 1), 
 (SELECT id FROM services WHERE tenant_id = 4 AND name = '染发护理' LIMIT 1), '染发护理', 288.00, 90),

((SELECT id FROM appointments WHERE tenant_id = 4 AND appointment_date = '2023-12-05' AND appointment_time = '10:30:00' LIMIT 1), 
 (SELECT id FROM services WHERE tenant_id = 4 AND name = '抗衰老护理' LIMIT 1), '抗衰老护理', 328.00, 120),

-- 即将到来预约的服务 (CONFIRMED)
((SELECT id FROM appointments WHERE tenant_id = 4 AND appointment_date = '2024-02-08' AND appointment_time = '14:00:00' LIMIT 1), 
 (SELECT id FROM services WHERE tenant_id = 4 AND name = '深层护理SPA' LIMIT 1), '深层护理SPA', 388.00, 120),
((SELECT id FROM appointments WHERE tenant_id = 4 AND appointment_date = '2024-02-08' AND appointment_time = '14:00:00' LIMIT 1), 
 (SELECT id FROM services WHERE tenant_id = 4 AND name = '香薰按摩' LIMIT 1), '香薰按摩', 68.00, 30),

((SELECT id FROM appointments WHERE tenant_id = 4 AND appointment_date = '2024-02-15' AND appointment_time = '11:00:00' LIMIT 1), 
 (SELECT id FROM services WHERE tenant_id = 4 AND name = '焕颜面部护理' LIMIT 1), '焕颜面部护理', 188.00, 90),

((SELECT id FROM appointments WHERE tenant_id = 4 AND appointment_date = '2024-02-22' AND appointment_time = '16:30:00' LIMIT 1), 
 (SELECT id FROM services WHERE tenant_id = 4 AND name = '法式美甲' LIMIT 1), '法式美甲', 128.00, 60),

((SELECT id FROM appointments WHERE tenant_id = 4 AND appointment_date = '2024-12-15' AND appointment_time = '10:30:00' LIMIT 1), 
 (SELECT id FROM services WHERE tenant_id = 4 AND name = '深层护理SPA' LIMIT 1), '深层护理SPA', 388.00, 120),
((SELECT id FROM appointments WHERE tenant_id = 4 AND appointment_date = '2024-12-15' AND appointment_time = '10:30:00' LIMIT 1), 
 (SELECT id FROM services WHERE tenant_id = 4 AND name = '香薰按摩' LIMIT 1), '香薰按摩', 268.00, 90),
((SELECT id FROM appointments WHERE tenant_id = 4 AND appointment_date = '2024-12-15' AND appointment_time = '10:30:00' LIMIT 1), 
 (SELECT id FROM services WHERE tenant_id = 4 AND name = '抗衰老护理' LIMIT 1), '年底特护', 200.00, 60),

-- 取消预约的服务 (CANCELLED)
((SELECT id FROM appointments WHERE tenant_id = 4 AND appointment_date = '2024-01-12' AND appointment_time = '09:30:00' LIMIT 1), 
 (SELECT id FROM services WHERE tenant_id = 4 AND name = '深层护理SPA' LIMIT 1), '深层护理SPA', 388.00, 120),

((SELECT id FROM appointments WHERE tenant_id = 4 AND appointment_date = '2023-12-28' AND appointment_time = '15:00:00' LIMIT 1), 
 (SELECT id FROM services WHERE tenant_id = 4 AND name = '焕颜面部护理' LIMIT 1), '焕颜面部护理', 188.00, 90),

-- 未到场预约的服务 (NO_SHOW)
((SELECT id FROM appointments WHERE tenant_id = 4 AND appointment_date = '2024-01-03' AND appointment_time = '13:00:00' LIMIT 1), 
 (SELECT id FROM services WHERE tenant_id = 4 AND name = '法式美甲' LIMIT 1), '法式美甲', 128.00, 60),

-- 王小华第一次预约的服务
((SELECT id FROM appointments WHERE tenant_id = 4 AND appointment_date = '2024-01-15' AND appointment_time = '16:45:00' LIMIT 1), 
 (SELECT id FROM services WHERE tenant_id = 4 AND name = '法式美甲' LIMIT 1), '法式美甲', 128.00, 60),

-- 王小华第二次预约的服务
((SELECT id FROM appointments WHERE tenant_id = 4 AND appointment_date = '2024-01-29' AND appointment_time = '15:00:00' LIMIT 1), 
 (SELECT id FROM services WHERE tenant_id = 4 AND name = '艺术美甲' LIMIT 1), '艺术美甲', 168.00, 75),

-- 刘小强的预约服务
((SELECT id FROM appointments WHERE tenant_id = 4 AND appointment_date = '2024-01-22' AND appointment_time = '11:20:00' LIMIT 1), 
 (SELECT id FROM services WHERE tenant_id = 4 AND name = '精致理发' LIMIT 1), '基础理发', 88.00, 45),

-- 陈小美第一次预约的服务
((SELECT id FROM appointments WHERE tenant_id = 4 AND appointment_date = '2024-01-20' AND appointment_time = '15:15:00' LIMIT 1), 
 (SELECT id FROM services WHERE tenant_id = 4 AND name = '焕颜面部护理' LIMIT 1), '焕颜面部护理', 188.00, 90),

-- 陈小美第二次预约的服务
((SELECT id FROM appointments WHERE tenant_id = 4 AND appointment_date = '2024-02-03' AND appointment_time = '14:30:00' LIMIT 1), 
 (SELECT id FROM services WHERE tenant_id = 4 AND name = '抗衰老护理' LIMIT 1), '抗衰老护理', 328.00, 120),

-- 赵小刚的预约服务
((SELECT id FROM appointments WHERE tenant_id = 4 AND appointment_date = '2024-01-12' AND appointment_time = '09:30:00' LIMIT 1), 
 (SELECT id FROM services WHERE tenant_id = 4 AND name = '染发护理' LIMIT 1), '染发护理', 288.00, 90),
((SELECT id FROM appointments WHERE tenant_id = 4 AND appointment_date = '2024-01-12' AND appointment_time = '09:30:00' LIMIT 1), 
 (SELECT id FROM services WHERE tenant_id = 4 AND name = '精致理发' LIMIT 1), '造型设计', 80.00, 30),

-- 孙小丽的预约服务
((SELECT id FROM appointments WHERE tenant_id = 4 AND appointment_date = '2024-01-28' AND appointment_time = '13:45:00' LIMIT 1), 
 (SELECT id FROM services WHERE tenant_id = 4 AND name = '精致理发' LIMIT 1), '学生理发', 68.00, 45),

-- 周小伟的预约服务
((SELECT id FROM appointments WHERE tenant_id = 4 AND appointment_date = '2024-01-30' AND appointment_time = '17:00:00' LIMIT 1), 
 (SELECT id FROM services WHERE tenant_id = 4 AND name = '精致理发' LIMIT 1), '商务理发', 88.00, 45),
((SELECT id FROM appointments WHERE tenant_id = 4 AND appointment_date = '2024-01-30' AND appointment_time = '17:00:00' LIMIT 1), 
 (SELECT id FROM services WHERE tenant_id = 4 AND name = '精致理发' LIMIT 1), '造型整理', 20.00, 15);

-- 验证数据插入 - 详细查询
SELECT 
    a.id,
    CONCAT(c.first_name, c.last_name) as customer_name,
    c.membership_level,
    s.name as staff_name,
    a.appointment_date,
    a.appointment_time,
    a.duration,
    a.total_amount,
    a.status,
    a.rating,
    a.notes
FROM appointments a
LEFT JOIN customers c ON a.customer_id = c.id
LEFT JOIN staff s ON a.staff_id = s.id
WHERE a.tenant_id = 4
ORDER BY a.appointment_date DESC, a.appointment_time DESC;

-- 按状态统计预约数量
SELECT 
    status,
    COUNT(*) as count,
    AVG(total_amount) as avg_amount,
    SUM(total_amount) as total_amount
FROM appointments 
WHERE tenant_id = 4 
GROUP BY status
ORDER BY count DESC;

-- 按客户统计预约情况
SELECT 
    CONCAT(c.first_name, c.last_name) as customer_name,
    c.membership_level,
    COUNT(*) as total_appointments,
    SUM(CASE WHEN a.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
    SUM(CASE WHEN a.status = 'CONFIRMED' THEN 1 ELSE 0 END) as upcoming,
    SUM(CASE WHEN a.status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled,
    SUM(CASE WHEN a.status = 'NO_SHOW' THEN 1 ELSE 0 END) as no_show,
    AVG(CASE WHEN a.rating IS NOT NULL THEN a.rating END) as avg_rating,
    SUM(CASE WHEN a.status = 'COMPLETED' THEN a.total_amount ELSE 0 END) as total_spent
FROM appointments a
LEFT JOIN customers c ON a.customer_id = c.id
WHERE a.tenant_id = 4
GROUP BY a.customer_id, c.first_name, c.last_name, c.membership_level
ORDER BY total_appointments DESC;

-- 李小红的完整预约历史（用于测试View Appointments功能）
SELECT 
    a.id,
    a.appointment_date,
    a.appointment_time,
    a.duration,
    a.total_amount,
    a.status,
    a.rating,
    a.review,
    s.name as staff_name,
    GROUP_CONCAT(aps.service_name SEPARATOR ', ') as services
FROM appointments a
LEFT JOIN customers c ON a.customer_id = c.id
LEFT JOIN staff s ON a.staff_id = s.id
LEFT JOIN appointment_services aps ON a.id = aps.appointment_id
WHERE a.tenant_id = 4 AND c.first_name = '小红' AND c.last_name = '李'
GROUP BY a.id
ORDER BY a.appointment_date DESC, a.appointment_time DESC;