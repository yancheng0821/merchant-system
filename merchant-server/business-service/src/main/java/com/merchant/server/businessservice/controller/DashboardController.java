package com.merchant.server.businessservice.controller;

import com.merchant.server.businessservice.service.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Dashboard 控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/business/dashboard")
@RequiredArgsConstructor
public class DashboardController {
    
    private final DashboardService dashboardService;
    
    /**
     * 获取 Dashboard 统计数据
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats(
            @RequestParam Long tenantId,
            @RequestParam(defaultValue = "30") int days) {
        log.info("Fetching dashboard statistics for tenant: {} with {} days", tenantId, days);
        
        Map<String, Object> stats = dashboardService.getDashboardStats(tenantId, days);
        return ResponseEntity.ok(stats);
    }
    
    /**
     * 获取销售趋势数据
     */
    @GetMapping("/sales-trend")
    public ResponseEntity<Map<String, Object>> getSalesTrend(
            @RequestParam Long tenantId,
            @RequestParam(defaultValue = "30") int days) {
        log.info("Fetching sales trend for tenant: {} with {} days", tenantId, days);
        
        Map<String, Object> trend = dashboardService.getSalesTrend(tenantId, days);
        return ResponseEntity.ok(trend);
    }
    
    /**
     * 获取服务分类统计
     */
    @GetMapping("/service-categories")
    public ResponseEntity<Map<String, Object>> getServiceCategoryStats(
            @RequestParam Long tenantId,
            @RequestParam(defaultValue = "30") int days) {
        log.info("Fetching service category stats for tenant: {} with {} days", tenantId, days);
        
        Map<String, Object> stats = dashboardService.getServiceCategoryStats(tenantId, days);
        return ResponseEntity.ok(stats);
    }
    
    /**
     * 获取热门服务排行
     */
    @GetMapping("/top-services")
    public ResponseEntity<Map<String, Object>> getTopServices(
            @RequestParam Long tenantId,
            @RequestParam(defaultValue = "30") int days,
            @RequestParam(defaultValue = "5") int limit) {
        log.info("Fetching top services for tenant: {} with {} days, limit: {}", tenantId, days, limit);
        
        Map<String, Object> topServices = dashboardService.getTopServices(tenantId, days, limit);
        return ResponseEntity.ok(topServices);
    }
}