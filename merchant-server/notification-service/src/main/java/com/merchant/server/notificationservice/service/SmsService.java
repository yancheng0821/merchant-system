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
                log.warn("⚠️  短信超长 - {}字符，将分割发送", content.length());
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

            log.info("📱 发送短信 - 手机号: {}, 内容: {}", formattedPhoneNumber, content);

            PublishResponse response = getSnsClient().publish(request);

            log.info("✅ 短信已发送 - AWS SNS [MessageId: {}]", response.messageId());

            return true;
            
        } catch (SnsException e) {
            log.error("❌ AWS SNS错误 - 手机号: {}, 错误: {} ({})",
                phoneNumber, e.awsErrorDetails().errorMessage(), e.awsErrorDetails().errorCode());
            return false;
        } catch (Exception e) {
            log.error("❌ 短信发送异常 - 手机号: {}, 错误: {}", phoneNumber, e.getMessage());
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
     * 格式化电话号码，直接使用原始号码，不添加国家代码
     */
    private String formatPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            throw new IllegalArgumentException("电话号码不能为空");
        }
        
        // 清理号码，只保留数字和+号
        String cleanNumber = phoneNumber.replaceAll("[^0-9+]", "");
        
        // 直接返回清理后的号码，不添加任何前缀
        return cleanNumber;
    }
}