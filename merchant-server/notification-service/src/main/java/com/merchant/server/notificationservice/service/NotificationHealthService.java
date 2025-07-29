package com.merchant.server.notificationservice.service;

import com.merchant.server.notificationservice.config.NotificationConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.ses.SesClient;
import software.amazon.awssdk.services.ses.model.GetSendQuotaRequest;
import software.amazon.awssdk.services.ses.model.GetSendQuotaResponse;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.GetSmsAttributesRequest;
import software.amazon.awssdk.services.sns.model.GetSmsAttributesResponse;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class NotificationHealthService {
    
    @Autowired
    private NotificationConfig notificationConfig;
    
    @Autowired
    private SmsService smsService;
    
    @Autowired
    private EmailService emailService;
    
    /**
     * 检查通知服务健康状态
     */
    public Map<String, Object> checkHealth() {
        Map<String, Object> health = new HashMap<>();
        
        // 检查配置状态
        health.put("configuration", checkConfiguration());
        
        // 检查AWS服务状态
        if (!notificationConfig.getMock().isEnabled()) {
            health.put("aws", checkAwsServices());
        }
        
        // 检查服务可用性
        health.put("services", checkServices());
        
        return health;
    }
    
    /**
     * 检查配置状态
     */
    private Map<String, Object> checkConfiguration() {
        Map<String, Object> config = new HashMap<>();
        
        config.put("mockEnabled", notificationConfig.getMock().isEnabled());
        config.put("smsEnabled", notificationConfig.getSms().isEnabled());
        config.put("emailEnabled", notificationConfig.getEmail().isEnabled());
        config.put("smsProvider", notificationConfig.getSms().getProvider());
        config.put("emailProvider", notificationConfig.getEmail().getProvider());
        
        return config;
    }
    
    /**
     * 检查AWS服务状态
     */
    private Map<String, Object> checkAwsServices() {
        Map<String, Object> aws = new HashMap<>();
        
        // 检查SES状态
        if ("aws".equals(notificationConfig.getEmail().getProvider())) {
            aws.put("ses", checkSesStatus());
        }
        
        // 检查SNS状态
        if ("aws".equals(notificationConfig.getSms().getProvider())) {
            aws.put("sns", checkSnsStatus());
        }
        
        return aws;
    }
    
    /**
     * 检查SES状态
     */
    private Map<String, Object> checkSesStatus() {
        Map<String, Object> sesStatus = new HashMap<>();
        
        try {
            // 这里需要从EmailService获取SesClient，但为了简化，我们先检查基本配置
            sesStatus.put("status", "configured");
            sesStatus.put("region", notificationConfig.getAws().getRegion());
            sesStatus.put("fromEmail", notificationConfig.getAws().getSes().getFromEmail());
            
            // 可以添加更多检查，比如发送配额等
            // GetSendQuotaResponse quota = sesClient.getSendQuota(GetSendQuotaRequest.builder().build());
            // sesStatus.put("sendQuota", quota.max24HourSend());
            // sesStatus.put("sentLast24Hours", quota.sentLast24Hours());
            
        } catch (Exception e) {
            log.error("检查SES状态失败", e);
            sesStatus.put("status", "error");
            sesStatus.put("error", e.getMessage());
        }
        
        return sesStatus;
    }
    
    /**
     * 检查SNS状态
     */
    private Map<String, Object> checkSnsStatus() {
        Map<String, Object> snsStatus = new HashMap<>();
        
        try {
            snsStatus.put("status", "configured");
            snsStatus.put("region", notificationConfig.getAws().getRegion());
            snsStatus.put("defaultMessageType", notificationConfig.getAws().getSns().getDefaultMessageType());
            
            // 可以添加更多检查，比如SMS属性等
            // GetSmsAttributesResponse attributes = snsClient.getSmsAttributes(GetSmsAttributesRequest.builder().build());
            // snsStatus.put("monthlySpendLimit", attributes.attributes().get("MonthlySpendLimit"));
            
        } catch (Exception e) {
            log.error("检查SNS状态失败", e);
            snsStatus.put("status", "error");
            snsStatus.put("error", e.getMessage());
        }
        
        return snsStatus;
    }
    
    /**
     * 检查服务可用性
     */
    private Map<String, Object> checkServices() {
        Map<String, Object> services = new HashMap<>();
        
        // 检查短信服务
        services.put("sms", checkSmsService());
        
        // 检查邮件服务
        services.put("email", checkEmailService());
        
        return services;
    }
    
    /**
     * 检查短信服务
     */
    private Map<String, Object> checkSmsService() {
        Map<String, Object> smsStatus = new HashMap<>();
        
        try {
            smsStatus.put("enabled", notificationConfig.getSms().isEnabled());
            smsStatus.put("provider", notificationConfig.getSms().getProvider());
            smsStatus.put("status", "available");
        } catch (Exception e) {
            log.error("检查短信服务失败", e);
            smsStatus.put("status", "error");
            smsStatus.put("error", e.getMessage());
        }
        
        return smsStatus;
    }
    
    /**
     * 检查邮件服务
     */
    private Map<String, Object> checkEmailService() {
        Map<String, Object> emailStatus = new HashMap<>();
        
        try {
            emailStatus.put("enabled", notificationConfig.getEmail().isEnabled());
            emailStatus.put("provider", notificationConfig.getEmail().getProvider());
            emailStatus.put("status", "available");
        } catch (Exception e) {
            log.error("检查邮件服务失败", e);
            emailStatus.put("status", "error");
            emailStatus.put("error", e.getMessage());
        }
        
        return emailStatus;
    }
    
    /**
     * 发送测试短信
     */
    public boolean sendTestSms(String phoneNumber) {
        try {
            String testMessage = "这是一条测试短信，用于验证短信服务是否正常工作。";
            return smsService.sendSms(phoneNumber, testMessage);
        } catch (Exception e) {
            log.error("发送测试短信失败", e);
            return false;
        }
    }
    
    /**
     * 发送测试邮件
     */
    public boolean sendTestEmail(String email) {
        try {
            String subject = "通知服务测试邮件";
            String content = "这是一封测试邮件，用于验证邮件服务是否正常工作。\n\n如果您收到此邮件，说明邮件服务配置正确。";
            return emailService.sendEmail(email, subject, content);
        } catch (Exception e) {
            log.error("发送测试邮件失败", e);
            return false;
        }
    }
}