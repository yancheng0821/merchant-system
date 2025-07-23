package com.merchant.server.notificationservice.service.impl;

import com.merchant.server.notificationservice.dto.SendNotificationRequest;
import com.merchant.server.notificationservice.entity.NotificationLog;
import com.merchant.server.notificationservice.entity.NotificationTemplate;
import com.merchant.server.notificationservice.mapper.NotificationLogMapper;
import com.merchant.server.notificationservice.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final TemplateService templateService;
    private final EmailService emailService;
    private final SmsService smsService;
    private final NotificationLogMapper notificationLogMapper;

    @Override
    public NotificationLog sendNotification(SendNotificationRequest request) {
        log.info("Sending notification: {} to {}", request.getTemplateCode(), request.getRecipient());
        
        NotificationLog notificationLog = new NotificationLog();
        notificationLog.setTenantId(request.getTenantId());
        notificationLog.setTemplateCode(request.getTemplateCode());
        notificationLog.setType(request.getType());
        notificationLog.setRecipient(request.getRecipient());
        notificationLog.setBusinessId(request.getBusinessId());
        notificationLog.setBusinessType(request.getBusinessType());
        notificationLog.setCreatedAt(LocalDateTime.now());
        
        try {
            // 获取模板
            List<NotificationTemplate> templates = templateService.getTemplatesByCodeAndTenantId(
                request.getTemplateCode(), request.getTenantId());
            
            NotificationTemplate template = templates.stream()
                .filter(t -> t.getType() == request.getType())
                .findFirst()
                .orElse(null);
            
            if (template == null) {
                notificationLog.setStatus(NotificationLog.NotificationStatus.FAILED);
                notificationLog.setErrorMessage("Template not found: " + request.getTemplateCode() + " for type: " + request.getType());
                notificationLogMapper.insert(notificationLog);
                return notificationLog;
            }
            
            // 替换模板变量
            String content = replaceTemplateVariables(template.getContent(), request.getVariables());
            String subject = template.getSubject() != null ? 
                replaceTemplateVariables(template.getSubject(), request.getVariables()) : null;
            
            notificationLog.setContent(content);
            notificationLog.setSubject(subject);
            
            // 发送通知
            boolean success = false;
            if (request.getType() == NotificationTemplate.NotificationType.EMAIL) {
                success = emailService.sendEmail(request.getRecipient(), subject, content);
            } else if (request.getType() == NotificationTemplate.NotificationType.SMS) {
                success = smsService.sendSms(request.getRecipient(), content);
            }
            
            if (success) {
                notificationLog.setStatus(NotificationLog.NotificationStatus.SENT);
                notificationLog.setSentAt(LocalDateTime.now());
            } else {
                notificationLog.setStatus(NotificationLog.NotificationStatus.FAILED);
                notificationLog.setErrorMessage("Failed to send notification");
            }
            
        } catch (Exception e) {
            log.error("Error sending notification", e);
            notificationLog.setStatus(NotificationLog.NotificationStatus.FAILED);
            notificationLog.setErrorMessage(e.getMessage());
        }
        
        notificationLogMapper.insert(notificationLog);
        return notificationLog;
    }

    @Override
    public List<NotificationLog> sendBatchNotifications(List<SendNotificationRequest> requests) {
        log.info("Sending batch notifications, count: {}", requests.size());
        
        List<NotificationLog> results = new ArrayList<>();
        for (SendNotificationRequest request : requests) {
            try {
                NotificationLog result = sendNotification(request);
                results.add(result);
            } catch (Exception e) {
                log.error("Error sending batch notification", e);
                NotificationLog errorLog = new NotificationLog();
                errorLog.setTenantId(request.getTenantId());
                errorLog.setTemplateCode(request.getTemplateCode());
                errorLog.setType(request.getType());
                errorLog.setRecipient(request.getRecipient());
                errorLog.setStatus(NotificationLog.NotificationStatus.FAILED);
                errorLog.setErrorMessage(e.getMessage());
                errorLog.setCreatedAt(LocalDateTime.now());
                results.add(errorLog);
            }
        }
        
        return results;
    }

    @Override
    public void retryFailedNotifications() {
        log.info("Retrying failed notifications");
        
        List<NotificationLog> failedLogs = notificationLogMapper.findFailedNotifications();
        
        for (NotificationLog failedLog : failedLogs) {
            try {
                boolean success = false;
                if (failedLog.getType() == NotificationTemplate.NotificationType.EMAIL) {
                    success = emailService.sendEmail(failedLog.getRecipient(), failedLog.getSubject(), failedLog.getContent());
                } else if (failedLog.getType() == NotificationTemplate.NotificationType.SMS) {
                    success = smsService.sendSms(failedLog.getRecipient(), failedLog.getContent());
                }
                
                if (success) {
                    failedLog.setStatus(NotificationLog.NotificationStatus.SENT);
                    failedLog.setSentAt(LocalDateTime.now());
                    failedLog.setRetryCount(failedLog.getRetryCount() + 1);
                    notificationLogMapper.update(failedLog);
                    log.info("Successfully retried notification: {}", failedLog.getId());
                }
                
            } catch (Exception e) {
                log.error("Error retrying notification: {}", failedLog.getId(), e);
                failedLog.setRetryCount(failedLog.getRetryCount() + 1);
                failedLog.setErrorMessage(e.getMessage());
                notificationLogMapper.update(failedLog);
            }
        }
    }

    @Override
    public List<NotificationLog> getNotificationsByBusinessId(String businessId) {
        return notificationLogMapper.findByBusinessId(businessId);
    }

    @Override
    public List<NotificationLog> getNotificationsByTenantId(Long tenantId, int page, int size) {
        int offset = page * size;
        return notificationLogMapper.findByTenantIdWithPaging(tenantId, offset, size);
    }

    @Override
    public List<NotificationLog> getNotificationsByTenantIdWithFilters(Long tenantId, int page, int size, 
            String templateCode, String type, String status, String recipient, String businessId) {
        int offset = page * size;
        return notificationLogMapper.findByTenantIdWithFilters(tenantId, offset, size, 
            templateCode, type, status, recipient, businessId);
    }

    /**
     * 替换模板变量
     * 支持 ${variableName} 格式的变量替换
     */
    private String replaceTemplateVariables(String template, Map<String, Object> variables) {
        if (template == null || variables == null || variables.isEmpty()) {
            return template;
        }
        
        String result = template;
        Pattern pattern = Pattern.compile("\\$\\{([^}]+)\\}");
        Matcher matcher = pattern.matcher(template);
        
        while (matcher.find()) {
            String variableName = matcher.group(1);
            Object value = variables.get(variableName);
            if (value != null) {
                result = result.replace("${" + variableName + "}", value.toString());
            }
        }
        
        return result;
    }
}