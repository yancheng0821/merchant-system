package com.merchant.server.businessservice.mapper;

import com.merchant.server.businessservice.entity.GoogleBookingSyncEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * Google Booking 同步 Mapper
 */
@Mapper
public interface GoogleBookingSyncMapper {

    /**
     * 插入新的同步记录
     */
    int insert(GoogleBookingSyncEntity entity);

    /**
     * 更新同步记录
     */
    int update(GoogleBookingSyncEntity entity);

    /**
     * 根据 ID 查询
     */
    GoogleBookingSyncEntity findById(@Param("id") Long id);

    /**
     * 根据 Google Booking ID 查询
     */
    GoogleBookingSyncEntity findByGoogleBookingId(@Param("googleBookingId") String googleBookingId);

    /**
     * 根据本地预约ID查询
     */
    GoogleBookingSyncEntity findByAppointmentId(@Param("appointmentId") Long appointmentId);

    /**
     * 根据幂等性令牌查询
     */
    GoogleBookingSyncEntity findByIdempotencyToken(@Param("idempotencyToken") String idempotencyToken);

    /**
     * 根据租户ID查询所有同步记录
     */
    List<GoogleBookingSyncEntity> findByTenantId(@Param("tenantId") Long tenantId);

    /**
     * 根据同步状态查询
     */
    List<GoogleBookingSyncEntity> findBySyncStatus(@Param("syncStatus") String syncStatus);

    /**
     * 删除同步记录
     */
    int deleteById(@Param("id") Long id);
}
