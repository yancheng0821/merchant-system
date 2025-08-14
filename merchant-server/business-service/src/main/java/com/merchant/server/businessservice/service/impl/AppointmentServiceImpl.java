package com.merchant.server.businessservice.service.impl;

import com.merchant.server.businessservice.entity.Appointment;
import com.merchant.server.businessservice.entity.AppointmentResource;
import com.merchant.server.businessservice.entity.Customer;
import com.merchant.server.businessservice.mapper.AppointmentMapper;
import com.merchant.server.businessservice.mapper.AppointmentResourceMapper;
import com.merchant.server.businessservice.mapper.CustomerMapper;
import com.merchant.server.businessservice.mapper.ServiceMapper;
import com.merchant.server.businessservice.service.AppointmentService;
import com.merchant.server.businessservice.service.AppointmentNotificationService;
import com.merchant.server.businessservice.service.ResourceService;
import com.merchant.server.businessservice.dto.AppointmentCreateDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentServiceImpl implements AppointmentService {

    private final AppointmentMapper appointmentMapper;
    private final AppointmentResourceMapper appointmentResourceMapper;
    private final AppointmentNotificationService notificationService;
    private final ResourceService resourceService;
    private final CustomerMapper customerMapper;
    private final ServiceMapper serviceMapper;

    @Override
    public List<Appointment> getAllAppointmentsByTenantId(Long tenantId) {
        log.info("Getting all appointments for tenant: {}", tenantId);
        List<Appointment> appointments = appointmentMapper.findByTenantId(tenantId);
        log.info("Found {} appointments for tenant {}", appointments.size(), tenantId);
        
        // 批量获取所有预约的ID
        List<Long> appointmentIds = appointments.stream()
            .map(Appointment::getId)
            .collect(java.util.stream.Collectors.toList());
        
        if (!appointmentIds.isEmpty()) {
            // 批量获取所有预约的资源关联
            List<AppointmentResource> allResources = appointmentResourceMapper.selectByAppointmentIds(appointmentIds);
            
            // 将资源按预约ID分组
            Map<Long, List<AppointmentResource>> resourceMap = allResources.stream()
                .collect(java.util.stream.Collectors.groupingBy(AppointmentResource::getAppointmentId));
            
            // 为每个预约设置服务详情和资源
            for (Appointment appointment : appointments) {
                // 获取服务详情
                List<com.merchant.server.businessservice.entity.AppointmentService> services = 
                    appointmentMapper.findAppointmentServicesByAppointmentId(appointment.getId());
                appointment.setAppointmentServices(services);
                
                // 设置资源列表
                List<AppointmentResource> resources = resourceMap.get(appointment.getId());
                if (resources != null) {
                    appointment.setAppointmentResources(resources);
                }
                
                log.info("Appointment {}: date={}, time={}, status={}, customer={}, services={}, resources={}", 
                    appointment.getId(), appointment.getAppointmentDate(), appointment.getAppointmentTime(), 
                    appointment.getStatus(), appointment.getCustomerId(), services.size(), 
                    resources != null ? resources.size() : 0);
            }
        }
        
        return appointments;
    }

    @Override
    public List<Appointment> getAppointmentsByCustomerId(Long customerId, Long tenantId) {
        log.info("Getting appointments for customer: {} in tenant: {}", customerId, tenantId);
        List<Appointment> appointments = appointmentMapper.findByCustomerIdAndTenantId(customerId, tenantId);
        
        // 批量获取所有预约的ID
        List<Long> appointmentIds = appointments.stream()
            .map(Appointment::getId)
            .collect(java.util.stream.Collectors.toList());
        
        if (!appointmentIds.isEmpty()) {
            // 批量获取所有预约的资源关联
            List<AppointmentResource> allResources = appointmentResourceMapper.selectByAppointmentIds(appointmentIds);
            
            // 将资源按预约ID分组
            Map<Long, List<AppointmentResource>> resourceMap = allResources.stream()
                .collect(java.util.stream.Collectors.groupingBy(AppointmentResource::getAppointmentId));
            
            // 为每个预约设置服务详情和资源
            for (Appointment appointment : appointments) {
                // 获取服务详情
                List<com.merchant.server.businessservice.entity.AppointmentService> services = 
                    appointmentMapper.findAppointmentServicesByAppointmentId(appointment.getId());
                appointment.setAppointmentServices(services);
                
                // 设置资源列表
                List<AppointmentResource> resources = resourceMap.get(appointment.getId());
                if (resources != null) {
                    appointment.setAppointmentResources(resources);
                }
            }
        }
        
        return appointments;
    }

    @Override
    public Map<String, Object> getAppointmentStats(Long customerId, Long tenantId) {
        log.info("Getting appointment stats for customer: {} in tenant: {}", customerId, tenantId);
        
        List<Appointment> appointments = appointmentMapper.findByCustomerIdAndTenantId(customerId, tenantId);
        
        Map<String, Object> stats = new HashMap<>();
        
        // 总预约数
        stats.put("totalAppointments", appointments.size());
        
        // 已完成预约数
        long completedCount = appointments.stream()
                .filter(apt -> apt.getStatus() == Appointment.AppointmentStatus.COMPLETED)
                .count();
        stats.put("completedAppointments", completedCount);
        
        // 总消费金额
        BigDecimal totalSpent = appointments.stream()
                .filter(apt -> apt.getStatus() == Appointment.AppointmentStatus.COMPLETED)
                .map(apt -> apt.getTotalAmount() != null ? apt.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.put("totalSpent", totalSpent);
        
        // 平均评分
        double avgRating = appointments.stream()
                .filter(apt -> apt.getRating() != null && apt.getRating() > 0)
                .mapToInt(Appointment::getRating)
                .average()
                .orElse(0.0);
        stats.put("avgRating", avgRating);
        
        return stats;
    }

    @Override
    public Appointment createAppointment(Appointment appointment) {
        log.info("Creating appointment for customer: {}", appointment.getCustomerId());
        log.info("Appointment details: {}", appointment);
        
        // 设置默认值
        if (appointment.getCreatedAt() == null) {
            appointment.setCreatedAt(LocalDateTime.now());
        }
        if (appointment.getUpdatedAt() == null) {
            appointment.setUpdatedAt(LocalDateTime.now());
        }
        if (appointment.getTotalAmount() == null) {
            appointment.setTotalAmount(BigDecimal.ZERO);
        }
        
        try {
            appointmentMapper.insert(appointment);
            log.info("Appointment created successfully with ID: {}", appointment.getId());
            
            // 注意：这个方法是旧的API，新的预约应该使用createAppointmentWithServices
            // 这里不创建资源关联，因为没有传入资源信息
            
            // 发送预约确认通知
            try {
                notificationService.sendConfirmationNotification(appointment);
            } catch (Exception e) {
                log.error("Failed to send confirmation notification for appointment: {}", appointment.getId(), e);
            }
            
            return appointment;
        } catch (Exception e) {
            log.error("Error creating appointment: ", e);
            throw e;
        }
    }

    @Override
    @Transactional
    public Appointment createAppointmentWithServices(AppointmentCreateDTO appointmentDTO) {
        log.info("Creating appointment with services for customer: {}", appointmentDTO.getCustomerId());
        log.info("Appointment DTO: {}", appointmentDTO);
        log.info("Selected Resources: {}", appointmentDTO.getSelectedResources());
        
        // 创建预约实体
        Appointment appointment = new Appointment();
        appointment.setTenantId(appointmentDTO.getTenantId());
        appointment.setCustomerId(appointmentDTO.getCustomerId());
        appointment.setAppointmentDate(appointmentDTO.getAppointmentDate());
        appointment.setAppointmentTime(appointmentDTO.getAppointmentTime());
        appointment.setDuration(appointmentDTO.getDuration());
        appointment.setTotalAmount(appointmentDTO.getTotalAmount());
        appointment.setStatus(appointmentDTO.getStatus() != null ? appointmentDTO.getStatus() : Appointment.AppointmentStatus.CONFIRMED);
        appointment.setNotes(appointmentDTO.getNotes());
        appointment.setRating(appointmentDTO.getRating());
        appointment.setReview(appointmentDTO.getReview());
        appointment.setCreatedAt(LocalDateTime.now());
        appointment.setUpdatedAt(LocalDateTime.now());
        
        try {
            // 1. 插入预约记录
            appointmentMapper.insert(appointment);
            log.info("Appointment created successfully with ID: {}", appointment.getId());
            
            // 2. 创建预约时间段
            if (appointment.getDuration() != null) {
                LocalTime startTime = appointment.getAppointmentTime();
                LocalTime endTime = startTime.plusMinutes(appointment.getDuration());
                
                // 添加详细日志
                log.info("Processing booking slots - selectedResources: {}", 
                    appointmentDTO.getSelectedResources());
                
                // 处理多个资源的预约时段创建和资源关联
                if (appointmentDTO.getSelectedResources() != null && !appointmentDTO.getSelectedResources().isEmpty()) {
                    log.info("Creating booking slots and resource associations for {} selected resources", appointmentDTO.getSelectedResources().size());
                    
                    // 创建appointment_resources记录
                    List<AppointmentResource> appointmentResources = new ArrayList<>();
                    for (int i = 0; i < appointmentDTO.getSelectedResources().size(); i++) {
                        AppointmentCreateDTO.SelectedResourceDTO selectedResource = appointmentDTO.getSelectedResources().get(i);
                        
                        // 创建资源关联记录
                        AppointmentResource ar = new AppointmentResource();
                        ar.setAppointmentId(appointment.getId());
                        ar.setResourceId(selectedResource.getId());
                        ar.setResourceType(AppointmentResource.ResourceType.valueOf(selectedResource.getType()));
                        // is_primary字段在当前业务场景下不使用，统一设置为false
                        ar.setIsPrimary(false);
                        appointmentResources.add(ar);
                        
                        // 创建预约时段
                        try {
                            log.info("Creating booking slot for resource: {} (type: {})", selectedResource.getId(), selectedResource.getType());
                            resourceService.createBookingSlot(
                                selectedResource.getId(),
                                appointment.getId(),
                                appointment.getAppointmentDate(),
                                startTime,
                                endTime
                            );
                            log.info("Booking slot created for resource: {} (type: {}) in appointment: {}", 
                                selectedResource.getId(), selectedResource.getType(), appointment.getId());
                        } catch (Exception e) {
                            log.error("Failed to create booking slot for resource: {} (type: {}) in appointment: {}", 
                                selectedResource.getId(), selectedResource.getType(), appointment.getId(), e);
                            // 如果创建预约时间段失败，回滚预约创建
                            throw new RuntimeException("Failed to create booking slot for resource " + selectedResource.getId() + ": " + e.getMessage(), e);
                        }
                    }
                    
                    // 批量插入资源关联记录
                    if (!appointmentResources.isEmpty()) {
                        appointmentResourceMapper.batchInsert(appointmentResources);
                        log.info("Created {} appointment resource associations", appointmentResources.size());
                        
                        // 设置资源信息到预约对象中（用于通知）
                        appointment.setAppointmentResources(appointmentResources);
                    }
                } else {
                    log.warn("No resources specified for booking slots - selectedResources: {}", 
                        appointmentDTO.getSelectedResources());
                }
            }
            
            // 3. 插入预约服务记录
            if (appointmentDTO.getServices() != null && !appointmentDTO.getServices().isEmpty()) {
                List<com.merchant.server.businessservice.entity.AppointmentService> appointmentServices = new ArrayList<>();
                
                for (AppointmentCreateDTO.AppointmentServiceDTO serviceDTO : appointmentDTO.getServices()) {
                    com.merchant.server.businessservice.entity.AppointmentService appointmentService = 
                        new com.merchant.server.businessservice.entity.AppointmentService();
                    appointmentService.setAppointmentId(appointment.getId());
                    appointmentService.setServiceId(serviceDTO.getServiceId());
                    appointmentService.setServiceName(serviceDTO.getServiceName());
                    appointmentService.setPrice(serviceDTO.getPrice());
                    appointmentService.setDuration(serviceDTO.getDuration());
                    appointmentService.setCreatedAt(LocalDateTime.now());
                    
                    appointmentServices.add(appointmentService);
                }
                
                // 批量插入预约服务
                appointmentMapper.insertAppointmentServices(appointmentServices);
                log.info("Inserted {} appointment services for appointment ID: {}", appointmentServices.size(), appointment.getId());
                
                // 设置服务信息到预约对象中（用于返回和通知）
                appointment.setAppointmentServices(appointmentServices);
            }
            
            // 4. 发送预约确认通知
            try {
                notificationService.sendConfirmationNotification(appointment);
            } catch (Exception e) {
                log.error("Failed to send confirmation notification for appointment: {}", appointment.getId(), e);
            }
            
            return appointment;
        } catch (Exception e) {
            log.error("Error creating appointment with services: ", e);
            throw e;
        }
    }

    @Override
    @Transactional
    public Appointment updateAppointmentStatus(Long id, String status) {
        log.info("Updating appointment status: {} to {}", id, status);
        Appointment appointment = appointmentMapper.findById(id);
        if (appointment != null) {
            Appointment.AppointmentStatus oldStatus = appointment.getStatus();
            Appointment.AppointmentStatus newStatus = Appointment.AppointmentStatus.valueOf(status);
            appointment.setStatus(newStatus);
            appointment.setUpdatedAt(LocalDateTime.now());
            appointmentMapper.update(appointment);
            
            // 如果预约被取消，释放预约时间段
            if (newStatus == Appointment.AppointmentStatus.CANCELLED && oldStatus != Appointment.AppointmentStatus.CANCELLED) {
                try {
                    resourceService.cancelBookingSlot(id);
                    log.info("Booking slot cancelled for appointment: {}", id);
                } catch (Exception e) {
                    log.error("Failed to cancel booking slot for appointment: {}", id, e);
                }
            }
            
            // 根据状态变化发送通知
            try {
                if (newStatus == Appointment.AppointmentStatus.CANCELLED && oldStatus != Appointment.AppointmentStatus.CANCELLED) {
                    notificationService.sendCancellationNotification(appointment);
                } else if (newStatus == Appointment.AppointmentStatus.COMPLETED && oldStatus != Appointment.AppointmentStatus.COMPLETED) {
                    notificationService.sendCompletionNotification(appointment);
                }
            } catch (Exception e) {
                log.error("Failed to send status change notification for appointment: {}", id, e);
            }
        }
        return appointment;
    }

    @Override
    public Appointment updateAppointment(Appointment appointment) {
        log.info("Updating appointment: {}", appointment.getId());
        appointment.setUpdatedAt(LocalDateTime.now());
        appointmentMapper.update(appointment);
        return appointment;
    }

    @Override
    @Transactional
    public void deleteAppointment(Long id) {
        log.info("Deleting appointment: {}", id);
        
        // 先删除预约时间段
        try {
            resourceService.cancelBookingSlot(id);
            log.info("Booking slot deleted for appointment: {}", id);
        } catch (Exception e) {
            log.error("Failed to delete booking slot for appointment: {}", id, e);
        }
        
        // 再删除预约记录
        appointmentMapper.deleteById(id);
    }

    @Override
    public Appointment getAppointmentById(Long id) {
        log.info("Getting appointment by id: {}", id);
        Appointment appointment = appointmentMapper.findById(id);
        
        if (appointment != null) {
            // 加载资源关联
            List<AppointmentResource> resources = appointmentResourceMapper.selectByAppointmentId(id);
            appointment.setAppointmentResources(resources);
        }
        
        return appointment;
    }
    
    @Override
    public List<Appointment> getUpcomingAppointments(String date, String time) {
        log.info("Getting upcoming appointments for date: {} and time: {}", date, time);
        // 获取指定日期和时间的预约
        return appointmentMapper.findUpcomingAppointments(date, time);
    }
    
    @Override
    public Customer getCustomerById(Long customerId) {
        log.info("Getting customer by id: {}", customerId);
        return customerMapper.selectById(customerId);
    }
    
    @Override
    public String getServiceName(Long serviceId) {
        log.info("Getting service name for id: {}", serviceId);
        com.merchant.server.businessservice.entity.Service service = serviceMapper.selectById(serviceId);
        return service != null ? service.getName() : "Unknown Service";
    }
}