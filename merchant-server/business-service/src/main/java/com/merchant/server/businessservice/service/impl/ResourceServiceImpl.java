package com.merchant.server.businessservice.service.impl;

import com.merchant.server.businessservice.client.MerchantServiceClient;
import com.merchant.server.businessservice.dto.DayAvailabilityDTO;
import com.merchant.server.businessservice.dto.TimeSegmentDTO;
import com.merchant.server.businessservice.dto.WeekAvailabilityDTO;
import com.merchant.server.businessservice.entity.Resource;
import com.merchant.server.businessservice.entity.ResourceAvailability;
import com.merchant.server.businessservice.entity.ResourceBookingSlot;
import com.merchant.server.businessservice.entity.Staff;
import com.merchant.server.businessservice.mapper.ResourceMapper;
import com.merchant.server.businessservice.mapper.StaffMapper;
import com.merchant.server.businessservice.service.ResourceService;
import com.merchant.server.businessservice.util.MessageUtil;
import com.merchant.server.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ResourceServiceImpl implements ResourceService {

    private final ResourceMapper resourceMapper;
    private final StaffMapper staffMapper;
    private final MessageUtil messageUtil;
    private final MerchantServiceClient merchantServiceClient;

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

        // 如果是创建员工资源，检查员工数量限制
        if (resource.getType() == Resource.ResourceType.STAFF) {
            checkStaffLimit(resource.getTenantId());
        }

        // 检查手机号是否已存在
        if (StringUtils.hasText(resource.getPhone())) {
            if (resourceMapper.existsByTenantIdAndPhone(resource.getTenantId(), resource.getPhone())) {
                log.warn("Phone number {} already exists for tenant {}", resource.getPhone(), resource.getTenantId());
                throw new RuntimeException(messageUtil.getMessage("staff.phone.exists"));
            }
        }

        // 检查邮箱是否已存在
        if (StringUtils.hasText(resource.getEmail())) {
            if (resourceMapper.existsByTenantIdAndEmail(resource.getTenantId(), resource.getEmail())) {
                log.warn("Email {} already exists for tenant {}", resource.getEmail(), resource.getTenantId());
                throw new RuntimeException(messageUtil.getMessage("staff.email.exists"));
            }
        }

        if (resource.getCreatedAt() == null) {
            resource.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
        }
        if (resource.getUpdatedAt() == null) {
            resource.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
        }

        resourceMapper.insert(resource);
        log.info("Resource created with ID: {}", resource.getId());

        return resource;
    }

    /**
     * 检查员工数量限制
     */
    private void checkStaffLimit(Long tenantId) {
        try {
            // 获取租户的员工数量限制
            ApiResponse<Integer> response = merchantServiceClient.getTenantMaxStaff(tenantId);
            if (response == null || !response.isSuccess()) {
                log.warn("Failed to get max staff limit for tenant {}, allowing creation", tenantId);
                return;
            }

            Integer maxStaff = response.getData();
            if (maxStaff == null || maxStaff == -1) {
                // -1 表示无限制
                log.info("Tenant {} has unlimited staff quota", tenantId);
                return;
            }

            // 获取当前员工数量（所有非删除状态）
            List<Resource> allStaff = resourceMapper.findActiveStaffByTenantId(tenantId);
            int currentStaffCount = allStaff.size();

            log.info("Tenant {} has {}/{} staff", tenantId, currentStaffCount, maxStaff);

            if (currentStaffCount >= maxStaff) {
                log.warn("Tenant {} has reached staff limit ({}/{})", tenantId, currentStaffCount, maxStaff);
                throw new RuntimeException(messageUtil.getMessage("staff.limit.reached"));
            }
        } catch (RuntimeException e) {
            // 如果是我们抛出的限制异常，继续抛出
            if (e.getMessage() != null && e.getMessage().contains(messageUtil.getMessage("staff.limit.reached"))) {
                throw e;
            }
            // 其他异常（如网络错误），记录日志但允许继续创建
            log.error("Error checking staff limit for tenant {}, allowing creation", tenantId, e);
        }
    }

    @Override
    @Transactional
    public Resource updateResource(Resource resource) {
        log.info("Updating resource: {}", resource.getId());

        // 检查手机号是否已被其他资源使用
        if (StringUtils.hasText(resource.getPhone())) {
            Resource existingByPhone = resourceMapper.selectByTenantIdAndPhone(resource.getTenantId(), resource.getPhone());
            if (existingByPhone != null && !existingByPhone.getId().equals(resource.getId())) {
                log.warn("Phone number {} already exists for tenant {} (resource {})",
                    resource.getPhone(), resource.getTenantId(), existingByPhone.getId());
                throw new RuntimeException(messageUtil.getMessage("staff.phone.exists"));
            }
        }

        // 检查邮箱是否已被其他资源使用
        if (StringUtils.hasText(resource.getEmail())) {
            Resource existingByEmail = resourceMapper.selectByTenantIdAndEmail(resource.getTenantId(), resource.getEmail());
            if (existingByEmail != null && !existingByEmail.getId().equals(resource.getId())) {
                log.warn("Email {} already exists for tenant {} (resource {})",
                    resource.getEmail(), resource.getTenantId(), existingByEmail.getId());
                throw new RuntimeException(messageUtil.getMessage("staff.email.exists"));
            }
        }

        resource.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
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
            resource.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
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
            
            // 如果结束时间是00:00:00（午夜），转换为23:59:00
            if (availability.getEndTime() != null && availability.getEndTime().equals(LocalTime.MIDNIGHT)) {
                availability.setEndTime(LocalTime.of(23, 59, 0));
                log.info("Converted end time from 00:00:00 to 23:59:00 for resource {} on day {}", 
                    resourceId, availability.getDayOfWeek());
            }
            
            availability.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
            availability.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
            resourceMapper.insertAvailability(availability);
        }
    }

    @Override
    public List<ResourceAvailability> getResourceAvailability(Long resourceId) {
        log.info("Getting availability for resource: {}", resourceId);
        return resourceMapper.findAvailabilitiesByResourceId(resourceId);
    }

    @Override
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.MANDATORY)
    public void createBookingSlot(Long resourceId, Long appointmentId, LocalDate bookingDate, LocalTime startTime, LocalTime endTime) {
        log.info("Creating booking slot for resource: {} on {} from {} to {} for appointment: {}",
            resourceId, bookingDate, startTime, endTime, appointmentId);

        // 检查时间段是否已被预约（排除当前预约自己）
        if (isResourceBookedInTimeSlotExcluding(resourceId, bookingDate, startTime, endTime, appointmentId)) {
            throw new RuntimeException(messageUtil.getMessage("error.resource.timeslot.already.booked"));
        }

        ResourceBookingSlot bookingSlot = new ResourceBookingSlot();
        bookingSlot.setResourceId(resourceId);
        bookingSlot.setAppointmentId(appointmentId);
        bookingSlot.setBookingDate(bookingDate);
        bookingSlot.setStartTime(startTime);
        bookingSlot.setEndTime(endTime);
        bookingSlot.setStatus(ResourceBookingSlot.BookingStatus.BOOKED);
        bookingSlot.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
        bookingSlot.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));

        resourceMapper.insertBookingSlot(bookingSlot);
        log.info("Booking slot created with ID: {} for appointment: {}", bookingSlot.getId(), appointmentId);
    }

    @Override
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.MANDATORY)
    public void cancelBookingSlot(Long appointmentId) {
        log.info("Cancelling booking slots for appointment: {}", appointmentId);
        resourceMapper.deleteBookingSlotsByAppointmentId(appointmentId);
    }

    @Override
    public boolean isResourceBookedInTimeSlot(Long resourceId, LocalDate bookingDate, LocalTime startTime, LocalTime endTime) {
        log.info("Checking if resource: {} is booked on {} from {} to {}", resourceId, bookingDate, startTime, endTime);
        return resourceMapper.isResourceBookedInTimeSlot(resourceId, bookingDate, startTime, endTime);
    }

    // 辅助方法：检查时间段是否已被预约（排除指定的预约）
    private boolean isResourceBookedInTimeSlotExcluding(Long resourceId, LocalDate bookingDate,
                                                        LocalTime startTime, LocalTime endTime,
                                                        Long excludeAppointmentId) {
        log.info("Checking if resource: {} is booked on {} from {} to {} (excluding appointment: {})",
            resourceId, bookingDate, startTime, endTime, excludeAppointmentId);
        return resourceMapper.isResourceBookedInTimeSlotExcluding(resourceId, bookingDate, startTime, endTime, excludeAppointmentId);
    }

    @Override
    public List<ResourceBookingSlot> getResourceBookingSlots(Long resourceId, LocalDate bookingDate) {
        log.info("Getting booking slots for resource: {} on {}", resourceId, bookingDate);
        return resourceMapper.findBookingSlotsByResourceIdAndDate(resourceId, bookingDate);
    }

    // ========== 新增：多时间段排班管理实现 ==========

    @Override
    public WeekAvailabilityDTO getWeekAvailability(Long resourceId) {
        log.info("Getting week availability for resource: {}", resourceId);

        // 获取资源信息
        Resource resource = resourceMapper.findById(resourceId);

        // 获取所有可用性记录并按天和时间段排序
        List<ResourceAvailability> availabilities = resourceMapper.findAvailabilitiesByResourceId(resourceId);
        availabilities.sort(Comparator
            .comparing(ResourceAvailability::getDayOfWeek)
            .thenComparing(ResourceAvailability::getSegmentOrder));

        // 按天分组
        Map<Integer, List<ResourceAvailability>> groupedByDay = availabilities.stream()
            .collect(Collectors.groupingBy(ResourceAvailability::getDayOfWeek));

        // 构建返回对象
        WeekAvailabilityDTO result = new WeekAvailabilityDTO();
        result.setResourceId(resourceId);
        result.setResourceName(resource != null ? resource.getName() : "");

        List<DayAvailabilityDTO> weekDays = new ArrayList<>();
        for (int day = 1; day <= 7; day++) {
            DayAvailabilityDTO dayDTO = new DayAvailabilityDTO();
            dayDTO.setDayOfWeek(day);
            dayDTO.setDayName(getDayName(day));

            List<ResourceAvailability> daySegments = groupedByDay.getOrDefault(day, new ArrayList<>());
            List<TimeSegmentDTO> segments = daySegments.stream()
                .filter(ResourceAvailability::getIsAvailable)
                .map(this::toTimeSegmentDTO)
                .collect(Collectors.toList());

            dayDTO.setSegments(segments);
            weekDays.add(dayDTO);
        }

        result.setWeekDays(weekDays);
        return result;
    }

    @Override
    @Transactional
    public void updateWeekAvailability(Long resourceId, WeekAvailabilityDTO weekAvailability) {
        log.info("Updating week availability for resource: {}", resourceId);

        // 验证时间段是否有重叠
        validateTimeSegments(weekAvailability);

        // 删除该资源现有的所有可用性记录
        resourceMapper.deleteAvailabilitiesByResourceId(resourceId);

        // 插入新的可用性记录
        for (DayAvailabilityDTO day : weekAvailability.getWeekDays()) {
            List<TimeSegmentDTO> segments = day.getSegments();
            if (segments == null || segments.isEmpty()) {
                continue;
            }

            log.info("Processing day {} with {} segments", day.getDayOfWeek(), segments.size());

            // 按开始时间排序segments，确保segmentOrder正确
            segments.sort((a, b) -> a.getStartTime().compareTo(b.getStartTime()));

            for (int i = 0; i < segments.size(); i++) {
                TimeSegmentDTO segment = segments.get(i);
                log.info("Inserting segment {}: {}-{} with segmentOrder={}", i, segment.getStartTime(), segment.getEndTime(), i);

                ResourceAvailability availability = new ResourceAvailability();
                availability.setResourceId(resourceId);
                availability.setDayOfWeek(day.getDayOfWeek());
                availability.setStartTime(LocalTime.parse(segment.getStartTime(), DateTimeFormatter.ofPattern("HH:mm")));
                availability.setEndTime(LocalTime.parse(segment.getEndTime(), DateTimeFormatter.ofPattern("HH:mm")));
                availability.setIsAvailable(true);
                availability.setSegmentOrder(i);  // 使用循环索引作为segmentOrder
                availability.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
                availability.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));

                log.info("About to insert availability with segmentOrder: {}", availability.getSegmentOrder());
                resourceMapper.insertAvailability(availability);
            }
        }
    }

    @Override
    @Transactional
    public ResourceAvailability addTimeSegment(Long resourceId, Integer dayOfWeek, TimeSegmentDTO segment) {
        log.info("Adding time segment for resource: {}, day: {}", resourceId, dayOfWeek);

        // 获取该天现有的最大segment_order
        List<ResourceAvailability> existingSegments = resourceMapper.findAvailabilitiesByResourceIdAndDay(resourceId, dayOfWeek);
        int maxOrder = existingSegments.stream()
            .mapToInt(ResourceAvailability::getSegmentOrder)
            .max()
            .orElse(-1);

        // 创建新的时间段
        ResourceAvailability availability = new ResourceAvailability();
        availability.setResourceId(resourceId);
        availability.setDayOfWeek(dayOfWeek);
        availability.setStartTime(LocalTime.parse(segment.getStartTime(), DateTimeFormatter.ofPattern("HH:mm")));
        availability.setEndTime(LocalTime.parse(segment.getEndTime(), DateTimeFormatter.ofPattern("HH:mm")));
        availability.setIsAvailable(true);
        availability.setSegmentOrder(maxOrder + 1);
        availability.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
        availability.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));

        resourceMapper.insertAvailability(availability);
        return availability;
    }

    @Override
    @Transactional
    public void deleteTimeSegment(Long availabilityId) {
        log.info("Deleting time segment: {}", availabilityId);
        resourceMapper.deleteAvailabilityById(availabilityId);
    }

    @Override
    @Transactional
    public void copyDayAvailability(Long resourceId, Integer sourceDayOfWeek, List<Integer> targetDaysOfWeek) {
        log.info("Copying day availability from day {} to days {} for resource: {}",
            sourceDayOfWeek, targetDaysOfWeek, resourceId);

        // 获取源天的所有时间段
        List<ResourceAvailability> sourceSegments = resourceMapper.findAvailabilitiesByResourceIdAndDay(resourceId, sourceDayOfWeek);

        if (sourceSegments.isEmpty()) {
            log.warn("No source segments found for day: {}", sourceDayOfWeek);
            return;
        }

        // 对源时间段按segmentOrder排序
        sourceSegments.sort(Comparator.comparing(ResourceAvailability::getSegmentOrder));

        // 复制到目标天
        for (Integer targetDay : targetDaysOfWeek) {
            // 先删除目标天的现有记录
            resourceMapper.deleteAvailabilitiesByResourceIdAndDay(resourceId, targetDay);

            // 复制时间段
            for (ResourceAvailability source : sourceSegments) {
                ResourceAvailability target = new ResourceAvailability();
                target.setResourceId(resourceId);
                target.setDayOfWeek(targetDay);
                target.setStartTime(source.getStartTime());
                target.setEndTime(source.getEndTime());
                target.setIsAvailable(source.getIsAvailable());
                target.setSegmentOrder(source.getSegmentOrder());
                target.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
                target.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));

                resourceMapper.insertAvailability(target);
            }
        }
    }

    // ========== 辅助方法 ==========

    /**
     * 将ResourceAvailability转换为TimeSegmentDTO
     */
    private TimeSegmentDTO toTimeSegmentDTO(ResourceAvailability availability) {
        TimeSegmentDTO dto = new TimeSegmentDTO();
        dto.setId(availability.getId());
        dto.setStartTime(availability.getStartTime().format(DateTimeFormatter.ofPattern("HH:mm")));
        dto.setEndTime(availability.getEndTime().format(DateTimeFormatter.ofPattern("HH:mm")));
        dto.setSegmentOrder(availability.getSegmentOrder());
        return dto;
    }

    /**
     * 获取星期名称
     */
    private String getDayName(int dayOfWeek) {
        switch (dayOfWeek) {
            case 1: return "Monday";
            case 2: return "Tuesday";
            case 3: return "Wednesday";
            case 4: return "Thursday";
            case 5: return "Friday";
            case 6: return "Saturday";
            case 7: return "Sunday";
            default: return "Unknown";
        }
    }

    /**
     * 验证时间段是否有重叠或无效
     */
    private void validateTimeSegments(WeekAvailabilityDTO weekAvailability) {
        for (DayAvailabilityDTO day : weekAvailability.getWeekDays()) {
            List<TimeSegmentDTO> segments = day.getSegments();
            if (segments == null || segments.size() <= 1) {
                continue;
            }

            // 按开始时间排序
            List<TimeSegmentDTO> sortedSegments = new ArrayList<>(segments);
            sortedSegments.sort((a, b) -> a.getStartTime().compareTo(b.getStartTime()));

            // 验证每个时间段的开始时间必须早于结束时间
            for (TimeSegmentDTO segment : sortedSegments) {
                LocalTime start = LocalTime.parse(segment.getStartTime(), DateTimeFormatter.ofPattern("HH:mm"));
                LocalTime end = LocalTime.parse(segment.getEndTime(), DateTimeFormatter.ofPattern("HH:mm"));

                if (!start.isBefore(end)) {
                    throw new IllegalArgumentException(
                        String.format("Invalid time range on day %d: %s-%s. Start time must be earlier than end time.",
                            day.getDayOfWeek(), segment.getStartTime(), segment.getEndTime())
                    );
                }
            }

            // 检查相邻时间段是否重叠
            for (int i = 0; i < sortedSegments.size() - 1; i++) {
                TimeSegmentDTO current = sortedSegments.get(i);
                TimeSegmentDTO next = sortedSegments.get(i + 1);

                LocalTime currentEnd = LocalTime.parse(current.getEndTime(), DateTimeFormatter.ofPattern("HH:mm"));
                LocalTime nextStart = LocalTime.parse(next.getStartTime(), DateTimeFormatter.ofPattern("HH:mm"));

                if (currentEnd.isAfter(nextStart)) {
                    throw new IllegalArgumentException(
                        String.format("Time overlap detected on day %d: %s-%s overlaps with %s-%s",
                            day.getDayOfWeek(),
                            current.getStartTime(), current.getEndTime(),
                            next.getStartTime(), next.getEndTime())
                    );
                }
            }
        }
    }
}