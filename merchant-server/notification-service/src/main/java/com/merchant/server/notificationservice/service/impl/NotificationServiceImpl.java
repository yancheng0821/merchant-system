package com.merchant.server.notificationservice.service.impl;

import com.merchant.server.common.dto.ApiResponse;
import com.merchant.server.notificationservice.client.MerchantServiceClient;
import com.merchant.server.notificationservice.dto.SendNotificationRequest;
import com.merchant.server.notificationservice.entity.NotificationLog;
import com.merchant.server.notificationservice.entity.NotificationTemplate;
import com.merchant.server.notificationservice.mapper.NotificationLogMapper;
import com.merchant.server.notificationservice.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
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
    private final MerchantServiceClient merchantServiceClient;

    @Override
    public NotificationLog getNotificationLogById(Long id) {
        return notificationLogMapper.findById(id);
    }

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
        notificationLog.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));

        // 检查是否是 Walk-in Customer 的特殊号码
        if (isWalkInCustomerPhone(request.getRecipient())) {
            log.info("跳过给 Walk-in Customer 发送通知 (号码: {}), 直接标记为成功", request.getRecipient());
            notificationLog.setContent("Walk-in Customer - 无需发送通知");
            notificationLog.setSubject(request.getTemplateCode());
            notificationLog.setStatus(NotificationLog.NotificationStatus.SENT);
            notificationLog.setSentAt(LocalDateTime.now(ZoneOffset.UTC));
            notificationLogMapper.insert(notificationLog);
            return notificationLog;
        }

        try {
            // 获取模板
            List<NotificationTemplate> templates = templateService.getTemplatesByCodeAndTenantId(
                request.getTemplateCode(), request.getTenantId());
            
            NotificationTemplate template = templates.stream()
                .filter(t -> t.getType() == request.getType())
                .findFirst()
                .orElse(null);
            
            String content;
            String subject;

            if (template == null) {
                // 如果没有找到模板，尝试使用 variables 中的 subject 和 content（用于无模板场景）
                if (request.getVariables() != null &&
                    request.getVariables().containsKey("subject") &&
                    request.getVariables().containsKey("content")) {

                    subject = (String) request.getVariables().get("subject");
                    content = (String) request.getVariables().get("content");
                    log.info("Template '{}' not found, using direct content from variables", request.getTemplateCode());
                } else {
                    notificationLog.setStatus(NotificationLog.NotificationStatus.FAILED);
                    notificationLog.setErrorMessage("Template not found: " + request.getTemplateCode() + " for type: " + request.getType());
                    notificationLogMapper.insert(notificationLog);
                    return notificationLog;
                }
            } else {
                // 有模板，使用模板内容并替换变量
                content = replaceTemplateVariables(template.getContent(), request.getVariables());
                subject = template.getSubject() != null ?
                    replaceTemplateVariables(template.getSubject(), request.getVariables()) : null;
            }
            
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
                notificationLog.setSentAt(LocalDateTime.now(ZoneOffset.UTC));
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
                errorLog.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
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
            // 检查是否是 Walk-in Customer 的特殊号码，直接标记为成功
            if (isWalkInCustomerPhone(failedLog.getRecipient())) {
                log.info("跳过批量重试 Walk-in Customer 通知 (号码: {}), 直接标记为成功", failedLog.getRecipient());
                failedLog.setStatus(NotificationLog.NotificationStatus.SENT);
                failedLog.setSentAt(LocalDateTime.now(ZoneOffset.UTC));
                failedLog.setRetryCount(failedLog.getRetryCount() + 1);
                failedLog.setErrorMessage(null);
                notificationLogMapper.update(failedLog);
                continue;
            }

            try {
                boolean success = false;
                if (failedLog.getType() == NotificationTemplate.NotificationType.EMAIL) {
                    success = emailService.sendEmail(failedLog.getRecipient(), failedLog.getSubject(), failedLog.getContent());
                } else if (failedLog.getType() == NotificationTemplate.NotificationType.SMS) {
                    success = smsService.sendSms(failedLog.getRecipient(), failedLog.getContent());
                }

                if (success) {
                    failedLog.setStatus(NotificationLog.NotificationStatus.SENT);
                    failedLog.setSentAt(LocalDateTime.now(ZoneOffset.UTC));
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
    public NotificationLog retrySingleNotification(Long logId) {
        log.info("Retrying single notification: {}", logId);

        NotificationLog notificationLog = notificationLogMapper.findById(logId);
        if (notificationLog == null) {
            throw new RuntimeException("Notification log not found: " + logId);
        }

        Long tenantId = notificationLog.getTenantId();

        // 检查是否是 Walk-in Customer
        if (notificationLog.getType() == NotificationTemplate.NotificationType.EMAIL) {
            if (isWalkInCustomerEmail(notificationLog.getRecipient())) {
                log.info("Skip retry Walk-in Customer email: {}", notificationLog.getRecipient());
                notificationLog.setStatus(NotificationLog.NotificationStatus.SENT);
                notificationLog.setSentAt(LocalDateTime.now(ZoneOffset.UTC));
                notificationLog.setRetryCount(notificationLog.getRetryCount() + 1);
                notificationLog.setErrorMessage(null);
                notificationLog.setContent("Walk-in Customer - Email skipped");
                notificationLogMapper.update(notificationLog);
                return notificationLog;
            }
        } else if (notificationLog.getType() == NotificationTemplate.NotificationType.SMS) {
            if (isWalkInCustomerPhone(notificationLog.getRecipient())) {
                log.info("Skip retry Walk-in Customer SMS: {}", notificationLog.getRecipient());
                notificationLog.setStatus(NotificationLog.NotificationStatus.SENT);
                notificationLog.setSentAt(LocalDateTime.now(ZoneOffset.UTC));
                notificationLog.setRetryCount(notificationLog.getRetryCount() + 1);
                notificationLog.setErrorMessage(null);
                notificationLog.setContent("Walk-in Customer - SMS skipped");
                notificationLogMapper.update(notificationLog);
                return notificationLog;
            }
        }

        // 检查用量限制
        if (tenantId != null) {
            if (notificationLog.getType() == NotificationTemplate.NotificationType.EMAIL) {
                if (!checkEmailLimit(tenantId)) {
                    log.warn("Email limit exceeded for tenant: {}", tenantId);
                    notificationLog.setRetryCount(notificationLog.getRetryCount() + 1);
                    notificationLog.setErrorMessage("Monthly email quota exceeded");
                    notificationLogMapper.update(notificationLog);
                    return notificationLog;
                }
            } else if (notificationLog.getType() == NotificationTemplate.NotificationType.SMS) {
                if (!checkSmsLimit(tenantId)) {
                    log.warn("SMS limit exceeded for tenant: {}", tenantId);
                    notificationLog.setRetryCount(notificationLog.getRetryCount() + 1);
                    notificationLog.setErrorMessage("SMS not included in plan or monthly quota exceeded");
                    notificationLogMapper.update(notificationLog);
                    return notificationLog;
                }
            }
        }

        try {
            boolean success = false;
            if (notificationLog.getType() == NotificationTemplate.NotificationType.EMAIL) {
                success = emailService.sendEmail(notificationLog.getRecipient(),
                    notificationLog.getSubject(), notificationLog.getContent());
            } else if (notificationLog.getType() == NotificationTemplate.NotificationType.SMS) {
                success = smsService.sendSms(notificationLog.getRecipient(), notificationLog.getContent());
            }

            if (success) {
                notificationLog.setStatus(NotificationLog.NotificationStatus.SENT);
                notificationLog.setSentAt(LocalDateTime.now(ZoneOffset.UTC));
                notificationLog.setRetryCount(notificationLog.getRetryCount() + 1);
                notificationLog.setErrorMessage(null);
                log.info("Successfully retried notification: {}", logId);

                // 增加用量计数
                if (tenantId != null) {
                    try {
                        if (notificationLog.getType() == NotificationTemplate.NotificationType.EMAIL) {
                            merchantServiceClient.incrementEmailCount(tenantId);
                        } else if (notificationLog.getType() == NotificationTemplate.NotificationType.SMS) {
                            merchantServiceClient.incrementSmsCount(tenantId);
                        }
                    } catch (Exception e) {
                        log.warn("Failed to increment usage count for tenant: {}", tenantId, e);
                    }
                }
            } else {
                notificationLog.setRetryCount(notificationLog.getRetryCount() + 1);
                notificationLog.setErrorMessage("Retry failed");
                log.warn("Failed to retry notification: {}", logId);
            }

            notificationLogMapper.update(notificationLog);
            return notificationLog;

        } catch (Exception e) {
            log.error("Error retrying notification: {}", logId, e);
            notificationLog.setRetryCount(notificationLog.getRetryCount() + 1);
            notificationLog.setErrorMessage(e.getMessage());
            notificationLogMapper.update(notificationLog);
            throw new RuntimeException("Failed to retry notification: " + e.getMessage(), e);
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
            String templateCode, String type, String status, String recipient, String businessId, String businessType) {
        int offset = page * size;
        return notificationLogMapper.findByTenantIdWithFilters(tenantId, offset, size,
            templateCode, type, status, recipient, businessId, businessType);
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
        // 支持两种格式：{variableName} 和 ${variableName}
        Pattern pattern = Pattern.compile("\\$?\\{([^}]+)\\}");
        Matcher matcher = pattern.matcher(template);

        while (matcher.find()) {
            String fullMatch = matcher.group(0);  // {variableName} 或 ${variableName}
            String variableName = matcher.group(1);  // variableName
            Object value = variables.get(variableName);
            if (value != null) {
                result = result.replace(fullMatch, value.toString());
            }
        }

        return result;
    }

    /**
     * 检查是否是 Walk-in Customer 的特殊号码
     * Walk-in Customer 使用 0000000000 作为占位符号码
     * 支持格式: 0000000000, +10000000000, 10000000000
     */
    private boolean isWalkInCustomerPhone(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            return false;
        }

        // 清理号码，只保留数字
        String cleanNumber = phoneNumber.replaceAll("[^0-9]", "");

        // 检查是否全是0（长度至少10位）或者以10个0结尾（带国家代码的情况）
        return cleanNumber.matches("0{10,}") || cleanNumber.endsWith("0000000000");
    }

    /**
     * 检查是否是 Walk-in Customer 的邮箱
     * Walk-in Customer 邮箱格式: walkinXX@vamerchant.app（XX是商户ID）
     */
    private boolean isWalkInCustomerEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }
        return email.toLowerCase().matches("walkin\\d+@vamerchant\\.app");
    }

    /**
     * 检查邮件数量是否在限制内
     */
    private boolean checkEmailLimit(Long tenantId) {
        try {
            ApiResponse<Integer> limitResponse = merchantServiceClient.getTenantMaxEmailsPerMonth(tenantId);
            if (limitResponse == null || limitResponse.getData() == null) {
                return true; // 无法获取限制，允许发送
            }
            int maxEmails = limitResponse.getData();
            if (maxEmails == -1) {
                return true; // 无限制
            }

            ApiResponse<Map<String, Object>> statsResponse = merchantServiceClient.getCurrentMonthStats(tenantId);
            if (statsResponse == null || statsResponse.getData() == null) {
                return true;
            }
            int currentCount = ((Number) statsResponse.getData().getOrDefault("emailCount", 0)).intValue();
            return currentCount < maxEmails;
        } catch (Exception e) {
            log.warn("Failed to check email limit for tenant: {}", tenantId, e);
            return true; // 出错时允许发送
        }
    }

    /**
     * 检查短信数量是否在限制内
     */
    private boolean checkSmsLimit(Long tenantId) {
        try {
            ApiResponse<Integer> limitResponse = merchantServiceClient.getTenantMaxSmsPerMonth(tenantId);
            if (limitResponse == null || limitResponse.getData() == null) {
                return true;
            }
            int maxSms = limitResponse.getData();
            if (maxSms == 0) {
                return false; // 套餐不包含短信
            }
            if (maxSms == -1) {
                return true; // 无限制
            }

            ApiResponse<Map<String, Object>> statsResponse = merchantServiceClient.getCurrentMonthStats(tenantId);
            if (statsResponse == null || statsResponse.getData() == null) {
                return true;
            }
            int currentCount = ((Number) statsResponse.getData().getOrDefault("smsCount", 0)).intValue();
            return currentCount < maxSms;
        } catch (Exception e) {
            log.warn("Failed to check SMS limit for tenant: {}", tenantId, e);
            return true;
        }
    }
}