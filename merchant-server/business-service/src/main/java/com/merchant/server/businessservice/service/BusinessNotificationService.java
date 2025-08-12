package com.merchant.server.businessservice.service;

import com.merchant.server.businessservice.entity.Appointment;
import com.merchant.server.businessservice.entity.BusinessNotification;
import com.merchant.server.businessservice.entity.Customer;
import com.merchant.server.businessservice.mapper.BusinessNotificationMapper;
import com.merchant.server.businessservice.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * 业务通知服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BusinessNotificationService {
    
    private final BusinessNotificationMapper notificationMapper;
    private final AppointmentService appointmentService;
    
    /**
     * 创建新预约通知
     */
    public void createNewAppointmentNotification(Appointment appointment, Customer customer, String serviceName) {
        BusinessNotification notification = BusinessNotification.builder()
                .tenantId(appointment.getTenantId())
                .notificationType("NEW_APPOINTMENT")
                .title("新预约提醒")
                .content(String.format("%s %s预约了%s的%s", 
                    customer.getLastName(), customer.getFirstName(),
                    appointment.getAppointmentDate() + " " + appointment.getAppointmentTime(),
                    serviceName))
                .level("INFO")
                .businessId(appointment.getId().toString())
                .businessType("APPOINTMENT")
                .relatedPerson(customer.getLastName() + customer.getFirstName())
                .relatedService(serviceName)
                .relatedTime(LocalDateTime.of(
                    LocalDate.parse(appointment.getAppointmentDate().toString()),
                    LocalTime.parse(appointment.getAppointmentTime().toString())))
                .isRead(false)
                .deleted(false)
                .build();
        
        notificationMapper.insert(notification);
        log.info("Created new appointment notification for appointment ID: {}", appointment.getId());
    }
    
    /**
     * 创建预约取消通知
     */
    public void createAppointmentCancelledNotification(Appointment appointment, Customer customer, String serviceName) {
        BusinessNotification notification = BusinessNotification.builder()
                .tenantId(appointment.getTenantId())
                .notificationType("APPOINTMENT_CANCELLED")
                .title("预约取消提醒")
                .content(String.format("%s %s取消了%s的%s预约", 
                    customer.getLastName(), customer.getFirstName(),
                    appointment.getAppointmentDate() + " " + appointment.getAppointmentTime(),
                    serviceName))
                .level("WARNING")
                .businessId(appointment.getId().toString())
                .businessType("APPOINTMENT")
                .relatedPerson(customer.getLastName() + customer.getFirstName())
                .relatedService(serviceName)
                .relatedTime(LocalDateTime.of(
                    LocalDate.parse(appointment.getAppointmentDate().toString()),
                    LocalTime.parse(appointment.getAppointmentTime().toString())))
                .isRead(false)
                .deleted(false)
                .build();
        
        notificationMapper.insert(notification);
        log.info("Created appointment cancelled notification for appointment ID: {}", appointment.getId());
    }
    
    /**
     * 创建预约确认通知
     */
    public void createAppointmentConfirmedNotification(Appointment appointment, Customer customer, String serviceName) {
        BusinessNotification notification = BusinessNotification.builder()
                .tenantId(appointment.getTenantId())
                .notificationType("APPOINTMENT_CONFIRMED")
                .title("预约确认提醒")
                .content(String.format("%s %s的%s预约已确认，时间：%s", 
                    customer.getLastName(), customer.getFirstName(),
                    serviceName,
                    appointment.getAppointmentDate() + " " + appointment.getAppointmentTime()))
                .level("SUCCESS")
                .businessId(appointment.getId().toString())
                .businessType("APPOINTMENT")
                .relatedPerson(customer.getLastName() + customer.getFirstName())
                .relatedService(serviceName)
                .relatedTime(LocalDateTime.of(
                    LocalDate.parse(appointment.getAppointmentDate().toString()),
                    LocalTime.parse(appointment.getAppointmentTime().toString())))
                .isRead(false)
                .deleted(false)
                .build();
        
        notificationMapper.insert(notification);
        log.info("Created appointment confirmed notification for appointment ID: {}", appointment.getId());
    }
    
    /**
     * 创建预约即将开始提醒（30分钟前）
     */
    public void createAppointmentReminderNotification(Appointment appointment, Customer customer, String serviceName) {
        BusinessNotification notification = BusinessNotification.builder()
                .tenantId(appointment.getTenantId())
                .notificationType("APPOINTMENT_REMINDER")
                .title("预约即将开始")
                .content(String.format("%s %s的%s预约将在30分钟后开始", 
                    customer.getLastName(), customer.getFirstName(),
                    serviceName))
                .level("WARNING")
                .businessId(appointment.getId().toString())
                .businessType("APPOINTMENT")
                .relatedPerson(customer.getLastName() + customer.getFirstName())
                .relatedService(serviceName)
                .relatedTime(LocalDateTime.of(
                    LocalDate.parse(appointment.getAppointmentDate().toString()),
                    LocalTime.parse(appointment.getAppointmentTime().toString())))
                .isRead(false)
                .deleted(false)
                .build();
        
        notificationMapper.insert(notification);
        log.info("Created appointment reminder notification for appointment ID: {}", appointment.getId());
    }
    
    /**
     * 创建待确认预约通知
     */
    public void createPendingConfirmationNotification(Long tenantId, int pendingCount) {
        BusinessNotification notification = BusinessNotification.builder()
                .tenantId(tenantId)
                .notificationType("PENDING_CONFIRMATION")
                .title("待确认预约提醒")
                .content(String.format("有%d个预约待确认，请及时处理", pendingCount))
                .level("WARNING")
                .businessType("APPOINTMENT")
                .isRead(false)
                .deleted(false)
                .build();
        
        notificationMapper.insert(notification);
        log.info("Created pending confirmation notification for tenant: {}", tenantId);
    }
    
    /**
     * 获取最近的通知
     */
    public List<BusinessNotification> getRecentNotifications(Long tenantId, Integer limit) {
        return notificationMapper.getRecentNotifications(tenantId, limit != null ? limit : 10);
    }
    
    /**
     * 获取未读通知数量
     */
    public Integer getUnreadCount(Long tenantId) {
        return notificationMapper.getUnreadCount(tenantId);
    }
    
    /**
     * 获取指定时间后的通知
     */
    public List<BusinessNotification> getNotificationsAfter(Long tenantId, LocalDateTime afterTime) {
        return notificationMapper.getNotificationsAfter(tenantId, afterTime);
    }
    
    /**
     * 标记通知为已读
     */
    @Transactional
    public void markAsRead(Long tenantId, List<Long> notificationIds) {
        if (notificationIds != null && !notificationIds.isEmpty()) {
            String ids = String.join(",", notificationIds.stream()
                .map(String::valueOf)
                .toArray(String[]::new));
            notificationMapper.markAsRead(tenantId, ids);
        }
    }
    
    /**
     * 定时任务：检查即将开始的预约并生成提醒
     * 每5分钟执行一次
     */
    @Scheduled(fixedDelay = 300000) // 5分钟
    public void checkUpcomingAppointments() {
        try {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime thirtyMinutesLater = now.plusMinutes(30);
            
            // 获取所有30分钟后即将开始的预约
            List<Appointment> upcomingAppointments = appointmentService.getUpcomingAppointments(
                thirtyMinutesLater.toLocalDate().toString(),
                thirtyMinutesLater.toLocalTime().format(DateTimeFormatter.ofPattern("HH:mm"))
            );
            
            for (Appointment appointment : upcomingAppointments) {
                // 检查是否已经发送过提醒
                if (!hasRecentReminder(appointment.getId())) {
                    Customer customer = appointmentService.getCustomerById(appointment.getCustomerId());
                    // 获取第一个服务的ID（预约可能包含多个服务）
                    List<com.merchant.server.businessservice.entity.AppointmentService> services = appointment.getAppointmentServices();
                    Long serviceId = services != null && !services.isEmpty() ? services.get(0).getServiceId() : null;
                    String serviceName = serviceId != null ? appointmentService.getServiceName(serviceId) : "Unknown Service";
                    createAppointmentReminderNotification(appointment, customer, serviceName);
                }
            }
        } catch (Exception e) {
            log.error("Error checking upcoming appointments", e);
        }
    }
    
    /**
     * 检查是否已经发送过最近的提醒
     */
    private boolean hasRecentReminder(Long appointmentId) {
        // 检查最近1小时内是否已经发送过提醒
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        List<BusinessNotification> recentReminders = notificationMapper.selectByBusinessIdAndType(
            appointmentId.toString(),
            "APPOINTMENT_REMINDER",
            oneHourAgo
        );
        return !recentReminders.isEmpty();
    }
}