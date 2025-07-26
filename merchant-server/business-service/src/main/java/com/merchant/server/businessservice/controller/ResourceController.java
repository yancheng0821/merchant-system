package com.merchant.server.businessservice.controller;

import com.merchant.server.businessservice.entity.Resource;
import com.merchant.server.businessservice.entity.ResourceAvailability;
import com.merchant.server.businessservice.service.ResourceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
@Slf4j
public class ResourceController {

    private final ResourceService resourceService;

    /**
     * 获取租户下所有资源
     */
    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<List<Resource>> getAllResources(@PathVariable Long tenantId) {
        log.info("Getting all resources for tenant: {}", tenantId);
        List<Resource> resources = resourceService.getAllResourcesByTenantId(tenantId);
        return ResponseEntity.ok(resources);
    }

    /**
     * 根据类型获取资源
     */
    @GetMapping("/tenant/{tenantId}/type/{type}")
    public ResponseEntity<List<Resource>> getResourcesByType(
            @PathVariable Long tenantId,
            @PathVariable String type) {
        log.info("Getting resources by type: {} for tenant: {}", type, tenantId);
        try {
            List<Resource> resources = resourceService.getResourcesByType(tenantId, type);
            log.info("Successfully retrieved {} resources", resources.size());
            return ResponseEntity.ok(resources);
        } catch (Exception e) {
            log.error("Error getting resources by type", e);
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    /**
     * 根据服务获取可用资源
     */
    @GetMapping("/service/{serviceId}/tenant/{tenantId}")
    public ResponseEntity<List<Resource>> getAvailableResourcesByService(
            @PathVariable Long serviceId,
            @PathVariable Long tenantId) {
        log.info("Getting available resources for service: {} in tenant: {}", serviceId, tenantId);
        List<Resource> resources = resourceService.getAvailableResourcesByService(serviceId, tenantId);
        return ResponseEntity.ok(resources);
    }

    /**
     * 检查资源可用性
     */
    @GetMapping("/{resourceId}/availability/check")
    public ResponseEntity<Boolean> checkResourceAvailability(
            @PathVariable Long resourceId,
            @RequestParam String date,
            @RequestParam String startTime,
            @RequestParam String endTime) {
        log.info("Checking availability for resource: {} on {} from {} to {}", resourceId, date, startTime, endTime);
        
        LocalDate appointmentDate = LocalDate.parse(date);
        LocalTime start = LocalTime.parse(startTime);
        LocalTime end = LocalTime.parse(endTime);
        
        boolean available = resourceService.checkResourceAvailability(resourceId, appointmentDate, start, end);
        return ResponseEntity.ok(available);
    }

    /**
     * 创建资源
     */
    @PostMapping
    public ResponseEntity<Resource> createResource(@RequestBody Resource resource) {
        log.info("Creating resource: {}", resource.getName());
        Resource createdResource = resourceService.createResource(resource);
        return ResponseEntity.ok(createdResource);
    }

    /**
     * 更新资源
     */
    @PutMapping("/{id}")
    public ResponseEntity<Resource> updateResource(
            @PathVariable Long id,
            @RequestBody Resource resource) {
        log.info("Updating resource: {}", id);
        resource.setId(id);
        Resource updatedResource = resourceService.updateResource(resource);
        return ResponseEntity.ok(updatedResource);
    }

    /**
     * 删除资源
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResource(@PathVariable Long id) {
        log.info("Deleting resource: {}", id);
        resourceService.deleteResource(id);
        return ResponseEntity.ok().build();
    }

    /**
     * 获取资源详情
     */
    @GetMapping("/{id}")
    public ResponseEntity<Resource> getResourceById(@PathVariable Long id) {
        log.info("Getting resource by id: {}", id);
        Resource resource = resourceService.getResourceById(id);
        if (resource != null) {
            return ResponseEntity.ok(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }



    /**
     * 设置资源可用性
     */
    @PostMapping("/{resourceId}/availability")
    public ResponseEntity<Void> setResourceAvailability(
            @PathVariable Long resourceId,
            @RequestBody List<ResourceAvailability> availabilities) {
        log.info("Setting availability for resource: {}", resourceId);
        resourceService.setResourceAvailability(resourceId, availabilities);
        return ResponseEntity.ok().build();
    }

    /**
     * 获取资源可用性
     */
    @GetMapping("/{resourceId}/availability")
    public ResponseEntity<List<ResourceAvailability>> getResourceAvailability(@PathVariable Long resourceId) {
        log.info("Getting availability for resource: {}", resourceId);
        List<ResourceAvailability> availabilities = resourceService.getResourceAvailability(resourceId);
        return ResponseEntity.ok(availabilities);
    }
}