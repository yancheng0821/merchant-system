package com.merchant.server.businessservice.service;

import com.merchant.server.businessservice.entity.CustomerPackageUsageLog;
import com.merchant.server.businessservice.mapper.CustomerPackageUsageLogMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

/**
 * 客户套餐使用记录服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerPackageUsageLogService {

    private final CustomerPackageUsageLogMapper usageLogMapper;

    /**
     * 记录套餐使用
     */
    @Transactional
    public void logPackageUsage(CustomerPackageUsageLog usageLog) {
        if (usageLog.getUsageDate() == null) {
            usageLog.setUsageDate(LocalDateTime.now(ZoneOffset.UTC));
        }
        if (usageLog.getCreatedAt() == null) {
            usageLog.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
        }

        usageLogMapper.insert(usageLog);
        log.info("Package usage logged - customer: {}, package: {}, service: {}",
                usageLog.getCustomerId(), usageLog.getCustomerPackageId(), usageLog.getServiceId());
    }

    /**
     * 获取客户的套餐使用记录
     */
    public List<CustomerPackageUsageLog> getCustomerUsageLogs(Long tenantId, Long customerId) {
        return usageLogMapper.selectByCustomerId(tenantId, customerId);
    }

    /**
     * 获取指定套餐的使用记录
     */
    public List<CustomerPackageUsageLog> getPackageUsageLogs(Long customerPackageId) {
        return usageLogMapper.selectByCustomerPackageId(customerPackageId);
    }

    /**
     * 获取预约相关的套餐使用记录
     */
    public List<CustomerPackageUsageLog> getAppointmentUsageLogs(Long appointmentId) {
        return usageLogMapper.selectByAppointmentId(appointmentId);
    }

    /**
     * 获取指定时间范围的使用记录
     */
    public List<CustomerPackageUsageLog> getUsageLogsByDateRange(
            Long tenantId,
            Long customerId,
            LocalDateTime startDate,
            LocalDateTime endDate) {
        return usageLogMapper.selectByDateRange(tenantId, customerId, startDate, endDate);
    }

    /**
     * 统计客户总使用次数
     */
    public Integer countCustomerUsage(Long tenantId, Long customerId) {
        return usageLogMapper.countByCustomerId(tenantId, customerId);
    }

    /**
     * 统计套餐总使用次数
     */
    public Integer countPackageUsage(Long tenantId, Long packageId) {
        return usageLogMapper.countByPackageId(tenantId, packageId);
    }
}
