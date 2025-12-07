package com.merchant.server.merchantservice.mapper;

import com.merchant.server.merchantservice.entity.TenantUsageStats;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 租户使用量统计 Mapper
 */
@Mapper
public interface TenantUsageStatsMapper {

    /**
     * 根据租户ID和月份查询使用量统计
     */
    TenantUsageStats findByTenantIdAndMonth(@Param("tenantId") Long tenantId, @Param("statMonth") String statMonth);

    /**
     * 获取或创建当月统计记录
     */
    TenantUsageStats getOrCreateCurrentMonthStats(@Param("tenantId") Long tenantId, @Param("statMonth") String statMonth);

    /**
     * 插入统计记录
     */
    int insert(TenantUsageStats stats);

    /**
     * 更新统计记录
     */
    int update(TenantUsageStats stats);

    /**
     * 增加预约计数
     */
    int incrementAppointmentCount(@Param("tenantId") Long tenantId, @Param("statMonth") String statMonth);

    /**
     * 增加邮件计数
     */
    int incrementEmailCount(@Param("tenantId") Long tenantId, @Param("statMonth") String statMonth);

    /**
     * 增加短信计数
     */
    int incrementSmsCount(@Param("tenantId") Long tenantId, @Param("statMonth") String statMonth);
}
