package com.merchant.server.businessservice.controller;

import com.merchant.server.common.annotation.RequiresPermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.merchant.server.businessservice.service.BusinessAnalyticsService;

import java.util.List;
import java.util.Map;

/**
 * 业务分析数据控制器
 */
@RestController
@RequestMapping("/api/business/analytics")
@RequiredArgsConstructor
@Slf4j
public class AnalyticsController {
    
    private final BusinessAnalyticsService businessAnalyticsService;
    
    /**
     * 获取订单统计数据
     */
    @RequiresPermission("analytics:view_revenue")
    @GetMapping("/orders")
    public ResponseEntity<List<Map<String, Object>>> getOrderStats(
            @RequestParam Long tenantId,
            @RequestParam String startDate,
            @RequestParam String endDate) {
        
        log.info("Getting order stats for tenant: {}, period: {} to {}", tenantId, startDate, endDate);
        
        try {
            List<Map<String, Object>> stats = businessAnalyticsService.getOrderStats(tenantId, startDate, endDate);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error getting order stats for tenant: {}", tenantId, e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 获取服务统计数据
     */
    @RequiresPermission("analytics:view_service_stats")
    @GetMapping("/services")
    public ResponseEntity<List<Map<String, Object>>> getServiceStats(
            @RequestParam Long tenantId,
            @RequestParam String startDate,
            @RequestParam String endDate) {
        
        log.info("Getting service stats for tenant: {}, period: {} to {}", tenantId, startDate, endDate);
        
        try {
            List<Map<String, Object>> stats = businessAnalyticsService.getServiceStats(tenantId, startDate, endDate);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error getting service stats for tenant: {}", tenantId, e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 获取资源统计数据
     */
    @RequiresPermission("analytics:view_resource_performance")
    @GetMapping("/resources")
    public ResponseEntity<List<Map<String, Object>>> getResourceStats(
            @RequestParam Long tenantId,
            @RequestParam String startDate,
            @RequestParam String endDate) {
        
        log.info("Getting resource stats for tenant: {}, period: {} to {}", tenantId, startDate, endDate);
        
        try {
            List<Map<String, Object>> stats = businessAnalyticsService.getResourceStats(tenantId, startDate, endDate);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error getting resource stats for tenant: {}", tenantId, e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 获取业务指标数据
     */
    @RequiresPermission("analytics:view_business_metrics")
    @GetMapping("/metrics")
    public ResponseEntity<Map<String, Object>> getBusinessMetrics(
            @RequestParam Long tenantId,
            @RequestParam String startDate,
            @RequestParam String endDate) {
        
        log.info("Getting business metrics for tenant: {}, period: {} to {}", tenantId, startDate, endDate);
        
        try {
            Map<String, Object> metrics = businessAnalyticsService.getBusinessMetrics(tenantId, startDate, endDate);
            return ResponseEntity.ok(metrics);
        } catch (Exception e) {
            log.error("Error getting business metrics for tenant: {}", tenantId, e);
            return ResponseEntity.internalServerError().build();
        }
    }
}