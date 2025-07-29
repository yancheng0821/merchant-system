package com.merchant.server.notificationservice.controller;

import com.merchant.server.notificationservice.config.NotificationConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/notification/aws-diagnostic")
public class AwsDiagnosticController {
    
    @Autowired
    private NotificationConfig notificationConfig;
    
    /**
     * 检查AWS SNS配置和权限
     */
    @GetMapping("/sns/check")
    public ResponseEntity<Map<String, Object>> checkSnsConfiguration() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            NotificationConfig.Aws awsConfig = notificationConfig.getAws();
            
            // 创建SNS客户端测试连接
            SnsClient snsClient = SnsClient.builder()
                .region(Region.of(awsConfig.getRegion()))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
            
            result.put("region", awsConfig.getRegion());
            result.put("useLocalCredentials", awsConfig.isUseLocalCredentials());
            result.put("defaultSenderId", awsConfig.getSns().getDefaultSenderId());
            result.put("defaultMessageType", awsConfig.getSns().getDefaultMessageType());
            
            // 测试SNS连接（通过尝试列出主题来验证权限）
            try {
                ListTopicsRequest listRequest = ListTopicsRequest.builder().build();
                ListTopicsResponse listResponse = snsClient.listTopics(listRequest);
                result.put("connectionTest", "success");
                result.put("topicCount", listResponse.topics().size());
                log.info("AWS SNS连接测试成功，区域：{}", awsConfig.getRegion());
            } catch (Exception e) {
                log.warn("AWS SNS连接测试失败，但这可能是正常的（权限限制）：{}", e.getMessage());
                result.put("connectionTest", "limited_permissions");
                result.put("connectionError", e.getMessage());
            }
            
            result.put("status", "success");
            result.put("message", "AWS SNS配置检查完成");
            
        } catch (Exception e) {
            log.error("AWS SNS配置检查失败", e);
            result.put("status", "error");
            result.put("message", "配置检查失败：" + e.getMessage());
            result.put("error", e.getClass().getSimpleName());
        }
        
        return ResponseEntity.ok(result);
    }
    
    /**
     * 发送测试短信并获取详细的发送状态
     */
    @PostMapping("/sns/test-with-details")
    public ResponseEntity<Map<String, Object>> testSmsWithDetails(@RequestBody Map<String, String> request) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            String phoneNumber = request.get("phoneNumber");
            String message = request.get("message");
            
            if (message == null || message.trim().isEmpty()) {
                message = "AWS SNS测试短信 - " + System.currentTimeMillis();
            }
            
            NotificationConfig.Aws awsConfig = notificationConfig.getAws();
            NotificationConfig.Aws.Sns snsConfig = awsConfig.getSns();
            
            SnsClient snsClient = SnsClient.builder()
                .region(Region.of(awsConfig.getRegion()))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
            
            // 设置SMS属性
            Map<String, MessageAttributeValue> smsAttributes = new HashMap<>();
            
            // 设置发送者ID
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
            
            // 设置最大价格
            smsAttributes.put("AWS.SNS.SMS.MaxPrice", MessageAttributeValue.builder()
                .stringValue("1.00")
                .dataType("Number")
                .build());
            
            PublishRequest publishRequest = PublishRequest.builder()
                .phoneNumber(phoneNumber)
                .message(message)
                .messageAttributes(smsAttributes)
                .build();
            
            PublishResponse response = snsClient.publish(publishRequest);
            
            result.put("success", true);
            result.put("messageId", response.messageId());
            result.put("phoneNumber", phoneNumber);
            result.put("message", message);
            result.put("region", awsConfig.getRegion());
            result.put("senderID", snsConfig.getDefaultSenderId());
            result.put("messageType", snsConfig.getDefaultMessageType());
            result.put("timestamp", System.currentTimeMillis());
            
            log.info("AWS SNS测试短信发送成功，MessageId：{}，手机号：{}", response.messageId(), phoneNumber);
            
        } catch (Exception e) {
            log.error("AWS SNS测试短信发送失败", e);
            result.put("success", false);
            result.put("error", e.getMessage());
            result.put("errorType", e.getClass().getSimpleName());
        }
        
        return ResponseEntity.ok(result);
    }
    
    /**
     * 检查手机号是否在沙盒模式的验证列表中
     */
    @GetMapping("/sns/sandbox-check")
    public ResponseEntity<Map<String, Object>> checkSandboxMode() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            result.put("message", "AWS SNS沙盒模式检查");
            result.put("info", "如果AWS账户处于沙盒模式，只能向已验证的手机号发送短信");
            result.put("solution", "请在AWS控制台中验证手机号或申请退出沙盒模式");
            result.put("verifyUrl", "https://console.aws.amazon.com/sns/v3/home#/mobile/text-messaging");
            
        } catch (Exception e) {
            result.put("error", e.getMessage());
        }
        
        return ResponseEntity.ok(result);
    }
    
    /**
     * 获取解决方案建议
     */
    @GetMapping("/solution-guide")
    public ResponseEntity<Map<String, Object>> getSolutionGuide() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            result.put("title", "AWS SES/SNS 沙盒模式解决方案");
            
            Map<String, Object> sesGuide = new HashMap<>();
            sesGuide.put("problem", "邮件发送失败：Email address is not verified");
            sesGuide.put("cause", "AWS SES处于沙盒模式，只能向已验证的邮箱地址发送邮件");
            sesGuide.put("solutions", java.util.Arrays.asList(
                "1. 验证发件人邮箱地址（" + notificationConfig.getEmail().getFrom() + "）",
                "2. 验证收件人邮箱地址（用于测试）",
                "3. 申请退出沙盒模式（生产环境推荐）"
            ));
            sesGuide.put("verifySteps", java.util.Arrays.asList(
                "1. 访问 AWS SES 控制台",
                "2. 选择 'Verified identities'",
                "3. 点击 'Create identity'",
                "4. 选择 'Email address'",
                "5. 输入邮箱地址并点击 'Create identity'",
                "6. 检查邮箱并点击验证链接"
            ));
            sesGuide.put("consoleUrl", "https://console.aws.amazon.com/ses/home#verified-senders-email:");
            
            Map<String, Object> snsGuide = new HashMap<>();
            snsGuide.put("problem", "短信发送可能受限");
            snsGuide.put("cause", "AWS SNS可能处于沙盒模式");
            snsGuide.put("solutions", java.util.Arrays.asList(
                "1. 验证测试手机号",
                "2. 申请退出沙盒模式"
            ));
            snsGuide.put("consoleUrl", "https://console.aws.amazon.com/sns/v3/home#/mobile/text-messaging");
            
            result.put("ses", sesGuide);
            result.put("sns", snsGuide);
            
            // 提供快速验证API
            result.put("quickActions", Map.of(
                "verifyEmail", "POST /api/notification/aws-diagnostic/ses/verify-email",
                "checkEmailStatus", "GET /api/notification/aws-diagnostic/ses/check-verification/{email}",
                "checkSandboxMode", "GET /api/notification/aws-diagnostic/ses/sandbox-check"
            ));
            
        } catch (Exception e) {
            result.put("error", e.getMessage());
        }
        
        return ResponseEntity.ok(result);
    }
    
    /**
     * 检查AWS SES配置和权限
     */
    @GetMapping("/ses/check")
    public ResponseEntity<Map<String, Object>> checkSesConfiguration() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            NotificationConfig.Aws awsConfig = notificationConfig.getAws();
            
            // 创建SES客户端
            software.amazon.awssdk.services.ses.SesClient sesClient = software.amazon.awssdk.services.ses.SesClient.builder()
                .region(software.amazon.awssdk.regions.Region.of(awsConfig.getRegion()))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
            
            result.put("region", awsConfig.getRegion());
            result.put("useLocalCredentials", awsConfig.isUseLocalCredentials());
            
            // 检查发送配额
            try {
                software.amazon.awssdk.services.ses.model.GetSendQuotaRequest quotaRequest = 
                    software.amazon.awssdk.services.ses.model.GetSendQuotaRequest.builder().build();
                software.amazon.awssdk.services.ses.model.GetSendQuotaResponse quotaResponse = 
                    sesClient.getSendQuota(quotaRequest);
                
                result.put("sendQuota", Map.of(
                    "max24HourSend", quotaResponse.max24HourSend(),
                    "maxSendRate", quotaResponse.maxSendRate(),
                    "sentLast24Hours", quotaResponse.sentLast24Hours()
                ));
                
                log.info("AWS SES发送配额：24小时最大发送量={}，最大发送速率={}，过去24小时已发送={}",
                    quotaResponse.max24HourSend(), quotaResponse.maxSendRate(), quotaResponse.sentLast24Hours());
                
            } catch (Exception e) {
                log.error("获取SES发送配额失败", e);
                result.put("quotaError", e.getMessage());
            }
            
            // 检查已验证的邮箱地址
            try {
                software.amazon.awssdk.services.ses.model.ListVerifiedEmailAddressesRequest verifiedRequest = 
                    software.amazon.awssdk.services.ses.model.ListVerifiedEmailAddressesRequest.builder().build();
                software.amazon.awssdk.services.ses.model.ListVerifiedEmailAddressesResponse verifiedResponse = 
                    sesClient.listVerifiedEmailAddresses(verifiedRequest);
                
                result.put("verifiedEmails", verifiedResponse.verifiedEmailAddresses());
                
                log.info("AWS SES已验证的邮箱地址：{}", verifiedResponse.verifiedEmailAddresses());
                
            } catch (Exception e) {
                log.error("获取已验证邮箱地址失败", e);
                result.put("verifiedEmailsError", e.getMessage());
            }
            
            result.put("status", "success");
            result.put("message", "AWS SES配置检查完成");
            
        } catch (Exception e) {
            log.error("AWS SES配置检查失败", e);
            result.put("status", "error");
            result.put("message", "配置检查失败：" + e.getMessage());
            result.put("error", e.getClass().getSimpleName());
        }
        
        return ResponseEntity.ok(result);
    }
    
    /**
     * 发送测试邮件并获取详细的发送状态
     */
    @PostMapping("/ses/test-with-details")
    public ResponseEntity<Map<String, Object>> testEmailWithDetails(@RequestBody Map<String, String> request) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            String email = request.get("email");
            String subject = request.get("subject");
            String content = request.get("content");
            
            if (subject == null || subject.trim().isEmpty()) {
                subject = "AWS SES测试邮件 - " + System.currentTimeMillis();
            }
            
            if (content == null || content.trim().isEmpty()) {
                content = "这是一封AWS SES测试邮件。\n\n发送时间：" + 
                    java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            }
            
            NotificationConfig.Aws awsConfig = notificationConfig.getAws();
            NotificationConfig.Aws.Ses sesConfig = awsConfig.getSes();
            
            software.amazon.awssdk.services.ses.SesClient sesClient = software.amazon.awssdk.services.ses.SesClient.builder()
                .region(software.amazon.awssdk.regions.Region.of(awsConfig.getRegion()))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
            
            String fromEmail = sesConfig.getFromEmail() != null ? sesConfig.getFromEmail() : notificationConfig.getEmail().getFrom();
            String fromName = sesConfig.getFromName() != null ? sesConfig.getFromName() : notificationConfig.getEmail().getFromName();
            String fromAddress = fromName != null && !fromName.trim().isEmpty() ? 
                fromName + " <" + fromEmail + ">" : fromEmail;
            
            software.amazon.awssdk.services.ses.model.Destination destination = 
                software.amazon.awssdk.services.ses.model.Destination.builder()
                    .toAddresses(email)
                    .build();
            
            software.amazon.awssdk.services.ses.model.Content subjectContent = 
                software.amazon.awssdk.services.ses.model.Content.builder()
                    .data(subject)
                    .charset("UTF-8")
                    .build();
            
            software.amazon.awssdk.services.ses.model.Content bodyContent = 
                software.amazon.awssdk.services.ses.model.Content.builder()
                    .data(content)
                    .charset("UTF-8")
                    .build();
            
            software.amazon.awssdk.services.ses.model.Body body = 
                software.amazon.awssdk.services.ses.model.Body.builder()
                    .text(bodyContent)
                    .build();
            
            software.amazon.awssdk.services.ses.model.Message message = 
                software.amazon.awssdk.services.ses.model.Message.builder()
                    .subject(subjectContent)
                    .body(body)
                    .build();
            
            software.amazon.awssdk.services.ses.model.SendEmailRequest emailRequest = 
                software.amazon.awssdk.services.ses.model.SendEmailRequest.builder()
                    .source(fromAddress)
                    .destination(destination)
                    .message(message)
                    .build();
            
            software.amazon.awssdk.services.ses.model.SendEmailResponse response = sesClient.sendEmail(emailRequest);
            
            result.put("success", true);
            result.put("messageId", response.messageId());
            result.put("email", email);
            result.put("subject", subject);
            result.put("fromAddress", fromAddress);
            result.put("region", awsConfig.getRegion());
            result.put("timestamp", System.currentTimeMillis());
            
            log.info("AWS SES测试邮件发送成功，MessageId：{}，收件人：{}", response.messageId(), email);
            
        } catch (Exception e) {
            log.error("AWS SES测试邮件发送失败", e);
            result.put("success", false);
            result.put("error", e.getMessage());
            result.put("errorType", e.getClass().getSimpleName());
        }
        
        return ResponseEntity.ok(result);
    }
    
    /**
     * 检查SES沙盒模式状态
     */
    @GetMapping("/ses/sandbox-check")
    public ResponseEntity<Map<String, Object>> checkSesSandboxMode() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            NotificationConfig.Aws awsConfig = notificationConfig.getAws();
            
            software.amazon.awssdk.services.ses.SesClient sesClient = software.amazon.awssdk.services.ses.SesClient.builder()
                .region(software.amazon.awssdk.regions.Region.of(awsConfig.getRegion()))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
            
            // 检查发送配额来判断是否在沙盒模式
            software.amazon.awssdk.services.ses.model.GetSendQuotaResponse quotaResponse = 
                sesClient.getSendQuota(software.amazon.awssdk.services.ses.model.GetSendQuotaRequest.builder().build());
            
            boolean isSandboxMode = quotaResponse.max24HourSend() <= 200.0; // 沙盒模式通常限制为200封/24小时
            
            result.put("isSandboxMode", isSandboxMode);
            result.put("max24HourSend", quotaResponse.max24HourSend());
            result.put("maxSendRate", quotaResponse.maxSendRate());
            result.put("sentLast24Hours", quotaResponse.sentLast24Hours());
            
            if (isSandboxMode) {
                result.put("message", "AWS SES当前处于沙盒模式");
                result.put("info", "沙盒模式下只能向已验证的邮箱地址发送邮件");
                result.put("solution", "请验证发件人和收件人邮箱地址，或申请退出沙盒模式");
            } else {
                result.put("message", "AWS SES已退出沙盒模式");
                result.put("info", "可以向任何有效邮箱地址发送邮件");
            }
            
            result.put("verifyUrl", "https://console.aws.amazon.com/ses/home#verified-senders-email:");
            result.put("productionAccessUrl", "https://console.aws.amazon.com/ses/home#reputation-dashboard:");
            
        } catch (Exception e) {
            log.error("检查SES沙盒模式状态失败", e);
            result.put("error", e.getMessage());
            result.put("message", "无法检查沙盒模式状态");
        }
        
        return ResponseEntity.ok(result);
    }
    
    /**
     * 验证邮箱地址
     */
    @PostMapping("/ses/verify-email")
    public ResponseEntity<Map<String, Object>> verifyEmailAddress(@RequestBody Map<String, String> request) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            String emailAddress = request.get("email");
            if (emailAddress == null || emailAddress.trim().isEmpty()) {
                result.put("success", false);
                result.put("error", "邮箱地址不能为空");
                return ResponseEntity.badRequest().body(result);
            }
            
            NotificationConfig.Aws awsConfig = notificationConfig.getAws();
            
            software.amazon.awssdk.services.ses.SesClient sesClient = software.amazon.awssdk.services.ses.SesClient.builder()
                .region(software.amazon.awssdk.regions.Region.of(awsConfig.getRegion()))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
            
            // 发送验证邮件
            software.amazon.awssdk.services.ses.model.VerifyEmailIdentityRequest verifyRequest = 
                software.amazon.awssdk.services.ses.model.VerifyEmailIdentityRequest.builder()
                    .emailAddress(emailAddress)
                    .build();
            
            sesClient.verifyEmailIdentity(verifyRequest);
            
            result.put("success", true);
            result.put("message", "验证邮件已发送到 " + emailAddress);
            result.put("info", "请检查邮箱并点击验证链接完成验证");
            result.put("email", emailAddress);
            
            log.info("已向邮箱 {} 发送验证邮件", emailAddress);
            
        } catch (Exception e) {
            log.error("发送邮箱验证失败", e);
            result.put("success", false);
            result.put("error", e.getMessage());
            result.put("errorType", e.getClass().getSimpleName());
        }
        
        return ResponseEntity.ok(result);
    }
    
    /**
     * 检查邮箱验证状态
     */
    @GetMapping("/ses/check-verification/{email}")
    public ResponseEntity<Map<String, Object>> checkEmailVerification(@PathVariable String email) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            NotificationConfig.Aws awsConfig = notificationConfig.getAws();
            
            software.amazon.awssdk.services.ses.SesClient sesClient = software.amazon.awssdk.services.ses.SesClient.builder()
                .region(software.amazon.awssdk.regions.Region.of(awsConfig.getRegion()))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
            
            // 获取身份验证属性
            software.amazon.awssdk.services.ses.model.GetIdentityVerificationAttributesRequest getRequest = 
                software.amazon.awssdk.services.ses.model.GetIdentityVerificationAttributesRequest.builder()
                    .identities(email)
                    .build();
            
            software.amazon.awssdk.services.ses.model.GetIdentityVerificationAttributesResponse getResponse = 
                sesClient.getIdentityVerificationAttributes(getRequest);
            
            if (getResponse.verificationAttributes().containsKey(email)) {
                software.amazon.awssdk.services.ses.model.IdentityVerificationAttributes attrs = 
                    getResponse.verificationAttributes().get(email);
                
                result.put("email", email);
                result.put("verificationStatus", attrs.verificationStatus().toString());
                result.put("isVerified", attrs.verificationStatus() == software.amazon.awssdk.services.ses.model.VerificationStatus.SUCCESS);
                
                if (attrs.verificationToken() != null) {
                    result.put("verificationToken", attrs.verificationToken());
                }
            } else {
                result.put("email", email);
                result.put("verificationStatus", "NOT_STARTED");
                result.put("isVerified", false);
                result.put("message", "该邮箱地址尚未开始验证流程");
            }
            
        } catch (Exception e) {
            log.error("检查邮箱验证状态失败", e);
            result.put("error", e.getMessage());
            result.put("errorType", e.getClass().getSimpleName());
        }
        
        return ResponseEntity.ok(result);
    }
}