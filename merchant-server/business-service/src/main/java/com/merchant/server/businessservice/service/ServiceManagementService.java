package com.merchant.server.businessservice.service;

import com.merchant.server.businessservice.dto.ServiceDTO;
import com.merchant.server.businessservice.dto.ServiceQueryDTO;

import java.util.List;

public interface ServiceManagementService {
    
    /**
     * 分页查询服务
     */
    List<ServiceDTO> getServices(ServiceQueryDTO queryDTO);
    
    /**
     * 统计服务数量
     */
    int countServices(ServiceQueryDTO queryDTO);
    
    /**
     * 根据ID获取服务详情
     */
    ServiceDTO getServiceById(Long id);
    
    /**
     * 创建服务
     */
    ServiceDTO createService(ServiceDTO serviceDTO);
    
    /**
     * 更新服务
     */
    ServiceDTO updateService(Long id, ServiceDTO serviceDTO);
    
    /**
     * 删除服务
     */
    void deleteService(Long id);
    
    /**
     * 根据租户ID获取所有服务
     */
    List<ServiceDTO> getServicesByTenantId(Long tenantId);
    
    /**
     * 根据分类ID获取服务
     */
    List<ServiceDTO> getServicesByCategoryId(Long tenantId, Long categoryId);
}