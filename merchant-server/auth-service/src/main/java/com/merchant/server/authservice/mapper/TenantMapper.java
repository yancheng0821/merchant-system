package com.merchant.server.authservice.mapper;

import com.merchant.server.authservice.entity.Tenant;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface TenantMapper {
    
    Tenant selectById(Long id);
    
    Tenant selectByTenantCode(String tenantCode);
    
    List<Tenant> selectAll();
    
    List<Tenant> selectByParentTenantId(Long parentTenantId);
    
    int insert(Tenant tenant);
    
    int update(Tenant tenant);
    
    int deleteById(Long id);
    
    boolean existsByTenantCode(String tenantCode);
} 