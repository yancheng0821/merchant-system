package com.merchant.server.authservice.util;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
public class MessageUtil {
    
    @Autowired
    private MessageSource messageSource;
    
    /**
     * 获取国际化消息
     */
    public String getMessage(String code) {
        return getMessage(code, null);
    }
    
    /**
     * 获取国际化消息
     */
    public String getMessage(String code, Object[] args) {
        return getMessage(code, args, LocaleContextHolder.getLocale());
    }
    
    /**
     * 获取国际化消息
     */
    public String getMessage(String code, Object[] args, Locale locale) {
        try {
            // 首先尝试使用当前语言环境
            String message = messageSource.getMessage(code, args, locale);
            return message;
        } catch (Exception e) {
            // 如果获取失败，尝试使用默认语言（英文）
            try {
                Locale defaultLocale = Locale.US;
                if (locale.equals(defaultLocale)) {
                    defaultLocale = Locale.SIMPLIFIED_CHINESE;
                }
                return messageSource.getMessage(code, args, defaultLocale);
            } catch (Exception ex) {
                // 如果还是失败，返回code本身
                return code;
            }
        }
    }
    
    /**
     * 获取当前语言环境
     */
    public Locale getCurrentLocale() {
        return LocaleContextHolder.getLocale();
    }
    
    /**
     * 检查是否支持指定语言
     */
    public boolean isSupportedLocale(Locale locale) {
        return locale.equals(Locale.US) || locale.equals(Locale.SIMPLIFIED_CHINESE);
    }
} 