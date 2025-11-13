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

import com.aliyun.dysmsapi20170525.Client;
import com.aliyun.dysmsapi20170525.models.SendSmsRequest;
import com.aliyun.dysmsapi20170525.models.SendSmsResponse;
import com.aliyun.teaopenapi.models.Config;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class SmsService {
    
    @Autowired
    private NotificationConfig notificationConfig;

    private SnsClient snsClient;
    private Client aliyunSmsClient;
    
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

    private Client getAliyunSmsClient() {
        if (aliyunSmsClient == null) {
            NotificationConfig.Aliyun aliyunConfig = notificationConfig.getAliyun();

            try {
                // 验证配置
                if (aliyunConfig.getAccessKeyId() == null || aliyunConfig.getAccessKeyId().trim().isEmpty()) {
                    throw new IllegalArgumentException("阿里云 Access Key ID未配置");
                }
                if (aliyunConfig.getAccessKeySecret() == null || aliyunConfig.getAccessKeySecret().trim().isEmpty()) {
                    throw new IllegalArgumentException("阿里云 Access Key Secret未配置");
                }

                Config config = new Config()
                    .setAccessKeyId(aliyunConfig.getAccessKeyId())
                    .setAccessKeySecret(aliyunConfig.getAccessKeySecret())
                    .setEndpoint(aliyunConfig.getEndpoint());

                aliyunSmsClient = new Client(config);
            } catch (Exception e) {
                log.error("初始化阿里云短信客户端失败", e);
                throw new RuntimeException("阿里云短信服务初始化失败: " + e.getMessage(), e);
            }
        }
        return aliyunSmsClient;
    }

    /**
     * 发送短信 - 根据手机号国际码自动选择渠道
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

        // 根据手机号国际码选择渠道
        String formattedPhone = formatPhoneNumber(phoneNumber);
        String provider = selectProviderByPhoneNumber(formattedPhone);

        log.info("📱 短信路由 - 手机号: {}, 选择渠道: {}", formattedPhone, provider);

        switch (provider.toLowerCase()) {
            case "aliyun":
                return sendSmsViaAliyunWithRetry(phoneNumber, content, null, null);
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
     * 发送短信 - 支持场景和变量（用于阿里云多模板）
     * @param phoneNumber 手机号
     * @param scene 场景标识（如 LOGIN_2FA, APPOINTMENT_CONFIRMATION）
     * @param variables 模板变量
     */
    public boolean sendSms(String phoneNumber, String scene, Map<String, Object> variables) {
        if (!notificationConfig.getSms().isEnabled()) {
            log.info("短信服务已禁用，跳过发送");
            return true;
        }

        // 如果启用了Mock模式，直接使用Mock发送
        if (notificationConfig.getMock().isEnabled()) {
            String mockContent = variables != null ? variables.toString() : scene;
            return sendSmsViaMock(phoneNumber, mockContent);
        }

        // 根据手机号国际码选择渠道
        String formattedPhone = formatPhoneNumber(phoneNumber);
        String provider = selectProviderByPhoneNumber(formattedPhone);

        // 对于+86号码，如果是预约相关场景，跳过发送（阿里云审核不通过）
        if ("aliyun".equals(provider.toLowerCase()) && isAppointmentRelatedScene(scene)) {
            log.info("⏭️  跳过发送 - +86号码的预约相关短信已禁用（阿里云审核限制）- 手机号: {}, 场景: {}", formattedPhone, scene);
            return true; // 返回true避免影响业务流程
        }

        log.info("📱 短信路由 - 手机号: {}, 场景: {}, 选择渠道: {}", formattedPhone, scene, provider);

        switch (provider.toLowerCase()) {
            case "aliyun":
                return sendSmsViaAliyunWithRetry(phoneNumber, null, scene, variables);
            case "aws":
                // AWS 不需要模板，直接从变量中获取 message
                String awsContent = variables != null && variables.containsKey("message")
                    ? (String) variables.get("message")
                    : scene;
                return sendSmsViaAwsWithRetry(phoneNumber, awsContent);
            case "mock":
                String mockContent = variables != null ? variables.toString() : scene;
                return sendSmsViaMock(phoneNumber, mockContent);
            default:
                log.warn("未知的短信服务提供商：{}，使用Mock模式", provider);
                return sendSmsViaMock(phoneNumber, scene);
        }
    }

    /**
     * 判断是否是预约相关场景
     */
    private boolean isAppointmentRelatedScene(String scene) {
        if (scene == null) {
            return false;
        }
        return scene.equals("APPOINTMENT_CONFIRMATION")
            || scene.equals("APPOINTMENT_CANCELLATION")
            || scene.equals("APPOINTMENT_COMPLETION")
            || scene.equals("APPOINTMENT_REMINDER");
    }

    /**
     * 根据手机号国际码选择短信渠道
     * +86 使用阿里云，其他使用AWS
     */
    private String selectProviderByPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            log.warn("手机号为空，使用默认渠道: {}", notificationConfig.getSms().getProvider());
            return notificationConfig.getSms().getProvider();
        }

        // 检查是否是中国手机号 (+86)
        if (phoneNumber.startsWith("+86") || phoneNumber.startsWith("86")) {
            return "aliyun";
        }

        // 其他国家使用AWS
        return "aws";
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

    /**
     * 带重试机制的阿里云短信发送
     * @param phoneNumber 手机号
     * @param content 内容（如果是验证码等简单场景）
     * @param scene 场景标识（如果是多模板场景）
     * @param variables 模板变量（如果是多模板场景）
     */
    private boolean sendSmsViaAliyunWithRetry(String phoneNumber, String content, String scene, Map<String, Object> variables) {
        NotificationConfig.Aliyun aliyunConfig = notificationConfig.getAliyun();

        return RetryUtil.executeWithRetryBoolean(
            () -> sendSmsViaAliyun(phoneNumber, content, scene, variables),
            aliyunConfig.getMaxRetries(),
            aliyunConfig.getRetryDelayMs(),
            "阿里云短信发送"
        );
    }

    private boolean sendSmsViaAliyun(String phoneNumber, String content, String scene, Map<String, Object> variables) {
        try {
            NotificationConfig.Aliyun.Sms smsConfig = notificationConfig.getAliyun().getSms();

            // 验证输入参数
            if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
                log.error("手机号码不能为空");
                return false;
            }

            // 验证配置
            if (smsConfig.getSignName() == null || smsConfig.getSignName().trim().isEmpty()) {
                log.error("阿里云短信签名未配置");
                return false;
            }

            // 格式化手机号 - 阿里云需要去掉+86前缀
            String formattedPhoneNumber = formatPhoneNumberForAliyun(phoneNumber);

            // 确定使用的模板CODE和参数
            String templateCode;
            String templateParam;

            if (scene != null && variables != null) {
                // 使用场景模板
                templateCode = getTemplateCodeByScene(scene, smsConfig);
                templateParam = buildTemplateParamByScene(scene, variables);
                log.info("📱 发送短信 - 手机号: {}, 场景: {}, 签名: {}, 模板: {}",
                    formattedPhoneNumber, scene, smsConfig.getSignName(), templateCode);
            } else {
                // 使用默认验证码模板
                if (content == null || content.trim().isEmpty()) {
                    log.error("短信内容不能为空");
                    return false;
                }

                templateCode = smsConfig.getTemplateCode();
                if (templateCode == null || templateCode.trim().isEmpty()) {
                    log.error("阿里云短信模板CODE未配置");
                    return false;
                }

                // 从内容中提取验证码
                String verificationCode = extractVerificationCode(content);
                if (verificationCode == null || verificationCode.isEmpty()) {
                    log.error("无法从内容中提取验证码: {}", content);
                    return false;
                }

                if (verificationCode.length() > 20) {
                    log.error("验证码长度超过20个字符限制: {}", verificationCode);
                    return false;
                }

                templateParam = "{\"code\":\"" + verificationCode + "\"}";
                log.info("📱 发送短信 - 手机号: {}, 签名: {}, 模板: {}, 验证码: {}",
                    formattedPhoneNumber, smsConfig.getSignName(), templateCode, verificationCode);
            }

            SendSmsRequest request = new SendSmsRequest()
                .setPhoneNumbers(formattedPhoneNumber)
                .setSignName(smsConfig.getSignName())
                .setTemplateCode(templateCode)
                .setTemplateParam(templateParam);

            SendSmsResponse response = getAliyunSmsClient().sendSms(request);

            if ("OK".equals(response.getBody().getCode())) {
                log.info("✅ 短信已发送 - 阿里云 [BizId: {}]", response.getBody().getBizId());
                return true;
            } else {
                log.error("❌ 阿里云短信发送失败 - Code: {}, Message: {}",
                    response.getBody().getCode(), response.getBody().getMessage());
                return false;
            }

        } catch (Exception e) {
            log.error("❌ 阿里云短信发送异常 - 手机号: {}, 错误: {}", phoneNumber, e.getMessage(), e);
            return false;
        }
    }

    /**
     * 根据场景获取模板CODE
     */
    private String getTemplateCodeByScene(String scene, NotificationConfig.Aliyun.Sms smsConfig) {
        // 从场景映射中获取模板CODE
        String templateCode = smsConfig.getSceneTemplates().get(scene);

        if (templateCode == null || templateCode.trim().isEmpty()) {
            // 如果没有配置场景模板，使用默认验证码模板
            log.warn("场景 {} 未配置阿里云模板，使用默认模板", scene);
            return smsConfig.getTemplateCode();
        }

        return templateCode;
    }

    /**
     * 根据场景构建模板参数
     * 将英文变量名映射为阿里云模板的中文变量名
     * 注意：阿里云仅支持验证码场景，预约相关场景已禁用
     */
    private String buildTemplateParamByScene(String scene, Map<String, Object> variables) {
        Map<String, String> params = new HashMap<>();

        switch (scene) {
            case "LOGIN_2FA":
            case "PACKAGE_VERIFICATION":
                // 验证码场景：${code}
                params.put("code", getStringValue(variables, "code"));
                break;

            default:
                // 其他场景尝试提取 code（兼容处理）
                String code = getStringValue(variables, "code");
                if (code != null && !code.isEmpty()) {
                    params.put("code", code);
                }
                break;
        }

        // 转换为JSON格式
        return convertToJson(params);
    }

    /**
     * 从变量Map中获取字符串值
     */
    private String getStringValue(Map<String, Object> variables, String key) {
        if (variables == null || !variables.containsKey(key)) {
            return "";
        }

        Object value = variables.get(key);
        return value != null ? value.toString() : "";
    }

    /**
     * 将Map转换为JSON字符串，并进行转义
     */
    private String convertToJson(Map<String, String> params) {
        StringBuilder json = new StringBuilder("{");
        boolean first = true;

        for (Map.Entry<String, String> entry : params.entrySet()) {
            if (!first) {
                json.append(",");
            }
            first = false;

            String value = entry.getValue()
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");

            json.append("\"").append(entry.getKey()).append("\":\"").append(value).append("\"");
        }

        json.append("}");
        return json.toString();
    }

    /**
     * 从短信内容中提取验证码
     * 支持多种格式：
     * - "Your verification code is: 123456. Valid for 5 minutes."
     * - "123456"
     * - "验证码：123456"
     * - "您的验证码是 123456"
     */
    private String extractVerificationCode(String content) {
        if (content == null || content.trim().isEmpty()) {
            return null;
        }

        // 提取 4-8 位数字（常见验证码长度）
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\b(\\d{4,8})\\b");
        java.util.regex.Matcher matcher = pattern.matcher(content);

        if (matcher.find()) {
            return matcher.group(1);
        }

        // 如果内容本身就是纯数字，直接返回
        if (content.trim().matches("^\\d{4,8}$")) {
            return content.trim();
        }

        return null;
    }

    /**
     * 格式化阿里云手机号 - 去掉+86前缀，只保留11位数字
     */
    private String formatPhoneNumberForAliyun(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            throw new IllegalArgumentException("电话号码不能为空");
        }

        // 清理号码，只保留数字
        String cleanNumber = phoneNumber.replaceAll("[^0-9]", "");

        // 如果是86开头的，去掉86前缀
        if (cleanNumber.startsWith("86") && cleanNumber.length() > 11) {
            cleanNumber = cleanNumber.substring(2);
        }

        return cleanNumber;
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