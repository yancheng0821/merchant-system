package com.merchant.server.businessservice.service.impl;

import com.merchant.server.businessservice.entity.Resource;
import com.merchant.server.businessservice.entity.ResourceAvailability;
import com.merchant.server.businessservice.entity.Staff;
import com.merchant.server.businessservice.mapper.ResourceMapper;
import com.merchant.server.businessservice.mapper.StaffMapper;
import com.merchant.server.businessservice.service.ResourceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ResourceServiceImpl implements ResourceService {

    private final ResourceMapper resourceMapper;
    private final StaffMapper staffMapper;

    @Override
    public List<Resource> getAllResourcesByTenantId(Long tenantId) {
        log.info("Getting all resources for tenant: {}", tenantId);
        List<Resource> resources = resourceMapper.findByTenantId(tenantId);
        
        // 为每个资源加载可用性信息
        for (Resource resource : resources) {
            List<ResourceAvailability> availabilities = resourceMapper.findAvailabilitiesByResourceId(resource.getId());
            resource.setAvailabilities(availabilities);
        }
        
        return resources;
    }

    @Override
    public List<Resource> getResourcesByType(Long tenantId, String type) {
        log.info("Getting resources by type: {} for tenant: {}", type, tenantId);
        List<Resource> resources = resourceMapper.findByTenantIdAndType(tenantId, type);
        log.info("Found {} resources of type {} for tenant {}", resources.size(), type, tenantId);
        return resources;
    }

    @Override
    public List<Resource> getAvailableResourcesByService(Long serviceId, Long tenantId) {
        log.info("Getting available resources for service: {} in tenant: {}", serviceId, tenantId);
        return resourceMapper.findAvailableResourcesByService(serviceId, tenantId);
    }

    @Override
    public boolean checkResourceAvailability(Long resourceId, LocalDate date, LocalTime startTime, LocalTime endTime) {
        log.info("Checking availability for resource: {} on {} from {} to {}", resourceId, date, startTime, endTime);
        return resourceMapper.isResourceAvailable(resourceId, date, startTime, endTime);
    }

    @Override
    @Transactional
    public Resource createResource(Resource resource) {
        log.info("Creating resource: {}", resource.getName());
        
        if (resource.getCreatedAt() == null) {
            resource.setCreatedAt(LocalDateTime.now());
        }
        if (resource.getUpdatedAt() == null) {
            resource.setUpdatedAt(LocalDateTime.now());
        }
        
        resourceMapper.insert(resource);
        log.info("Resource created with ID: {}", resource.getId());
        
        return resource;
    }

    @Override
    @Transactional
    public Resource updateResource(Resource resource) {
        log.info("Updating resource: {}", resource.getId());
        resource.setUpdatedAt(LocalDateTime.now());
        resourceMapper.update(resource);
        return resource;
    }

    @Override
    @Transactional
    public void deleteResource(Long id) {
        log.info("Soft deleting resource: {}", id);
        
        // 软删除：将状态设置为DELETED
        Resource resource = resourceMapper.findById(id);
        if (resource != null) {
            resource.setStatus(Resource.ResourceStatus.DELETED);
            resource.setUpdatedAt(LocalDateTime.now());
            resourceMapper.update(resource);
            log.info("Resource {} marked as DELETED", id);
        } else {
            log.warn("Resource {} not found for deletion", id);
        }
    }

    @Override
    public Resource getResourceById(Long id) {
        log.info("Getting resource by id: {}", id);
        Resource resource = resourceMapper.findActiveById(id);
        if (resource != null) {
            List<ResourceAvailability> availabilities = resourceMapper.findAvailabilitiesByResourceId(id);
            resource.setAvailabilities(availabilities);
        }
        return resource;
    }

    @Override
    @Transactional
    public void setResourceAvailability(Long resourceId, List<ResourceAvailability> availabilities) {
        log.info("Setting availability for resource: {}", resourceId);
        
        // 先删除现有的可用性记录
        resourceMapper.deleteAvailabilitiesByResourceId(resourceId);
        
        // 插入新的可用性记录
        for (ResourceAvailability availability : availabilities) {
            availability.setResourceId(resourceId);
            availability.setCreatedAt(LocalDateTime.now());
            availability.setUpdatedAt(LocalDateTime.now());
            resourceMapper.insertAvailability(availability);
        }
    }

    @Override
    public List<ResourceAvailability> getResourceAvailability(Long resourceId) {
        log.info("Getting availability for resource: {}", resourceId);
        return resourceMapper.findAvailabilitiesByResourceId(resourceId);
    }
}