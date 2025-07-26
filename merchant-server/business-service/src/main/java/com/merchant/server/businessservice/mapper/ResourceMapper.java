package com.merchant.server.businessservice.mapper;

import com.merchant.server.businessservice.entity.Resource;
import com.merchant.server.businessservice.entity.ResourceAvailability;
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
    
    Resource findById(@Param("id") Long id);
    
    Resource findActiveById(@Param("id") Long id);
    
    void insert(Resource resource);
    
    void update(Resource resource);
    
    void deleteById(@Param("id") Long id);
    
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
}