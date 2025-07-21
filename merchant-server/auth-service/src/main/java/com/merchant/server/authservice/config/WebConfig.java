package com.merchant.server.authservice.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Value("${app.avatar.upload.path:/tmp/avatars}")
    private String avatarUploadPath;
    
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 配置头像文件的静态资源访问
        registry.addResourceHandler("/api/users/avatar/**")
                .addResourceLocations("file:" + avatarUploadPath + "/");
    }
} 