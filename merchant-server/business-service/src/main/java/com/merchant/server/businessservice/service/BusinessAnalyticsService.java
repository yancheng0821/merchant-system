package com.merchant.server.businessservice.service;

import java.util.List;
import java.util.Map;

/**
 * 业务分析服务接口
 */
public interface BusinessAnalyticsService {
    
    /**
     * 获取订单统计数据
     */
    List<Map<String, Object>> getOrderStats(Long tenantId, String startDate, String endDate);
    
    /**
     * 获取服务统计数据
     */
    List<Map<String, Object>> getServiceStats(Long tenantId, String startDate, String endDate);
    
    /**
     * 获取资源统计数据
     */
    List<Map<String, Object>> getResourceStats(Long tenantId, String startDate, String endDate);
    
    /**
     * 获取业务指标数据
     */
    Map<String, Object> getBusinessMetrics(Long tenantId, String startDate, String endDate);

    /**
     * 按服务维度统计订单
     */
    List<Map<String, Object>> getOrderStatsByService(Long tenantId, String startDate, String endDate);

    /**
     * 按支付方式维度统计订单
     */
    List<Map<String, Object>> getOrderStatsByPaymentMethod(Long tenantId, String startDate, String endDate);

    /**
     * 按支付方式统计package购买订单
     */
    List<Map<String, Object>> getPackagePurchaseStatsByPaymentMethod(Long tenantId, String startDate, String endDate);
}