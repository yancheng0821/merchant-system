-- =====================================================
-- 业务核心服务数据库表结构
-- 数据库: merchant_business
-- 创建时间: 2024-07-19
-- 描述: 服务项目、员工、客户、预约、订单相关表
-- =====================================================

USE merchant_business;

-- 服务分类表
CREATE TABLE IF NOT EXISTS service_categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '分类ID',
    merchant_id BIGINT NOT NULL COMMENT '商户ID',
    category_name VARCHAR(100) NOT NULL COMMENT '分类名称',
    category_code VARCHAR(50) NOT NULL COMMENT '分类编码',
    parent_category_id BIGINT NULL COMMENT '父分类ID',
    description TEXT COMMENT '分类描述',
    icon_url VARCHAR(255) COMMENT '图标URL',
    sort_order INT DEFAULT 0 COMMENT '排序',
    status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_category_code_merchant (category_code, merchant_id),
    INDEX idx_merchant_id (merchant_id),
    INDEX idx_parent_category (parent_category_id),
    INDEX idx_sort_order (sort_order),
    FOREIGN KEY (merchant_id) REFERENCES merchant_management.merchants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='服务分类表';

-- 服务项目表
CREATE TABLE IF NOT EXISTS services (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '服务ID',
    merchant_id BIGINT NOT NULL COMMENT '商户ID',
    category_id BIGINT NOT NULL COMMENT '分类ID',
    service_name VARCHAR(100) NOT NULL COMMENT '服务名称',
    service_code VARCHAR(50) NOT NULL COMMENT '服务编码',
    description TEXT COMMENT '服务描述',
    price DECIMAL(10, 2) NOT NULL COMMENT '价格',
    duration INT NOT NULL COMMENT '服务时长（分钟）',
    image_url VARCHAR(255) COMMENT '服务图片',
    is_popular BOOLEAN DEFAULT FALSE COMMENT '是否热门',
    is_recommended BOOLEAN DEFAULT FALSE COMMENT '是否推荐',
    sort_order INT DEFAULT 0 COMMENT '排序',
    status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_service_code_merchant (service_code, merchant_id),
    INDEX idx_merchant_id (merchant_id),
    INDEX idx_category_id (category_id),
    INDEX idx_status (status),
    INDEX idx_sort_order (sort_order),
    FOREIGN KEY (merchant_id) REFERENCES merchant_management.merchants(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='服务项目表';

-- 员工表
CREATE TABLE IF NOT EXISTS staff (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '员工ID',
    merchant_id BIGINT NOT NULL COMMENT '商户ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    staff_code VARCHAR(50) NOT NULL COMMENT '员工编号',
    real_name VARCHAR(50) NOT NULL COMMENT '真实姓名',
    phone VARCHAR(20) COMMENT '手机号',
    email VARCHAR(100) COMMENT '邮箱',
    avatar_url VARCHAR(255) COMMENT '头像URL',
    position VARCHAR(50) COMMENT '职位',
    department VARCHAR(50) COMMENT '部门',
    hire_date DATE COMMENT '入职日期',
    salary DECIMAL(10, 2) COMMENT '薪资',
    skills JSON COMMENT '技能列表',
    experience_years INT DEFAULT 0 COMMENT '工作经验（年）',
    status ENUM('ACTIVE', 'INACTIVE', 'ON_LEAVE') DEFAULT 'ACTIVE' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_staff_code_merchant (staff_code, merchant_id),
    UNIQUE KEY uk_user_id (user_id),
    INDEX idx_merchant_id (merchant_id),
    INDEX idx_status (status),
    FOREIGN KEY (merchant_id) REFERENCES merchant_management.merchants(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES merchant_auth.users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='员工表';

-- 员工服务关联表
CREATE TABLE IF NOT EXISTS staff_services (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID',
    staff_id BIGINT NOT NULL COMMENT '员工ID',
    service_id BIGINT NOT NULL COMMENT '服务ID',
    proficiency_level ENUM('BEGINNER', 'INTERMEDIATE', 'EXPERT') DEFAULT 'INTERMEDIATE' COMMENT '熟练程度',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uk_staff_service (staff_id, service_id),
    INDEX idx_staff_id (staff_id),
    INDEX idx_service_id (service_id),
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='员工服务关联表';

-- 客户表
CREATE TABLE IF NOT EXISTS customers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '客户ID',
    merchant_id BIGINT NOT NULL COMMENT '商户ID',
    customer_code VARCHAR(50) NOT NULL COMMENT '客户编号',
    real_name VARCHAR(50) NOT NULL COMMENT '真实姓名',
    phone VARCHAR(20) NOT NULL COMMENT '手机号',
    email VARCHAR(100) COMMENT '邮箱',
    gender ENUM('MALE', 'FEMALE', 'OTHER') COMMENT '性别',
    birth_date DATE COMMENT '出生日期',
    avatar_url VARCHAR(255) COMMENT '头像URL',
    address TEXT COMMENT '地址',
    source ENUM('WALK_IN', 'ONLINE', 'REFERRAL', 'OTHER') DEFAULT 'WALK_IN' COMMENT '客户来源',
    total_visits INT DEFAULT 0 COMMENT '总访问次数',
    total_spent DECIMAL(10, 2) DEFAULT 0.00 COMMENT '总消费金额',
    last_visit_at TIMESTAMP NULL COMMENT '最后访问时间',
    status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_customer_code_merchant (customer_code, merchant_id),
    UNIQUE KEY uk_phone_merchant (phone, merchant_id),
    INDEX idx_merchant_id (merchant_id),
    INDEX idx_phone (phone),
    INDEX idx_status (status),
    INDEX idx_last_visit (last_visit_at),
    FOREIGN KEY (merchant_id) REFERENCES merchant_management.merchants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='客户表';

-- 预约表
CREATE TABLE IF NOT EXISTS appointments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '预约ID',
    merchant_id BIGINT NOT NULL COMMENT '商户ID',
    customer_id BIGINT NOT NULL COMMENT '客户ID',
    staff_id BIGINT NULL COMMENT '员工ID',
    appointment_code VARCHAR(50) NOT NULL UNIQUE COMMENT '预约编号',
    appointment_date DATE NOT NULL COMMENT '预约日期',
    start_time TIME NOT NULL COMMENT '开始时间',
    end_time TIME NOT NULL COMMENT '结束时间',
    total_duration INT NOT NULL COMMENT '总时长（分钟）',
    total_amount DECIMAL(10, 2) NOT NULL COMMENT '总金额',
    status ENUM('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW') DEFAULT 'PENDING' COMMENT '状态',
    notes TEXT COMMENT '备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_merchant_id (merchant_id),
    INDEX idx_customer_id (customer_id),
    INDEX idx_staff_id (staff_id),
    INDEX idx_appointment_date (appointment_date),
    INDEX idx_status (status),
    INDEX idx_appointment_code (appointment_code),
    FOREIGN KEY (merchant_id) REFERENCES merchant_management.merchants(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预约表';

-- 预约服务关联表
CREATE TABLE IF NOT EXISTS appointment_services (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID',
    appointment_id BIGINT NOT NULL COMMENT '预约ID',
    service_id BIGINT NOT NULL COMMENT '服务ID',
    staff_id BIGINT NULL COMMENT '员工ID',
    price DECIMAL(10, 2) NOT NULL COMMENT '价格',
    duration INT NOT NULL COMMENT '时长（分钟）',
    start_time TIME NULL COMMENT '开始时间',
    end_time TIME NULL COMMENT '结束时间',
    notes TEXT COMMENT '备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_appointment_id (appointment_id),
    INDEX idx_service_id (service_id),
    INDEX idx_staff_id (staff_id),
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预约服务关联表';

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '订单ID',
    merchant_id BIGINT NOT NULL COMMENT '商户ID',
    customer_id BIGINT NOT NULL COMMENT '客户ID',
    order_code VARCHAR(50) NOT NULL UNIQUE COMMENT '订单编号',
    order_type ENUM('APPOINTMENT', 'WALK_IN', 'ONLINE') NOT NULL COMMENT '订单类型',
    appointment_id BIGINT NULL COMMENT '预约ID',
    total_amount DECIMAL(10, 2) NOT NULL COMMENT '订单总金额',
    discount_amount DECIMAL(10, 2) DEFAULT 0.00 COMMENT '优惠金额',
    actual_amount DECIMAL(10, 2) NOT NULL COMMENT '实付金额',
    payment_method ENUM('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'WECHAT', 'ALIPAY', 'OTHER') COMMENT '支付方式',
    payment_status ENUM('PENDING', 'PAID', 'REFUNDED', 'PARTIAL_REFUND') DEFAULT 'PENDING' COMMENT '支付状态',
    order_status ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING' COMMENT '订单状态',
    notes TEXT COMMENT '备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_merchant_id (merchant_id),
    INDEX idx_customer_id (customer_id),
    INDEX idx_appointment_id (appointment_id),
    INDEX idx_order_code (order_code),
    INDEX idx_payment_status (payment_status),
    INDEX idx_order_status (order_status),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (merchant_id) REFERENCES merchant_management.merchants(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表';

-- 订单明细表
CREATE TABLE IF NOT EXISTS order_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID',
    order_id BIGINT NOT NULL COMMENT '订单ID',
    service_id BIGINT NOT NULL COMMENT '服务ID',
    staff_id BIGINT NULL COMMENT '员工ID',
    quantity INT NOT NULL DEFAULT 1 COMMENT '数量',
    unit_price DECIMAL(10, 2) NOT NULL COMMENT '单价',
    total_price DECIMAL(10, 2) NOT NULL COMMENT '总价',
    discount_amount DECIMAL(10, 2) DEFAULT 0.00 COMMENT '优惠金额',
    actual_price DECIMAL(10, 2) NOT NULL COMMENT '实付价格',
    notes TEXT COMMENT '备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_order_id (order_id),
    INDEX idx_service_id (service_id),
    INDEX idx_staff_id (staff_id),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单明细表'; 