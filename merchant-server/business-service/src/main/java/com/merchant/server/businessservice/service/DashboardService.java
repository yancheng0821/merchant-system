package com.merchant.server.businessservice.service;

import java.util.Map;

/**
 * Dashboard 服务接口
 */
public interface DashboardService {
    
    /**
     * 获取 Dashboard 统计数据
     */
    Map<String, Object> getDashboardStats(Long tenantId, int days);
    
    /**
     * 获取销售趋势数据
     */
    Map<String, Object> getSalesTrend(Long tenantId, int days);
    
    /**
     * 获取服务分类统计
     */
    Map<String, Object> getServiceCategoryStats(Long tenantId, int days);
    
    /**
     * 获取热门服务排行
     */
    Map<String, Object> getTopServices(Long tenantId, int days, int limit);
}