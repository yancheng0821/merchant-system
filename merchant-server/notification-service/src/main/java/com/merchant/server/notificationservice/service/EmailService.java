package com.merchant.server.notificationservice.service;

import com.merchant.server.notificationservice.config.NotificationConfig;
import com.merchant.server.notificationservice.util.RetryUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.ses.SesClient;
import software.amazon.awssdk.services.ses.model.*;

import java.util.Properties;

@Slf4j
@Service
public class EmailService {
    
    @Autowired
    private NotificationConfig notificationConfig;
    
    private JavaMailSender mailSender;
    private SesClient sesClient;
    
    private SesClient getSesClient() {
        if (sesClient == null) {
            NotificationConfig.Aws awsConfig = notificationConfig.getAws();
            
            try {
                // 验证区域配置
                if (awsConfig.getRegion() == null || awsConfig.getRegion().trim().isEmpty()) {
                    throw new IllegalArgumentException("AWS区域未配置");
                }
                
                if (awsConfig.isUseLocalCredentials()) {
                    // 使用本地AWS CLI配置的凭证
                    sesClient = SesClient.builder()
                        .region(Region.of(awsConfig.getRegion()))
                        .credentialsProvider(DefaultCredentialsProvider.create())
                        .build();
                    log.info("AWS SES客户端初始化成功（使用本地凭证），区域：{}", awsConfig.getRegion());
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
                    sesClient = SesClient.builder()
                        .region(Region.of(awsConfig.getRegion()))
                        .credentialsProvider(StaticCredentialsProvider.create(awsCreds))
                        .build();
                    log.info("AWS SES客户端初始化成功（使用配置凭证），区域：{}", awsConfig.getRegion());
                }
            } catch (Exception e) {
                log.error("初始化AWS SES客户端失败", e);
                throw new RuntimeException("AWS SES服务初始化失败: " + e.getMessage(), e);
            }
        }
        return sesClient;
    }
    
    private JavaMailSender getMailSender() {
        if (mailSender == null) {
            JavaMailSenderImpl sender = new JavaMailSenderImpl();
            NotificationConfig.Email emailConfig = notificationConfig.getEmail();
            
            sender.setHost(emailConfig.getHost());
            sender.setPort(emailConfig.getPort());
            sender.setUsername(emailConfig.getUsername());
            sender.setPassword(emailConfig.getPassword());
            
            Properties props = sender.getJavaMailProperties();
            props.put("mail.transport.protocol", "smtp");
            props.put("mail.smtp.auth", emailConfig.isAuth());
            props.put("mail.smtp.starttls.enable", emailConfig.isStarttlsEnable());
            props.put("mail.debug", "false");
            
            mailSender = sender;
        }
        return mailSender;
    }
    
    /**
     * 发送邮件
     */
    public boolean sendEmail(String to, String subject, String content) {
        if (!notificationConfig.getEmail().isEnabled()) {
            log.info("邮件服务已禁用，跳过发送");
            return true;
        }
        
        // 如果启用了Mock模式，直接使用Mock发送
        if (notificationConfig.getMock().isEnabled()) {
            return sendEmailViaMock(to, subject, content);
        }
        
        String provider = notificationConfig.getEmail().getProvider();
        
        switch (provider.toLowerCase()) {
            case "aws":
                return sendEmailViaAwsWithRetry(to, subject, content);
            case "smtp":
                return sendEmailViaSmtpWithRetry(to, subject, content);
            case "mock":
                return sendEmailViaMock(to, subject, content);
            default:
                log.warn("未知的邮件服务提供商：{}，使用Mock模式", provider);
                return sendEmailViaMock(to, subject, content);
        }
    }
    
    /**
     * 带重试机制的AWS邮件发送
     */
    private boolean sendEmailViaAwsWithRetry(String to, String subject, String content) {
        NotificationConfig.Aws awsConfig = notificationConfig.getAws();
        
        return RetryUtil.executeWithRetryBoolean(
            () -> sendEmailViaAws(to, subject, content),
            awsConfig.getMaxRetries(),
            awsConfig.getRetryDelayMs(),
            "AWS SES邮件发送"
        );
    }
    
    /**
     * 带重试机制的SMTP邮件发送
     */
    private boolean sendEmailViaSmtpWithRetry(String to, String subject, String content) {
        NotificationConfig.Aws awsConfig = notificationConfig.getAws();
        
        return RetryUtil.executeWithRetryBoolean(
            () -> sendEmailViaSmtp(to, subject, content),
            awsConfig.getMaxRetries(),
            awsConfig.getRetryDelayMs(),
            "SMTP邮件发送"
        );
    }
    
    private boolean sendEmailViaAws(String to, String subject, String content) {
        try {
            // 验证输入参数
            if (to == null || to.trim().isEmpty()) {
                log.error("收件人邮箱不能为空");
                return false;
            }
            
            if (subject == null || subject.trim().isEmpty()) {
                log.error("邮件主题不能为空");
                return false;
            }
            
            if (content == null || content.trim().isEmpty()) {
                log.error("邮件内容不能为空");
                return false;
            }
            
            // 验证邮箱格式
            if (!isValidEmail(to)) {
                log.error("无效的邮箱格式：{}", to);
                return false;
            }
            
            NotificationConfig.Aws.Ses sesConfig = notificationConfig.getAws().getSes();
            String fromEmail = sesConfig.getFromEmail() != null ? sesConfig.getFromEmail() : notificationConfig.getEmail().getFrom();
            String fromName = sesConfig.getFromName() != null ? sesConfig.getFromName() : notificationConfig.getEmail().getFromName();
            
            if (fromEmail == null || fromEmail.trim().isEmpty()) {
                log.error("发件人邮箱未配置");
                return false;
            }
            
            // 验证发件人邮箱格式
            if (!isValidEmail(fromEmail)) {
                log.error("发件人邮箱格式无效：{}", fromEmail);
                return false;
            }
            
            String fromAddress = fromName != null && !fromName.trim().isEmpty() ? 
                fromName + " <" + fromEmail + ">" : fromEmail;
            
            log.info("准备发送AWS SES邮件，收件人：{}，发件人：{}，主题：{}，内容长度：{}，区域：{}", 
                to, fromAddress, subject, content.length(), notificationConfig.getAws().getRegion());
            
            Destination destination = Destination.builder()
                .toAddresses(to)
                .build();
            
            Content subjectContent = Content.builder()
                .data(subject)
                .charset("UTF-8")
                .build();
            
            // 检查内容是否包含HTML标签
            boolean isHtmlContent = isHtmlContent(content);
            
            Body.Builder bodyBuilder = Body.builder();
            
            if (isHtmlContent) {
                // HTML邮件
                Content htmlContent = Content.builder()
                    .data(content)
                    .charset("UTF-8")
                    .build();
                bodyBuilder.html(htmlContent);
                
                // 同时提供纯文本版本（去除HTML标签）
                String textContent = htmlToText(content);
                Content textContentObj = Content.builder()
                    .data(textContent)
                    .charset("UTF-8")
                    .build();
                bodyBuilder.text(textContentObj);
                
                log.debug("发送HTML邮件，HTML长度：{}，纯文本长度：{}", content.length(), textContent.length());
            } else {
                // 纯文本邮件
                Content textContent = Content.builder()
                    .data(content)
                    .charset("UTF-8")
                    .build();
                bodyBuilder.text(textContent);
                
                log.debug("发送纯文本邮件，内容长度：{}", content.length());
            }
            
            Body body = bodyBuilder.build();
            
            Message message = Message.builder()
                .subject(subjectContent)
                .body(body)
                .build();
            
            SendEmailRequest.Builder requestBuilder = SendEmailRequest.builder()
                .source(fromAddress)
                .destination(destination)
                .message(message);
            
            // 如果配置了Configuration Set，则添加
            if (sesConfig.getConfigurationSetName() != null && !sesConfig.getConfigurationSetName().trim().isEmpty()) {
                requestBuilder.configurationSetName(sesConfig.getConfigurationSetName());
                log.debug("使用Configuration Set：{}", sesConfig.getConfigurationSetName());
            }
            
            // 添加邮件标签（用于跟踪和分类）
            requestBuilder.tags(
                MessageTag.builder().name("service").value("notification").build(),
                MessageTag.builder().name("type").value(isHtmlContent ? "html" : "text").build(),
                MessageTag.builder().name("timestamp").value(String.valueOf(System.currentTimeMillis())).build()
            );
            
            SendEmailRequest request = requestBuilder.build();
            SendEmailResponse response = getSesClient().sendEmail(request);
            
            log.info("AWS SES邮件发送成功，收件人：{}，MessageId：{}，响应：{}", 
                to, response.messageId(), response.toString());
            
            // 记录详细的发送信息
            log.info("邮件发送详情 - 发件人：{}，收件人：{}，主题：{}，内容类型：{}，区域：{}", 
                fromAddress, to, subject, isHtmlContent ? "HTML" : "TEXT", 
                notificationConfig.getAws().getRegion());
            
            return true;
            
        } catch (SesException e) {
            log.error("AWS SES服务异常，收件人：{}，错误代码：{}，错误信息：{}", 
                to, e.awsErrorDetails().errorCode(), e.awsErrorDetails().errorMessage(), e);
            
            // 记录更详细的错误信息
            if (e.awsErrorDetails() != null) {
                log.error("AWS SES错误详情 - 错误代码：{}，HTTP状态码：{}，请求ID：{}", 
                    e.awsErrorDetails().errorCode(), 
                    e.statusCode(), 
                    e.requestId());
            }
            
            return false;
        } catch (Exception e) {
            log.error("AWS SES邮件发送失败，收件人：{}", to, e);
            return false;
        }
    }
    
    /**
     * 检查内容是否为HTML格式
     */
    private boolean isHtmlContent(String content) {
        if (content == null || content.trim().isEmpty()) {
            return false;
        }
        
        // 检查常见的HTML标签
        String[] htmlTags = {"<html>", "<body>", "<div>", "<p>", "<br>", "<span>", "<h1>", "<h2>", "<h3>", "<table>", "<tr>", "<td>"};
        String lowerContent = content.toLowerCase();
        
        for (String tag : htmlTags) {
            if (lowerContent.contains(tag)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 将HTML内容转换为纯文本
     */
    private String htmlToText(String html) {
        if (html == null || html.trim().isEmpty()) {
            return "";
        }
        
        // 简单的HTML到文本转换
        String text = html
            .replaceAll("<br\\s*/?>", "\n")
            .replaceAll("<p\\s*>", "\n")
            .replaceAll("</p>", "\n")
            .replaceAll("<div\\s*>", "\n")
            .replaceAll("</div>", "\n")
            .replaceAll("<h[1-6]\\s*>", "\n")
            .replaceAll("</h[1-6]>", "\n")
            .replaceAll("<li\\s*>", "\n• ")
            .replaceAll("</li>", "")
            .replaceAll("<[^>]*>", "") // 移除所有HTML标签
            .replaceAll("&nbsp;", " ")
            .replaceAll("&amp;", "&")
            .replaceAll("&lt;", "<")
            .replaceAll("&gt;", ">")
            .replaceAll("&quot;", "\"")
            .replaceAll("&#39;", "'")
            .replaceAll("\\s+", " ") // 合并多个空白字符
            .trim();
        
        return text;
    }
    
    /**
     * 发送HTML邮件
     */
    public boolean sendHtmlEmail(String to, String subject, String htmlContent) {
        return sendEmail(to, subject, htmlContent);
    }
    
    /**
     * 发送邮件给多个收件人
     */
    public boolean sendEmailToMultiple(String[] toAddresses, String subject, String content) {
        if (!notificationConfig.getEmail().isEnabled()) {
            log.info("邮件服务已禁用，跳过发送");
            return true;
        }
        
        if (notificationConfig.getMock().isEnabled()) {
            // Mock模式下模拟发送给多个收件人
            boolean allSuccess = true;
            for (String to : toAddresses) {
                if (!sendEmailViaMock(to, subject, content)) {
                    allSuccess = false;
                }
            }
            return allSuccess;
        }
        
        if ("aws".equals(notificationConfig.getEmail().getProvider())) {
            return sendEmailToMultipleViaAws(toAddresses, subject, content);
        } else {
            // 其他提供商逐个发送
            boolean allSuccess = true;
            for (String to : toAddresses) {
                if (!sendEmail(to, subject, content)) {
                    allSuccess = false;
                }
            }
            return allSuccess;
        }
    }
    
    /**
     * 通过AWS SES发送邮件给多个收件人
     */
    private boolean sendEmailToMultipleViaAws(String[] toAddresses, String subject, String content) {
        try {
            // 验证收件人地址
            for (String to : toAddresses) {
                if (!isValidEmail(to)) {
                    log.error("无效的邮箱格式：{}", to);
                    return false;
                }
            }
            
            NotificationConfig.Aws.Ses sesConfig = notificationConfig.getAws().getSes();
            String fromEmail = sesConfig.getFromEmail() != null ? sesConfig.getFromEmail() : notificationConfig.getEmail().getFrom();
            String fromName = sesConfig.getFromName() != null ? sesConfig.getFromName() : notificationConfig.getEmail().getFromName();
            
            String fromAddress = fromName != null && !fromName.trim().isEmpty() ? 
                fromName + " <" + fromEmail + ">" : fromEmail;
            
            Destination destination = Destination.builder()
                .toAddresses(toAddresses)
                .build();
            
            Content subjectContent = Content.builder()
                .data(subject)
                .charset("UTF-8")
                .build();
            
            boolean isHtmlContent = isHtmlContent(content);
            Body.Builder bodyBuilder = Body.builder();
            
            if (isHtmlContent) {
                bodyBuilder.html(Content.builder().data(content).charset("UTF-8").build());
                bodyBuilder.text(Content.builder().data(htmlToText(content)).charset("UTF-8").build());
            } else {
                bodyBuilder.text(Content.builder().data(content).charset("UTF-8").build());
            }
            
            Message message = Message.builder()
                .subject(subjectContent)
                .body(bodyBuilder.build())
                .build();
            
            SendEmailRequest request = SendEmailRequest.builder()
                .source(fromAddress)
                .destination(destination)
                .message(message)
                .build();
            
            SendEmailResponse response = getSesClient().sendEmail(request);
            
            log.info("AWS SES批量邮件发送成功，收件人数量：{}，MessageId：{}", 
                toAddresses.length, response.messageId());
            
            return true;
            
        } catch (Exception e) {
            log.error("AWS SES批量邮件发送失败", e);
            return false;
        }
    }
    
    /**
     * 发送带抄送的邮件
     */
    public boolean sendEmailWithCc(String to, String[] ccAddresses, String subject, String content) {
        if (!notificationConfig.getEmail().isEnabled()) {
            log.info("邮件服务已禁用，跳过发送");
            return true;
        }
        
        if (notificationConfig.getMock().isEnabled()) {
            log.info("✅ Mock邮件发送成功（带抄送） - 收件人：{}，抄送：{}，主题：{}", 
                to, String.join(",", ccAddresses), subject);
            return true;
        }
        
        if ("aws".equals(notificationConfig.getEmail().getProvider())) {
            return sendEmailWithCcViaAws(to, ccAddresses, subject, content);
        } else {
            // 其他提供商不支持抄送，只发送给主收件人
            return sendEmail(to, subject, content);
        }
    }
    
    /**
     * 通过AWS SES发送带抄送的邮件
     */
    private boolean sendEmailWithCcViaAws(String to, String[] ccAddresses, String subject, String content) {
        try {
            NotificationConfig.Aws.Ses sesConfig = notificationConfig.getAws().getSes();
            String fromEmail = sesConfig.getFromEmail() != null ? sesConfig.getFromEmail() : notificationConfig.getEmail().getFrom();
            String fromName = sesConfig.getFromName() != null ? sesConfig.getFromName() : notificationConfig.getEmail().getFromName();
            
            String fromAddress = fromName != null && !fromName.trim().isEmpty() ? 
                fromName + " <" + fromEmail + ">" : fromEmail;
            
            Destination destination = Destination.builder()
                .toAddresses(to)
                .ccAddresses(ccAddresses)
                .build();
            
            Content subjectContent = Content.builder()
                .data(subject)
                .charset("UTF-8")
                .build();
            
            boolean isHtmlContent = isHtmlContent(content);
            Body.Builder bodyBuilder = Body.builder();
            
            if (isHtmlContent) {
                bodyBuilder.html(Content.builder().data(content).charset("UTF-8").build());
                bodyBuilder.text(Content.builder().data(htmlToText(content)).charset("UTF-8").build());
            } else {
                bodyBuilder.text(Content.builder().data(content).charset("UTF-8").build());
            }
            
            Message message = Message.builder()
                .subject(subjectContent)
                .body(bodyBuilder.build())
                .build();
            
            SendEmailRequest request = SendEmailRequest.builder()
                .source(fromAddress)
                .destination(destination)
                .message(message)
                .build();
            
            SendEmailResponse response = getSesClient().sendEmail(request);
            
            log.info("AWS SES邮件发送成功（带抄送），收件人：{}，抄送：{}，MessageId：{}", 
                to, String.join(",", ccAddresses), response.messageId());
            
            return true;
            
        } catch (Exception e) {
            log.error("AWS SES邮件发送失败（带抄送）", e);
            return false;
        }
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
    
    private boolean sendEmailViaSmtp(String to, String subject, String content) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(notificationConfig.getEmail().getFrom());
            message.setTo(to);
            message.setSubject(subject);
            message.setText(content);
            
            getMailSender().send(message);
            log.info("SMTP邮件发送成功，收件人：{}", to);
            return true;
        } catch (Exception e) {
            log.error("SMTP邮件发送失败，收件人：{}", to, e);
            return false;
        }
    }
    
    private boolean sendEmailViaMock(String to, String subject, String content) {
        NotificationConfig.Mock.MockEmail mockConfig = notificationConfig.getMock().getEmail();
        
        // 模拟发送延迟
        if (mockConfig.isSimulateDelay()) {
            try {
                Thread.sleep(mockConfig.getDelayMs());
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.warn("Mock邮件发送延迟被中断");
            }
        }
        
        // 模拟成功率
        double random = Math.random();
        boolean success = random < mockConfig.getSuccessRate();
        
        if (success) {
            log.info("✅ Mock邮件发送成功 - 收件人：{}，主题：{}，内容长度：{}", to, subject, content.length());
            log.debug("Mock邮件内容：{}", content);
        } else {
            log.error("❌ Mock邮件发送失败 - 收件人：{}，主题：{}（模拟失败）", to, subject);
        }
        
        return success;
    }
}