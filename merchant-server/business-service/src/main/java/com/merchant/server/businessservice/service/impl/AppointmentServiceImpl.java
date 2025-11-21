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
import com.merchant.server.businessservice.dto.OrderCreateDTO;
import com.merchant.server.businessservice.dto.OrderServiceCreateDTO;
import com.merchant.server.businessservice.util.MessageUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import org.springframework.transaction.annotation.Transactional;
import com.merchant.server.businessservice.client.MerchantServiceClient;
import com.merchant.server.common.util.TimeZoneUtils;

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
    private final com.merchant.server.businessservice.service.CustomerPackageService customerPackageService;
    private final com.merchant.server.businessservice.service.OrderService orderService;
    private final com.merchant.server.businessservice.mapper.OrderMapper orderMapper;
    private final com.merchant.server.businessservice.service.StaffNotificationService staffNotificationService;
    private final MerchantServiceClient merchantServiceClient;
    private final MessageUtil messageUtil;

    @Override
    public List<Appointment> getAllAppointmentsByTenantId(Long tenantId) {
        List<Appointment> appointments = appointmentMapper.findByTenantId(tenantId);

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

            log.debug("[BUSINESS] Loaded {} appointments with services and resources for tenant: {}",
                appointments.size(), tenantId);
        }

        return appointments;
    }

    @Override
    public List<Appointment> getAppointmentsByCustomerId(Long customerId, Long tenantId) {
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
        // 设置默认值 - 使用UTC时间
        if (appointment.getCreatedAt() == null) {
            appointment.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
        }
        if (appointment.getUpdatedAt() == null) {
            appointment.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
        }
        if (appointment.getTotalAmount() == null) {
            appointment.setTotalAmount(BigDecimal.ZERO);
        }
        
        try {
            appointmentMapper.insert(appointment);
            log.info("[BUSINESS] Appointment created - appointmentId: {}, customerId: {}, date: {}, totalAmount: {}",
                appointment.getId(), appointment.getCustomerId(), appointment.getAppointmentDate(), appointment.getTotalAmount());

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
    @Transactional(rollbackFor = Exception.class)
    public Appointment createAppointmentWithServices(AppointmentCreateDTO appointmentDTO) {
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
        appointment.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
        appointment.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
        
        try {
            // 1. 插入预约记录
            appointmentMapper.insert(appointment);
            log.info("[BUSINESS] Appointment created - appointmentId: {}, customerId: {}, date: {}, time: {}, totalAmount: {}, resourceCount: {}",
                appointment.getId(), appointment.getCustomerId(), appointment.getAppointmentDate(),
                appointment.getAppointmentTime(), appointment.getTotalAmount(),
                appointmentDTO.getSelectedResources() != null ? appointmentDTO.getSelectedResources().size() : 0);

            // 2. 创建预约时间段
            if (appointment.getDuration() != null) {
                LocalTime startTime = appointment.getAppointmentTime();
                LocalTime endTime = startTime.plusMinutes(appointment.getDuration());

                // 处理多个资源的预约时段创建和资源关联
                if (appointmentDTO.getSelectedResources() != null && !appointmentDTO.getSelectedResources().isEmpty()) {
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
                            resourceService.createBookingSlot(
                                selectedResource.getId(),
                                appointment.getId(),
                                appointment.getAppointmentDate(),
                                startTime,
                                endTime
                            );
                        } catch (Exception e) {
                            log.error("[BUSINESS] Failed to create booking slot - appointmentId: {}, resourceId: {}, resourceType: {}",
                                appointment.getId(), selectedResource.getId(), selectedResource.getType(), e);
                            throw new RuntimeException(e.getMessage(), e);
                        }
                    }

                    // 批量插入资源关联记录
                    if (!appointmentResources.isEmpty()) {
                        appointmentResourceMapper.batchInsert(appointmentResources);
                        // 设置资源信息到预约对象中（用于通知）
                        appointment.setAppointmentResources(appointmentResources);
                    }
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
                    appointmentService.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
                    
                    appointmentServices.add(appointmentService);
                }


                // 批量插入预约服务
                appointmentMapper.insertAppointmentServices(appointmentServices);
                // 设置服务信息到预约对象中（用于返回和通知）
                appointment.setAppointmentServices(appointmentServices);
            }

            // 4. 填充customer信息（前端需要显示客户姓名）
            try {
                Customer customer = customerMapper.selectById(appointment.getCustomerId());
                appointment.setCustomer(customer);
            } catch (Exception e) {
                log.error("Failed to load customer for appointment: {}", appointment.getId(), e);
            }

            // 5. 发送预约确认通知
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
        Appointment appointment = appointmentMapper.findById(id);
        if (appointment != null) {
            Appointment.AppointmentStatus oldStatus = appointment.getStatus();
            Appointment.AppointmentStatus newStatus = Appointment.AppointmentStatus.valueOf(status);
            appointment.setStatus(newStatus);
            appointment.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
            appointmentMapper.update(appointment);

            log.info("[BUSINESS] Appointment status changed - appointmentId: {}, from: {}, to: {}",
                id, oldStatus, newStatus);

            // 如果预约被取消，释放预约时间段
            if (newStatus == Appointment.AppointmentStatus.CANCELLED && oldStatus != Appointment.AppointmentStatus.CANCELLED) {
                try {
                    resourceService.cancelBookingSlot(id);
                } catch (Exception e) {
                    log.error("[BUSINESS] Failed to cancel booking slot - appointmentId: {}", id, e);
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
    @Transactional(rollbackFor = Exception.class)
    public Appointment updateAppointment(Appointment appointment) {
        // 0. 先获取旧的预约信息，用于发送取消通知
        Appointment oldAppointment = getAppointmentById(appointment.getId());

        appointment.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));

        // 1. 更新预约基本信息
        appointmentMapper.update(appointment);

        log.info("[BUSINESS] Appointment updated - appointmentId: {}, customerId: {}, date: {}, totalAmount: {}",
            appointment.getId(), appointment.getCustomerId(), appointment.getAppointmentDate(), appointment.getTotalAmount());

        // 2. 如果包含服务信息，先删除旧的服务关联，再插入新的
        if (appointment.getAppointmentServices() != null && !appointment.getAppointmentServices().isEmpty()) {
            // 删除旧的服务关联
            appointmentMapper.deleteAppointmentServices(appointment.getId());

            // 插入新的服务关联
            List<com.merchant.server.businessservice.entity.AppointmentService> appointmentServices = new ArrayList<>();
            for (com.merchant.server.businessservice.entity.AppointmentService service : appointment.getAppointmentServices()) {
                service.setAppointmentId(appointment.getId());
                if (service.getCreatedAt() == null) {
                    service.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
                }
                appointmentServices.add(service);
            }

            appointmentMapper.insertAppointmentServices(appointmentServices);
        }

        // 3. 如果包含资源信息，更新资源关联和预约时段
        if (appointment.getAppointmentResources() != null && !appointment.getAppointmentResources().isEmpty()) {
            // 先删除旧的预约时段（必须成功，否则回滚整个事务）
            resourceService.cancelBookingSlot(appointment.getId());

            // 删除旧的资源关联
            appointmentResourceMapper.deleteByAppointmentId(appointment.getId());

            // 创建新的资源关联和预约时段
            if (appointment.getDuration() != null) {
                LocalTime startTime = appointment.getAppointmentTime();
                LocalTime endTime = startTime.plusMinutes(appointment.getDuration());

                for (AppointmentResource resource : appointment.getAppointmentResources()) {
                    // 插入资源关联
                    resource.setAppointmentId(appointment.getId());
                    appointmentResourceMapper.insert(resource);

                    // 创建预约时段 - 如果失败则抛出异常让事务回滚
                    resourceService.createBookingSlot(
                        resource.getResourceId(),
                        appointment.getId(),
                        appointment.getAppointmentDate(),
                        startTime,
                        endTime
                    );
                }
            }
        }

        // 4. 事务完成后发送通知（异步，不在事务内，失败不影响更新流程）
        // 重新查询完整的预约信息（包含关联数据）
        Appointment updatedAppointment = getAppointmentById(appointment.getId());

        try {
            // 发送旧预约的取消通知
            if (oldAppointment != null) {
                notificationService.sendCancellationNotification(oldAppointment);
            }

            // 发送新预约的确认通知
            notificationService.sendConfirmationNotification(updatedAppointment);
        } catch (Exception e) {
            log.error("Failed to send update notifications for appointment {}: {}",
                appointment.getId(), e.getMessage());
            // 不抛出异常，避免影响更新流程
        }

        return updatedAppointment;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteAppointment(Long id) {
        // 先获取预约信息用于发送取消通知
        Appointment appointment = getAppointmentById(id);

        // 删除预约时间段（必须成功，否则回滚整个事务）
        resourceService.cancelBookingSlot(id);

        // 删除预约记录
        appointmentMapper.deleteById(id);

        log.info("[BUSINESS] Appointment deleted - appointmentId: {}", id);

        // 发送取消通知（异步，在事务外，失败不影响删除流程）
        if (appointment != null) {
            try {
                notificationService.sendCancellationNotification(appointment);
            } catch (Exception e) {
                log.error("Failed to send cancellation notification for appointment {}: {}",
                    id, e.getMessage());
                // 不抛出异常，避免影响删除流程
            }
        }
    }

    @Override
    public Appointment getAppointmentById(Long id) {
        Appointment appointment = appointmentMapper.findById(id);

        if (appointment != null) {
            // 加载资源关联
            List<AppointmentResource> resources = appointmentResourceMapper.selectByAppointmentId(id);
            appointment.setAppointmentResources(resources);

            // 加载customer信息（前端需要显示客户姓名）
            try {
                Customer customer = customerMapper.selectById(appointment.getCustomerId());
                appointment.setCustomer(customer);
            } catch (Exception e) {
                log.error("Failed to load customer for appointment: {}", id, e);
            }

            // 加载服务详情
            try {
                List<com.merchant.server.businessservice.entity.AppointmentService> services =
                    appointmentMapper.findAppointmentServicesByAppointmentId(id);
                appointment.setAppointmentServices(services);
            } catch (Exception e) {
                log.error("Failed to load services for appointment: {}", id, e);
            }
        }

        return appointment;
    }

    @Override
    public List<Appointment> getUpcomingAppointments(String date, String time) {
        return appointmentMapper.findUpcomingAppointments(date, time);
    }

    @Override
    public Customer getCustomerById(Long customerId) {
        return customerMapper.selectById(customerId);
    }

    @Override
    public String getServiceName(Long serviceId) {
        com.merchant.server.businessservice.entity.Service service = serviceMapper.selectById(serviceId);
        return service != null ? service.getName() : "Unknown Service";
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Appointment processPayment(Long appointmentId, String paymentMethod, Integer customerPackageId, Long tenantId, Long verificationCodeId,
            Double taxRate, Double taxAmount, Double tipAmount, Double tipPercentage, Double subtotal, Double totalAmount, String tipPaymentMethod, String notes,
            Double giftCardAmount, String giftCardNumber, String additionalPaymentMethod, Double additionalPaymentAmount) {
        // Get the appointment
        Appointment appointment = getAppointmentById(appointmentId);
        if (appointment == null) {
            throw new RuntimeException(messageUtil.getMessage("error.appointment.not.found", new Object[]{appointmentId}));
        }

        // Verify tenant
        if (tenantId != null && !appointment.getTenantId().equals(tenantId)) {
            throw new RuntimeException(messageUtil.getMessage("error.appointment.not.belong.to.tenant", new Object[]{tenantId}));
        }

        // If using package, verify and deduct usage
        if ("PACKAGE".equals(paymentMethod) && customerPackageId != null) {
            // Validate that appointment has services
            if (appointment.getAppointmentServices() == null || appointment.getAppointmentServices().isEmpty()) {
                throw new RuntimeException(messageUtil.getMessage("error.appointment.package.payment.no.services"));
            }

            try {
                // Get staff information from appointment resources
                Long staffId = null;
                String staffName = null;
                if (appointment.getAppointmentResources() != null && !appointment.getAppointmentResources().isEmpty()) {
                    // Get the first resource (primary staff)
                    com.merchant.server.businessservice.entity.AppointmentResource appointmentResource =
                        appointment.getAppointmentResources().get(0);
                    staffId = appointmentResource.getResourceId();
                    staffName = appointmentResource.getResourceName();
                }

                // Deduct usage for each service in the appointment
                for (com.merchant.server.businessservice.entity.AppointmentService appointmentService : appointment.getAppointmentServices()) {
                    Long serviceId = appointmentService.getServiceId();
                    if (serviceId != null) {
                        customerPackageService.deductServiceUsage(
                            customerPackageId,
                            serviceId,
                            appointmentId,
                            verificationCodeId,
                            staffId,
                            staffName
                        );
                        log.info("[BUSINESS] Package usage deducted - packageId: {}, serviceId: {}, staffId: {}, appointmentId: {}",
                                customerPackageId, serviceId, staffId, appointmentId);
                    }
                }
            } catch (Exception e) {
                log.error("[BUSINESS] Failed to deduct package usage - packageId: {}, appointmentId: {}, error: {}",
                    customerPackageId, appointmentId, e.getMessage());
                throw new RuntimeException(messageUtil.getMessage("error.appointment.package.payment.failed", new Object[]{e.getMessage()}));
            }
        }

        // Update appointment with payment info
        appointment.setPaid(true);
        appointment.setPaidTime(LocalDateTime.now(ZoneOffset.UTC));
        appointment.setPaymentMethod(paymentMethod);
        appointment.setStatus(Appointment.AppointmentStatus.COMPLETED);

        // Update in database
        appointmentMapper.update(appointment);

        // Create order record - must succeed or transaction rolls back
        // For single service scenario, pass null for servicePayments
        createOrderFromAppointment(appointment, paymentMethod, taxRate, taxAmount, tipAmount, tipPercentage, subtotal, totalAmount,
                tipPaymentMethod, notes, null, giftCardAmount, giftCardNumber, additionalPaymentMethod, additionalPaymentAmount, "single");

        // Update customer statistics (total spent, points, last visit)
        // The totalAmount from frontend already excludes package payments (0 for package payment)
        updateCustomerStatsForAppointment(appointment.getCustomerId(), totalAmount);

        log.info("[BUSINESS] Payment processed - appointmentId: {}, method: {}, amount: {}, packageId: {}",
            appointmentId, paymentMethod, totalAmount, customerPackageId);

        // 发送客户完成通知（异步，不阻塞支付流程）
        try {
            notificationService.sendCompletionNotification(appointment);
        } catch (Exception e) {
            log.error("Failed to send customer completion notification for appointment {}: {}",
                appointmentId, e.getMessage());
            // 不抛出异常，避免影响支付流程
        }

        // 发送员工完成通知（异步，不阻塞支付流程）
        try {
            staffNotificationService.sendAppointmentCompletionNotification(appointment);
        } catch (Exception e) {
            log.error("Failed to send staff notification for appointment {}: {}",
                appointmentId, e.getMessage());
            // 不抛出异常，避免影响支付流程
        }

        return appointment;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Appointment processMultiServicePayment(Long appointmentId, String paymentMethod, List<Map<String, Object>> servicePayments, Long tenantId,
            Double taxRate, Double taxAmount, Double tipAmount, Double tipPercentage, Double subtotal, Double totalAmount, String tipPaymentMethod, String notes,
            Double giftCardAmount, String giftCardNumber, String additionalPaymentMethod, Double additionalPaymentAmount, String paymentMode) {
        // Get the appointment
        Appointment appointment = getAppointmentById(appointmentId);
        if (appointment == null) {
            throw new RuntimeException(messageUtil.getMessage("error.appointment.not.found", new Object[]{appointmentId}));
        }

        // Verify tenant
        if (tenantId != null && !appointment.getTenantId().equals(tenantId)) {
            throw new RuntimeException(messageUtil.getMessage("error.appointment.not.belong.to.tenant", new Object[]{tenantId}));
        }

        // Get staff information from appointment resources
        Long staffId = null;
        String staffName = null;
        if (appointment.getAppointmentResources() != null && !appointment.getAppointmentResources().isEmpty()) {
            // Get the first resource (primary staff)
            com.merchant.server.businessservice.entity.AppointmentResource appointmentResource =
                appointment.getAppointmentResources().get(0);
            staffId = appointmentResource.getResourceId();
            staffName = appointmentResource.getResourceName();
        }

        // 处理每个服务的支付
        for (Map<String, Object> servicePayment : servicePayments) {
            Long serviceId = servicePayment.get("serviceId") != null
                ? Long.valueOf(servicePayment.get("serviceId").toString()) : null;
            String servicePaymentMethod = (String) servicePayment.get("paymentMethod");
            Integer customerPackageId = servicePayment.get("customerPackageId") != null
                ? Integer.valueOf(servicePayment.get("customerPackageId").toString()) : null;
            Long verificationCodeId = servicePayment.get("verificationCodeId") != null
                ? Long.valueOf(servicePayment.get("verificationCodeId").toString()) : null;

            // 如果是套餐支付，扣除使用次数
            if ("PACKAGE".equals(servicePaymentMethod) && customerPackageId != null && serviceId != null) {
                try {
                    customerPackageService.deductServiceUsage(
                        customerPackageId,
                        serviceId,
                        appointmentId,
                        verificationCodeId,
                        staffId,
                        staffName
                    );
                    log.info("[BUSINESS] Package usage deducted - packageId: {}, serviceId: {}, staffId: {}, appointmentId: {}",
                            customerPackageId, serviceId, staffId, appointmentId);
                } catch (Exception e) {
                    log.error("[BUSINESS] Failed to deduct package usage - packageId: {}, serviceId: {}, appointmentId: {}, error: {}",
                        customerPackageId, serviceId, appointmentId, e.getMessage());
                    throw new RuntimeException(messageUtil.getMessage("error.appointment.package.payment.service.failed", new Object[]{serviceId, e.getMessage()}));
                }
            }
        }

        // Update appointment with payment info
        appointment.setPaid(true);
        appointment.setPaidTime(LocalDateTime.now(ZoneOffset.UTC));
        appointment.setPaymentMethod(paymentMethod);
        appointment.setStatus(Appointment.AppointmentStatus.COMPLETED);

        // Update in database
        appointmentMapper.update(appointment);

        // Create order record - must succeed or transaction rolls back
        // For multi-service scenario, pass servicePayments to record each service's payment method
        createOrderFromAppointment(appointment, paymentMethod, taxRate, taxAmount, tipAmount, tipPercentage, subtotal, totalAmount,
                tipPaymentMethod, notes, servicePayments, giftCardAmount, giftCardNumber, additionalPaymentMethod, additionalPaymentAmount, paymentMode);

        // Update customer statistics (total spent, points, last visit)
        // The totalAmount from frontend already excludes package payments
        // So we can directly use it without any calculation
        updateCustomerStatsForAppointment(appointment.getCustomerId(), totalAmount);

        log.info("[BUSINESS] Multi-service payment processed - appointmentId: {}, method: {}, amount: {}, serviceCount: {}",
            appointmentId, paymentMethod, totalAmount, servicePayments != null ? servicePayments.size() : 0);

        // 发送客户完成通知（异步，不阻塞支付流程）
        try {
            notificationService.sendCompletionNotification(appointment);
        } catch (Exception e) {
            log.error("Failed to send customer completion notification for appointment {}: {}",
                appointmentId, e.getMessage());
            // 不抛出异常，避免影响支付流程
        }

        // 发送员工完成通知（异步，不阻塞支付流程）
        try {
            staffNotificationService.sendAppointmentCompletionNotification(appointment);
        } catch (Exception e) {
            log.error("Failed to send staff notification for appointment {}: {}",
                appointmentId, e.getMessage());
            // 不抛出异常，避免影响支付流程
        }

        return appointment;
    }

    /**
     * Update customer statistics after appointment payment
     * Updates: total spent, points, last visit date
     * This method is part of the transaction - if it fails, the entire payment will rollback
     *
     * Note: The totalAmount passed from frontend already excludes package payments,
     * so if totalAmount is 0, it means pure package payment and we only update last visit date.
     *
     * @param customerId Customer ID
     * @param totalAmount Total payment amount (already excluding package payments)
     */
    private void updateCustomerStatsForAppointment(Long customerId, Double totalAmount) {
        Customer customer = customerMapper.selectById(customerId);
        if (customer == null) {
            String errorMsg = "Customer not found when updating stats: " + customerId;
            log.error(errorMsg);
            throw new RuntimeException(errorMsg);
        }

        // Always update last visit date
        customer.setLastVisitDate(LocalDateTime.now(ZoneOffset.UTC));

        // Update total spent and points if totalAmount > 0
        if (totalAmount != null && totalAmount > 0) {
            BigDecimal amountToAdd = BigDecimal.valueOf(totalAmount);

            // Update total spent
            customer.setTotalSpent(
                (customer.getTotalSpent() != null ? customer.getTotalSpent() : BigDecimal.ZERO)
                    .add(amountToAdd)
            );

            // Update points (1 point per $10 spent, rounded down)
            int pointsToAdd = amountToAdd.divide(BigDecimal.TEN, 0, java.math.RoundingMode.DOWN).intValue();
            customer.setPoints(
                (customer.getPoints() != null ? customer.getPoints() : 0) + pointsToAdd
            );

            log.info("[BUSINESS] Customer stats updated - customerId: {}, amountAdded: {}, pointsAdded: {}",
                customerId, amountToAdd, pointsToAdd);
        } else {
            log.debug("[BUSINESS] Customer last visit updated - customerId: {}, totalAmount: {}",
                customerId, totalAmount);
        }

        int updatedRows = customerMapper.update(customer);
        if (updatedRows == 0) {
            String errorMsg = "Failed to update customer stats for appointment payment: customerId=" + customerId;
            log.error(errorMsg);
            throw new RuntimeException(errorMsg);
        }
    }

    /**
     * Create order from appointment
     */
    private void createOrderFromAppointment(Appointment appointment, String paymentMethod,
            Double taxRate, Double taxAmount, Double tipAmount, Double tipPercentage, Double subtotal, Double totalAmount, String tipPaymentMethod, String notes,
            List<Map<String, Object>> servicePayments,
            Double giftCardAmount, String giftCardNumber, String additionalPaymentMethod, Double additionalPaymentAmount, String paymentMode) {
        // Build order create DTO
        OrderCreateDTO orderCreate = new OrderCreateDTO();
        orderCreate.setTenantId(appointment.getTenantId());
        orderCreate.setCustomerId(appointment.getCustomerId());
        orderCreate.setAppointmentId(appointment.getId());
        // Convert payment method to lowercase for database ENUM compatibility
        // Frontend sends: CASH, PACKAGE, CREDIT_CARD etc.
        // Database expects: cash, package, credit_card etc.
        orderCreate.setPaymentMethod(paymentMethod != null ? paymentMethod.toLowerCase() : null);

        // Get resource info from appointment resources
        if (appointment.getAppointmentResources() != null && !appointment.getAppointmentResources().isEmpty()) {
            com.merchant.server.businessservice.entity.AppointmentResource firstResource =
                appointment.getAppointmentResources().get(0);
            orderCreate.setResourceId(firstResource.getResourceId());
            orderCreate.setResourceType(firstResource.getResourceType() != null ?
                firstResource.getResourceType().name() : null);
        }

        // Build service list from appointment services
        List<OrderServiceCreateDTO> orderServices = new ArrayList<>();
        if (appointment.getAppointmentServices() != null && !appointment.getAppointmentServices().isEmpty()) {
            for (com.merchant.server.businessservice.entity.AppointmentService appointmentService : appointment.getAppointmentServices()) {
                OrderServiceCreateDTO orderService = new OrderServiceCreateDTO();
                orderService.setServiceId(appointmentService.getServiceId());
                orderService.setQuantity(1); // Appointment services are typically 1 quantity

                // Add resource info if available
                if (appointment.getAppointmentResources() != null && !appointment.getAppointmentResources().isEmpty()) {
                    com.merchant.server.businessservice.entity.AppointmentResource resource =
                        appointment.getAppointmentResources().get(0);
                    orderService.setAssignedResourceId(resource.getResourceId());
                    orderService.setAssignedResourceType(resource.getResourceType() != null ?
                        resource.getResourceType().name() : null);
                }

                // Set payment method for this service (for multi-service mixed payment scenarios)
                if (servicePayments != null && !servicePayments.isEmpty()) {
                    // Multi-service scenario: find the payment method for this specific service
                    for (Map<String, Object> servicePayment : servicePayments) {
                        Long serviceId = servicePayment.get("serviceId") != null
                            ? Long.valueOf(servicePayment.get("serviceId").toString()) : null;
                        if (serviceId != null && serviceId.equals(appointmentService.getServiceId())) {
                            String servicePaymentMethod = (String) servicePayment.get("paymentMethod");
                            // Convert to lowercase for database ENUM compatibility
                            orderService.setPaymentMethod(servicePaymentMethod != null ? servicePaymentMethod.toLowerCase() : null);

                            // 提取礼品卡金额（如果有）
                            Object giftCardAmountObj = servicePayment.get("giftCardAmount");
                            if (giftCardAmountObj != null) {
                                if (giftCardAmountObj instanceof Number) {
                                    orderService.setGiftCardAmount(((Number) giftCardAmountObj).doubleValue());
                                } else {
                                    orderService.setGiftCardAmount(Double.valueOf(giftCardAmountObj.toString()));
                                }
                            }

                            // 提取礼品卡号（如果有）
                            String giftCardNumberStr = (String) servicePayment.get("giftCardNumber");
                            if (giftCardNumberStr != null && !giftCardNumberStr.trim().isEmpty()) {
                                orderService.setGiftCardNumber(giftCardNumberStr);
                            }

                            // 提取补充支付方式（如果有）
                            String additionalMethodStr = (String) servicePayment.get("additionalPaymentMethod");
                            if (additionalMethodStr != null && !additionalMethodStr.trim().isEmpty()) {
                                orderService.setAdditionalPaymentMethod(additionalMethodStr.toLowerCase());
                            }

                            // 提取补充支付金额（如果有）
                            Object additionalAmountObj = servicePayment.get("additionalPaymentAmount");
                            if (additionalAmountObj != null) {
                                if (additionalAmountObj instanceof Number) {
                                    orderService.setAdditionalPaymentAmount(((Number) additionalAmountObj).doubleValue());
                                } else {
                                    orderService.setAdditionalPaymentAmount(Double.valueOf(additionalAmountObj.toString()));
                                }
                            }

                            // 提取服务实际应付金额（混合支付场景下，用于普通支付方式）
                            Object serviceAmountObj = servicePayment.get("serviceAmount");
                            if (serviceAmountObj != null) {
                                if (serviceAmountObj instanceof Number) {
                                    orderService.setServiceAmount(((Number) serviceAmountObj).doubleValue());
                                } else {
                                    orderService.setServiceAmount(Double.valueOf(serviceAmountObj.toString()));
                                }
                            }

                            break;
                        }
                    }
                } else {
                    // Single service scenario: use the overall payment method
                    orderService.setPaymentMethod(paymentMethod != null ? paymentMethod.toLowerCase() : null);
                }

                orderServices.add(orderService);
            }
        }
        orderCreate.setServices(orderServices);

        // Set tax rate and tip from payment info
        orderCreate.setTaxRate(taxRate != null ? taxRate : 0.0);
        orderCreate.setTipAmount(tipAmount != null ? tipAmount : 0.0);
        orderCreate.setTipPercentage(tipPercentage != null ? tipPercentage : 0.0);

        // Set tip payment method (convert to lowercase for database ENUM compatibility)
        if (tipPaymentMethod != null && !tipPaymentMethod.trim().isEmpty()) {
            orderCreate.setTipPaymentMethod(tipPaymentMethod.toLowerCase());
        }

        // IMPORTANT: Set subtotal and totalAmount from frontend
        // These values already exclude package payments, so use them directly
        orderCreate.setSubtotal(subtotal);
        orderCreate.setTotalAmount(totalAmount);

        // Set gift card payment info if provided
        orderCreate.setGiftCardAmount(giftCardAmount);
        orderCreate.setGiftCardNumber(giftCardNumber);
        orderCreate.setAdditionalPaymentMethod(additionalPaymentMethod != null ? additionalPaymentMethod.toLowerCase() : null);
        orderCreate.setAdditionalPaymentAmount(additionalPaymentAmount);

        // Set notes if provided
        if (notes != null && !notes.trim().isEmpty()) {
            orderCreate.setNotes(notes);
        }

        // Set payment mode
        orderCreate.setPaymentMode(paymentMode);

        // Create the order
        com.merchant.server.businessservice.dto.OrderDTO createdOrder = orderService.createOrder(orderCreate);

        log.info("[BUSINESS] Order created - orderId: {}, appointmentId: {}, totalAmount: {}",
            createdOrder.getId(), appointment.getId(), totalAmount);

        // Update order status to completed and paid
        // Since the payment is already processed, the order should be marked as completed
        com.merchant.server.businessservice.entity.Order order = orderMapper.selectById(createdOrder.getId());
        if (order != null) {
            order.setOrderStatus("completed");
            order.setPaymentStatus("paid");
            order.setCompletedAt(LocalDateTime.now(ZoneOffset.UTC));
            order.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
            orderMapper.updateById(order);
        }
    }
}