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
     * 根据租户ID和分类ID查询服务
     */
    List<Service> selectByTenantIdAndCategoryId(@Param("tenantId") Long tenantId, @Param("categoryId") Long categoryId);
    
    /**
     * 根据ID查询服务
     */
    Service selectById(Long id);
    
    /**
     * 插入服务
     */
    int insert(Service service);
    
    /**
     * 更新服务
     */
    int updateById(Service service);
    
    /**
     * 删除服务
     */
    int deleteById(Long id);
    
    /**
     * 检查服务名称是否存在
     */
    int countByTenantIdAndName(@Param("tenantId") Long tenantId, @Param("name") String name, @Param("excludeId") Long excludeId);
    
    /**
     * 分页查询服务（带搜索和筛选）
     */
    List<Service> selectByConditions(@Param("tenantId") Long tenantId, 
                                   @Param("categoryId") Long categoryId,
                                   @Param("status") String status,
                                   @Param("searchTerm") String searchTerm,
                                   @Param("offset") Integer offset,
                                   @Param("limit") Integer limit);
    
    /**
     * 统计服务数量（带搜索和筛选）
     */
    int countByConditions(@Param("tenantId") Long tenantId, 
                         @Param("categoryId") Long categoryId,
                         @Param("status") String status,
                         @Param("searchTerm") String searchTerm);
    
    /**
     * Dashboard 相关查询 - 使用 datetime 范围 (支持时区转换)
     */
    List<java.util.Map<String, Object>> getServiceCategoryStats(@Param("tenantId") Long tenantId, @Param("startDateTime") java.time.LocalDateTime startDateTime, @Param("endDateTime") java.time.LocalDateTime endDateTime);
    List<java.util.Map<String, Object>> getTopServices(@Param("tenantId") Long tenantId, @Param("startDateTime") java.time.LocalDateTime startDateTime, @Param("endDateTime") java.time.LocalDateTime endDateTime, @Param("limit") int limit);
}