package com.merchant.server.merchantservice.service.impl;

import com.merchant.server.merchantservice.entity.TenantUsageStats;
import com.merchant.server.merchantservice.mapper.TenantUsageStatsMapper;
import com.merchant.server.merchantservice.service.TenantUsageStatsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * 租户使用量统计服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TenantUsageStatsServiceImpl implements TenantUsageStatsService {

    private final TenantUsageStatsMapper tenantUsageStatsMapper;

    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM");

    /**
     * 获取当前月份字符串
     */
    private String getCurrentMonth() {
        return LocalDate.now().format(MONTH_FORMATTER);
    }

    @Override
    public TenantUsageStats getCurrentMonthStats(Long tenantId) {
        String currentMonth = getCurrentMonth();
        TenantUsageStats stats = tenantUsageStatsMapper.findByTenantIdAndMonth(tenantId, currentMonth);

        if (stats == null) {
            // 如果没有记录，返回一个空的统计对象
            stats = new TenantUsageStats();
            stats.setTenantId(tenantId);
            stats.setStatMonth(currentMonth);
            stats.setAppointmentCount(0);
            stats.setEmailCount(0);
            stats.setSmsCount(0);
        }

        return stats;
    }

    @Override
    public TenantUsageStats getStatsByMonth(Long tenantId, String statMonth) {
        TenantUsageStats stats = tenantUsageStatsMapper.findByTenantIdAndMonth(tenantId, statMonth);

        if (stats == null) {
            stats = new TenantUsageStats();
            stats.setTenantId(tenantId);
            stats.setStatMonth(statMonth);
            stats.setAppointmentCount(0);
            stats.setEmailCount(0);
            stats.setSmsCount(0);
        }

        return stats;
    }

    @Override
    @Transactional
    public void incrementAppointmentCount(Long tenantId) {
        String currentMonth = getCurrentMonth();
        tenantUsageStatsMapper.incrementAppointmentCount(tenantId, currentMonth);
        log.debug("增加预约计数 - 租户ID: {}, 月份: {}", tenantId, currentMonth);
    }

    @Override
    @Transactional
    public void incrementEmailCount(Long tenantId) {
        String currentMonth = getCurrentMonth();
        tenantUsageStatsMapper.incrementEmailCount(tenantId, currentMonth);
        log.debug("增加邮件计数 - 租户ID: {}, 月份: {}", tenantId, currentMonth);
    }

    @Override
    @Transactional
    public void incrementSmsCount(Long tenantId) {
        String currentMonth = getCurrentMonth();
        tenantUsageStatsMapper.incrementSmsCount(tenantId, currentMonth);
        log.debug("增加短信计数 - 租户ID: {}, 月份: {}", tenantId, currentMonth);
    }
}
