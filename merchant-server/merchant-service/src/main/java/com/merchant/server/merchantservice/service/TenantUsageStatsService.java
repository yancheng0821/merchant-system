package com.merchant.server.merchantservice.service;

import com.merchant.server.merchantservice.entity.TenantUsageStats;

/**
 * 租户使用量统计服务接口
 */
public interface TenantUsageStatsService {

    /**
     * 获取当月使用量统计
     */
    TenantUsageStats getCurrentMonthStats(Long tenantId);

    /**
     * 获取指定月份使用量统计
     */
    TenantUsageStats getStatsByMonth(Long tenantId, String statMonth);

    /**
     * 增加预约计数
     */
    void incrementAppointmentCount(Long tenantId);

    /**
     * 增加邮件计数
     */
    void incrementEmailCount(Long tenantId);

    /**
     * 增加短信计数
     */
    void incrementSmsCount(Long tenantId);
}
