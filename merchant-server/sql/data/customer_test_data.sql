-- Customer Management Test Data
-- 客户管理测试数据

-- 插入服务分类测试数据
INSERT INTO service_categories (tenant_id, name, name_en, description, icon, color, sort_order) VALUES
(1, '美发护理', 'Hair Care', '专业美发护理服务', 'hair', '#FF6B6B', 1),
(1, 'SPA护理', 'SPA Treatments', '放松身心的SPA护理', 'spa', '#4ECDC4', 2),
(1, '面部护理', 'Facial Care', '专业面部护理服务', 'face', '#45B7D1', 3),
(1, '美甲护理', 'Nail Care', '精致美甲护理服务', 'nail', '#96CEB4', 4);

-- 插入服务项目测试数据
INSERT INTO services (tenant_id, category_id, name, name_en, description, price, duration, skill_level) VALUES
(1, 1, '精致理发', 'Premium Haircut', '专业理发师提供的精致理发服务', 88.00, 60, 'INTERMEDIATE'),
(1, 1, '染发护理', 'Hair Coloring', '专业染发和护理服务', 288.00, 180, 'ADVANCED'),
(1, 2, '深层护理SPA', 'Deep Treatment Spa', '全身深层护理和放松', 388.00, 120, 'EXPERT'),
(1, 2, '香薰按摩', 'Aromatherapy Massage', '舒缓香薰按摩服务', 268.00, 90, 'INTERMEDIATE'),
(1, 3, '焕颜面部护理', 'Rejuvenating Facial', '深层清洁和焕颜护理', 188.00, 75, 'INTERMEDIATE'),
(1, 3, '抗衰老护理', 'Anti-aging Treatment', '专业抗衰老面部护理', 328.00, 90, 'ADVANCED'),
(1, 4, '法式美甲', 'French Manicure', '经典法式美甲服务', 128.00, 45, 'BEGINNER'),
(1, 4, '艺术美甲', 'Nail Art', '创意艺术美甲设计', 168.00, 60, 'INTERMEDIATE');

-- 插入员工测试数据
INSERT INTO staff (tenant_id, name, phone, email, position, skills, start_date) VALUES
(1, '李师傅', '13800138001', 'li.master@example.com', '高级理发师', '理发,染发,造型设计', '2020-01-15'),
(1, '王小姐', '13800138002', 'wang.miss@example.com', 'SPA技师', 'SPA护理,按摩,香薰', '2021-03-20'),
(1, '张师傅', '13800138003', 'zhang.master@example.com', '美容师', '面部护理,皮肤管理', '2019-08-10'),
(1, '刘小姐', '13800138004', 'liu.miss@example.com', '美甲师', '美甲,指甲护理,艺术设计', '2022-01-05');

-- 插入员工服务关联数据
INSERT INTO staff_services (staff_id, service_id) VALUES
(1, 1), (1, 2),  -- 李师傅：理发、染发
(2, 3), (2, 4),  -- 王小姐：SPA、按摩
(3, 5), (3, 6),  -- 张师傅：面部护理
(4, 7), (4, 8);  -- 刘小姐：美甲

-- 插入客户测试数据
INSERT INTO customers (tenant_id, first_name, last_name, phone, email, address, date_of_birth, gender, membership_level, points, total_spent, notes, communication_preference, last_visit_date) VALUES
(1, '小明', '张', '13900139001', 'zhangxiaoming@example.com', '北京市朝阳区建国路88号', '1990-05-15', 'MALE', 'GOLD', 1200, 2580.00, '喜欢简约风格的理发', 'SMS', '2024-01-15 14:30:00'),
(1, '小红', '李', '13900139002', 'lixiaohong@example.com', '北京市海淀区中关村大街123号', '1985-08-22', 'FEMALE', 'PLATINUM', 2800, 5680.00, '定期做SPA护理', 'EMAIL', '2024-01-20 10:00:00'),
(1, '小华', '王', '13900139003', 'wangxiaohua@example.com', '北京市西城区西单北大街56号', '1992-12-03', 'FEMALE', 'SILVER', 680, 1350.00, '喜欢法式美甲', 'SMS', '2024-01-18 16:45:00'),
(1, '小强', '刘', '13900139004', 'liuxiaoqiang@example.com', '北京市东城区王府井大街99号', '1988-03-18', 'MALE', 'REGULAR', 320, 680.00, '第一次来店', 'PHONE', '2024-01-22 11:20:00'),
(1, '小美', '陈', '13900139005', 'chenxiaomei@example.com', '北京市丰台区南三环西路168号', '1995-07-09', 'FEMALE', 'GOLD', 1580, 3260.00, '对护肤很有研究', 'EMAIL', '2024-01-25 15:15:00'),
(1, '小刚', '赵', '13900139006', 'zhaoxiaogang@example.com', '北京市石景山区石景山路88号', '1987-11-25', 'MALE', 'SILVER', 890, 1780.00, '喜欢尝试新发型', 'SMS', '2024-01-12 09:30:00'),
(1, '小丽', '孙', '13900139007', 'sunxiaoli@example.com', '北京市通州区通胡大街101号', '1993-04-14', 'FEMALE', 'REGULAR', 150, 380.00, '学生客户', 'SMS', '2024-01-28 13:45:00'),
(1, '小伟', '周', '13900139008', 'zhouxiaowei@example.com', '北京市昌平区回龙观西大街66号', '1991-09-30', 'MALE', 'GOLD', 1350, 2890.00, '商务人士，时间宝贵', 'EMAIL', '2024-01-30 17:00:00');

-- 插入客户偏好服务数据
INSERT INTO customer_preferred_services (customer_id, service_id) VALUES
(1, 1), (1, 2),  -- 张小明：理发、染发
(2, 3), (2, 4), (2, 5),  -- 李小红：SPA、按摩、面部护理
(3, 7), (3, 8),  -- 王小华：美甲
(4, 1),  -- 刘小强：理发
(5, 5), (5, 6),  -- 陈小美：面部护理
(6, 1), (6, 2),  -- 赵小刚：理发、染发
(7, 7),  -- 孙小丽：美甲
(8, 1), (8, 5);  -- 周小伟：理发、面部护理

-- 插入预约测试数据
INSERT INTO appointments (tenant_id, customer_id, staff_id, appointment_date, appointment_time, duration, total_amount, status, notes, rating) VALUES
(1, 1, 1, '2024-02-01', '10:00:00', 60, 88.00, 'COMPLETED', '客户很满意', 5),
(1, 2, 2, '2024-02-01', '14:00:00', 120, 388.00, 'COMPLETED', 'SPA效果很好', 5),
(1, 3, 4, '2024-02-02', '11:00:00', 45, 128.00, 'COMPLETED', '法式美甲很精致', 4),
(1, 4, 1, '2024-02-02', '15:30:00', 60, 88.00, 'COMPLETED', '第一次体验很好', 4),
(1, 5, 3, '2024-02-03', '09:30:00', 75, 188.00, 'COMPLETED', '面部护理效果显著', 5),
(1, 1, 1, '2024-02-05', '16:00:00', 180, 288.00, 'CONFIRMED', '预约染发服务', NULL),
(1, 2, 2, '2024-02-06', '10:30:00', 90, 268.00, 'CONFIRMED', '香薰按摩预约', NULL),
(1, 6, 1, '2024-02-07', '14:00:00', 60, 88.00, 'CONFIRMED', '理发预约', NULL);

-- 插入预约服务明细数据
INSERT INTO appointment_services (appointment_id, service_id, service_name, price, duration) VALUES
(1, 1, '精致理发', 88.00, 60),
(2, 3, '深层护理SPA', 388.00, 120),
(3, 7, '法式美甲', 128.00, 45),
(4, 1, '精致理发', 88.00, 60),
(5, 5, '焕颜面部护理', 188.00, 75),
(6, 2, '染发护理', 288.00, 180),
(7, 4, '香薰按摩', 268.00, 90),
(8, 1, '精致理发', 88.00, 60);