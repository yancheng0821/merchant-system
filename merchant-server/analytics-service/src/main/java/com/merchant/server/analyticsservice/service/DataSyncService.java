package com.merchant.server.analyticsservice.service;

import com.merchant.server.analyticsservice.client.BusinessServiceClient;
import com.merchant.server.analyticsservice.entity.DailyRevenueStats;
import com.merchant.server.analyticsservice.entity.DailyServiceStats;
import com.merchant.server.analyticsservice.entity.DailyResourceStats;
import com.merchant.server.analyticsservice.mapper.DailyRevenueStatsMapper;
import com.merchant.server.analyticsservice.mapper.DailyServiceStatsMapper;
import com.merchant.server.analyticsservice.mapper.DailyResourceStatsMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * 数据同步服务
 * 从business-service同步真实数据到analytics数据库
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DataSyncService {
    
    private final DailyRevenueStatsMapper revenueStatsMapper;
    private final DailyServiceStatsMapper serviceStatsMapper;
    private final DailyResourceStatsMapper resourceStatsMapper;
    private final BusinessServiceClient businessServiceClient;
    
    /**
     * 为指定租户同步真实数据
     */
    @Transactional
    public void syncDataForTenant(Long tenantId) {
        log.info("Syncing real data for tenant: {}", tenantId);
        
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(30);
        
        try {
            // 同步收入统计数据
            syncRevenueStats(tenantId, startDate, endDate);
            
            // 同步服务统计数据
            syncServiceStats(tenantId, startDate, endDate);
            
            // 同步资源统计数据
            syncResourceStats(tenantId, startDate, endDate);
            
            log.info("Data sync completed for tenant: {}", tenantId);
        } catch (Exception e) {
            log.error("Error syncing data for tenant: {}", tenantId, e);
            throw e;
        }
    }
    
    private void syncRevenueStats(Long tenantId, LocalDate startDate, LocalDate endDate) {
        log.info("Syncing revenue stats for tenant: {}, period: {} to {}", tenantId, startDate, endDate);
        
        try {
            // 先删除该时间段的现有数据，避免重复
            revenueStatsMapper.deleteByTenantIdAndDateRange(tenantId, startDate, endDate);
            
            // 从business-service获取订单统计数据
            List<Map<String, Object>> orderStats = businessServiceClient.getOrderStats(
                tenantId, startDate.toString(), endDate.toString());
            
            for (Map<String, Object> stat : orderStats) {
                DailyRevenueStats revenueStats = new DailyRevenueStats();
                revenueStats.setTenantId(tenantId);
                revenueStats.setStatDate(LocalDate.parse(stat.get("statDate").toString()));
                revenueStats.setTotalOrders(((Number) stat.get("totalOrders")).intValue());
                revenueStats.setTotalRevenue(convertToBigDecimal(stat.get("totalRevenue")));
                revenueStats.setTotalTips(convertToBigDecimal(stat.get("totalTips")));
                revenueStats.setAvgOrderValue(convertToBigDecimal(stat.get("avgOrderValue")));
                
                revenueStatsMapper.insert(revenueStats);
            }
            
            log.info("Revenue stats sync completed for tenant: {}", tenantId);
        } catch (Exception e) {
            log.error("Error syncing revenue stats for tenant: {}", tenantId, e);
            throw e;
        }
    }
    
    private void syncServiceStats(Long tenantId, LocalDate startDate, LocalDate endDate) {
        log.info("Syncing service stats for tenant: {}, period: {} to {}", tenantId, startDate, endDate);
        
        try {
            // 先删除该时间段的现有数据，避免重复
            serviceStatsMapper.deleteByTenantIdAndDateRange(tenantId, startDate, endDate);
            
            // 从business-service获取服务统计数据
            List<Map<String, Object>> serviceStats = businessServiceClient.getServiceStats(
                tenantId, startDate.toString(), endDate.toString());
            
            for (Map<String, Object> stat : serviceStats) {
                DailyServiceStats serviceStatsEntity = new DailyServiceStats();
                serviceStatsEntity.setTenantId(tenantId);
                serviceStatsEntity.setServiceId(((Number) stat.get("serviceId")).longValue());
                serviceStatsEntity.setServiceName((String) stat.get("serviceName"));
                serviceStatsEntity.setServiceCategory((String) stat.get("serviceCategory"));
                serviceStatsEntity.setStatDate(LocalDate.parse(stat.get("statDate").toString()));
                serviceStatsEntity.setOrderCount(((Number) stat.get("orderCount")).intValue());
                serviceStatsEntity.setTotalQuantity(((Number) stat.get("totalQuantity")).intValue());
                serviceStatsEntity.setTotalRevenue(convertToBigDecimal(stat.get("totalRevenue")));
                serviceStatsEntity.setAvgPrice(convertToBigDecimal(stat.get("avgPrice")));
                
                serviceStatsMapper.insert(serviceStatsEntity);
            }
            
            log.info("Service stats sync completed for tenant: {}", tenantId);
        } catch (Exception e) {
            log.error("Error syncing service stats for tenant: {}", tenantId, e);
            throw e;
        }
    }
    
    private void syncResourceStats(Long tenantId, LocalDate startDate, LocalDate endDate) {
        log.info("Syncing resource stats for tenant: {}, period: {} to {}", tenantId, startDate, endDate);
        
        try {
            // 先删除该时间段的现有数据，避免重复
            resourceStatsMapper.deleteByTenantIdAndDateRange(tenantId, startDate, endDate);
            
            // 从business-service获取资源统计数据
            List<Map<String, Object>> resourceStats = businessServiceClient.getResourceStats(
                tenantId, startDate.toString(), endDate.toString());
            
            if (resourceStats != null && !resourceStats.isEmpty()) {
                for (Map<String, Object> stat : resourceStats) {
                    if (stat.get("resourceId") != null) {
                        DailyResourceStats resourceStatsEntity = new DailyResourceStats();
                        resourceStatsEntity.setTenantId(tenantId);
                        resourceStatsEntity.setResourceId(((Number) stat.get("resourceId")).longValue());
                        resourceStatsEntity.setResourceName((String) stat.get("resourceName"));
                        resourceStatsEntity.setResourceType((String) stat.get("resourceType"));
                        resourceStatsEntity.setStatDate(LocalDate.parse(stat.get("statDate").toString()));
                        resourceStatsEntity.setOrderCount(((Number) stat.get("orderCount")).intValue());
                        resourceStatsEntity.setTotalRevenue(convertToBigDecimal(stat.get("totalRevenue")));
                        resourceStatsEntity.setAvgRating(convertToBigDecimal(stat.get("avgRating")).setScale(2, RoundingMode.HALF_UP));
                        resourceStatsEntity.setRatingCount(((Number) stat.get("ratingCount")).intValue());
                        resourceStatsEntity.setWorkingHours(convertToBigDecimal(stat.get("workingHours")));
                        resourceStatsEntity.setEfficiencyScore(convertToBigDecimal(stat.get("efficiencyScore")));
                        
                        resourceStatsMapper.insert(resourceStatsEntity);
                    }
                }
            } else {
                log.info("No resource stats data found for tenant: {}", tenantId);
            }
            
            log.info("Resource stats sync completed for tenant: {}", tenantId);
        } catch (Exception e) {
            log.error("Error syncing resource stats for tenant: {}", tenantId, e);
            throw e;
        }
    }
    
    /**
     * 安全地将对象转换为BigDecimal
     */
    private BigDecimal convertToBigDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal) {
            return (BigDecimal) value;
        }
        if (value instanceof Number) {
            return BigDecimal.valueOf(((Number) value).doubleValue());
        }
        if (value instanceof String) {
            try {
                return new BigDecimal((String) value);
            } catch (NumberFormatException e) {
                log.warn("Failed to convert string to BigDecimal: {}", value);
                return BigDecimal.ZERO;
            }
        }
        log.warn("Unknown type for BigDecimal conversion: {}", value.getClass());
        return BigDecimal.ZERO;
    }
}