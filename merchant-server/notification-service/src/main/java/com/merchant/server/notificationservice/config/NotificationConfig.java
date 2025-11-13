package com.merchant.server.notificationservice.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "notification")
public class NotificationConfig {
    
    private Mock mock = new Mock();
    private Sms sms = new Sms();
    private Email email = new Email();
    private Aws aws = new Aws();
    private Aliyun aliyun = new Aliyun();
    
    @Data
    public static class Mock {
        private boolean enabled = true; // 设置为false时使用真实的邮件和短信服务
        private MockSms sms = new MockSms();
        private MockEmail email = new MockEmail();
        
        @Data
        public static class MockSms {
            private boolean simulateDelay = true; // 模拟发送延迟
            private long delayMs = 1000; // 模拟延迟时间（毫秒）
            private double successRate = 0.95; // 模拟成功率（0.0-1.0）
        }
        
        @Data
        public static class MockEmail {
            private boolean simulateDelay = true;
            private long delayMs = 800;
            private double successRate = 0.98;
        }
    }
    
    @Data
    public static class Sms {
        private String provider = "aws"; // aws, mock
        private boolean enabled = true;
    }
    
    @Data
    public static class Email {
        private String provider = "aws"; // aws, smtp, mock
        private String from;
        private String fromName;
        private boolean enabled = true;
        // SMTP配置（备用）
        private String host;
        private int port = 587;
        private String username;
        private String password;
        private boolean starttlsEnable = true;
        private boolean auth = true;
    }
    
    @Data
    public static class Aws {
        private String region = "us-east-1";
        private String accessKeyId;
        private String secretAccessKey;
        private boolean useLocalCredentials = true; // 本地测试时使用AWS CLI配置的凭证
        private int maxRetries = 3; // 最大重试次数
        private long retryDelayMs = 1000; // 重试间隔（毫秒）
        private Ses ses = new Ses();
        private Sns sns = new Sns();
        
        @Data
        public static class Ses {
            private String fromEmail;
            private String fromName;
            private String configurationSetName;
        }
        
        @Data
        public static class Sns {
            private String defaultSenderId;
            private String defaultMessageType = "Transactional";
        }
    }

    @Data
    public static class Aliyun {
        private String accessKeyId;
        private String accessKeySecret;
        private String endpoint = "dysmsapi.aliyuncs.com"; // 阿里云短信服务端点
        private int maxRetries = 3; // 最大重试次数
        private long retryDelayMs = 1000; // 重试间隔（毫秒）
        private Sms sms = new Sms();

        @Data
        public static class Sms {
            private String signName; // 短信签名
            private String templateCode; // 短信模板CODE（默认验证码模板）
            private java.util.Map<String, String> sceneTemplates = new java.util.HashMap<>(); // 场景到模板CODE的映射
        }
    }
}