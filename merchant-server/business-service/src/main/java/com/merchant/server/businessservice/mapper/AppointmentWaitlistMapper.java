package com.merchant.server.businessservice.mapper;

import com.merchant.server.businessservice.entity.AppointmentWaitlist;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface AppointmentWaitlistMapper {

    /**
     * 根据ID查询候补
     */
    AppointmentWaitlist findById(@Param("id") Long id);

    /**
     * 根据租户ID查询所有活跃候补
     */
    List<AppointmentWaitlist> findActiveByTenantId(@Param("tenantId") Long tenantId);

    /**
     * 根据客户ID查询候补
     */
    List<AppointmentWaitlist> findByCustomerId(@Param("customerId") Long customerId);

    /**
     * 根据服务ID查询候补
     */
    List<AppointmentWaitlist> findByServiceId(@Param("serviceId") Long serviceId);

    /**
     * 查询指定日期范围内的候补
     */
    List<AppointmentWaitlist> findByDateRange(
        @Param("tenantId") Long tenantId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    /**
     * 查询匹配指定条件的候补(用于自动匹配)
     */
    List<AppointmentWaitlist> findMatchingWaitlist(
        @Param("tenantId") Long tenantId,
        @Param("serviceId") Long serviceId,
        @Param("date") LocalDate date,
        @Param("resourceId") Long resourceId
    );

    /**
     * 插入候补记录
     */
    void insert(AppointmentWaitlist waitlist);

    /**
     * 更新候补记录
     */
    void update(AppointmentWaitlist waitlist);

    /**
     * 删除候补记录
     */
    void deleteById(@Param("id") Long id);

    /**
     * 更新过期候补的状态
     */
    void updateExpiredWaitlists();
}
