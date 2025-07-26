package com.merchant.server.businessservice.mapper;

import com.merchant.server.businessservice.entity.ServiceCategory;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ServiceCategoryMapper {
    
    /**
     * 根据租户ID查询所有服务分类
     */
    List<ServiceCategory> selectByTenantId(@Param("tenantId") Long tenantId);
    
    /**
     * 根据租户ID和状态查询服务分类
     */
    List<ServiceCategory> selectByTenantIdAndStatus(@Param("tenantId") Long tenantId, @Param("status") String status);
    
    /**
     * 根据ID查询服务分类
     */
    ServiceCategory selectById(Long id);
    
    /**
     * 插入服务分类
     */
    int insert(ServiceCategory serviceCategory);
    
    /**
     * 更新服务分类
     */
    int updateById(ServiceCategory serviceCategory);
    
    /**
     * 删除服务分类
     */
    int deleteById(Long id);
    
    /**
     * 检查分类名称是否存在
     */
    int countByTenantIdAndName(@Param("tenantId") Long tenantId, @Param("name") String name, @Param("excludeId") Long excludeId);
}