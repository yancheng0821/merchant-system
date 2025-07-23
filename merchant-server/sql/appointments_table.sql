-- 创建预约表
CREATE TABLE IF NOT EXISTS appointments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL COMMENT '租户ID',
    customer_id BIGINT NOT NULL COMMENT '客户ID',
    staff_id BIGINT COMMENT '员工ID',
    appointment_date DATE NOT NULL COMMENT '预约日期',
    appointment_time TIME NOT NULL COMMENT '预约时间',
    duration INT NOT NULL DEFAULT 60 COMMENT '预约时长（分钟）',
    total_amount DECIMAL(10,2) DEFAULT 0.00 COMMENT '总金额',
    status ENUM('CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW') DEFAULT 'CONFIRMED' COMMENT '预约状态',
    notes TEXT COMMENT '备注',
    rating INT COMMENT '评分（1-5）',
    review TEXT COMMENT '评价',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_tenant_customer (tenant_id, customer_id),
    INDEX idx_appointment_date (appointment_date),
    INDEX idx_status (status),
    
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预约表';

-- 创建预约服务关联表
CREATE TABLE IF NOT EXISTS appointment_services (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    appointment_id BIGINT NOT NULL COMMENT '预约ID',
    service_id BIGINT NOT NULL COMMENT '服务ID',
    service_name VARCHAR(100) NOT NULL COMMENT '服务名称',
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '服务价格',
    duration INT NOT NULL DEFAULT 60 COMMENT '服务时长（分钟）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    INDEX idx_appointment_id (appointment_id),
    INDEX idx_service_id (service_id),
    
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预约服务关联表';