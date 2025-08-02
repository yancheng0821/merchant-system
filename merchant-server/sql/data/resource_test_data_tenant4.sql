-- 租户4的资源测试数据
-- 包含不同状态的员工和房间数据，用于测试资源管理功能

-- 清理现有测试数据（可选）
-- DELETE FROM merchant_business.resource WHERE tenant_id = 4;

-- 员工数据
INSERT INTO merchant_business.resource (
    tenant_id, name, type, description, capacity, location, 
    equipment, specialties, hourly_rate, status, phone, email, position, start_date, 
    created_at, updated_at
) VALUES 
-- ACTIVE状态员工
(4, '张三', 'STAFF', '资深理发师，擅长各种发型设计', 1, '一楼工作区A',
 NULL, '理发,染发,烫发,造型设计', 50.00, 'ACTIVE', '13800138001', 'zhangsan@example.com', '高级理发师', '2023-01-15',
 NOW(), NOW()),

(4, '赵六', 'STAFF', '专业美甲师', 1, '二楼美甲区',
 NULL, '美甲,指甲护理,彩绘', 40.00, 'ACTIVE', '13800138004', 'zhaoliu@example.com', '美甲师', '2023-03-01',
 NOW(), NOW()),

-- INACTIVE状态员工
(4, '李四', 'STAFF', '前美容师，已离职', 1, '二楼美容区',
 NULL, '美容,护肤,按摩', 60.00, 'INACTIVE', '13800138002', 'lisi@example.com', '美容师', '2022-06-01',
 NOW(), NOW()),

(4, '孙七', 'STAFF', '前按摩师，已离职', 1, '三楼按摩区',
 NULL, '按摩,推拿,理疗', 55.00, 'INACTIVE', '13800138005', 'sunqi@example.com', '按摩师', '2022-12-01',
 NOW(), NOW()),

-- VACATION状态员工
(4, '王五', 'STAFF', '技术培训中的理发师', 1, '培训室',
 NULL, '理发,造型', 45.00, 'VACATION', '13800138003', 'wangwu@example.com', '初级理发师', '2023-08-01',
 NOW(), NOW());

-- 房间数据
INSERT INTO merchant_business.resource (
    tenant_id, name, type, description, capacity, location, 
    equipment, specialties, hourly_rate, status, phone, email, position, start_date, 
    created_at, updated_at
) VALUES 
-- ACTIVE状态房间
(4, 'VIP包间1', 'ROOM', '豪华VIP包间，适合高端客户', 2, '三楼VIP区',
 '按摩椅,音响设备,空调,茶具', NULL, 100.00, 'ACTIVE', NULL, NULL, NULL, NULL,
 NOW(), NOW()),

(4, '理发区A', 'ROOM', '标准理发工作区', 4, '一楼理发区',
 '理发椅,镜子,吹风机,工具柜', NULL, 30.00, 'ACTIVE', NULL, NULL, NULL, NULL,
 NOW(), NOW()),

(4, '美甲室1', 'ROOM', '专业美甲工作室', 2, '二楼美甲区',
 '美甲桌,UV灯,工具消毒柜', NULL, 25.00, 'ACTIVE', NULL, NULL, NULL, NULL,
 NOW(), NOW()),

-- INACTIVE状态房间
(4, '美容室A', 'ROOM', '标准美容室，暂停使用', 1, '二楼美容区',
 '美容床,护肤设备,镜子,储物柜', NULL, 80.00, 'INACTIVE', NULL, NULL, NULL, NULL,
 NOW(), NOW()),

(4, '按摩室B', 'ROOM', '按摩室，设备维修中', 1, '三楼按摩区',
 '按摩床,精油加热器,音响', NULL, 70.00, 'INACTIVE', NULL, NULL, NULL, NULL,
 NOW(), NOW()),

-- MAINTENANCE状态房间
(4, 'VIP包间2', 'ROOM', 'VIP包间，装修维护中', 2, '三楼VIP区',
 '按摩椅,音响设备,空调,茶具', NULL, 100.00, 'MAINTENANCE', NULL, NULL, NULL, NULL,
 NOW(), NOW());

-- 验证插入的数据
SELECT 
    id, 
    name, 
    type, 
    status, 
    COALESCE(phone, '无') as phone, 
    COALESCE(email, '无') as email, 
    COALESCE(position, '无') as position,
    COALESCE(location, '无') as location,
    capacity,
    created_at
FROM merchant_business.resource 
WHERE tenant_id = 4
ORDER BY type, status, name;

-- 统计信息
SELECT 
    type,
    status,
    COUNT(*) as count
FROM merchant_business.resource 
WHERE tenant_id = 4
GROUP BY type, status
ORDER BY type, status;