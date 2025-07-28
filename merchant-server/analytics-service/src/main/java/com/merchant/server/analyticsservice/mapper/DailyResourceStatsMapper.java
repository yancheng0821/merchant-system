package com.merchant.server.analyticsservice.mapper;

import com.merchant.server.analyticsservice.entity.DailyResourceStats;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * 日资源统计Mapper
 */
@Mapper
public interface DailyResourceStatsMapper {
    
    /**
     * 插入资源统计
     */
    void insert(DailyResourceStats stats);
    
    /**
     * 根据租户ID和日期范围查询资源统计
     */
    List<DailyResourceStats> selectByTenantIdAndDateRange(
            @Param("tenantId") Long tenantId, 
            @Param("startDate") LocalDate startDate, 
            @Param("endDate") LocalDate endDate);
    
    /**
     * 查询指定时间范围内按资源汇总的统计数据
     */
    List<Map<String, Object>> getResourceStatsSummary(@Param("tenantId") Long tenantId, 
                                                     @Param("startDate") LocalDate startDate, 
                                                     @Param("endDate") LocalDate endDate);
    
    /**
     * 查询活跃资源数量
     */
    Integer getActiveResourceCount(@Param("tenantId") Long tenantId, 
                                  @Param("startDate") LocalDate startDate, 
                                  @Param("endDate") LocalDate endDate);
    
    /**
     * 查询平均评分
     */
    BigDecimal getOverallAvgRating(@Param("tenantId") Long tenantId, 
                                  @Param("startDate") LocalDate startDate, 
                                  @Param("endDate") LocalDate endDate);
    
    /**
     * 删除指定租户和时间范围的数据
     */
    void deleteByTenantIdAndDateRange(@Param("tenantId") Long tenantId, 
                                     @Param("startDate") LocalDate startDate, 
                                     @Param("endDate") LocalDate endDate);
}