package com.merchant.server.analyticsservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.Map;

/**
 * Business Service客户端
 */
@FeignClient(name = "business-service")
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

    /**
     * 按服务维度统计订单
     */
    @GetMapping("/api/business/analytics/orders/by-service")
    List<Map<String, Object>> getOrderStatsByService(@RequestParam Long tenantId,
                                                     @RequestParam String startDate,
                                                     @RequestParam String endDate);

    /**
     * 按支付方式维度统计订单
     */
    @GetMapping("/api/business/analytics/orders/by-payment-method")
    List<Map<String, Object>> getOrderStatsByPaymentMethod(@RequestParam Long tenantId,
                                                           @RequestParam String startDate,
                                                           @RequestParam String endDate);
}