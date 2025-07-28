package com.merchant.server.analyticsservice.mapper;

import com.merchant.server.analyticsservice.entity.DailyRevenueStats;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * 日收入统计Mapper
 */
@Mapper
public interface DailyRevenueStatsMapper {
    
    /**
     * 插入收入统计
     */
    void insert(DailyRevenueStats stats);
    
    /**
     * 根据租户ID和日期范围查询收入统计
     */
    List<DailyRevenueStats> selectByTenantIdAndDateRange(
            @Param("tenantId") Long tenantId, 
            @Param("startDate") LocalDate startDate, 
            @Param("endDate") LocalDate endDate);
    
    /**
     * 根据租户ID和日期查询单日统计
     */
    DailyRevenueStats selectByTenantIdAndDate(@Param("tenantId") Long tenantId, @Param("statDate") LocalDate statDate);
    
    /**
     * 查询指定时间范围内的总收入
     */
    BigDecimal getTotalRevenueByDateRange(@Param("tenantId") Long tenantId, 
                                         @Param("startDate") LocalDate startDate, 
                                         @Param("endDate") LocalDate endDate);
    
    /**
     * 查询指定时间范围内的总订单数
     */
    Integer getTotalOrdersByDateRange(@Param("tenantId") Long tenantId, 
                                     @Param("startDate") LocalDate startDate, 
                                     @Param("endDate") LocalDate endDate);
    
    /**
     * 查询指定时间范围内的总小费
     */
    BigDecimal getTotalTipsByDateRange(@Param("tenantId") Long tenantId, 
                                      @Param("startDate") LocalDate startDate, 
                                      @Param("endDate") LocalDate endDate);
    
    /**
     * 查询指定时间范围内的平均订单价值
     */
    BigDecimal getAvgOrderValueByDateRange(@Param("tenantId") Long tenantId, 
                                          @Param("startDate") LocalDate startDate, 
                                          @Param("endDate") LocalDate endDate);
    
    /**
     * 删除指定租户和时间范围的数据
     */
    void deleteByTenantIdAndDateRange(@Param("tenantId") Long tenantId, 
                                     @Param("startDate") LocalDate startDate, 
                                     @Param("endDate") LocalDate endDate);
}