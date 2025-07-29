package com.merchant.server.businessservice.service;

import com.merchant.server.businessservice.entity.Resource;
import com.merchant.server.businessservice.entity.ResourceAvailability;
import com.merchant.server.businessservice.entity.ResourceBookingSlot;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface ResourceService {
    
    /**
     * 获取租户下所有资源
     */
    List<Resource> getAllResourcesByTenantId(Long tenantId);
    
    /**
     * 根据类型获取资源
     */
    List<Resource> getResourcesByType(Long tenantId, String type);
    
    /**
     * 根据服务获取可用资源
     */
    List<Resource> getAvailableResourcesByService(Long serviceId, Long tenantId);
    
    /**
     * 检查资源可用性
     */
    boolean checkResourceAvailability(Long resourceId, LocalDate date, LocalTime startTime, LocalTime endTime);
    
    /**
     * 创建资源
     */
    Resource createResource(Resource resource);
    
    /**
     * 更新资源
     */
    Resource updateResource(Resource resource);
    
    /**
     * 删除资源
     */
    void deleteResource(Long id);
    
    /**
     * 获取资源详情
     */
    Resource getResourceById(Long id);
    
    /**
     * 设置资源可用性
     */
    void setResourceAvailability(Long resourceId, List<ResourceAvailability> availabilities);
    
    /**
     * 获取资源可用性
     */
    List<ResourceAvailability> getResourceAvailability(Long resourceId);
    
    /**
     * 创建预约时间段
     */
    void createBookingSlot(Long resourceId, Long appointmentId, LocalDate bookingDate, LocalTime startTime, LocalTime endTime);
    
    /**
     * 取消预约时间段
     */
    void cancelBookingSlot(Long appointmentId);
    
    /**
     * 检查资源在指定时间段是否已被预约
     */
    boolean isResourceBookedInTimeSlot(Long resourceId, LocalDate bookingDate, LocalTime startTime, LocalTime endTime);
    
    /**
     * 获取资源的预约时间段
     */
    List<ResourceBookingSlot> getResourceBookingSlots(Long resourceId, LocalDate bookingDate);
}