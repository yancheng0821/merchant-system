package com.merchant.server.common.config;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.TimeZone;

/**
 * 时区配置类
 * 统一管理系统时区设置
 */
public class TimeZoneConfig {
    
    /**
     * 系统默认时区 - 温哥华时间
     */
    public static final String DEFAULT_TIMEZONE = "America/Vancouver";
    public static final ZoneId DEFAULT_ZONE_ID = ZoneId.of(DEFAULT_TIMEZONE);
    
    /**
     * 日期时间格式常量
     */
    public static final String DATE_FORMAT = "yyyy-MM-dd";
    public static final String TIME_FORMAT = "HH:mm:ss";
    public static final String DATETIME_FORMAT = "yyyy-MM-dd HH:mm:ss";
    
    /**
     * 日期时间格式化器
     */
    public static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern(DATE_FORMAT);
    public static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern(TIME_FORMAT);
    public static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern(DATETIME_FORMAT);
    
    // 静态初始化块，在类加载时设置JVM默认时区
    static {
        TimeZone.setDefault(TimeZone.getTimeZone(DEFAULT_TIMEZONE));
    }
    
    /**
     * 私有构造函数，防止实例化
     */
    private TimeZoneConfig() {
        // 工具类，不允许实例化
    }
}