package com.merchant.server.businessservice.service.impl;

import com.merchant.server.businessservice.mapper.OrderMapper;
import com.merchant.server.businessservice.mapper.OrderServiceMapper;
import com.merchant.server.businessservice.service.BusinessAnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * 业务分析服务实现
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BusinessAnalyticsServiceImpl implements BusinessAnalyticsService {
    
    private final OrderMapper orderMapper;
    private final OrderServiceMapper orderServiceMapper;
    
    @Override
    public List<Map<String, Object>> getOrderStats(Long tenantId, String startDate, String endDate) {
        log.info("Getting order stats for tenant: {}, period: {} to {}", tenantId, startDate, endDate);
        return orderMapper.getOrderStatsForAnalytics(tenantId, startDate, endDate);
    }
    
    @Override
    public List<Map<String, Object>> getServiceStats(Long tenantId, String startDate, String endDate) {
        log.info("Getting service stats for tenant: {}, period: {} to {}", tenantId, startDate, endDate);
        return orderServiceMapper.getServiceStatsForAnalytics(tenantId, startDate, endDate);
    }
    
    @Override
    public List<Map<String, Object>> getResourceStats(Long tenantId, String startDate, String endDate) {
        log.info("Getting resource stats for tenant: {}, period: {} to {}", tenantId, startDate, endDate);
        return orderMapper.getResourceStatsForAnalytics(tenantId, startDate, endDate);
    }
    
    @Override
    public Map<String, Object> getBusinessMetrics(Long tenantId, String startDate, String endDate) {
        log.info("Getting business metrics for tenant: {}, period: {} to {}", tenantId, startDate, endDate);
        return orderMapper.getBusinessMetricsForAnalytics(tenantId, startDate, endDate);
    }
}