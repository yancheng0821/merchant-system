package com.merchant.server.analyticsservice.entity;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 日资源统计实体（包括员工、场地等资源）
 */
@Data
public class DailyResourceStats {
    
    private Long id;
    private Long tenantId;
    private Long resourceId;
    private String resourceName;
    private String resourceType;
    private LocalDate statDate;
    private Integer orderCount = 0;
    private BigDecimal totalRevenue = BigDecimal.ZERO;
    private BigDecimal avgRating = BigDecimal.ZERO;
    private Integer ratingCount = 0;
    private BigDecimal workingHours = BigDecimal.ZERO;
    private BigDecimal efficiencyScore = BigDecimal.ZERO;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}