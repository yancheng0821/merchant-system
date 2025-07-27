package com.merchant.server.businessservice.service;

import com.merchant.server.businessservice.dto.AppointmentNotificationDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * 本地通知服务 - 作为远程通知服务的降级方案
 */
@Service
@Slf4j
public class LocalNotificationService {
    
    /**
     * 发送预约确认通知（本地处理）
     */
    public void sendAppointmentConfirmation(AppointmentNotificationDTO notification) {
        log.info("📧 本地通知服务 - 预约确认通知");
        log.info("客户：{}", notification.getCustomerName());
        log.info("预约时间：{} {}", notification.getAppointmentDate(), notification.getAppointmentTime());
        log.info("服务项目：{}", notification.getServiceName());
        log.info("通知方式：{}", notification.getCommunicationPreference());
        
        sendNotificationByPreference(notification, "预约确认", 
            buildConfirmationEmailContent(notification), 
            buildConfirmationSmsContent(notification));
    }
    
    /**
     * 发送预约取消通知（本地处理）
     */
    public void sendAppointmentCancellation(AppointmentNotificationDTO notification) {
        log.info("📧 本地通知服务 - 预约取消通知");
        log.info("客户：{}", notification.getCustomerName());
        log.info("预约时间：{} {}", notification.getAppointmentDate(), notification.getAppointmentTime());
        log.info("通知方式：{}", notification.getCommunicationPreference());
        
        sendNotificationByPreference(notification, "预约取消", 
            buildCancellationEmailContent(notification), 
            buildCancellationSmsContent(notification));
    }
    
    /**
     * 发送预约完成通知（本地处理）
     */
    public void sendAppointmentCompletion(AppointmentNotificationDTO notification) {
        log.info("📧 本地通知服务 - 预约完成通知");
        log.info("客户：{}", notification.getCustomerName());
        log.info("预约时间：{} {}", notification.getAppointmentDate(), notification.getAppointmentTime());
        log.info("通知方式：{}", notification.getCommunicationPreference());
        
        sendNotificationByPreference(notification, "服务完成", 
            buildCompletionEmailContent(notification), 
            buildCompletionSmsContent(notification));
    }
    
    /**
     * 根据通信偏好发送通知
     */
    private void sendNotificationByPreference(AppointmentNotificationDTO notification, 
                                            String emailSubject, 
                                            String emailContent, 
                                            String smsContent) {
        String preference = notification.getCommunicationPreference();
        
        if ("BOTH".equalsIgnoreCase(preference)) {
            // 同时发送邮件和短信
            log.info("🔄 发送双重通知（邮件+短信）给客户：{}", notification.getCustomerName());
            
            // 发送邮件（如果有邮箱地址）
            if (notification.getCustomerEmail() != null && !notification.getCustomerEmail().trim().isEmpty()) {
                sendEmailLocally(notification, emailSubject, emailContent);
            } else {
                log.warn("⚠️ 客户没有邮箱地址，跳过邮件发送：{}", notification.getCustomerName());
            }
            
            // 发送短信（如果有手机号）
            if (notification.getCustomerPhone() != null && !notification.getCustomerPhone().trim().isEmpty()) {
                sendSmsLocally(notification, smsContent);
            } else {
                log.warn("⚠️ 客户没有手机号，跳过短信发送：{}", notification.getCustomerName());
            }
            
        } else if ("EMAIL".equalsIgnoreCase(preference)) {
            // 只发送邮件
            if (notification.getCustomerEmail() != null && !notification.getCustomerEmail().trim().isEmpty()) {
                sendEmailLocally(notification, emailSubject, emailContent);
            } else {
                log.warn("⚠️ 客户偏好邮件但没有邮箱地址，改为发送短信：{}", notification.getCustomerName());
                sendSmsLocally(notification, smsContent);
            }
            
        } else {
            // 默认发送短信
            if (notification.getCustomerPhone() != null && !notification.getCustomerPhone().trim().isEmpty()) {
                sendSmsLocally(notification, smsContent);
            } else {
                log.warn("⚠️ 客户没有手机号，尝试发送邮件：{}", notification.getCustomerName());
                if (notification.getCustomerEmail() != null && !notification.getCustomerEmail().trim().isEmpty()) {
                    sendEmailLocally(notification, emailSubject, emailContent);
                } else {
                    log.error("❌ 客户既没有手机号也没有邮箱，无法发送通知：{}", notification.getCustomerName());
                }
            }
        }
    }
    
    private void sendEmailLocally(AppointmentNotificationDTO notification, String subject, String content) {
        log.info("📧 发送邮件到：{}", notification.getCustomerEmail());
        log.info("📧 邮件主题：{}", subject);
        log.info("📧 邮件内容：{}", content);
        // 这里可以集成实际的邮件发送服务
    }
    
    private void sendSmsLocally(AppointmentNotificationDTO notification, String content) {
        log.info("📱 发送短信到：{}", notification.getCustomerPhone());
        log.info("📱 短信内容：{}", content);
        // 这里可以集成实际的短信发送服务
    }
    
    private String buildConfirmationEmailContent(AppointmentNotificationDTO notification) {
        return String.format(
            "尊敬的%s，\n\n" +
            "您的预约已确认！\n\n" +
            "预约详情：\n" +
            "时间：%s %s\n" +
            "服务：%s\n" +
            "时长：%d分钟\n" +
            "金额：¥%.2f\n\n" +
            "地址：%s\n" +
            "联系电话：%s\n\n" +
            "感谢您的信任！\n" +
            "%s",
            notification.getCustomerName(),
            notification.getAppointmentDate(),
            notification.getAppointmentTime(),
            notification.getServiceName(),
            notification.getDuration(),
            notification.getTotalAmount(),
            notification.getBusinessAddress(),
            notification.getBusinessPhone(),
            notification.getBusinessName()
        );
    }
    
    private String buildConfirmationSmsContent(AppointmentNotificationDTO notification) {
        return String.format(
            "【%s】尊敬的%s，您的预约已确认！时间：%s %s，服务：%s。地址：%s，电话：%s",
            notification.getBusinessName(),
            notification.getCustomerName(),
            notification.getAppointmentDate(),
            notification.getAppointmentTime(),
            notification.getServiceName(),
            notification.getBusinessAddress(),
            notification.getBusinessPhone()
        );
    }
    
    private String buildCancellationEmailContent(AppointmentNotificationDTO notification) {
        return String.format(
            "尊敬的%s，\n\n" +
            "很抱歉通知您，您的预约已被取消。\n\n" +
            "原预约详情：\n" +
            "时间：%s %s\n" +
            "服务：%s\n\n" +
            "如有疑问，请联系我们：%s\n\n" +
            "%s",
            notification.getCustomerName(),
            notification.getAppointmentDate(),
            notification.getAppointmentTime(),
            notification.getServiceName(),
            notification.getBusinessPhone(),
            notification.getBusinessName()
        );
    }
    
    private String buildCancellationSmsContent(AppointmentNotificationDTO notification) {
        return String.format(
            "【%s】尊敬的%s，您的预约（%s %s）已取消。如有疑问请联系：%s",
            notification.getBusinessName(),
            notification.getCustomerName(),
            notification.getAppointmentDate(),
            notification.getAppointmentTime(),
            notification.getBusinessPhone()
        );
    }
    
    private String buildCompletionEmailContent(AppointmentNotificationDTO notification) {
        return String.format(
            "尊敬的%s，\n\n" +
            "感谢您选择我们的服务！\n\n" +
            "服务详情：\n" +
            "时间：%s %s\n" +
            "服务：%s\n" +
            "金额：¥%.2f\n\n" +
            "期待您的再次光临！\n" +
            "%s",
            notification.getCustomerName(),
            notification.getAppointmentDate(),
            notification.getAppointmentTime(),
            notification.getServiceName(),
            notification.getTotalAmount(),
            notification.getBusinessName()
        );
    }
    
    private String buildCompletionSmsContent(AppointmentNotificationDTO notification) {
        return String.format(
            "【%s】尊敬的%s，感谢您选择我们的服务！服务：%s，金额：¥%.2f。期待您的再次光临！",
            notification.getBusinessName(),
            notification.getCustomerName(),
            notification.getServiceName(),
            notification.getTotalAmount()
        );
    }
}