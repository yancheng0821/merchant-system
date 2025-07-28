package com.merchant.server.analyticsservice.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

/**
 * 分析概览DTO
 */
@Data
public class AnalyticsOverviewDTO {
    
    // 总体统计
    private BigDecimal totalRevenue;
    private Integer totalOrders;
    private Integer totalCustomers;
    private BigDecimal avgOrderValue;
    private Integer activeStaff;
    private BigDecimal avgRating;
    
    // 趋势数据
    private List<RevenueDataPoint> revenueData;
    private List<ServiceStatsDTO> serviceStats;
    private List<StaffPerformanceDTO> staffPerformance;
    private BusinessMetricsDTO businessMetrics;
    
    @Data
    public static class RevenueDataPoint {
        private String date;
        private BigDecimal revenue;
        private Integer orders;
        private BigDecimal tips;
    }
    
    @Data
    public static class ServiceStatsDTO {
        private Long serviceId;
        private String serviceName;
        private String serviceCategory;
        private BigDecimal totalRevenue;
        private Integer orderCount;
        private Integer totalQuantity;
        private BigDecimal avgPrice;
        private Double percentage;
        private String color;
    }
    
    @Data
    public static class StaffPerformanceDTO {
        private Long staffId;
        private String staffName;
        private String avatar;
        private BigDecimal totalRevenue;
        private Integer orderCount;
        private BigDecimal avgRating;
        private BigDecimal efficiencyScore;
        private List<String> topServices;
    }
    
    @Data
    public static class BusinessMetricsDTO {
        private BigDecimal customerSatisfaction;
        private BigDecimal serviceCompletionRate;
        private BigDecimal appointmentCancellationRate;
        private BigDecimal repeatCustomerRate;
        
        // 趋势数据 (与上月对比)
        private BigDecimal customerSatisfactionTrend;
        private BigDecimal serviceCompletionRateTrend;
        private BigDecimal appointmentCancellationRateTrend;
        private BigDecimal repeatCustomerRateTrend;
    }
}