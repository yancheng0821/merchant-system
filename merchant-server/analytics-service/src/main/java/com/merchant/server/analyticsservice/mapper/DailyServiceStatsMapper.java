package com.merchant.server.analyticsservice.mapper;

import com.merchant.server.analyticsservice.entity.DailyServiceStats;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * 日服务统计Mapper
 */
@Mapper
public interface DailyServiceStatsMapper {
    
    /**
     * 插入服务统计
     */
    void insert(DailyServiceStats stats);
    
    /**
     * 根据租户ID和日期范围查询服务统计
     */
    List<DailyServiceStats> selectByTenantIdAndDateRange(
            @Param("tenantId") Long tenantId, 
            @Param("startDate") LocalDate startDate, 
            @Param("endDate") LocalDate endDate);
    
    /**
     * 查询指定时间范围内按服务汇总的统计数据
     */
    List<Map<String, Object>> getServiceStatsSummary(@Param("tenantId") Long tenantId, 
                                                    @Param("startDate") LocalDate startDate, 
                                                    @Param("endDate") LocalDate endDate);
    
    /**
     * 查询指定时间范围内的服务收入排行
     */
    List<Map<String, Object>> getTopServicesByRevenue(@Param("tenantId") Long tenantId, 
                                                     @Param("startDate") LocalDate startDate, 
                                                     @Param("endDate") LocalDate endDate);
    
    /**
     * 删除指定租户和时间范围的数据
     */
    void deleteByTenantIdAndDateRange(@Param("tenantId") Long tenantId, 
                                     @Param("startDate") LocalDate startDate, 
                                     @Param("endDate") LocalDate endDate);
}