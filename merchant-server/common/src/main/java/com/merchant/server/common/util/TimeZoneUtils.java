package com.merchant.server.common.util;

import com.merchant.server.common.config.TimeZoneConfig;

import java.time.*;
import java.time.format.DateTimeFormatter;

/**
 * 时区工具类
 * 提供统一的时区转换和格式化功能
 */
public class TimeZoneUtils {
    
    /**
     * 获取当前温哥华时间
     */
    public static LocalDateTime getCurrentVancouverTime() {
        return LocalDateTime.now(TimeZoneConfig.DEFAULT_ZONE_ID);
    }
    
    /**
     * 获取当前温哥华日期
     */
    public static LocalDate getCurrentVancouverDate() {
        return LocalDate.now(TimeZoneConfig.DEFAULT_ZONE_ID);
    }
    
    /**
     * 将UTC时间转换为温哥华时间
     */
    public static LocalDateTime convertToVancouverTime(LocalDateTime utcDateTime) {
        if (utcDateTime == null) {
            return null;
        }
        return utcDateTime.atZone(ZoneOffset.UTC)
                .withZoneSameInstant(TimeZoneConfig.DEFAULT_ZONE_ID)
                .toLocalDateTime();
    }
    
    /**
     * 将温哥华时间转换为UTC时间
     */
    public static LocalDateTime convertToUtcTime(LocalDateTime vancouverDateTime) {
        if (vancouverDateTime == null) {
            return null;
        }
        return vancouverDateTime.atZone(TimeZoneConfig.DEFAULT_ZONE_ID)
                .withZoneSameInstant(ZoneOffset.UTC)
                .toLocalDateTime();
    }
    
    /**
     * 格式化日期为字符串（温哥华时区）
     */
    public static String formatVancouverDate(LocalDate date) {
        if (date == null) {
            return null;
        }
        return date.format(TimeZoneConfig.DATE_FORMATTER);
    }
    
    /**
     * 格式化时间为字符串（温哥华时区）
     */
    public static String formatVancouverTime(LocalTime time) {
        if (time == null) {
            return null;
        }
        return time.format(TimeZoneConfig.TIME_FORMATTER);
    }
    
    /**
     * 格式化日期时间为字符串（温哥华时区）
     */
    public static String formatVancouverDateTime(LocalDateTime dateTime) {
        if (dateTime == null) {
            return null;
        }
        return dateTime.format(TimeZoneConfig.DATETIME_FORMATTER);
    }
    
    /**
     * 解析日期字符串为LocalDate
     */
    public static LocalDate parseDate(String dateString) {
        if (dateString == null || dateString.trim().isEmpty()) {
            return null;
        }
        return LocalDate.parse(dateString, TimeZoneConfig.DATE_FORMATTER);
    }
    
    /**
     * 解析时间字符串为LocalTime
     */
    public static LocalTime parseTime(String timeString) {
        if (timeString == null || timeString.trim().isEmpty()) {
            return null;
        }
        return LocalTime.parse(timeString, TimeZoneConfig.TIME_FORMATTER);
    }
    
    /**
     * 解析日期时间字符串为LocalDateTime
     */
    public static LocalDateTime parseDateTime(String dateTimeString) {
        if (dateTimeString == null || dateTimeString.trim().isEmpty()) {
            return null;
        }
        return LocalDateTime.parse(dateTimeString, TimeZoneConfig.DATETIME_FORMATTER);
    }
    
    /**
     * 获取今天的开始时间（温哥华时区）
     */
    public static LocalDateTime getTodayStart() {
        return getCurrentVancouverDate().atStartOfDay();
    }
    
    /**
     * 获取今天的结束时间（温哥华时区）
     */
    public static LocalDateTime getTodayEnd() {
        return getCurrentVancouverDate().atTime(23, 59, 59);
    }
    
    /**
     * 获取指定日期的开始时间（温哥华时区）
     */
    public static LocalDateTime getDateStart(LocalDate date) {
        if (date == null) {
            return null;
        }
        return date.atStartOfDay();
    }
    
    /**
     * 获取指定日期的结束时间（温哥华时区）
     */
    public static LocalDateTime getDateEnd(LocalDate date) {
        if (date == null) {
            return null;
        }
        return date.atTime(23, 59, 59);
    }
    
    /**
     * 判断两个日期是否为同一天（温哥华时区）
     */
    public static boolean isSameDay(LocalDateTime dateTime1, LocalDateTime dateTime2) {
        if (dateTime1 == null || dateTime2 == null) {
            return false;
        }
        return dateTime1.toLocalDate().equals(dateTime2.toLocalDate());
    }
    
    /**
     * 判断指定日期时间是否为今天（温哥华时区）
     */
    public static boolean isToday(LocalDateTime dateTime) {
        if (dateTime == null) {
            return false;
        }
        return dateTime.toLocalDate().equals(getCurrentVancouverDate());
    }
}