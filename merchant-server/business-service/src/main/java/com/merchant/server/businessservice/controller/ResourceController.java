package com.merchant.server.businessservice.controller;

import com.merchant.server.common.annotation.RequiresPermission;
import com.merchant.server.businessservice.dto.TimeSegmentDTO;
import com.merchant.server.businessservice.dto.WeekAvailabilityDTO;
import com.merchant.server.businessservice.entity.Resource;
import com.merchant.server.businessservice.entity.ResourceAvailability;
import com.merchant.server.businessservice.entity.ResourceBookingSlot;
import com.merchant.server.businessservice.entity.ResourceServiceExpertise;
import com.merchant.server.businessservice.dto.ResourceCreateDTO;
import com.merchant.server.businessservice.service.ResourceService;
import com.merchant.server.businessservice.mapper.ResourceServiceExpertiseMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/business/resources")
@RequiredArgsConstructor
@Slf4j
public class ResourceController {

    private final ResourceService resourceService;
    private final ResourceServiceExpertiseMapper resourceServiceExpertiseMapper;

    /**
     * 获取租户下所有资源
     */
    @RequiresPermission("resources:view")
    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<List<Resource>> getAllResources(@PathVariable Long tenantId) {
        log.info("Getting all resources for tenant: {}", tenantId);
        List<Resource> resources = resourceService.getAllResourcesByTenantId(tenantId);
        return ResponseEntity.ok(resources);
    }

    /**
     * 根据类型获取资源
     */
    @RequiresPermission("resources:view")
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
    @RequiresPermission("resources:view")
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
    @RequiresPermission("resources:create")
    @com.merchant.server.common.annotation.Auditable(resource = "RESOURCE", action = "CREATE", recordOldValue = true, description = "Create new resource (staff/room)")
    @PostMapping
    public ResponseEntity<Resource> createResource(@RequestBody Resource resource) {
        log.info("Creating resource: {}", resource.getName());
        Resource createdResource = resourceService.createResource(resource);
        return ResponseEntity.ok(createdResource);
    }

    /**
     * 创建资源（包含可用性信息）
     */
    @RequiresPermission("resources:create")
    @com.merchant.server.common.annotation.Auditable(resource = "RESOURCE", action = "CREATE", recordOldValue = true, description = "Create new resource with availability schedule")
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
        resource.setCountryCode(resourceDTO.getCountryCode());  // ⭐ 添加countryCode
        resource.setEmail(resourceDTO.getEmail());
        resource.setPosition(resourceDTO.getPosition());
        resource.setStartDate(resourceDTO.getStartDate());
        resource.setAvatar(resourceDTO.getAvatar());
        resource.setIcon(resourceDTO.getIcon());
        resource.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
        resource.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
        
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
                availability.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
                availability.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
                
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
    @RequiresPermission("resources:update")
    @com.merchant.server.common.annotation.Auditable(resource = "RESOURCE", action = "UPDATE", resourceIdParam = "id", recordOldValue = true, description = "Update resource information")
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
    @RequiresPermission("resources:delete")
    @com.merchant.server.common.annotation.Auditable(resource = "RESOURCE", action = "DELETE", resourceIdParam = "id", recordOldValue = true, description = "Delete resource")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResource(@PathVariable Long id) {
        log.info("Deleting resource: {}", id);
        resourceService.deleteResource(id);
        return ResponseEntity.ok().build();
    }

    /**
     * 获取资源详情
     */
    @RequiresPermission("resources:view")
    @GetMapping("/detail/{id}")
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
     * 获取资源的预约时间段
     */
    @GetMapping("/{resourceId}/booking-slots")
    public ResponseEntity<List<ResourceBookingSlot>> getResourceBookingSlots(
            @PathVariable Long resourceId,
            @RequestParam String date) {
        log.info("Getting booking slots for resource: {} on {}", resourceId, date);
        
        LocalDate bookingDate = LocalDate.parse(date);
        List<ResourceBookingSlot> bookingSlots = resourceService.getResourceBookingSlots(resourceId, bookingDate);
        return ResponseEntity.ok(bookingSlots);
    }

    /**
     * 获取资源的详细可用性（包括已预约时间段）
     */
    @GetMapping("/{resourceId}/detailed-availability")
    public ResponseEntity<DetailedAvailabilityDTO> getResourceDetailedAvailability(
            @PathVariable Long resourceId,
            @RequestParam String date) {
        log.info("Getting detailed availability for resource: {} on {}", resourceId, date);
        
        LocalDate queryDate = LocalDate.parse(date);
        
        // 获取基础可用性
        List<ResourceAvailability> availabilities = resourceService.getResourceAvailability(resourceId);
        
        // 获取预约时间段
        List<ResourceBookingSlot> bookingSlots = resourceService.getResourceBookingSlots(resourceId, queryDate);
        
        log.info("Found {} availabilities and {} booking slots for resource {} on {}", 
                availabilities.size(), bookingSlots.size(), resourceId, queryDate);
        
        // 构建详细可用性响应
        DetailedAvailabilityDTO detailedAvailability = new DetailedAvailabilityDTO();
        detailedAvailability.setResourceId(resourceId);
        detailedAvailability.setDate(queryDate);
        detailedAvailability.setAvailabilities(availabilities);
        detailedAvailability.setBookingSlots(bookingSlots);
        
        return ResponseEntity.ok(detailedAvailability);
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
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
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

    // 详细可用性DTO
    public static class DetailedAvailabilityDTO {
        private Long resourceId;
        private LocalDate date;
        private List<ResourceAvailability> availabilities;
        private List<ResourceBookingSlot> bookingSlots;

        // Getters and Setters
        public Long getResourceId() { return resourceId; }
        public void setResourceId(Long resourceId) { this.resourceId = resourceId; }

        public LocalDate getDate() { return date; }
        public void setDate(LocalDate date) { this.date = date; }

        public List<ResourceAvailability> getAvailabilities() { return availabilities; }
        public void setAvailabilities(List<ResourceAvailability> availabilities) { this.availabilities = availabilities; }

        public List<ResourceBookingSlot> getBookingSlots() { return bookingSlots; }
        public void setBookingSlots(List<ResourceBookingSlot> bookingSlots) { this.bookingSlots = bookingSlots; }
    }

    // ========== 员工-服务关联 API ==========

    /**
     * 获取员工的所有服务专长
     */
    @GetMapping("/{resourceId}/services")
    public ResponseEntity<List<ResourceServiceExpertise>> getResourceServices(@PathVariable Long resourceId) {
        log.info("Getting service expertise for resource: {}", resourceId);
        List<ResourceServiceExpertise> expertiseList = resourceServiceExpertiseMapper.findByResourceId(resourceId);
        return ResponseEntity.ok(expertiseList);
    }

    /**
     * 添加员工-服务关联
     */
    @PostMapping("/{resourceId}/services")
    public ResponseEntity<Void> addResourceService(
            @PathVariable Long resourceId,
            @RequestBody ResourceServiceExpertise expertise) {
        log.info("Adding service expertise for resource: {}, service: {}", resourceId, expertise.getServiceId());
        expertise.setResourceId(resourceId);
        expertise.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
        resourceServiceExpertiseMapper.insert(expertise);
        return ResponseEntity.ok().build();
    }

    /**
     * 批量设置员工的服务关联
     */
    @PutMapping("/{resourceId}/services")
    public ResponseEntity<Void> setResourceServices(
            @PathVariable Long resourceId,
            @RequestBody List<ResourceServiceExpertise> expertiseList) {
        log.info("Setting {} service expertise records for resource: {}", expertiseList.size(), resourceId);

        // 先删除现有的关联
        resourceServiceExpertiseMapper.deleteByResourceId(resourceId);

        // 添加新的关联
        for (ResourceServiceExpertise expertise : expertiseList) {
            expertise.setResourceId(resourceId);
            expertise.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
            resourceServiceExpertiseMapper.insert(expertise);
        }

        return ResponseEntity.ok().build();
    }

    /**
     * 删除员工-服务关联
     */
    @DeleteMapping("/{resourceId}/services/{serviceId}")
    public ResponseEntity<Void> deleteResourceService(
            @PathVariable Long resourceId,
            @PathVariable Long serviceId) {
        log.info("Deleting service expertise for resource: {}, service: {}", resourceId, serviceId);
        resourceServiceExpertiseMapper.deleteByResourceIdAndServiceId(resourceId, serviceId);
        return ResponseEntity.ok().build();
    }

    /**
     * 获取提供某个服务的所有员工
     */
    @GetMapping("/service/{serviceId}")
    public ResponseEntity<List<Resource>> getResourcesByService(@PathVariable Long serviceId) {
        log.info("Getting resources that provide service: {}", serviceId);
        List<ResourceServiceExpertise> expertiseList = resourceServiceExpertiseMapper.findByServiceId(serviceId);

        List<Resource> resources = new ArrayList<>();
        for (ResourceServiceExpertise expertise : expertiseList) {
            Resource resource = resourceService.getResourceById(expertise.getResourceId());
            if (resource != null && resource.getStatus() == Resource.ResourceStatus.ACTIVE) {
                resources.add(resource);
            }
        }

        return ResponseEntity.ok(resources);
    }

    // ========== 新增：多时间段排班管理API ==========

    /**
     * 获取资源的每周可用性（支持多时间段）
     * GET /api/business/resources/{resourceId}/availability/week
     */
    @GetMapping("/{resourceId}/availability/week")
    public ResponseEntity<WeekAvailabilityDTO> getWeekAvailability(@PathVariable Long resourceId) {
        log.info("Getting week availability for resource: {}", resourceId);
        WeekAvailabilityDTO weekAvailability = resourceService.getWeekAvailability(resourceId);
        return ResponseEntity.ok(weekAvailability);
    }

    /**
     * 更新资源的每周可用性（支持多时间段）
     * PUT /api/business/resources/{resourceId}/availability/week
     */
    @com.merchant.server.common.annotation.Auditable(resource = "RESOURCE_SCHEDULE", action = "UPDATE", resourceIdParam = "resourceId", recordOldValue = true, description = "Update resource weekly schedule")
    @PutMapping("/{resourceId}/availability/week")
    public ResponseEntity<WeekAvailabilityDTO> updateWeekAvailability(
            @PathVariable Long resourceId,
            @RequestBody WeekAvailabilityDTO weekAvailability) {
        log.info("Updating week availability for resource: {}", resourceId);
        resourceService.updateWeekAvailability(resourceId, weekAvailability);
        // 返回更新后的排班信息
        WeekAvailabilityDTO updated = resourceService.getWeekAvailability(resourceId);
        return ResponseEntity.ok(updated);
    }

    /**
     * 为某一天添加新的时间段
     * POST /api/business/resources/{resourceId}/availability/day/{dayOfWeek}/segment
     */
    @PostMapping("/{resourceId}/availability/day/{dayOfWeek}/segment")
    public ResponseEntity<ResourceAvailability> addTimeSegment(
            @PathVariable Long resourceId,
            @PathVariable Integer dayOfWeek,
            @RequestBody TimeSegmentDTO segment) {
        log.info("Adding time segment for resource: {}, day: {}", resourceId, dayOfWeek);
        ResourceAvailability created = resourceService.addTimeSegment(resourceId, dayOfWeek, segment);
        return ResponseEntity.ok(created);
    }

    /**
     * 删除某个时间段
     * DELETE /api/business/resources/availability/{availabilityId}
     */
    @DeleteMapping("/availability/{availabilityId}")
    public ResponseEntity<Void> deleteTimeSegment(@PathVariable Long availabilityId) {
        log.info("Deleting time segment: {}", availabilityId);
        resourceService.deleteTimeSegment(availabilityId);
        return ResponseEntity.ok().build();
    }

    /**
     * 复制某一天的排班到其他天
     * POST /api/business/resources/{resourceId}/availability/copy
     */
    @PostMapping("/{resourceId}/availability/copy")
    public ResponseEntity<Void> copyDayAvailability(
            @PathVariable Long resourceId,
            @RequestParam Integer sourceDayOfWeek,
            @RequestParam List<Integer> targetDaysOfWeek) {
        log.info("Copying day availability from day {} to days {} for resource: {}",
                sourceDayOfWeek, targetDaysOfWeek, resourceId);
        resourceService.copyDayAvailability(resourceId, sourceDayOfWeek, targetDaysOfWeek);
        return ResponseEntity.ok().build();
    }

}