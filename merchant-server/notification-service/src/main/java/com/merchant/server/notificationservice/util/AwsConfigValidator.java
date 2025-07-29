package com.merchant.server.notificationservice.util;

import com.merchant.server.notificationservice.config.NotificationConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
public class AwsConfigValidator {
    
    /**
     * 验证AWS配置
     */
    public List<String> validateAwsConfig(NotificationConfig config) {
        List<String> errors = new ArrayList<>();
        
        NotificationConfig.Aws awsConfig = config.getAws();
        
        // 验证基本配置
        if (awsConfig.getRegion() == null || awsConfig.getRegion().trim().isEmpty()) {
            errors.add("AWS区域未配置");
        }
        
        // 验证凭证配置
        if (!awsConfig.isUseLocalCredentials()) {
            if (awsConfig.getAccessKeyId() == null || awsConfig.getAccessKeyId().trim().isEmpty()) {
                errors.add("AWS Access Key ID未配置");
            }
            
            if (awsConfig.getSecretAccessKey() == null || awsConfig.getSecretAccessKey().trim().isEmpty()) {
                errors.add("AWS Secret Access Key未配置");
            }
        }
        
        // 验证SES配置
        if ("aws".equals(config.getEmail().getProvider())) {
            errors.addAll(validateSesConfig(awsConfig.getSes(), config.getEmail()));
        }
        
        // 验证SNS配置
        if ("aws".equals(config.getSms().getProvider())) {
            errors.addAll(validateSnsConfig(awsConfig.getSns()));
        }
        
        return errors;
    }
    
    /**
     * 验证SES配置
     */
    private List<String> validateSesConfig(NotificationConfig.Aws.Ses sesConfig, NotificationConfig.Email emailConfig) {
        List<String> errors = new ArrayList<>();
        
        String fromEmail = sesConfig.getFromEmail() != null ? sesConfig.getFromEmail() : emailConfig.getFrom();
        
        if (fromEmail == null || fromEmail.trim().isEmpty()) {
            errors.add("SES发件人邮箱未配置");
        } else if (!isValidEmail(fromEmail)) {
            errors.add("SES发件人邮箱格式无效：" + fromEmail);
        }
        
        return errors;
    }
    
    /**
     * 验证SNS配置
     */
    private List<String> validateSnsConfig(NotificationConfig.Aws.Sns snsConfig) {
        List<String> errors = new ArrayList<>();
        
        if (snsConfig.getDefaultMessageType() == null || snsConfig.getDefaultMessageType().trim().isEmpty()) {
            errors.add("SNS默认消息类型未配置");
        } else {
            String messageType = snsConfig.getDefaultMessageType().toLowerCase();
            if (!"transactional".equals(messageType) && !"promotional".equals(messageType)) {
                errors.add("SNS消息类型必须是Transactional或Promotional");
            }
        }
        
        return errors;
    }
    
    /**
     * 验证邮箱格式
     */
    private boolean isValidEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }
        
        String emailRegex = "^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,7}$";
        return email.matches(emailRegex);
    }
    
    /**
     * 验证配置并记录错误
     */
    public boolean validateAndLog(NotificationConfig config) {
        List<String> errors = validateAwsConfig(config);
        
        if (!errors.isEmpty()) {
            log.error("AWS配置验证失败：");
            for (String error : errors) {
                log.error("  - {}", error);
            }
            return false;
        }
        
        log.info("AWS配置验证通过");
        return true;
    }
}