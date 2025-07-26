package com.merchant.server.businessservice.service.impl;

import com.merchant.server.businessservice.dto.ServiceCategoryDTO;
import com.merchant.server.businessservice.entity.ServiceCategory;
import com.merchant.server.businessservice.mapper.ServiceCategoryMapper;
import com.merchant.server.businessservice.mapper.ServiceMapper;
import com.merchant.server.businessservice.service.ServiceCategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ServiceCategoryServiceImpl implements ServiceCategoryService {
    
    private final ServiceCategoryMapper serviceCategoryMapper;
    private final ServiceMapper serviceMapper;
    
    @Override
    public List<ServiceCategoryDTO> getCategoriesByTenantId(Long tenantId) {
        List<ServiceCategory> categories = serviceCategoryMapper.selectByTenantId(tenantId);
        return categories.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<ServiceCategoryDTO> getCategoriesByTenantIdAndStatus(Long tenantId, String status) {
        List<ServiceCategory> categories = serviceCategoryMapper.selectByTenantIdAndStatus(tenantId, status);
        return categories.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public ServiceCategoryDTO getCategoryById(Long id) {
        ServiceCategory category = serviceCategoryMapper.selectById(id);
        if (category == null) {
            throw new RuntimeException("分类不存在");
        }
        return convertToDTO(category);
    }
    
    @Override
    @Transactional
    public ServiceCategoryDTO createCategory(ServiceCategoryDTO categoryDTO) {
        // 检查分类名称是否已存在
        if (existsByName(categoryDTO.getTenantId(), categoryDTO.getName(), null)) {
            throw new RuntimeException("分类名称已存在");
        }
        
        ServiceCategory category = convertToEntity(categoryDTO);
        serviceCategoryMapper.insert(category);
        
        return convertToDTO(category);
    }
    
    @Override
    @Transactional
    public ServiceCategoryDTO updateCategory(Long id, ServiceCategoryDTO categoryDTO) {
        ServiceCategory existingCategory = serviceCategoryMapper.selectById(id);
        if (existingCategory == null) {
            throw new RuntimeException("分类不存在");
        }
        
        // 检查分类名称是否已存在（排除当前分类）
        if (existsByName(categoryDTO.getTenantId(), categoryDTO.getName(), id)) {
            throw new RuntimeException("分类名称已存在");
        }
        
        ServiceCategory category = convertToEntity(categoryDTO);
        category.setId(id);
        serviceCategoryMapper.updateById(category);
        
        return convertToDTO(category);
    }
    
    @Override
    @Transactional
    public void deleteCategory(Long id) {
        ServiceCategory category = serviceCategoryMapper.selectById(id);
        if (category == null) {
            throw new RuntimeException("分类不存在");
        }
        
        // 检查是否有关联的服务
        List<com.merchant.server.businessservice.entity.Service> services = 
            serviceMapper.selectByTenantIdAndCategoryId(category.getTenantId(), id);
        if (!services.isEmpty()) {
            throw new RuntimeException("该分类下还有服务，无法删除");
        }
        
        serviceCategoryMapper.deleteById(id);
    }
    
    @Override
    public boolean existsByName(Long tenantId, String name, Long excludeId) {
        return serviceCategoryMapper.countByTenantIdAndName(tenantId, name, excludeId) > 0;
    }
    
    private ServiceCategoryDTO convertToDTO(ServiceCategory category) {
        ServiceCategoryDTO dto = new ServiceCategoryDTO();
        BeanUtils.copyProperties(category, dto);
        
        // 设置枚举值为字符串
        if (category.getStatus() != null) {
            dto.setStatus(category.getStatus().name());
        }
        
        // 统计该分类下的服务数量
        List<com.merchant.server.businessservice.entity.Service> services = 
            serviceMapper.selectByTenantIdAndCategoryId(category.getTenantId(), category.getId());
        dto.setServiceCount(services.size());
        
        return dto;
    }
    
    private ServiceCategory convertToEntity(ServiceCategoryDTO dto) {
        ServiceCategory category = new ServiceCategory();
        BeanUtils.copyProperties(dto, category);
        
        // 设置枚举值
        if (dto.getStatus() != null) {
            category.setStatus(ServiceCategory.CategoryStatus.valueOf(dto.getStatus()));
        }
        
        return category;
    }
}