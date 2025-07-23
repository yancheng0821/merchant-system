package com.merchant.server.notificationservice.service;

import com.merchant.server.notificationservice.config.NotificationConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class SmsService {
    
    @Autowired
    private NotificationConfig notificationConfig;
    
    private SnsClient snsClient;
    
    private SnsClient getSnsClient() {
        if (snsClient == null) {
            NotificationConfig.Aws awsConfig = notificationConfig.getAws();
            
            try {
                if (awsConfig.isUseLocalCredentials()) {
                    // 使用本地AWS CLI配置的凭证
                    snsClient = SnsClient.builder()
                        .region(Region.of(awsConfig.getRegion()))
                        .credentialsProvider(DefaultCredentialsProvider.create())
                        .build();
                } else {
                    // 使用配置文件中的凭证
                    AwsBasicCredentials awsCreds = AwsBasicCredentials.create(
                        awsConfig.getAccessKeyId(),
                        awsConfig.getSecretAccessKey()
                    );
                    snsClient = SnsClient.builder()
                        .region(Region.of(awsConfig.getRegion()))
                        .credentialsProvider(StaticCredentialsProvider.create(awsCreds))
                        .build();
                }
                log.info("AWS SNS客户端初始化成功，区域：{}", awsConfig.getRegion());
            } catch (Exception e) {
                log.error("初始化AWS SNS客户端失败", e);
                throw new RuntimeException("AWS SNS服务初始化失败", e);
            }
        }
        return snsClient;
    }
    
    /**
     * 发送短信
     */
    public boolean sendSms(String phoneNumber, String content) {
        if (!notificationConfig.getSms().isEnabled()) {
            log.info("短信服务已禁用，跳过发送");
            return true;
        }
        
        String provider = notificationConfig.getSms().getProvider();
        
        switch (provider.toLowerCase()) {
            case "aws":
                return sendSmsViaAws(phoneNumber, content);
            case "mock":
                return sendSmsViaMock(phoneNumber, content);
            default:
                log.warn("未知的短信服务提供商：{}，使用Mock模式", provider);
                return sendSmsViaMock(phoneNumber, content);
        }
    }
    
    private boolean sendSmsViaAws(String phoneNumber, String content) {
        try {
            NotificationConfig.Aws.Sns snsConfig = notificationConfig.getAws().getSns();
            
            // 确保电话号码格式正确（包含国家代码）
            String formattedPhoneNumber = formatPhoneNumber(phoneNumber);
            
            // 设置SMS属性
            Map<String, MessageAttributeValue> smsAttributes = new HashMap<>();
            
            // 设置发送者ID（如果配置了）
            if (snsConfig.getDefaultSenderId() != null) {
                smsAttributes.put("AWS.SNS.SMS.SenderID", MessageAttributeValue.builder()
                    .stringValue(snsConfig.getDefaultSenderId())
                    .dataType("String")
                    .build());
            }
            
            // 设置消息类型
            smsAttributes.put("AWS.SNS.SMS.SMSType", MessageAttributeValue.builder()
                .stringValue(snsConfig.getDefaultMessageType())
                .dataType("String")
                .build());
            
            PublishRequest request = PublishRequest.builder()
                .phoneNumber(formattedPhoneNumber)
                .message(content)
                .messageAttributes(smsAttributes)
                .build();
            
            PublishResponse response = getSnsClient().publish(request);
            
            log.info("AWS SNS短信发送成功，手机号：{}，MessageId：{}", phoneNumber, response.messageId());
            return true;
            
        } catch (Exception e) {
            log.error("AWS SNS短信发送失败，手机号：{}", phoneNumber, e);
            return false;
        }
    }
    
    private boolean sendSmsViaMock(String phoneNumber, String content) {
        log.info("Mock短信发送 - 手机号：{}，内容：{}", phoneNumber, content);
        return true;
    }
    
    /**
     * 格式化电话号码，确保包含国家代码
     * 中国手机号码需要添加+86前缀
     */
    private String formatPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            throw new IllegalArgumentException("电话号码不能为空");
        }
        
        String cleanNumber = phoneNumber.replaceAll("[^0-9+]", "");
        
        // 如果已经包含+号，直接返回
        if (cleanNumber.startsWith("+")) {
            return cleanNumber;
        }
        
        // 中国手机号码处理
        if (cleanNumber.length() == 11 && cleanNumber.startsWith("1")) {
            return "+86" + cleanNumber;
        }
        
        // 如果是86开头的13位号码
        if (cleanNumber.length() == 13 && cleanNumber.startsWith("86")) {
            return "+" + cleanNumber;
        }
        
        // 默认添加+86前缀（假设是中国号码）
        return "+86" + cleanNumber;
    }
}