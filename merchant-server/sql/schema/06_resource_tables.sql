-- 统一资源表
CREATE TABLE IF NOT EXISTS resource (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL COMMENT '租户ID',
    name VARCHAR(100) NOT NULL COMMENT '资源名称',
    type ENUM('STAFF', 'ROOM') NOT NULL COMMENT '资源类型：员工或房间',
    description TEXT COMMENT '资源描述',
    capacity INT DEFAULT 1 COMMENT '容量（房间可容纳人数，员工通常为1）',
    location VARCHAR(200) COMMENT '位置信息',
    equipment TEXT COMMENT '设备信息（JSON格式）',
    specialties TEXT COMMENT '专长/特色（JSON格式）',
    hourly_rate DECIMAL(10,2) COMMENT '小时费率',
    status ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE') DEFAULT 'ACTIVE' COMMENT '状态',
    
    -- 员工特有字段
    phone VARCHAR(20) COMMENT '联系电话（员工专用）',
    email VARCHAR(100) COMMENT '邮箱（员工专用）',
    position VARCHAR(100) COMMENT '职位（员工专用）',
    start_date DATE COMMENT '入职日期（员工专用）',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_tenant_type (tenant_id, type),
    INDEX idx_email (email),
    INDEX idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='统一资源表';

-- 资源可用性表
CREATE TABLE IF NOT EXISTS resource_availability (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    resource_id BIGINT NOT NULL COMMENT '资源ID',
    day_of_week TINYINT NOT NULL COMMENT '星期几（1-7，1为周一）',
    start_time TIME NOT NULL COMMENT '开始时间',
    end_time TIME NOT NULL COMMENT '结束时间',
    is_available BOOLEAN DEFAULT TRUE COMMENT '是否可用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    FOREIGN KEY (resource_id) REFERENCES resource(id) ON DELETE CASCADE,
    INDEX idx_resource_id (resource_id),
    INDEX idx_day_of_week (day_of_week),
    UNIQUE KEY uk_resource_day_time (resource_id, day_of_week, start_time, end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资源可用性表';

-- 服务资源关联表（更新Service表，添加资源类型字段）
ALTER TABLE service ADD COLUMN resource_type ENUM('STAFF', 'ROOM', 'BOTH') DEFAULT 'STAFF' COMMENT '服务需要的资源类型';

-- 更新预约表，添加资源相关字段
ALTER TABLE appointment 
ADD COLUMN resource_id BIGINT COMMENT '预约的资源ID',
ADD COLUMN resource_type ENUM('STAFF', 'ROOM') COMMENT '预约的资源类型',
ADD INDEX idx_resource_id (resource_id);

-- 将现有员工数据迁移到资源表
INSERT INTO resource (tenant_id, name, type, description, specialties, status, created_at, updated_at)
SELECT 
    tenant_id,
    name,
    'STAFF',
    CONCAT('职位: ', IFNULL(position, ''), ' | 技能: ', IFNULL(skills, '')),
    skills,
    CASE 
        WHEN status = 'ACTIVE' THEN 'ACTIVE'
        WHEN status = 'INACTIVE' THEN 'INACTIVE'
        ELSE 'INACTIVE'
    END,
    created_at,
    updated_at
FROM staff;

-- 更新现有预约记录，关联到资源表
UPDATE appointment a
JOIN staff s ON a.staff_id = s.id
JOIN resource r ON r.tenant_id = s.tenant_id AND r.name = s.name AND r.type = 'STAFF'
SET a.resource_id = r.id, a.resource_type = 'STAFF'
WHERE a.staff_id IS NOT NULL;

-- 示例房间数据
INSERT INTO resource (tenant_id, name, type, description, capacity, location, equipment, status) VALUES
(1, 'VIP包间A', 'ROOM', '豪华VIP包间，适合小型聚会', 8, '2楼东侧', '{"sound_system": true, "projector": true, "mini_bar": true}', 'ACTIVE'),
(1, 'VIP包间B', 'ROOM', '标准VIP包间', 6, '2楼西侧', '{"sound_system": true, "projector": false, "mini_bar": true}', 'ACTIVE'),
(1, '普通包间1', 'ROOM', '经济型包间', 4, '1楼', '{"sound_system": true}', 'ACTIVE'),
(2, '健身房A区', 'ROOM', '器械训练区域', 20, '1楼', '{"equipment": ["跑步机", "哑铃", "杠铃"]}', 'ACTIVE'),
(2, '瑜伽室', 'ROOM', '专业瑜伽练习室', 15, '2楼', '{"equipment": ["瑜伽垫", "音响系统", "镜墙"]}', 'ACTIVE');

-- 示例资源可用性数据
INSERT INTO resource_availability (resource_id, day_of_week, start_time, end_time, is_available) 
SELECT 
    r.id,
    d.day_num,
    '09:00:00',
    '22:00:00',
    TRUE
FROM resource r
CROSS JOIN (
    SELECT 1 as day_num UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION 
    SELECT 5 UNION SELECT 6 UNION SELECT 7
) d
WHERE r.status = 'ACTIVE';