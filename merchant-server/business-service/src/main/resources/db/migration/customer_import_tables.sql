-- 客户导入临时表
CREATE TABLE IF NOT EXISTS customer_import_temp (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    import_session_id VARCHAR(255) NOT NULL,
    row_index INT UNSIGNED,
    raw_data JSON,
    status ENUM('PENDING','VALID','INVALID','IMPORTED') DEFAULT 'PENDING',
    error_message VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tenant_session (tenant_id, import_session_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- 客户导入日志表
CREATE TABLE IF NOT EXISTS customer_import_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    import_session_id VARCHAR(255) NOT NULL UNIQUE,
    file_name VARCHAR(255),
    total_records INT DEFAULT 0,
    success_records INT DEFAULT 0,
    failed_records INT DEFAULT 0,
    status ENUM('PROCESSING','COMPLETED','FAILED') DEFAULT 'PROCESSING',
    error_message VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);