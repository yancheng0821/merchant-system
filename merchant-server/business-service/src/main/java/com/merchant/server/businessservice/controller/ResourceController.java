package com.merchant.server.businessservice.controller;

import com.merchant.server.businessservice.entity.Resource;
import com.merchant.server.businessservice.entity.ResourceAvailability;
import com.merchant.server.businessservice.dto.ResourceCreateDTO;
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
@RequestMapping("/api/business/resources")
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
     * 创建资源（包含可用性信息）
     */
    @PostMapping("/with-availability")
    public ResponseEntity<Resource> createResourceWithAvailability(@RequestBody ResourceCreateDTO resourceDTO) {
        log.info("Creating resource with availability: {}", resourceDTO.getName());
        
        // 创建资源实体
        Resource resource = new Resource();
        resource.setTenantId(resourceDTO.getTenantId());
        resource.setName(resourceDTO.getName());
        resource.setType(resourceDTO.getType());
        resource.setDescription(resourceDTO.getDescription());
        resource.setCapacity(resourceDTO.getCapacity());
        resource.setLocation(resourceDTO.getLocation());
        resource.setEquipment(resourceDTO.getEquipment());
        resource.setSpecialties(resourceDTO.getSpecialties());
        resource.setHourlyRate(resourceDTO.getHourlyRate());
        resource.setStatus(resourceDTO.getStatus());
        resource.setPhone(resourceDTO.getPhone());
        resource.setEmail(resourceDTO.getEmail());
        resource.setPosition(resourceDTO.getPosition());
        resource.setStartDate(resourceDTO.getStartDate());
        resource.setAvatar(resourceDTO.getAvatar());
        resource.setIcon(resourceDTO.getIcon());
        resource.setCreatedAt(LocalDateTime.now());
        resource.setUpdatedAt(LocalDateTime.now());
        
        // 创建资源
        Resource createdResource = resourceService.createResource(resource);
        
        // 如果有可用性信息，设置可用性
        if (resourceDTO.getAvailabilities() != null && !resourceDTO.getAvailabilities().isEmpty()) {
            List<ResourceAvailability> availabilities = new ArrayList<>();
            
            for (ResourceCreateDTO.ResourceAvailabilityDTO availabilityDTO : resourceDTO.getAvailabilities()) {
                ResourceAvailability availability = new ResourceAvailability();
                availability.setResourceId(createdResource.getId());
                availability.setDayOfWeek(availabilityDTO.getDayOfWeek());
                availability.setStartTime(LocalTime.parse(availabilityDTO.getStartTime()));
                availability.setEndTime(LocalTime.parse(availabilityDTO.getEndTime()));
                availability.setIsAvailable(availabilityDTO.getIsAvailable());
                availability.setCreatedAt(LocalDateTime.now());
                availability.setUpdatedAt(LocalDateTime.now());
                
                availabilities.add(availability);
            }
            
            resourceService.setResourceAvailability(createdResource.getId(), availabilities);
            log.info("Set {} availability records for resource: {}", availabilities.size(), createdResource.getId());
        }
        
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

    /**
     * 检查资源在指定时间段是否已被预约
     */
    @GetMapping("/{resourceId}/booking-slot/check")
    public ResponseEntity<Boolean> checkResourceBookingSlot(
            @PathVariable Long resourceId,
            @RequestParam String date,
            @RequestParam String startTime,
            @RequestParam String endTime) {
        log.info("Checking booking slot for resource: {} on {} from {} to {}", resourceId, date, startTime, endTime);
        
        LocalDate bookingDate = LocalDate.parse(date);
        LocalTime start = LocalTime.parse(startTime);
        LocalTime end = LocalTime.parse(endTime);
        
        boolean isBooked = resourceService.isResourceBookedInTimeSlot(resourceId, bookingDate, start, end);
        return ResponseEntity.ok(isBooked);
    }

    /**
     * 获取资源实时状态
     */
    @GetMapping("/{resourceId}/status")
    public ResponseEntity<ResourceStatusDTO> getResourceStatus(@PathVariable Long resourceId) {
        log.info("Getting real-time status for resource: {}", resourceId);
        
        Resource resource = resourceService.getResourceById(resourceId);
        if (resource == null) {
            return ResponseEntity.notFound().build();
        }

        // 构建状态响应
        ResourceStatusDTO status = new ResourceStatusDTO();
        status.setResourceId(resourceId);
        status.setResourceName(resource.getName());
        status.setResourceType(resource.getType().name());
        status.setStatus(resource.getStatus().name());
        
        // 检查当前时间的可用性
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();
        LocalTime currentTime = now.toLocalTime();
        
        // 获取今天是星期几 (1-7, 1为周一)
        int dayOfWeek = today.getDayOfWeek().getValue();
        
        // 检查当前时间段的可用性
        List<ResourceAvailability> availabilities = resourceService.getResourceAvailability(resourceId);
        boolean isCurrentlyAvailable = availabilities.stream()
            .anyMatch(availability -> 
                availability.getDayOfWeek() == dayOfWeek &&
                availability.getIsAvailable() &&
                !currentTime.isBefore(availability.getStartTime()) &&
                currentTime.isBefore(availability.getEndTime())
            );
        
        status.setCurrentlyAvailable(isCurrentlyAvailable);
        status.setLastUpdated(resource.getUpdatedAt());
        
        return ResponseEntity.ok(status);
    }

    // 资源状态DTO
    public static class ResourceStatusDTO {
        private Long resourceId;
        private String resourceName;
        private String resourceType;
        private String status;
        private boolean currentlyAvailable;
        private LocalDateTime lastUpdated;

        // Getters and Setters
        public Long getResourceId() { return resourceId; }
        public void setResourceId(Long resourceId) { this.resourceId = resourceId; }

        public String getResourceName() { return resourceName; }
        public void setResourceName(String resourceName) { this.resourceName = resourceName; }

        public String getResourceType() { return resourceType; }
        public void setResourceType(String resourceType) { this.resourceType = resourceType; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public boolean isCurrentlyAvailable() { return currentlyAvailable; }
        public void setCurrentlyAvailable(boolean currentlyAvailable) { this.currentlyAvailable = currentlyAvailable; }

        public LocalDateTime getLastUpdated() { return lastUpdated; }
        public void setLastUpdated(LocalDateTime lastUpdated) { this.lastUpdated = lastUpdated; }
    }
}