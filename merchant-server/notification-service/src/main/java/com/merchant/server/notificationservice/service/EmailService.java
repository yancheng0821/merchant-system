package com.merchant.server.notificationservice.service;

import com.merchant.server.notificationservice.config.NotificationConfig;
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
                if (awsConfig.isUseLocalCredentials()) {
                    // 使用本地AWS CLI配置的凭证
                    sesClient = SesClient.builder()
                        .region(Region.of(awsConfig.getRegion()))
                        .credentialsProvider(DefaultCredentialsProvider.create())
                        .build();
                } else {
                    // 使用配置文件中的凭证
                    AwsBasicCredentials awsCreds = AwsBasicCredentials.create(
                        awsConfig.getAccessKeyId(),
                        awsConfig.getSecretAccessKey()
                    );
                    sesClient = SesClient.builder()
                        .region(Region.of(awsConfig.getRegion()))
                        .credentialsProvider(StaticCredentialsProvider.create(awsCreds))
                        .build();
                }
                log.info("AWS SES客户端初始化成功，区域：{}", awsConfig.getRegion());
            } catch (Exception e) {
                log.error("初始化AWS SES客户端失败", e);
                throw new RuntimeException("AWS SES服务初始化失败", e);
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
        
        String provider = notificationConfig.getEmail().getProvider();
        
        switch (provider.toLowerCase()) {
            case "aws":
                return sendEmailViaAws(to, subject, content);
            case "smtp":
                return sendEmailViaSmtp(to, subject, content);
            case "mock":
                return sendEmailViaMock(to, subject, content);
            default:
                log.warn("未知的邮件服务提供商：{}，使用Mock模式", provider);
                return sendEmailViaMock(to, subject, content);
        }
    }
    
    private boolean sendEmailViaAws(String to, String subject, String content) {
        try {
            NotificationConfig.Aws.Ses sesConfig = notificationConfig.getAws().getSes();
            String fromEmail = sesConfig.getFromEmail() != null ? sesConfig.getFromEmail() : notificationConfig.getEmail().getFrom();
            String fromName = sesConfig.getFromName() != null ? sesConfig.getFromName() : notificationConfig.getEmail().getFromName();
            
            String fromAddress = fromName != null ? fromName + " <" + fromEmail + ">" : fromEmail;
            
            Destination destination = Destination.builder()
                .toAddresses(to)
                .build();
            
            Content subjectContent = Content.builder()
                .data(subject)
                .charset("UTF-8")
                .build();
            
            Content bodyContent = Content.builder()
                .data(content)
                .charset("UTF-8")
                .build();
            
            Body body = Body.builder()
                .html(bodyContent) // 支持HTML内容
                .build();
            
            Message message = Message.builder()
                .subject(subjectContent)
                .body(body)
                .build();
            
            SendEmailRequest.Builder requestBuilder = SendEmailRequest.builder()
                .source(fromAddress)
                .destination(destination)
                .message(message);
            
            // 如果配置了Configuration Set，则添加
            if (sesConfig.getConfigurationSetName() != null) {
                requestBuilder.configurationSetName(sesConfig.getConfigurationSetName());
            }
            
            SendEmailRequest request = requestBuilder.build();
            SendEmailResponse response = getSesClient().sendEmail(request);
            
            log.info("AWS SES邮件发送成功，收件人：{}，MessageId：{}", to, response.messageId());
            return true;
            
        } catch (Exception e) {
            log.error("AWS SES邮件发送失败，收件人：{}", to, e);
            return false;
        }
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
        log.info("Mock邮件发送 - 收件人：{}，主题：{}，内容长度：{}", to, subject, content.length());
        log.debug("Mock邮件内容：{}", content);
        return true;
    }
}