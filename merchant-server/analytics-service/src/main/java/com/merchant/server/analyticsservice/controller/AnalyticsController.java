package com.merchant.server.analyticsservice.controller;

import com.merchant.server.analyticsservice.client.BusinessServiceClient;
import com.merchant.server.analyticsservice.dto.AnalyticsOverviewDTO;
import com.merchant.server.analyticsservice.dto.AnalyticsQueryDTO;
import com.merchant.server.analyticsservice.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 分析数据控制器
 */
@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@Slf4j
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final BusinessServiceClient businessServiceClient;
    
    /**
     * 获取分析概览数据
     */
    @GetMapping("/overview")
    public ResponseEntity<AnalyticsOverviewDTO> getAnalyticsOverview(
            @RequestParam Long tenantId,
            @RequestParam(defaultValue = "30days") String timePeriod) {
        
        log.info("Getting analytics overview for tenant: {}, period: {}", tenantId, timePeriod);
        
        try {
            AnalyticsQueryDTO queryDTO = new AnalyticsQueryDTO();
            queryDTO.setTenantId(tenantId);
            queryDTO.setTimePeriodAndCalculateDates(timePeriod);
            
            AnalyticsOverviewDTO overview = analyticsService.getAnalyticsOverview(queryDTO);
            
            return ResponseEntity.ok(overview);
            
        } catch (Exception e) {
            log.error("Error getting analytics overview for tenant: {}", tenantId, e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 同步业务数据
     */
    @PostMapping("/sync/{tenantId}")
    public ResponseEntity<Void> syncBusinessData(@PathVariable Long tenantId) {
        log.info("Syncing business data for tenant: {}", tenantId);
        
        try {
            analyticsService.syncBusinessData(tenantId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error syncing business data for tenant: {}", tenantId, e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 清理过期缓存
     */
    @PostMapping("/cache/clean")
    public ResponseEntity<Void> cleanExpiredCache() {
        log.info("Cleaning expired cache data");
        
        try {
            analyticsService.cleanExpiredCache();
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error cleaning expired cache", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 初始化分析数据 (用于演示)
     */
    @PostMapping("/init/{tenantId}")
    public ResponseEntity<String> initAnalyticsData(@PathVariable Long tenantId) {
        log.info("Initializing analytics data for tenant: {}", tenantId);

        try {
            analyticsService.syncBusinessData(tenantId);
            return ResponseEntity.ok("Analytics data initialized successfully for tenant: " + tenantId);
        } catch (Exception e) {
            log.error("Error initializing analytics data for tenant: {}", tenantId, e);
            return ResponseEntity.internalServerError().body("Failed to initialize analytics data");
        }
    }

    /**
     * 按服务维度统计订单
     */
    @GetMapping("/orders/by-service")
    public ResponseEntity<List<Map<String, Object>>> getOrderStatsByService(
            @RequestParam Long tenantId,
            @RequestParam String startDate,
            @RequestParam String endDate) {

        log.info("Getting order stats by service for tenant: {}, period: {} to {}", tenantId, startDate, endDate);

        try {
            List<Map<String, Object>> stats = businessServiceClient.getOrderStatsByService(tenantId, startDate, endDate);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error getting order stats by service for tenant: {}", tenantId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 按支付方式维度统计订单
     */
    @GetMapping("/orders/by-payment-method")
    public ResponseEntity<List<Map<String, Object>>> getOrderStatsByPaymentMethod(
            @RequestParam Long tenantId,
            @RequestParam String startDate,
            @RequestParam String endDate) {

        log.info("Getting order stats by payment method for tenant: {}, period: {} to {}", tenantId, startDate, endDate);

        try {
            List<Map<String, Object>> stats = businessServiceClient.getOrderStatsByPaymentMethod(tenantId, startDate, endDate);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error getting order stats by payment method for tenant: {}", tenantId, e);
            return ResponseEntity.internalServerError().build();
        }
    }
}