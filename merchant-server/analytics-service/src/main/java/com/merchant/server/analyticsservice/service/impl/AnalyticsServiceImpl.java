package com.merchant.server.analyticsservice.service.impl;

import com.merchant.server.analyticsservice.dto.AnalyticsOverviewDTO;
import com.merchant.server.analyticsservice.dto.AnalyticsQueryDTO;
import com.merchant.server.analyticsservice.entity.DailyRevenueStats;
import com.merchant.server.analyticsservice.entity.DailyServiceStats;
import com.merchant.server.analyticsservice.mapper.DailyRevenueStatsMapper;
import com.merchant.server.analyticsservice.mapper.DailyServiceStatsMapper;
import com.merchant.server.analyticsservice.mapper.DailyResourceStatsMapper;
import com.merchant.server.analyticsservice.service.AnalyticsService;
import com.merchant.server.analyticsservice.client.BusinessServiceClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 分析服务实现
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsServiceImpl implements AnalyticsService {
    
    private final DailyRevenueStatsMapper revenueStatsMapper;
    private final DailyServiceStatsMapper serviceStatsMapper;
    private final DailyResourceStatsMapper resourceStatsMapper;
    private final com.merchant.server.analyticsservice.service.DataSyncService dataSyncService;
    private final BusinessServiceClient businessServiceClient;
    
    // 服务分类颜色映射
    private static final List<String> SERVICE_COLORS = Arrays.asList(
        "#EC4899", "#10B981", "#F59E0B", "#8B5CF6", "#6366F1", "#EF4444"
    );
    
    @Override
    public AnalyticsOverviewDTO getAnalyticsOverview(AnalyticsQueryDTO queryDTO) {
        log.info("Getting analytics overview for tenant: {}, period: {}", 
                queryDTO.getTenantId(), queryDTO.getTimePeriod());
        
        AnalyticsOverviewDTO overview = new AnalyticsOverviewDTO();
        
        // 获取总体统计数据
        overview.setTotalRevenue(getTotalRevenue(queryDTO));
        overview.setTotalOrders(getTotalOrders(queryDTO));
        overview.setAvgOrderValue(getAvgOrderValue(queryDTO));
        overview.setActiveStaff(getActiveStaffCount(queryDTO));
        overview.setAvgRating(getOverallAvgRating(queryDTO));
        
        // 获取收入趋势数据
        overview.setRevenueData(getRevenueData(queryDTO));
        
        // 获取服务统计数据
        overview.setServiceStats(getServiceStats(queryDTO));
        
        // 获取员工绩效数据
        overview.setStaffPerformance(getStaffPerformance(queryDTO));
        
        // 获取业务指标数据
        overview.setBusinessMetrics(getBusinessMetrics(queryDTO));
        
        return overview;
    }
    
    private BigDecimal getTotalRevenue(AnalyticsQueryDTO queryDTO) {
        BigDecimal revenue = revenueStatsMapper.getTotalRevenueByDateRange(
            queryDTO.getTenantId(), queryDTO.getStartDate(), queryDTO.getEndDate());
        return revenue != null ? revenue : BigDecimal.ZERO;
    }
    
    private Integer getTotalOrders(AnalyticsQueryDTO queryDTO) {
        Integer orders = revenueStatsMapper.getTotalOrdersByDateRange(
            queryDTO.getTenantId(), queryDTO.getStartDate(), queryDTO.getEndDate());
        return orders != null ? orders : 0;
    }
    
    private BigDecimal getAvgOrderValue(AnalyticsQueryDTO queryDTO) {
        BigDecimal avgValue = revenueStatsMapper.getAvgOrderValueByDateRange(
            queryDTO.getTenantId(), queryDTO.getStartDate(), queryDTO.getEndDate());
        return avgValue != null ? avgValue : BigDecimal.ZERO;
    }
    
    private Integer getActiveStaffCount(AnalyticsQueryDTO queryDTO) {
        Integer count = resourceStatsMapper.getActiveResourceCount(
            queryDTO.getTenantId(), queryDTO.getStartDate(), queryDTO.getEndDate());
        return count != null ? count : 0;
    }
    
    private BigDecimal getOverallAvgRating(AnalyticsQueryDTO queryDTO) {
        BigDecimal rating = resourceStatsMapper.getOverallAvgRating(
            queryDTO.getTenantId(), queryDTO.getStartDate(), queryDTO.getEndDate());
        return rating != null ? rating.setScale(1, RoundingMode.HALF_UP) : BigDecimal.ZERO;
    }
    
    private List<AnalyticsOverviewDTO.RevenueDataPoint> getRevenueData(AnalyticsQueryDTO queryDTO) {
        List<DailyRevenueStats> revenueStats = revenueStatsMapper
            .selectByTenantIdAndDateRange(
                queryDTO.getTenantId(), queryDTO.getStartDate(), queryDTO.getEndDate());
        
        return revenueStats.stream()
            .map(stats -> {
                AnalyticsOverviewDTO.RevenueDataPoint dataPoint = new AnalyticsOverviewDTO.RevenueDataPoint();
                dataPoint.setDate(stats.getStatDate().toString());
                dataPoint.setRevenue(stats.getTotalRevenue());
                dataPoint.setOrders(stats.getTotalOrders());
                dataPoint.setTips(stats.getTotalTips());
                return dataPoint;
            })
            .collect(Collectors.toList());
    }
    
    private List<AnalyticsOverviewDTO.ServiceStatsDTO> getServiceStats(AnalyticsQueryDTO queryDTO) {
        List<Map<String, Object>> serviceStatsSummary = serviceStatsMapper.getServiceStatsSummary(
            queryDTO.getTenantId(), queryDTO.getStartDate(), queryDTO.getEndDate());
        
        // 计算总收入用于百分比计算
        BigDecimal totalRevenue = serviceStatsSummary.stream()
            .map(row -> (BigDecimal) row.get("totalRevenue"))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        List<AnalyticsOverviewDTO.ServiceStatsDTO> serviceStats = new ArrayList<>();
        
        for (int i = 0; i < serviceStatsSummary.size(); i++) {
            Map<String, Object> row = serviceStatsSummary.get(i);
            AnalyticsOverviewDTO.ServiceStatsDTO serviceDTO = new AnalyticsOverviewDTO.ServiceStatsDTO();
            
            serviceDTO.setServiceId((Long) row.get("serviceId"));
            serviceDTO.setServiceName((String) row.get("serviceName"));
            serviceDTO.setServiceCategory((String) row.get("serviceCategory"));
            serviceDTO.setTotalRevenue((BigDecimal) row.get("totalRevenue"));
            serviceDTO.setOrderCount(((Number) row.get("orderCount")).intValue());
            serviceDTO.setTotalQuantity(((Number) row.get("totalQuantity")).intValue());
            serviceDTO.setAvgPrice((BigDecimal) row.get("avgPrice"));
            
            // 计算百分比
            if (totalRevenue.compareTo(BigDecimal.ZERO) > 0) {
                double percentage = serviceDTO.getTotalRevenue()
                    .divide(totalRevenue, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .doubleValue();
                serviceDTO.setPercentage(percentage);
            } else {
                serviceDTO.setPercentage(0.0);
            }
            
            // 设置颜色
            serviceDTO.setColor(SERVICE_COLORS.get(i % SERVICE_COLORS.size()));
            
            serviceStats.add(serviceDTO);
        }
        
        return serviceStats;
    }
    
    private List<AnalyticsOverviewDTO.StaffPerformanceDTO> getStaffPerformance(AnalyticsQueryDTO queryDTO) {
        List<Map<String, Object>> resourceStatsSummary = resourceStatsMapper.getResourceStatsSummary(
            queryDTO.getTenantId(), queryDTO.getStartDate(), queryDTO.getEndDate());
        
        return resourceStatsSummary.stream()
            .map(row -> {
                AnalyticsOverviewDTO.StaffPerformanceDTO staffDTO = new AnalyticsOverviewDTO.StaffPerformanceDTO();
                staffDTO.setStaffId((Long) row.get("resourceId"));
                staffDTO.setStaffName((String) row.get("resourceName"));
                staffDTO.setTotalRevenue((BigDecimal) row.get("totalRevenue"));
                staffDTO.setOrderCount(((Number) row.get("orderCount")).intValue());
                staffDTO.setAvgRating(((BigDecimal) row.get("avgRating")).setScale(1, RoundingMode.HALF_UP));
                staffDTO.setEfficiencyScore(((BigDecimal) row.get("efficiencyScore")).setScale(0, RoundingMode.HALF_UP));
                
                // 生成头像缩写
                String[] nameParts = staffDTO.getStaffName().split(" ");
                String avatar = nameParts.length >= 2 
                    ? (nameParts[0].substring(0, 1) + nameParts[1].substring(0, 1)).toUpperCase()
                    : staffDTO.getStaffName().substring(0, Math.min(2, staffDTO.getStaffName().length())).toUpperCase();
                staffDTO.setAvatar(avatar);
                
                // TODO: 获取资源的主要服务类型
                staffDTO.setTopServices(Arrays.asList("Hair Care", "Facial Care"));
                
                return staffDTO;
            })
            .collect(Collectors.toList());
    }
    
    private AnalyticsOverviewDTO.BusinessMetricsDTO getBusinessMetrics(AnalyticsQueryDTO queryDTO) {
        AnalyticsOverviewDTO.BusinessMetricsDTO metrics = new AnalyticsOverviewDTO.BusinessMetricsDTO();
        
        try {
            // 从business-service获取业务指标数据
            Map<String, Object> businessMetrics = businessServiceClient.getBusinessMetrics(
                queryDTO.getTenantId(), queryDTO.getStartDate().toString(), queryDTO.getEndDate().toString());
            
            // 设置当前期间的指标
            metrics.setCustomerSatisfaction(
                BigDecimal.valueOf(((Number) businessMetrics.get("customerSatisfaction")).doubleValue())
                    .setScale(1, RoundingMode.HALF_UP));
            metrics.setServiceCompletionRate(
                BigDecimal.valueOf(((Number) businessMetrics.get("serviceCompletionRate")).doubleValue())
                    .setScale(1, RoundingMode.HALF_UP));
            metrics.setAppointmentCancellationRate(
                BigDecimal.valueOf(((Number) businessMetrics.get("appointmentCancellationRate")).doubleValue())
                    .setScale(1, RoundingMode.HALF_UP));
            metrics.setRepeatCustomerRate(
                BigDecimal.valueOf(((Number) businessMetrics.get("repeatCustomerRate")).doubleValue())
                    .setScale(1, RoundingMode.HALF_UP));
            
            // 获取上月数据用于趋势对比
            LocalDate prevStartDate = queryDTO.getStartDate().minusMonths(1);
            LocalDate prevEndDate = queryDTO.getEndDate().minusMonths(1);
            
            Map<String, Object> prevMetrics = businessServiceClient.getBusinessMetrics(
                queryDTO.getTenantId(), prevStartDate.toString(), prevEndDate.toString());
            
            // 计算趋势 (当前值 - 上月值)
            double customerSatisfactionTrend = 
                ((Number) businessMetrics.get("customerSatisfaction")).doubleValue() - 
                ((Number) prevMetrics.get("customerSatisfaction")).doubleValue();
            double serviceCompletionRateTrend = 
                ((Number) businessMetrics.get("serviceCompletionRate")).doubleValue() - 
                ((Number) prevMetrics.get("serviceCompletionRate")).doubleValue();
            double appointmentCancellationRateTrend = 
                ((Number) businessMetrics.get("appointmentCancellationRate")).doubleValue() - 
                ((Number) prevMetrics.get("appointmentCancellationRate")).doubleValue();
            double repeatCustomerRateTrend = 
                ((Number) businessMetrics.get("repeatCustomerRate")).doubleValue() - 
                ((Number) prevMetrics.get("repeatCustomerRate")).doubleValue();
            
            metrics.setCustomerSatisfactionTrend(BigDecimal.valueOf(customerSatisfactionTrend).setScale(1, RoundingMode.HALF_UP));
            metrics.setServiceCompletionRateTrend(BigDecimal.valueOf(serviceCompletionRateTrend).setScale(1, RoundingMode.HALF_UP));
            metrics.setAppointmentCancellationRateTrend(BigDecimal.valueOf(appointmentCancellationRateTrend).setScale(1, RoundingMode.HALF_UP));
            metrics.setRepeatCustomerRateTrend(BigDecimal.valueOf(repeatCustomerRateTrend).setScale(1, RoundingMode.HALF_UP));
            
        } catch (Exception e) {
            log.error("Error getting business metrics for tenant: {}", queryDTO.getTenantId(), e);
            // 如果获取失败，返回默认值
            metrics.setCustomerSatisfaction(BigDecimal.ZERO);
            metrics.setServiceCompletionRate(BigDecimal.ZERO);
            metrics.setAppointmentCancellationRate(BigDecimal.ZERO);
            metrics.setRepeatCustomerRate(BigDecimal.ZERO);
            metrics.setCustomerSatisfactionTrend(BigDecimal.ZERO);
            metrics.setServiceCompletionRateTrend(BigDecimal.ZERO);
            metrics.setAppointmentCancellationRateTrend(BigDecimal.ZERO);
            metrics.setRepeatCustomerRateTrend(BigDecimal.ZERO);
        }
        
        return metrics;
    }
    
    @Override
    public void syncBusinessData(Long tenantId) {
        log.info("Syncing business data for tenant: {}", tenantId);
        // 从business-service同步真实数据
        dataSyncService.syncDataForTenant(tenantId);
    }
    
    @Override
    public void cleanExpiredCache() {
        // TODO: 实现清理过期缓存的逻辑
        log.info("Cleaning expired cache data");
    }
}