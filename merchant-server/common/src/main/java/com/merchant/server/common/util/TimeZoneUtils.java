package com.merchant.server.common.util;

import com.merchant.server.common.config.TimeZoneConfig;

import java.time.*;
import java.time.format.DateTimeFormatter;

/**
 * 时区工具类
 * 提供统一的时区转换和格式化功能
 * 支持动态商户时区和UTC时间存储
 */
public class TimeZoneUtils {

    /**
     * 将商户本地时间转换为UTC时间
     * @param localDateTime 商户本地时间
     * @param timezone 商户时区（IANA格式，如 "America/Vancouver"）
     * @return UTC时间
     */
    public static LocalDateTime toUTC(LocalDateTime localDateTime, String timezone) {
        if (localDateTime == null || timezone == null) {
            return null;
        }
        ZoneId zoneId = ZoneId.of(timezone);
        return localDateTime.atZone(zoneId)
                .withZoneSameInstant(ZoneOffset.UTC)
                .toLocalDateTime();
    }

    /**
     * 将UTC时间转换为商户本地时间
     * @param utcDateTime UTC时间
     * @param timezone 商户时区（IANA格式，如 "America/Vancouver"）
     * @return 商户本地时间
     */
    public static LocalDateTime toMerchantTime(LocalDateTime utcDateTime, String timezone) {
        if (utcDateTime == null || timezone == null) {
            return null;
        }
        ZoneId zoneId = ZoneId.of(timezone);
        return utcDateTime.atZone(ZoneOffset.UTC)
                .withZoneSameInstant(zoneId)
                .toLocalDateTime();
    }

    /**
     * 获取商户当前时间
     * @param timezone 商户时区
     * @return 商户当前时间
     */
    public static LocalDateTime getMerchantNow(String timezone) {
        if (timezone == null) {
            timezone = TimeZoneConfig.DEFAULT_TIMEZONE;
        }
        return ZonedDateTime.now(ZoneId.of(timezone)).toLocalDateTime();
    }

    /**
     * 获取商户当前日期
     * @param timezone 商户时区
     * @return 商户当前日期
     */
    public static LocalDate getMerchantToday(String timezone) {
        if (timezone == null) {
            timezone = TimeZoneConfig.DEFAULT_TIMEZONE;
        }
        return LocalDate.now(ZoneId.of(timezone));
    }

    /**
     * 获取商户指定日期的开始时间（00:00:00），并转换为UTC
     * @param date 商户本地日期
     * @param timezone 商户时区
     * @return UTC时间
     */
    public static LocalDateTime getMerchantStartOfDayUTC(LocalDate date, String timezone) {
        if (date == null) {
            return null;
        }
        LocalDateTime startOfDay = date.atStartOfDay();
        return toUTC(startOfDay, timezone);
    }

    /**
     * 获取商户指定日期的结束时间（23:59:59），并转换为UTC
     * @param date 商户本地日期
     * @param timezone 商户时区
     * @return UTC时间
     */
    public static LocalDateTime getMerchantEndOfDayUTC(LocalDate date, String timezone) {
        if (date == null) {
            return null;
        }
        LocalDateTime endOfDay = date.atTime(23, 59, 59, 999999999);
        return toUTC(endOfDay, timezone);
    }

    /**
     * 检查时间是否在指定范围内（用于营业时间检查等）
     * @param checkTime 要检查的时间
     * @param startTime 开始时间
     * @param endTime 结束时间
     * @return 是否在范围内
     */
    public static boolean isWithinTimeRange(LocalTime checkTime, LocalTime startTime, LocalTime endTime) {
        if (checkTime == null || startTime == null || endTime == null) {
            return false;
        }
        return !checkTime.isBefore(startTime) && !checkTime.isAfter(endTime);
    }

    // ==================== 以下为兼容旧代码的方法 ====================

    /**
     * 获取当前温哥华时间
     * @deprecated 使用 getMerchantNow(timezone) 代替
     */
    @Deprecated
    public static LocalDateTime getCurrentVancouverTime() {
        return LocalDateTime.now(TimeZoneConfig.DEFAULT_ZONE_ID);
    }

    /**
     * 获取当前温哥华日期
     * @deprecated 使用 getMerchantToday(timezone) 代替
     */
    @Deprecated
    public static LocalDate getCurrentVancouverDate() {
        return LocalDate.now(TimeZoneConfig.DEFAULT_ZONE_ID);
    }

    /**
     * 将UTC时间转换为温哥华时间
     * @deprecated 使用 toMerchantTime(utcDateTime, timezone) 代替
     */
    @Deprecated
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
     * @deprecated 使用 toUTC(localDateTime, timezone) 代替
     */
    @Deprecated
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