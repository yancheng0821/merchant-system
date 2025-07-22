-- Customer Management Test Data for Tenant 4
-- 租户4的客户管理测试数据

-- 插入服务分类测试数据
INSERT INTO service_categories (tenant_id, name, name_en, description, icon, color, sort_order) VALUES
(4, '美发护理', 'Hair Care', '专业美发护理服务', 'hair', '#FF6B6B', 1),
(4, 'SPA护理', 'SPA Treatments', '放松身心的SPA护理', 'spa', '#4ECDC4', 2),
(4, '面部护理', 'Facial Care', '专业面部护理服务', 'face', '#45B7D1', 3),
(4, '美甲护理', 'Nail Care', '精致美甲护理服务', 'nail', '#96CEB4', 4);

-- 插入服务项目测试数据
INSERT INTO services (tenant_id, category_id, name, name_en, description, price, duration, skill_level) VALUES
(4, (SELECT id FROM service_categories WHERE tenant_id = 4 AND name = '美发护理'), '精致理发', 'Premium Haircut', '专业理发师提供的精致理发服务', 88.00, 60, 'INTERMEDIATE'),
(4, (SELECT id FROM service_categories WHERE tenant_id = 4 AND name = '美发护理'), '染发护理', 'Hair Coloring', '专业染发和护理服务', 288.00, 180, 'ADVANCED'),
(4, (SELECT id FROM service_categories WHERE tenant_id = 4 AND name = 'SPA护理'), '深层护理SPA', 'Deep Treatment Spa', '全身深层护理和放松', 388.00, 120, 'EXPERT'),
(4, (SELECT id FROM service_categories WHERE tenant_id = 4 AND name = 'SPA护理'), '香薰按摩', 'Aromatherapy Massage', '舒缓香薰按摩服务', 268.00, 90, 'INTERMEDIATE'),
(4, (SELECT id FROM service_categories WHERE tenant_id = 4 AND name = '面部护理'), '焕颜面部护理', 'Rejuvenating Facial', '深层清洁和焕颜护理', 188.00, 75, 'INTERMEDIATE'),
(4, (SELECT id FROM service_categories WHERE tenant_id = 4 AND name = '面部护理'), '抗衰老护理', 'Anti-aging Treatment', '专业抗衰老面部护理', 328.00, 90, 'ADVANCED'),
(4, (SELECT id FROM service_categories WHERE tenant_id = 4 AND name = '美甲护理'), '法式美甲', 'French Manicure', '经典法式美甲服务', 128.00, 45, 'BEGINNER'),
(4, (SELECT id FROM service_categories WHERE tenant_id = 4 AND name = '美甲护理'), '艺术美甲', 'Nail Art', '创意艺术美甲设计', 168.00, 60, 'INTERMEDIATE');

-- 插入员工测试数据
INSERT INTO staff (tenant_id, name, phone, email, position, skills, start_date) VALUES
(4, '李师傅', '13800138001', 'li.master@tenant4.com', '高级理发师', '理发,染发,造型设计', '2020-01-15'),
(4, '王小姐', '13800138002', 'wang.miss@tenant4.com', 'SPA技师', 'SPA护理,按摩,香薰', '2021-03-20'),
(4, '张师傅', '13800138003', 'zhang.master@tenant4.com', '美容师', '面部护理,皮肤管理', '2019-08-10'),
(4, '刘小姐', '13800138004', 'liu.miss@tenant4.com', '美甲师', '美甲,指甲护理,艺术设计', '2022-01-05');

-- 插入客户测试数据
INSERT INTO customers (tenant_id, first_name, last_name, phone, email, address, date_of_birth, gender, membership_level, points, total_spent, notes, communication_preference, last_visit_date, status) VALUES
(4, '小明', '张', '13900139001', 'zhangxiaoming@tenant4.com', '北京市朝阳区建国路88号', '1990-05-15', 'MALE', 'GOLD', 1200, 2580.00, '喜欢简约风格的理发', 'SMS', '2024-01-15 14:30:00', 'ACTIVE'),
(4, '小红', '李', '13900139002', 'lixiaohong@tenant4.com', '北京市海淀区中关村大街123号', '1985-08-22', 'FEMALE', 'PLATINUM', 2800, 5680.00, '定期做SPA护理', 'EMAIL', '2024-01-20 10:00:00', 'ACTIVE'),
(4, '小华', '王', '13900139003', 'wangxiaohua@tenant4.com', '北京市西城区西单北大街56号', '1992-12-03', 'FEMALE', 'SILVER', 680, 1350.00, '喜欢法式美甲', 'SMS', '2024-01-18 16:45:00', 'ACTIVE'),
(4, '小强', '刘', '13900139004', 'liuxiaoqiang@tenant4.com', '北京市东城区王府井大街99号', '1988-03-18', 'MALE', 'REGULAR', 320, 680.00, '第一次来店', 'PHONE', '2024-01-22 11:20:00', 'ACTIVE'),
(4, '小美', '陈', '13900139005', 'chenxiaomei@tenant4.com', '北京市丰台区南三环西路168号', '1995-07-09', 'FEMALE', 'GOLD', 1580, 3260.00, '对护肤很有研究', 'EMAIL', '2024-01-25 15:15:00', 'ACTIVE'),
(4, '小刚', '赵', '13900139006', 'zhaoxiaogang@tenant4.com', '北京市石景山区石景山路88号', '1987-11-25', 'MALE', 'SILVER', 890, 1780.00, '喜欢尝试新发型', 'SMS', '2024-01-12 09:30:00', 'ACTIVE'),
(4, '小丽', '孙', '13900139007', 'sunxiaoli@tenant4.com', '北京市通州区通胡大街101号', '1993-04-14', 'FEMALE', 'REGULAR', 150, 380.00, '学生客户', 'SMS', '2024-01-28 13:45:00', 'ACTIVE'),
(4, '小伟', '周', '13900139008', 'zhouxiaowei@tenant4.com', '北京市昌平区回龙观西大街66号', '1991-09-30', 'MALE', 'GOLD', 1350, 2890.00, '商务人士，时间宝贵', 'EMAIL', '2024-01-30 17:00:00', 'ACTIVE');