package com.merchant.server.analyticsservice.entity;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 日收入统计实体
 */
@Data
public class DailyRevenueStats {
    
    private Long id;
    private Long tenantId;
    private LocalDate statDate;
    private BigDecimal totalRevenue = BigDecimal.ZERO;
    private Integer totalOrders = 0;
    private BigDecimal totalTips = BigDecimal.ZERO;
    private BigDecimal avgOrderValue = BigDecimal.ZERO;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}