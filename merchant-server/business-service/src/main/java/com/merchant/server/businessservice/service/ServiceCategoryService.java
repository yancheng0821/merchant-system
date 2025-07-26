package com.merchant.server.businessservice.service;

import com.merchant.server.businessservice.dto.ServiceCategoryDTO;
import com.merchant.server.businessservice.entity.ServiceCategory;

import java.util.List;

public interface ServiceCategoryService {
    
    /**
     * 根据租户ID获取所有分类
     */
    List<ServiceCategoryDTO> getCategoriesByTenantId(Long tenantId);
    
    /**
     * 根据租户ID和状态获取分类
     */
    List<ServiceCategoryDTO> getCategoriesByTenantIdAndStatus(Long tenantId, String status);
    
    /**
     * 根据ID获取分类详情
     */
    ServiceCategoryDTO getCategoryById(Long id);
    
    /**
     * 创建分类
     */
    ServiceCategoryDTO createCategory(ServiceCategoryDTO categoryDTO);
    
    /**
     * 更新分类
     */
    ServiceCategoryDTO updateCategory(Long id, ServiceCategoryDTO categoryDTO);
    
    /**
     * 删除分类
     */
    void deleteCategory(Long id);
    
    /**
     * 检查分类名称是否存在
     */
    boolean existsByName(Long tenantId, String name, Long excludeId);
}