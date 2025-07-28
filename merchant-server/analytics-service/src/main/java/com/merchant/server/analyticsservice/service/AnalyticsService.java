package com.merchant.server.analyticsservice.service;

import com.merchant.server.analyticsservice.dto.AnalyticsOverviewDTO;
import com.merchant.server.analyticsservice.dto.AnalyticsQueryDTO;

/**
 * 分析服务接口
 */
public interface AnalyticsService {
    
    /**
     * 获取分析概览数据
     */
    AnalyticsOverviewDTO getAnalyticsOverview(AnalyticsQueryDTO queryDTO);
    
    /**
     * 同步业务数据到分析数据库
     */
    void syncBusinessData(Long tenantId);
    
    /**
     * 清理过期的缓存数据
     */
    void cleanExpiredCache();
}