-- Customer Management Tables
-- 客户管理相关表结构

-- 1. 客户基本信息表
CREATE TABLE IF NOT EXISTS customers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '客户ID',
    tenant_id BIGINT NOT NULL COMMENT '租户ID',
    first_name VARCHAR(50) NOT NULL COMMENT '名',
    last_name VARCHAR(50) NOT NULL COMMENT '姓',
    phone VARCHAR(20) NOT NULL COMMENT '电话号码',
    email VARCHAR(100) COMMENT '邮箱地址',
    address TEXT COMMENT '地址',
    date_of_birth DATE COMMENT '生日',
    gender ENUM('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY') COMMENT '性别',
    membership_level ENUM('REGULAR', 'SILVER', 'GOLD', 'PLATINUM') DEFAULT 'REGULAR' COMMENT '会员等级',
    points INT DEFAULT 0 COMMENT '积分',
    total_spent DECIMAL(10,2) DEFAULT 0.00 COMMENT '总消费金额',
    status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE' COMMENT '状态',
    notes TEXT COMMENT '备注',
    allergies TEXT COMMENT '过敏信息',
    communication_preference ENUM('SMS', 'EMAIL', 'PHONE') DEFAULT 'SMS' COMMENT '联系偏好',
    last_visit_date DATETIME COMMENT '最后访问时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    created_by BIGINT COMMENT '创建人',
    updated_by BIGINT COMMENT '更新人',
    
    INDEX idx_tenant_phone (tenant_id, phone),
    INDEX idx_tenant_email (tenant_id, email),
    INDEX idx_tenant_membership (tenant_id, membership_level),
    INDEX idx_tenant_status (tenant_id, status),
    INDEX idx_last_visit (last_visit_date),
    UNIQUE KEY uk_tenant_phone (tenant_id, phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='客户基本信息表';

-- 2. 客户偏好服务表
CREATE TABLE IF NOT EXISTS customer_preferred_services (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID',
    customer_id BIGINT NOT NULL COMMENT '客户ID',
    service_id BIGINT NOT NULL COMMENT '服务ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    UNIQUE KEY uk_customer_service (customer_id, service_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='客户偏好服务表';

-- 3. 服务分类表
CREATE TABLE IF NOT EXISTS service_categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '分类ID',
    tenant_id BIGINT NOT NULL COMMENT '租户ID',
    name VARCHAR(100) NOT NULL COMMENT '分类名称',
    name_en VARCHAR(100) COMMENT '英文名称',
    description TEXT COMMENT '分类描述',
    icon VARCHAR(50) COMMENT '图标',
    color VARCHAR(20) COMMENT '颜色',
    sort_order INT DEFAULT 0 COMMENT '排序',
    status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_tenant_status (tenant_id, status),
    UNIQUE KEY uk_tenant_name (tenant_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='服务分类表';

-- 4. 服务项目表
CREATE TABLE IF NOT EXISTS services (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '服务ID',
    tenant_id BIGINT NOT NULL COMMENT '租户ID',
    category_id BIGINT NOT NULL COMMENT '分类ID',
    name VARCHAR(100) NOT NULL COMMENT '服务名称',
    name_en VARCHAR(100) COMMENT '英文名称',
    description TEXT COMMENT '服务描述',
    description_en TEXT COMMENT '英文描述',
    price DECIMAL(10,2) NOT NULL COMMENT '价格',
    duration INT NOT NULL COMMENT '时长(分钟)',
    skill_level ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT') DEFAULT 'BEGINNER' COMMENT '技能等级',
    status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    FOREIGN KEY (category_id) REFERENCES service_categories(id),
    INDEX idx_tenant_category (tenant_id, category_id),
    INDEX idx_tenant_status (tenant_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='服务项目表';

-- 5. 员工表
CREATE TABLE IF NOT EXISTS staff (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '员工ID',
    tenant_id BIGINT NOT NULL COMMENT '租户ID',
    name VARCHAR(100) NOT NULL COMMENT '员工姓名',
    phone VARCHAR(20) COMMENT '电话',
    email VARCHAR(100) COMMENT '邮箱',
    position VARCHAR(100) COMMENT '职位',
    skills TEXT COMMENT '技能描述',
    status ENUM('ACTIVE', 'INACTIVE', 'VACATION') DEFAULT 'ACTIVE' COMMENT '状态',
    start_date DATE COMMENT '入职日期',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_tenant_status (tenant_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='员工表';

-- 6. 员工服务关联表
CREATE TABLE IF NOT EXISTS staff_services (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID',
    staff_id BIGINT NOT NULL COMMENT '员工ID',
    service_id BIGINT NOT NULL COMMENT '服务ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    UNIQUE KEY uk_staff_service (staff_id, service_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='员工服务关联表';

-- 7. 预约表
CREATE TABLE IF NOT EXISTS appointments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '预约ID',
    tenant_id BIGINT NOT NULL COMMENT '租户ID',
    customer_id BIGINT NOT NULL COMMENT '客户ID',
    staff_id BIGINT NOT NULL COMMENT '员工ID',
    appointment_date DATE NOT NULL COMMENT '预约日期',
    appointment_time TIME NOT NULL COMMENT '预约时间',
    duration INT NOT NULL COMMENT '预计时长(分钟)',
    total_amount DECIMAL(10,2) NOT NULL COMMENT '总金额',
    status ENUM('CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW') DEFAULT 'CONFIRMED' COMMENT '状态',
    notes TEXT COMMENT '备注',
    rating INT COMMENT '评分(1-5)',
    review TEXT COMMENT '评价',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (staff_id) REFERENCES staff(id),
    INDEX idx_tenant_date (tenant_id, appointment_date),
    INDEX idx_customer_date (customer_id, appointment_date),
    INDEX idx_staff_date (staff_id, appointment_date),
    INDEX idx_tenant_status (tenant_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预约表';

-- 8. 预约服务明细表
CREATE TABLE IF NOT EXISTS appointment_services (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID',
    appointment_id BIGINT NOT NULL COMMENT '预约ID',
    service_id BIGINT NOT NULL COMMENT '服务ID',
    service_name VARCHAR(100) NOT NULL COMMENT '服务名称',
    price DECIMAL(10,2) NOT NULL COMMENT '价格',
    duration INT NOT NULL COMMENT '时长(分钟)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预约服务明细表';