-- 资源预约时间段表
CREATE TABLE IF NOT EXISTS resource_booking_slots (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    resource_id BIGINT NOT NULL COMMENT '资源ID',
    appointment_id BIGINT NOT NULL COMMENT '预约ID',
    booking_date DATE NOT NULL COMMENT '预约日期',
    start_time TIME NOT NULL COMMENT '开始时间',
    end_time TIME NOT NULL COMMENT '结束时间',
    status ENUM('BOOKED', 'CANCELLED') DEFAULT 'BOOKED' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    FOREIGN KEY (resource_id) REFERENCES resource(id) ON DELETE CASCADE,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    INDEX idx_resource_date (resource_id, booking_date),
    INDEX idx_appointment_id (appointment_id),
    INDEX idx_booking_time (booking_date, start_time, end_time),
    UNIQUE KEY uk_resource_booking_time (resource_id, booking_date, start_time, end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资源预约时间段表';