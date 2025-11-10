package com.merchant.server.businessservice.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Component;

import java.util.Locale;

@Slf4j
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
            log.debug("Getting message for code: {}, locale: {}", code, locale);
            // 首先尝试使用当前语言环境
            String message = messageSource.getMessage(code, args, locale);
            log.debug("Message found: {}", message);
            return message;
        } catch (Exception e) {
            log.warn("Failed to get message for code: {}, locale: {}, error: {}", code, locale, e.getMessage());
            // 如果获取失败，尝试使用默认语言（英文）
            try {
                Locale defaultLocale = Locale.US;
                if (locale.equals(defaultLocale)) {
                    defaultLocale = Locale.SIMPLIFIED_CHINESE;
                }
                String message = messageSource.getMessage(code, args, defaultLocale);
                log.debug("Using fallback message: {}", message);
                return message;
            } catch (Exception ex) {
                log.error("Failed to get message for code: {} with all locales, returning code itself", code, ex);
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
