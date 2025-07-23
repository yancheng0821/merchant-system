package com.merchant.server.notificationservice.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "notification")
public class NotificationConfig {
    
    private Sms sms = new Sms();
    private Email email = new Email();
    private Aws aws = new Aws();
    
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
}