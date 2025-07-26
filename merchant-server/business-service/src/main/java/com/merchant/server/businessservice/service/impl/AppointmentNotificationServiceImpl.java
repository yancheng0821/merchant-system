package com.merchant.server.businessservice.service.impl;

import com.merchant.server.businessservice.client.NotificationClient;
import com.merchant.server.businessservice.dto.AppointmentNotificationDTO;
import com.merchant.server.businessservice.entity.Appointment;
import com.merchant.server.businessservice.entity.Customer;
import com.merchant.server.businessservice.entity.Resource;
import com.merchant.server.businessservice.mapper.CustomerMapper;
import com.merchant.server.businessservice.mapper.ResourceMapper;
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
    
    @Value("${business.name:美容院}")
    private String businessName;
    
    @Value("${business.address:}")
    private String businessAddress;
    
    @Value("${business.phone:}")
    private String businessPhone;

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

            // 获取资源信息
            Resource resource = null;
            if (appointment.getResourceId() != null) {
                resource = resourceMapper.findById(appointment.getResourceId());
            }

            // 构建通知DTO
            AppointmentNotificationDTO notification = new AppointmentNotificationDTO();
            notification.setAppointmentId(appointment.getId());
            notification.setTenantId(appointment.getTenantId());
            notification.setCustomerId(customer.getId());
            notification.setCustomerName(customer.getFullName());
            notification.setCustomerPhone(customer.getPhone());
            notification.setCustomerEmail(customer.getEmail());
            notification.setCommunicationPreference(customer.getCommunicationPreference().name());
            
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
            
            // 获取服务名称（简化处理，实际可能需要查询服务详情）
            notification.setServiceName("美容服务");
            
            notification.setBusinessName(businessName);
            notification.setBusinessAddress(businessAddress);
            notification.setBusinessPhone(businessPhone);
            
            return notification;
            
        } catch (Exception e) {
            log.error("Error building notification DTO for appointment: {}", appointment.getId(), e);
            return null;
        }
    }
}