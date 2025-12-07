package com.merchant.server.businessservice.mapper;

import com.merchant.server.businessservice.entity.Resource;
import com.merchant.server.businessservice.entity.ResourceAvailability;
import com.merchant.server.businessservice.entity.ResourceBookingSlot;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Mapper
public interface ResourceMapper {
    
    // 资源基本操作
    List<Resource> findByTenantId(@Param("tenantId") Long tenantId);
    
    List<Resource> findByTenantIdAndType(@Param("tenantId") Long tenantId, @Param("type") String type);

    List<Resource> findByTenantIdAndTypeAndStatus(@Param("tenantId") Long tenantId,
                                                   @Param("type") String type,
                                                   @Param("status") String status);

    Resource findById(@Param("id") Long id);
    
    Resource findActiveById(@Param("id") Long id);
    
    void insert(Resource resource);
    
    void update(Resource resource);
    
    void deleteById(@Param("id") Long id);

    // 检查手机号是否已存在
    boolean existsByTenantIdAndPhone(@Param("tenantId") Long tenantId, @Param("phone") String phone);

    // 检查邮箱是否已存在
    boolean existsByTenantIdAndEmail(@Param("tenantId") Long tenantId, @Param("email") String email);

    // 根据租户ID和手机号查询资源
    Resource selectByTenantIdAndPhone(@Param("tenantId") Long tenantId, @Param("phone") String phone);

    // 根据租户ID和邮箱查询资源
    Resource selectByTenantIdAndEmail(@Param("tenantId") Long tenantId, @Param("email") String email);

    // 根据服务查询可用资源
    List<Resource> findAvailableResourcesByService(@Param("serviceId") Long serviceId, @Param("tenantId") Long tenantId);
    
    // 检查资源在指定时间是否可用
    boolean isResourceAvailable(@Param("resourceId") Long resourceId, 
                               @Param("date") LocalDate date, 
                               @Param("startTime") LocalTime startTime, 
                               @Param("endTime") LocalTime endTime);
    
    // 资源可用性操作
    List<ResourceAvailability> findAvailabilitiesByResourceId(@Param("resourceId") Long resourceId);
    
    void insertAvailability(ResourceAvailability availability);
    
    void updateAvailability(ResourceAvailability availability);
    
    void deleteAvailability(@Param("id") Long id);
    
    void deleteAvailabilitiesByResourceId(@Param("resourceId") Long resourceId);
    
    // 资源预约时间段操作
    List<ResourceBookingSlot> findBookingSlotsByResourceId(@Param("resourceId") Long resourceId);
    
    List<ResourceBookingSlot> findBookingSlotsByResourceIdAndDate(@Param("resourceId") Long resourceId, 
                                                                  @Param("bookingDate") LocalDate bookingDate);
    
    void insertBookingSlot(ResourceBookingSlot bookingSlot);
    
    void updateBookingSlot(ResourceBookingSlot bookingSlot);
    
    void deleteBookingSlot(@Param("id") Long id);
    
    void deleteBookingSlotsByAppointmentId(@Param("appointmentId") Long appointmentId);
    
    // 检查资源在指定时间段是否已被预约
    boolean isResourceBookedInTimeSlot(@Param("resourceId") Long resourceId,
                                       @Param("bookingDate") LocalDate bookingDate,
                                       @Param("startTime") LocalTime startTime,
                                       @Param("endTime") LocalTime endTime);

    // 检查资源在指定时间段是否已被预约（排除指定预约）
    boolean isResourceBookedInTimeSlotExcluding(@Param("resourceId") Long resourceId,
                                                @Param("bookingDate") LocalDate bookingDate,
                                                @Param("startTime") LocalTime startTime,
                                                @Param("endTime") LocalTime endTime,
                                                @Param("excludeAppointmentId") Long excludeAppointmentId);

    // ========== 新增：多时间段排班管理 ==========

    /**
     * 根据资源ID和星期几查询可用性记录
     */
    List<ResourceAvailability> findAvailabilitiesByResourceIdAndDay(@Param("resourceId") Long resourceId,
                                                                     @Param("dayOfWeek") Integer dayOfWeek);

    /**
     * 根据ID删除可用性记录
     */
    void deleteAvailabilityById(@Param("id") Long id);

    /**
     * 根据资源ID和星期几删除可用性记录
     */
    void deleteAvailabilitiesByResourceIdAndDay(@Param("resourceId") Long resourceId,
                                                 @Param("dayOfWeek") Integer dayOfWeek);

    /**
     * 获取租户下所有活跃员工资源（用于检查员工数量限制）
     */
    List<Resource> findActiveStaffByTenantId(@Param("tenantId") Long tenantId);
}