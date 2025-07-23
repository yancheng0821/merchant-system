-- 创建员工表
CREATE TABLE IF NOT EXISTS staff (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL COMMENT '租户ID',
    name VARCHAR(100) NOT NULL COMMENT '员工姓名',
    phone VARCHAR(20) COMMENT '电话号码',
    email VARCHAR(100) COMMENT '邮箱地址',
    position VARCHAR(50) COMMENT '职位',
    specialties TEXT COMMENT '专长',
    status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_status (status),
    UNIQUE KEY uk_tenant_phone (tenant_id, phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='员工表';



