-- Analytics Service Database Tables
-- 数据统计服务相关表结构

-- 1. 收入统计表 (按日汇总)
CREATE TABLE daily_revenue_stats (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    stat_date DATE NOT NULL,
    total_revenue DECIMAL(10,2) DEFAULT 0.00,
    total_orders INT DEFAULT 0,
    total_tips DECIMAL(10,2) DEFAULT 0.00,
    avg_order_value DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_tenant_date (tenant_id, stat_date),
    INDEX idx_tenant_date (tenant_id, stat_date)
);

-- 2. 服务统计表 (按日按服务汇总)
CREATE TABLE daily_service_stats (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    service_id BIGINT NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    service_category VARCHAR(100),
    stat_date DATE NOT NULL,
    order_count INT DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0.00,
    total_quantity INT DEFAULT 0,
    avg_price DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_tenant_service_date (tenant_id, service_id, stat_date),
    INDEX idx_tenant_date (tenant_id, stat_date),
    INDEX idx_service_date (service_id, stat_date)
);

-- 3. 资源绩效统计表 (按日按资源汇总)
CREATE TABLE merchant_analytics.daily_resource_stats (
                                                         id               BIGINT AUTO_INCREMENT PRIMARY KEY,
                                                         tenant_id        BIGINT                                   NOT NULL,
                                                         resource_id      BIGINT                                   NOT NULL,
                                                         resource_name    VARCHAR(255)                             NOT NULL,
                                                         resource_type    VARCHAR(50)                              NOT NULL,
                                                         stat_date        DATE                                     NOT NULL,
                                                         order_count      INT            DEFAULT 0                 NULL,
                                                         total_revenue    DECIMAL(10, 2) DEFAULT 0.00              NULL,
                                                         avg_rating       DECIMAL(3, 2)  DEFAULT 0.00              NULL,
                                                         rating_count     INT            DEFAULT 0                 NULL,
                                                         working_hours    DECIMAL(4, 2)  DEFAULT 0.00              NULL,
                                                         efficiency_score DECIMAL(5, 2)  DEFAULT 0.00              NULL,
                                                         created_at       TIMESTAMP      DEFAULT CURRENT_TIMESTAMP NULL,
                                                         updated_at       TIMESTAMP      DEFAULT CURRENT_TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
                                                         CONSTRAINT uk_tenant_resource_date UNIQUE (tenant_id, resource_id, stat_date)
);

CREATE INDEX idx_resource_date ON merchant_analytics.daily_resource_stats (resource_id, stat_date);
CREATE INDEX idx_tenant_date ON merchant_analytics.daily_resource_stats (tenant_id, stat_date);
CREATE INDEX idx_resource_type ON merchant_analytics.daily_resource_stats (resource_type);

-- 4. 客户统计表 (按日汇总)
CREATE TABLE daily_customer_stats (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    stat_date DATE NOT NULL,
    new_customers INT DEFAULT 0,
    returning_customers INT DEFAULT 0,
    total_active_customers INT DEFAULT 0,
    customer_satisfaction DECIMAL(3,2) DEFAULT 0.00,
    avg_visit_frequency DECIMAL(4,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_tenant_date (tenant_id, stat_date),
    INDEX idx_tenant_date (tenant_id, stat_date)
);

-- 5. 预约统计表 (按日汇总)
CREATE TABLE daily_appointment_stats (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    stat_date DATE NOT NULL,
    total_appointments INT DEFAULT 0,
    confirmed_appointments INT DEFAULT 0,
    completed_appointments INT DEFAULT 0,
    cancelled_appointments INT DEFAULT 0,
    no_show_appointments INT DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0.00,
    cancellation_rate DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_tenant_date (tenant_id, stat_date),
    INDEX idx_tenant_date (tenant_id, stat_date)
);

-- 6. 实时统计缓存表 (用于快速查询当前数据)
CREATE TABLE realtime_stats_cache (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    cache_key VARCHAR(255) NOT NULL,
    cache_value TEXT,
    cache_type VARCHAR(50) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_tenant_key (tenant_id, cache_key),
    INDEX idx_tenant_type (tenant_id, cache_type),
    INDEX idx_expires (expires_at)
);

-- 7. 数据同步日志表 (记录数据同步状态)
CREATE TABLE data_sync_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    sync_type VARCHAR(50) NOT NULL,
    sync_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    start_time TIMESTAMP NULL,
    end_time TIMESTAMP NULL,
    records_processed INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tenant_type_date (tenant_id, sync_type, sync_date),
    INDEX idx_status (status)
);