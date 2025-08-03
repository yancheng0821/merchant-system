package com.merchant.server.analyticsservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.Map;

/**
 * Business Service客户端
 */
@FeignClient(name = "business-service", url = "http://business-service:8083")
public interface BusinessServiceClient {
    
    /**
     * 获取订单统计数据
     */
    @GetMapping("/api/business/analytics/orders")
    List<Map<String, Object>> getOrderStats(@RequestParam Long tenantId, 
                                           @RequestParam String startDate, 
                                           @RequestParam String endDate);
    
    /**
     * 获取服务统计数据
     */
    @GetMapping("/api/business/analytics/services")
    List<Map<String, Object>> getServiceStats(@RequestParam Long tenantId, 
                                             @RequestParam String startDate, 
                                             @RequestParam String endDate);
    
    /**
     * 获取资源统计数据
     */
    @GetMapping("/api/business/analytics/resources")
    List<Map<String, Object>> getResourceStats(@RequestParam Long tenantId, 
                                              @RequestParam String startDate, 
                                              @RequestParam String endDate);
    
    /**
     * 获取业务指标数据
     */
    @GetMapping("/api/business/analytics/metrics")
    Map<String, Object> getBusinessMetrics(@RequestParam Long tenantId, 
                                         @RequestParam String startDate, 
                                         @RequestParam String endDate);
}