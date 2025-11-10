package com.merchant.server.businessservice.mapper;

import com.merchant.server.businessservice.entity.CustomerPackageUsageLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 客户套餐使用记录Mapper接口
 */
@Mapper
public interface CustomerPackageUsageLogMapper {

    /**
     * 插入使用记录
     */
    int insert(CustomerPackageUsageLog log);

    /**
     * 根据ID查询
     */
    CustomerPackageUsageLog selectById(@Param("id") Long id);

    /**
     * 根据客户ID查询使用记录
     */
    List<CustomerPackageUsageLog> selectByCustomerId(
        @Param("tenantId") Long tenantId,
        @Param("customerId") Long customerId
    );

    /**
     * 根据客户套餐ID查询使用记录
     */
    List<CustomerPackageUsageLog> selectByCustomerPackageId(
        @Param("customerPackageId") Long customerPackageId
    );

    /**
     * 根据预约ID查询使用记录
     */
    List<CustomerPackageUsageLog> selectByAppointmentId(
        @Param("appointmentId") Long appointmentId
    );

    /**
     * 查询指定时间范围内的使用记录
     */
    List<CustomerPackageUsageLog> selectByDateRange(
        @Param("tenantId") Long tenantId,
        @Param("customerId") Long customerId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    /**
     * 统计客户的总使用次数
     */
    Integer countByCustomerId(
        @Param("tenantId") Long tenantId,
        @Param("customerId") Long customerId
    );

    /**
     * 统计套餐的总使用次数
     */
    Integer countByPackageId(
        @Param("tenantId") Long tenantId,
        @Param("packageId") Long packageId
    );
}
