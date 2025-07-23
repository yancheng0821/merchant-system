package com.merchant.server.businessservice.mapper;

import com.merchant.server.businessservice.entity.Service;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ServiceMapper {
    
    /**
     * 根据租户ID查询所有服务
     */
    List<Service> selectByTenantId(@Param("tenantId") Long tenantId);
    
    /**
     * 根据租户ID和状态查询服务
     */
    List<Service> selectByTenantIdAndStatus(@Param("tenantId") Long tenantId, @Param("status") String status);
    
    /**
     * 根据ID查询服务
     */
    Service selectById(Long id);
}