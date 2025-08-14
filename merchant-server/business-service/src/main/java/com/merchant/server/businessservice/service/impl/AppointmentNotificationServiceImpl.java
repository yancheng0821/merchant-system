package com.merchant.server.businessservice.service.impl;

import com.merchant.server.businessservice.client.NotificationClient;
import com.merchant.server.businessservice.dto.AppointmentNotificationDTO;
import com.merchant.server.businessservice.entity.Appointment;
import com.merchant.server.businessservice.entity.AppointmentResource;
import com.merchant.server.businessservice.entity.Customer;
import com.merchant.server.businessservice.entity.Resource;
import com.merchant.server.businessservice.mapper.CustomerMapper;
import com.merchant.server.businessservice.mapper.ResourceMapper;
import com.merchant.server.businessservice.mapper.AppointmentMapper;
import com.merchant.server.businessservice.service.AppointmentNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentNotificationServiceImpl implements AppointmentNotificationService {

    private final NotificationClient notificationClient;
    private final CustomerMapper customerMapper;
    private final ResourceMapper resourceMapper;
    private final AppointmentMapper appointmentMapper;
    
    @Value("${business.name:美容院}")
    private String businessName;
    
    @Value("${business.address:}")
    private String businessAddress;
    
    @Value("${business.phone:}")
    private String businessPhone;
    
    @Value("${notification.enabled:true}")
    private boolean notificationEnabled;

    @Override
    public void sendConfirmationNotification(Appointment appointment) {
        log.info("Preparing confirmation notification for appointment: {}", appointment.getId());
        
        AppointmentNotificationDTO notification = buildNotificationDTO(appointment);
        if (notification != null) {
            notificationClient.sendAppointmentConfirmation(notification);
        }
    }

    @Override
    public void sendCancellationNotification(Appointment appointment) {
        log.info("Preparing cancellation notification for appointment: {}", appointment.getId());
        
        AppointmentNotificationDTO notification = buildNotificationDTO(appointment);
        if (notification != null) {
            notificationClient.sendAppointmentCancellation(notification);
        }
    }

    @Override
    public void sendCompletionNotification(Appointment appointment) {
        log.info("Preparing completion notification for appointment: {}", appointment.getId());
        
        AppointmentNotificationDTO notification = buildNotificationDTO(appointment);
        if (notification != null) {
            notificationClient.sendAppointmentCompletion(notification);
        }
    }

    @Override
    public void sendReminderNotification(Appointment appointment) {
        log.info("Preparing reminder notification for appointment: {}", appointment.getId());
        
        AppointmentNotificationDTO notification = buildNotificationDTO(appointment);
        if (notification != null) {
            notificationClient.sendAppointmentReminder(notification);
        }
    }

    private AppointmentNotificationDTO buildNotificationDTO(Appointment appointment) {
        try {
            // 获取客户信息
            Customer customer = customerMapper.selectById(appointment.getCustomerId());
            if (customer == null) {
                log.warn("Customer not found for appointment: {}", appointment.getId());
                return null;
            }

            // 获取资源信息（从appointmentResources中获取主要资源）
            Resource resource = null;
            if (appointment.getAppointmentResources() != null && !appointment.getAppointmentResources().isEmpty()) {
                // 获取主要资源（优先选择员工）
                AppointmentResource primaryResource = appointment.getAppointmentResources().stream()
                    .filter(ar -> ar.getIsPrimary() != null && ar.getIsPrimary())
                    .findFirst()
                    .orElse(appointment.getAppointmentResources().get(0));
                
                if (primaryResource != null) {
                    resource = resourceMapper.findById(primaryResource.getResourceId());
                }
            }

            // 构建通知DTO
            AppointmentNotificationDTO notification = new AppointmentNotificationDTO();
            notification.setAppointmentId(appointment.getId());
            notification.setTenantId(appointment.getTenantId());
            notification.setCustomerId(customer.getId());
            notification.setCustomerName(customer.getFullName());
            notification.setCustomerPhone(customer.getPhone());
            notification.setCustomerEmail(customer.getEmail());
            // 处理联系偏好：对于新客户或没有明确偏好的，同时发送邮件和短信
            String communicationPreference = determineCommunicationPreference(customer);
            notification.setCommunicationPreference(communicationPreference);
            
            notification.setAppointmentDate(appointment.getAppointmentDate());
            notification.setAppointmentTime(appointment.getAppointmentTime());
            notification.setDuration(appointment.getDuration());
            notification.setTotalAmount(appointment.getTotalAmount());
            notification.setStatus(appointment.getStatus().name());
            notification.setNotes(appointment.getNotes());
            
            if (resource != null) {
                notification.setResourceId(resource.getId());
                notification.setResourceType(resource.getType().name());
                notification.setResourceName(resource.getName());
            }
            
            // 获取服务名称
            String serviceName = "美容服务"; // 默认值
            try {
                if (appointment.getAppointmentServices() != null && !appointment.getAppointmentServices().isEmpty()) {
                    // 如果预约对象中已经包含服务信息，直接使用
                    serviceName = appointment.getAppointmentServices().stream()
                        .map(com.merchant.server.businessservice.entity.AppointmentService::getServiceName)
                        .reduce((s1, s2) -> s1 + ", " + s2)
                        .orElse("美容服务");
                } else {
                    // 否则从数据库查询
                    var appointmentServices = appointmentMapper.findAppointmentServicesByAppointmentId(appointment.getId());
                    if (appointmentServices != null && !appointmentServices.isEmpty()) {
                        serviceName = appointmentServices.stream()
                            .map(com.merchant.server.businessservice.entity.AppointmentService::getServiceName)
                            .reduce((s1, s2) -> s1 + ", " + s2)
                            .orElse("美容服务");
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to get service names for appointment: {}, using default", appointment.getId(), e);
            }
            notification.setServiceName(serviceName);
            
            notification.setBusinessName(businessName);
            notification.setBusinessAddress(businessAddress);
            notification.setBusinessPhone(businessPhone);
            
            return notification;
            
        } catch (Exception e) {
            log.error("Error building notification DTO for appointment: {}", appointment.getId(), e);
            return null;
        }
    }
    
    /**
     * 确定客户的通信偏好
     * 对于新客户或没有明确偏好的客户，返回"BOTH"表示同时发送邮件和短信
     */
    private String determineCommunicationPreference(Customer customer) {
        // 检查客户是否是新创建的（创建时间在最近5分钟内）
        boolean isNewCustomer = customer.getCreatedAt() != null && 
            customer.getCreatedAt().isAfter(java.time.LocalDateTime.now().minusMinutes(5));
        
        // 检查客户是否有有效的邮箱和手机号
        boolean hasEmail = customer.getEmail() != null && !customer.getEmail().trim().isEmpty();
        boolean hasPhone = customer.getPhone() != null && !customer.getPhone().trim().isEmpty();
        
        // 如果是新客户且同时有邮箱和手机号，同时发送两种通知
        if (isNewCustomer && hasEmail && hasPhone) {
            log.info("New customer detected for notification, will send both email and SMS: {}", customer.getFullName());
            return "BOTH";
        }
        
        // 如果客户没有设置通信偏好，但有邮箱和手机号，也同时发送
        if (customer.getCommunicationPreference() == null && hasEmail && hasPhone) {
            log.info("Customer has no communication preference, will send both email and SMS: {}", customer.getFullName());
            return "BOTH";
        }
        
        // 否则使用客户的偏好设置
        if (customer.getCommunicationPreference() != null) {
            return customer.getCommunicationPreference().name();
        }
        
        // 默认情况：如果有邮箱优先邮箱，否则短信
        if (hasEmail) {
            return "EMAIL";
        } else if (hasPhone) {
            return "SMS";
        } else {
            log.warn("Customer has no valid contact information: {}", customer.getFullName());
            return "SMS"; // 默认返回SMS
        }
    }
}