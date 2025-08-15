package com.merchant.server.businessservice.service;

import com.merchant.server.businessservice.config.NotificationTemplates;
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
     * @param language 语言代码 (zh 或 en)
     */
    public void createNewAppointmentNotification(Appointment appointment, Customer customer, String serviceName, String language) {
        // 使用传入的语言参数，如果为空则使用默认值
        if (language == null || language.isEmpty()) {
            language = "zh-CN";
        }
        // 将 zh 转换为 zh-CN, en 转换为 en-US
        if ("zh".equals(language)) {
            language = "zh-CN";
        } else if ("en".equals(language)) {
            language = "en-US";
        }
        String title = NotificationTemplates.getTemplate(language, "NEW_APPOINTMENT_TITLE");
        String contentTemplate = NotificationTemplates.getTemplate(language, "NEW_APPOINTMENT_CONTENT");
        
        String content;
        if ("en-US".equals(language) || "en".equals(language)) {
            content = String.format(contentTemplate,
                customer.getFirstName(), customer.getLastName(),
                serviceName,
                appointment.getAppointmentDate(),
                appointment.getAppointmentTime());
        } else {
            content = String.format(contentTemplate,
                customer.getLastName(), customer.getFirstName(),
                appointment.getAppointmentDate() + " " + appointment.getAppointmentTime(),
                serviceName);
        }
        
        BusinessNotification notification = BusinessNotification.builder()
                .tenantId(appointment.getTenantId())
                .notificationType("NEW_APPOINTMENT")
                .title(title)
                .content(content)
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
     * @param language 语言代码 (zh 或 en)
     */
    public void createAppointmentCancelledNotification(Appointment appointment, Customer customer, String serviceName, String language) {
        // 使用传入的语言参数，如果为空则使用默认值
        if (language == null || language.isEmpty()) {
            language = "zh-CN";
        }
        // 将 zh 转换为 zh-CN, en 转换为 en-US
        if ("zh".equals(language)) {
            language = "zh-CN";
        } else if ("en".equals(language)) {
            language = "en-US";
        }
        String title = NotificationTemplates.getTemplate(language, "APPOINTMENT_CANCELLED_TITLE");
        String contentTemplate = NotificationTemplates.getTemplate(language, "APPOINTMENT_CANCELLED_CONTENT");
        
        String content;
        if ("en-US".equals(language) || "en".equals(language)) {
            content = String.format(contentTemplate,
                customer.getFirstName(), customer.getLastName(),
                serviceName,
                appointment.getAppointmentDate(),
                appointment.getAppointmentTime());
        } else {
            content = String.format(contentTemplate,
                customer.getLastName(), customer.getFirstName(),
                appointment.getAppointmentDate() + " " + appointment.getAppointmentTime(),
                serviceName);
        }
        
        BusinessNotification notification = BusinessNotification.builder()
                .tenantId(appointment.getTenantId())
                .notificationType("APPOINTMENT_CANCELLED")
                .title(title)
                .content(content)
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
     * @param language 语言代码 (zh 或 en)
     */
    public void createAppointmentConfirmedNotification(Appointment appointment, Customer customer, String serviceName, String language) {
        // 使用传入的语言参数，如果为空则使用默认值
        if (language == null || language.isEmpty()) {
            language = "zh-CN";
        }
        // 将 zh 转换为 zh-CN, en 转换为 en-US
        if ("zh".equals(language)) {
            language = "zh-CN";
        } else if ("en".equals(language)) {
            language = "en-US";
        }
        String title = NotificationTemplates.getTemplate(language, "APPOINTMENT_CONFIRMED_TITLE");
        String contentTemplate = NotificationTemplates.getTemplate(language, "APPOINTMENT_CONFIRMED_CONTENT");
        
        String content;
        if ("en-US".equals(language) || "en".equals(language)) {
            content = String.format(contentTemplate,
                customer.getFirstName(), customer.getLastName(),
                serviceName,
                appointment.getAppointmentDate(),
                appointment.getAppointmentTime());
        } else {
            content = String.format(contentTemplate,
                customer.getLastName(), customer.getFirstName(),
                serviceName,
                appointment.getAppointmentDate() + " " + appointment.getAppointmentTime());
        }
        
        BusinessNotification notification = BusinessNotification.builder()
                .tenantId(appointment.getTenantId())
                .notificationType("APPOINTMENT_CONFIRMED")
                .title(title)
                .content(content)
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
     * @param language 语言代码 (zh 或 en)
     */
    public void createAppointmentReminderNotification(Appointment appointment, Customer customer, String serviceName, String language) {
        // 使用传入的语言参数，如果为空则使用默认值
        if (language == null || language.isEmpty()) {
            language = "zh-CN";
        }
        // 将 zh 转换为 zh-CN, en 转换为 en-US
        if ("zh".equals(language)) {
            language = "zh-CN";
        } else if ("en".equals(language)) {
            language = "en-US";
        }
        String title = NotificationTemplates.getTemplate(language, "APPOINTMENT_REMINDER_TITLE");
        String contentTemplate = NotificationTemplates.getTemplate(language, "APPOINTMENT_REMINDER_CONTENT");
        
        String content;
        if ("en-US".equals(language) || "en".equals(language)) {
            content = String.format(contentTemplate,
                customer.getFirstName(), customer.getLastName(),
                serviceName);
        } else {
            content = String.format(contentTemplate,
                customer.getLastName(), customer.getFirstName(),
                serviceName);
        }
        
        BusinessNotification notification = BusinessNotification.builder()
                .tenantId(appointment.getTenantId())
                .notificationType("APPOINTMENT_REMINDER")
                .title(title)
                .content(content)
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
     * @param language 语言代码 (zh 或 en)
     */
    public void createPendingConfirmationNotification(Long tenantId, int pendingCount, String language) {
        // 使用传入的语言参数，如果为空则使用默认值
        if (language == null || language.isEmpty()) {
            language = "zh-CN";
        }
        // 将 zh 转换为 zh-CN, en 转换为 en-US
        if ("zh".equals(language)) {
            language = "zh-CN";
        } else if ("en".equals(language)) {
            language = "en-US";
        }
        String title = NotificationTemplates.getTemplate(language, "PENDING_CONFIRMATION_TITLE");
        String contentTemplate = NotificationTemplates.getTemplate(language, "PENDING_CONFIRMATION_CONTENT");
        String content = String.format(contentTemplate, pendingCount);
        
        BusinessNotification notification = BusinessNotification.builder()
                .tenantId(tenantId)
                .notificationType("PENDING_CONFIRMATION")
                .title(title)
                .content(content)
                .level("WARNING")
                .businessType("APPOINTMENT")
                .isRead(false)
                .deleted(false)
                .build();
        
        notificationMapper.insert(notification);
        log.info("Created pending confirmation notification for tenant: {}", tenantId);
    }
    
    /**
     * 创建支付成功通知
     * @param language 语言代码 (zh 或 en)
     */
    public void createPaymentSuccessNotification(Long tenantId, String orderId, Double amount, String language) {
        // 使用传入的语言参数，如果为空则使用默认值
        if (language == null || language.isEmpty()) {
            language = "zh-CN";
        }
        // 将 zh 转换为 zh-CN, en 转换为 en-US
        if ("zh".equals(language)) {
            language = "zh-CN";
        } else if ("en".equals(language)) {
            language = "en-US";
        }
        String title = NotificationTemplates.getTemplate(language, "PAYMENT_SUCCESS_TITLE");
        String contentTemplate = NotificationTemplates.getTemplate(language, "PAYMENT_SUCCESS_CONTENT");
        String content = String.format(contentTemplate, orderId, amount);
        
        BusinessNotification notification = BusinessNotification.builder()
                .tenantId(tenantId)
                .notificationType("PAYMENT_SUCCESS")
                .title(title)
                .content(content)
                .level("SUCCESS")
                .businessId(orderId)
                .businessType("ORDER")
                .isRead(false)
                .deleted(false)
                .build();
        
        notificationMapper.insert(notification);
        log.info("Created payment success notification for order: {}", orderId);
    }
    
    /**
     * 创建支付失败通知
     * @param language 语言代码 (zh 或 en)
     */
    public void createPaymentFailedNotification(Long tenantId, String orderId, String language) {
        // 使用传入的语言参数，如果为空则使用默认值
        if (language == null || language.isEmpty()) {
            language = "zh-CN";
        }
        // 将 zh 转换为 zh-CN, en 转换为 en-US
        if ("zh".equals(language)) {
            language = "zh-CN";
        } else if ("en".equals(language)) {
            language = "en-US";
        }
        String title = NotificationTemplates.getTemplate(language, "PAYMENT_FAILED_TITLE");
        String contentTemplate = NotificationTemplates.getTemplate(language, "PAYMENT_FAILED_CONTENT");
        String content = String.format(contentTemplate, orderId);
        
        BusinessNotification notification = BusinessNotification.builder()
                .tenantId(tenantId)
                .notificationType("PAYMENT_FAILED")
                .title(title)
                .content(content)
                .level("ERROR")
                .businessId(orderId)
                .businessType("ORDER")
                .isRead(false)
                .deleted(false)
                .build();
        
        notificationMapper.insert(notification);
        log.info("Created payment failed notification for order: {}", orderId);
    }
    
    /**
     * 创建退款成功通知
     * @param language 语言代码 (zh 或 en)
     */
    public void createRefundSuccessNotification(Long tenantId, String orderId, Double amount, String language) {
        // 使用传入的语言参数，如果为空则使用默认值
        if (language == null || language.isEmpty()) {
            language = "zh-CN";
        }
        // 将 zh 转换为 zh-CN, en 转换为 en-US
        if ("zh".equals(language)) {
            language = "zh-CN";
        } else if ("en".equals(language)) {
            language = "en-US";
        }
        String title = NotificationTemplates.getTemplate(language, "REFUND_SUCCESS_TITLE");
        String contentTemplate = NotificationTemplates.getTemplate(language, "REFUND_SUCCESS_CONTENT");
        String content = String.format(contentTemplate, orderId, amount);
        
        BusinessNotification notification = BusinessNotification.builder()
                .tenantId(tenantId)
                .notificationType("REFUND_SUCCESS")
                .title(title)
                .content(content)
                .level("INFO")
                .businessId(orderId)
                .businessType("ORDER")
                .isRead(false)
                .deleted(false)
                .build();
        
        notificationMapper.insert(notification);
        log.info("Created refund success notification for order: {}", orderId);
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
                    // 获取服务名称（预约可能包含多个服务，取第一个）
                    List<com.merchant.server.businessservice.entity.AppointmentService> services = appointment.getAppointmentServices();
                    String serviceName = "Unknown Service";
                    if (services != null && !services.isEmpty()) {
                        // 直接从appointment_services表中获取已经保存的服务名称
                        serviceName = services.get(0).getServiceName();
                        if (serviceName == null || serviceName.isEmpty()) {
                            // 如果服务名称为空，尝试通过服务ID获取
                            Long serviceId = services.get(0).getServiceId();
                            if (serviceId != null) {
                                serviceName = appointmentService.getServiceName(serviceId);
                            }
                        }
                    }
                    // 定时任务默认使用中文
                    createAppointmentReminderNotification(appointment, customer, serviceName, "zh-CN");
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