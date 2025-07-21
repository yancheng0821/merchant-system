package com.merchant.server.authservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.support.ResourceBundleMessageSource;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.web.servlet.i18n.AcceptHeaderLocaleResolver;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;

@Configuration
public class LocaleConfig {
    
    @Bean
    public LocaleResolver localeResolver() {
        AcceptHeaderLocaleResolver localeResolver = new AcceptHeaderLocaleResolver();
        localeResolver.setDefaultLocale(Locale.ENGLISH); // 默认英文
        
        // 支持的语言列表：英文和中文
        List<Locale> supportedLocales = Arrays.asList(
            Locale.ENGLISH,              // en
            Locale.CHINESE               // zh
        );
        localeResolver.setSupportedLocales(supportedLocales);
        
        return localeResolver;
    }
    
    @Bean
    public ResourceBundleMessageSource messageSource() {
        ResourceBundleMessageSource messageSource = new ResourceBundleMessageSource();
        messageSource.setBasename("messages"); // 使用统一的basename
        messageSource.setDefaultEncoding("UTF-8");
        messageSource.setUseCodeAsDefaultMessage(false);
        messageSource.setFallbackToSystemLocale(false);
        // 设置默认语言为英文，当找不到对应语言文件时使用
        messageSource.setDefaultLocale(Locale.ENGLISH);
        return messageSource;
    }
} 