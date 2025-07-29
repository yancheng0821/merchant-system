package com.merchant.server.notificationservice.service;

import com.merchant.server.notificationservice.config.NotificationConfig;
import com.merchant.server.notificationservice.util.RetryUtil;
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
                // 验证区域配置
                if (awsConfig.getRegion() == null || awsConfig.getRegion().trim().isEmpty()) {
                    throw new IllegalArgumentException("AWS区域未配置");
                }
                
                if (awsConfig.isUseLocalCredentials()) {
                    // 使用本地AWS CLI配置的凭证
                    snsClient = SnsClient.builder()
                        .region(Region.of(awsConfig.getRegion()))
                        .credentialsProvider(DefaultCredentialsProvider.create())
                        .build();
                    log.info("AWS SNS客户端初始化成功（使用本地凭证），区域：{}", awsConfig.getRegion());
                } else {
                    // 验证凭证配置
                    if (awsConfig.getAccessKeyId() == null || awsConfig.getAccessKeyId().trim().isEmpty()) {
                        throw new IllegalArgumentException("AWS Access Key ID未配置");
                    }
                    if (awsConfig.getSecretAccessKey() == null || awsConfig.getSecretAccessKey().trim().isEmpty()) {
                        throw new IllegalArgumentException("AWS Secret Access Key未配置");
                    }
                    
                    // 使用配置文件中的凭证
                    AwsBasicCredentials awsCreds = AwsBasicCredentials.create(
                        awsConfig.getAccessKeyId(),
                        awsConfig.getSecretAccessKey()
                    );
                    snsClient = SnsClient.builder()
                        .region(Region.of(awsConfig.getRegion()))
                        .credentialsProvider(StaticCredentialsProvider.create(awsCreds))
                        .build();
                    log.info("AWS SNS客户端初始化成功（使用配置凭证），区域：{}", awsConfig.getRegion());
                }
            } catch (Exception e) {
                log.error("初始化AWS SNS客户端失败", e);
                throw new RuntimeException("AWS SNS服务初始化失败: " + e.getMessage(), e);
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
        
        // 如果启用了Mock模式，直接使用Mock发送
        if (notificationConfig.getMock().isEnabled()) {
            return sendSmsViaMock(phoneNumber, content);
        }
        
        String provider = notificationConfig.getSms().getProvider();
        
        switch (provider.toLowerCase()) {
            case "aws":
                return sendSmsViaAwsWithRetry(phoneNumber, content);
            case "mock":
                return sendSmsViaMock(phoneNumber, content);
            default:
                log.warn("未知的短信服务提供商：{}，使用Mock模式", provider);
                return sendSmsViaMock(phoneNumber, content);
        }
    }
    
    /**
     * 带重试机制的AWS短信发送
     */
    private boolean sendSmsViaAwsWithRetry(String phoneNumber, String content) {
        NotificationConfig.Aws awsConfig = notificationConfig.getAws();
        
        return RetryUtil.executeWithRetryBoolean(
            () -> sendSmsViaAws(phoneNumber, content),
            awsConfig.getMaxRetries(),
            awsConfig.getRetryDelayMs(),
            "AWS SNS短信发送"
        );
    }
    
    private boolean sendSmsViaAws(String phoneNumber, String content) {
        try {
            NotificationConfig.Aws.Sns snsConfig = notificationConfig.getAws().getSns();
            
            // 验证输入参数
            if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
                log.error("手机号码不能为空");
                return false;
            }
            
            if (content == null || content.trim().isEmpty()) {
                log.error("短信内容不能为空");
                return false;
            }
            
            // 检查短信内容长度（SMS限制为160个字符）
            if (content.length() > 160) {
                log.warn("短信内容超过160字符，可能会被分割发送，长度：{}", content.length());
            }
            
            // 确保电话号码格式正确（包含国家代码）
            String formattedPhoneNumber = formatPhoneNumber(phoneNumber);
            
            // 设置SMS属性
            Map<String, MessageAttributeValue> smsAttributes = new HashMap<>();
            
            // 设置发送者ID（如果配置了）
            if (snsConfig.getDefaultSenderId() != null && !snsConfig.getDefaultSenderId().trim().isEmpty()) {
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
            
            // 设置最大价格（防止意外高费用）
            smsAttributes.put("AWS.SNS.SMS.MaxPrice", MessageAttributeValue.builder()
                .stringValue("0.50") // 最大0.5美元每条短信
                .dataType("Number")
                .build());
            
            PublishRequest request = PublishRequest.builder()
                .phoneNumber(formattedPhoneNumber)
                .message(content)
                .messageAttributes(smsAttributes)
                .build();
            
            PublishResponse response = getSnsClient().publish(request);
            
            log.info("AWS SNS短信发送成功，手机号：{}，MessageId：{}", phoneNumber, response.messageId());
            return true;
            
        } catch (SnsException e) {
            log.error("AWS SNS服务异常，手机号：{}，错误代码：{}，错误信息：{}", 
                phoneNumber, e.awsErrorDetails().errorCode(), e.awsErrorDetails().errorMessage(), e);
            return false;
        } catch (Exception e) {
            log.error("AWS SNS短信发送失败，手机号：{}", phoneNumber, e);
            return false;
        }
    }
    
    private boolean sendSmsViaMock(String phoneNumber, String content) {
        NotificationConfig.Mock.MockSms mockConfig = notificationConfig.getMock().getSms();
        
        // 模拟发送延迟
        if (mockConfig.isSimulateDelay()) {
            try {
                Thread.sleep(mockConfig.getDelayMs());
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.warn("Mock短信发送延迟被中断");
            }
        }
        
        // 模拟成功率
        double random = Math.random();
        boolean success = random < mockConfig.getSuccessRate();
        
        if (success) {
            log.info("📱 Mock短信发送成功 - 手机号：{}，内容：{}", phoneNumber, content);
        } else {
            log.error("❌ Mock短信发送失败 - 手机号：{}，内容：{}（模拟失败）", phoneNumber, content);
        }
        
        return success;
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