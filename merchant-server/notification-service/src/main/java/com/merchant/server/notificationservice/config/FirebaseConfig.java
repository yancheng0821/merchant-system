package com.merchant.server.notificationservice.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

import javax.annotation.PostConstruct;
import java.io.FileInputStream;
import java.io.IOException;

/**
 * Firebase 推送服务配置
 */
@Slf4j
@Configuration
public class FirebaseConfig {

    @Value("${notification.firebase.enabled:false}")
    private boolean enabled;

    @Value("${notification.firebase.credentialsPath:}")
    private String credentialsPath;

    @PostConstruct
    public void initialize() {
        if (!enabled) {
            log.info("Firebase推送服务已禁用");
            return;
        }

        if (!StringUtils.hasText(credentialsPath)) {
            log.warn("Firebase凭证路径未配置，推送服务将不可用");
            return;
        }

        try {
            if (FirebaseApp.getApps().isEmpty()) {
                FileInputStream serviceAccount = new FileInputStream(credentialsPath);
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                        .build();
                FirebaseApp.initializeApp(options);
                log.info("Firebase Admin SDK 初始化成功");
            }
        } catch (IOException e) {
            log.error("Firebase Admin SDK 初始化失败: {}", e.getMessage());
        }
    }
}
