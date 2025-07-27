package com.merchant.server.businessservice.service.impl;

import com.merchant.server.businessservice.dto.ServiceDTO;
import com.merchant.server.businessservice.dto.ServiceQueryDTO;
import com.merchant.server.businessservice.entity.ServiceCategory;
import com.merchant.server.businessservice.mapper.ServiceMapper;
import com.merchant.server.businessservice.mapper.ServiceCategoryMapper;
import com.merchant.server.businessservice.service.ServiceManagementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;

import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@org.springframework.stereotype.Service
@RequiredArgsConstructor
public class ServiceManagementServiceImpl implements ServiceManagementService {
    
    private final ServiceMapper serviceMapper;
    private final ServiceCategoryMapper serviceCategoryMapper;
    
    @Override
    public List<ServiceDTO> getServices(ServiceQueryDTO queryDTO) {
        List<com.merchant.server.businessservice.entity.Service> services = serviceMapper.selectByConditions(
            queryDTO.getTenantId(),
            queryDTO.getCategoryId(),
            queryDTO.getStatus(),
            queryDTO.getSearchTerm(),
            queryDTO.getOffset(),
            queryDTO.getSize()
        );
        
        return services.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public int countServices(ServiceQueryDTO queryDTO) {
        return serviceMapper.countByConditions(
            queryDTO.getTenantId(),
            queryDTO.getCategoryId(),
            queryDTO.getStatus(),
            queryDTO.getSearchTerm()
        );
    }
    
    @Override
    public ServiceDTO getServiceById(Long id) {
        com.merchant.server.businessservice.entity.Service service = serviceMapper.selectById(id);
        if (service == null) {
            throw new RuntimeException("服务不存在");
        }
        return convertToDTO(service);
    }
    
    @Override
    @Transactional
    public ServiceDTO createService(ServiceDTO serviceDTO) {
        // 检查服务名称是否已存在
        if (serviceMapper.countByTenantIdAndName(serviceDTO.getTenantId(), serviceDTO.getName(), null) > 0) {
            throw new RuntimeException("服务名称已存在");
        }
        
        com.merchant.server.businessservice.entity.Service service = convertToEntity(serviceDTO);
        serviceMapper.insert(service);
        
        return convertToDTO(service);
    }
    
    @Override
    @Transactional
    public ServiceDTO updateService(Long id, ServiceDTO serviceDTO) {
        com.merchant.server.businessservice.entity.Service existingService = serviceMapper.selectById(id);
        if (existingService == null) {
            throw new RuntimeException("服务不存在");
        }
        
        // 检查服务名称是否已存在（排除当前服务）
        if (serviceMapper.countByTenantIdAndName(serviceDTO.getTenantId(), serviceDTO.getName(), id) > 0) {
            throw new RuntimeException("服务名称已存在");
        }
        
        com.merchant.server.businessservice.entity.Service service = convertToEntity(serviceDTO);
        service.setId(id);
        serviceMapper.updateById(service);
        
        return convertToDTO(service);
    }
    
    @Override
    @Transactional
    public void deleteService(Long id) {
        com.merchant.server.businessservice.entity.Service service = serviceMapper.selectById(id);
        if (service == null) {
            throw new RuntimeException("服务不存在");
        }
        
        // TODO: 检查是否有关联的预约记录，如果有则不允许删除
        
        serviceMapper.deleteById(id);
    }
    
    @Override
    public List<ServiceDTO> getServicesByTenantId(Long tenantId) {
        List<com.merchant.server.businessservice.entity.Service> services = serviceMapper.selectByTenantId(tenantId);
        return services.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<ServiceDTO> getServicesByCategoryId(Long tenantId, Long categoryId) {
        List<com.merchant.server.businessservice.entity.Service> services = serviceMapper.selectByTenantIdAndCategoryId(tenantId, categoryId);
        return services.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    private ServiceDTO convertToDTO(com.merchant.server.businessservice.entity.Service service) {
        ServiceDTO dto = new ServiceDTO();
        BeanUtils.copyProperties(service, dto);
        
        // 设置枚举值为字符串
        if (service.getStatus() != null) {
            dto.setStatus(service.getStatus().name());
        }
        if (service.getResourceType() != null) {
            dto.setResourceType(service.getResourceType().name());
        }
        
        // 获取分类信息
        if (service.getCategoryId() != null) {
            ServiceCategory category = serviceCategoryMapper.selectById(service.getCategoryId());
            if (category != null) {
                dto.setCategoryName(category.getName());
                dto.setCategoryIcon(category.getIcon());
                dto.setCategoryColor(category.getColor());
            }
        }
        
        return dto;
    }
    
    private com.merchant.server.businessservice.entity.Service convertToEntity(ServiceDTO dto) {
        com.merchant.server.businessservice.entity.Service service = new com.merchant.server.businessservice.entity.Service();
        BeanUtils.copyProperties(dto, service);
        
        // 设置枚举值
        if (dto.getStatus() != null) {
            service.setStatus(com.merchant.server.businessservice.entity.Service.ServiceStatus.valueOf(dto.getStatus()));
        }
        if (dto.getResourceType() != null) {
            service.setResourceType(com.merchant.server.businessservice.entity.Service.ResourceType.valueOf(dto.getResourceType()));
        }
        
        return service;
    }
}