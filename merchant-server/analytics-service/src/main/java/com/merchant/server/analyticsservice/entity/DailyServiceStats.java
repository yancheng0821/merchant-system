package com.merchant.server.analyticsservice.entity;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 日服务统计实体
 */
@Data
public class DailyServiceStats {
    
    private Long id;
    private Long tenantId;
    private Long serviceId;
    private String serviceName;
    private String serviceCategory;
    private LocalDate statDate;
    private Integer orderCount = 0;
    private BigDecimal totalRevenue = BigDecimal.ZERO;
    private Integer totalQuantity = 0;
    private BigDecimal avgPrice = BigDecimal.ZERO;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}