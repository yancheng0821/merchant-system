package com.merchant.server.businessservice.service.impl;

import com.merchant.server.businessservice.client.MerchantServiceClient;
import com.merchant.server.businessservice.entity.Appointment;
import com.merchant.server.businessservice.mapper.AppointmentMapper;
import com.merchant.server.businessservice.service.AppointmentScheduleService;
import com.merchant.server.businessservice.service.AppointmentNotificationService;
import com.merchant.server.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentScheduleServiceImpl implements AppointmentScheduleService {

    private final AppointmentMapper appointmentMapper;
    private final AppointmentNotificationService appointmentNotificationService;
    private final MerchantServiceClient merchantServiceClient;

    // 缓存商户时区信息，key: tenantId, value: timezone
    private final Map<Long, String> merchantTimezoneCache = new ConcurrentHashMap<>();

    /**
     * 获取商户时区（带缓存）
     */
    private String getMerchantTimezone(Long tenantId) {
        return merchantTimezoneCache.computeIfAbsent(tenantId, id -> {
            try {
                ApiResponse<Map<String, Object>> response = merchantServiceClient.getMerchantByTenantId(id);
                if (response != null && response.isSuccess() && response.getData() != null) {
                    String timezone = (String) response.getData().get("timezone");
                    if (timezone != null && !timezone.isEmpty()) {
                        log.debug("Retrieved timezone for tenant {}: {}", id, timezone);
                        return timezone;
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to get timezone for tenant {}: {}", id, e.getMessage());
            }
            // 默认使用温哥华时区
            log.debug("Using default timezone for tenant {}: America/Vancouver", id);
            return "America/Vancouver";
        });
    }

    /**
     * 每小时执行一次，检查过期的预约
     * 注意：数据库中的预约时间是商户本地时间，需要转换为UTC后比较
     */
    @Scheduled(fixedRate = 3600000) // 1小时 = 3,600,000毫秒
    @Override
    public void markOverdueAppointmentsAsNoShow() {
        log.info("开始检查过期预约...");

        try {
            // 获取所有CONFIRMED状态的预约
            List<Appointment> confirmedAppointments = appointmentMapper.findConfirmedAppointments();

            ZonedDateTime nowUtc = ZonedDateTime.now(ZoneOffset.UTC);
            int updatedCount = 0;

            for (Appointment appointment : confirmedAppointments) {
                try {
                    // 获取商户时区
                    String merchantTimezone = getMerchantTimezone(appointment.getTenantId());
                    ZoneId zoneId = ZoneId.of(merchantTimezone);

                    // 数据库中的预约时间是商户本地时间，需要转换为UTC
                    LocalDateTime appointmentLocalDateTime = LocalDateTime.of(
                        appointment.getAppointmentDate(),
                        appointment.getAppointmentTime()
                    );
                    // 将商户本地时间转换为UTC时间
                    ZonedDateTime appointmentInMerchantZone = ZonedDateTime.of(appointmentLocalDateTime, zoneId);
                    ZonedDateTime appointmentUtc = appointmentInMerchantZone.withZoneSameInstant(ZoneOffset.UTC);

                    // 如果预约时间过后24小时，标记为NO_SHOW
                    ZonedDateTime noShowThreshold = appointmentUtc.plusHours(24);

                    if (nowUtc.isAfter(noShowThreshold)) {
                        log.info("标记预约为NO_SHOW: 预约ID={}, 客户ID={}, 商户时区={}, 预约本地时间={}, 预约UTC时间={}",
                            appointment.getId(), appointment.getCustomerId(), merchantTimezone,
                            appointmentLocalDateTime, appointmentUtc);

                        appointment.setStatus(Appointment.AppointmentStatus.NO_SHOW);
                        appointment.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
                        String notes = appointment.getNotes() != null ? appointment.getNotes() : "";
                        appointment.setNotes(notes + " [系统自动标记：预约时间过后24小时未到]");

                        appointmentMapper.update(appointment);
                        updatedCount++;
                    }
                } catch (Exception e) {
                    log.error("处理过期预约检查时发生错误 - 预约ID: {}, 错误: {}", appointment.getId(), e.getMessage(), e);
                }
            }

            if (updatedCount > 0) {
                log.info("成功标记 {} 个预约为NO_SHOW", updatedCount);
            }

        } catch (Exception e) {
            log.error("检查过期预约时发生错误", e);
        }
    }

    /**
     * 每10分钟执行一次，发送预约提醒
     * - 24小时提醒：预约时间前24小时发送
     * - 30分钟提醒：预约时间前30分钟发送
     *
     * 注意：数据库中的预约时间是商户本地时间，需要转换为UTC后比较
     */
    @Scheduled(fixedRate = 600000) // 10分钟 = 600,000毫秒
    @Override
    public void sendAppointmentReminders() {
        log.info("开始发送预约提醒...");

        try {
            // 获取当前UTC时间
            ZonedDateTime nowUtc = ZonedDateTime.now(ZoneOffset.UTC);

            // 1. 获取所有CONFIRMED状态的预约
            List<Appointment> confirmedAppointments = appointmentMapper.findConfirmedAppointments();
            log.debug("找到 {} 个待确认的预约", confirmedAppointments.size());

            int reminder24hCount = 0;
            int reminder30minCount = 0;

            for (Appointment appointment : confirmedAppointments) {
                try {
                    // 获取商户时区
                    String merchantTimezone = getMerchantTimezone(appointment.getTenantId());
                    ZoneId zoneId = ZoneId.of(merchantTimezone);

                    // 数据库中的预约时间是商户本地时间，需要转换为UTC
                    LocalDateTime appointmentLocalDateTime = LocalDateTime.of(
                        appointment.getAppointmentDate(),
                        appointment.getAppointmentTime()
                    );
                    // 将商户本地时间转换为UTC时间
                    ZonedDateTime appointmentInMerchantZone = ZonedDateTime.of(appointmentLocalDateTime, zoneId);
                    ZonedDateTime appointmentUtc = appointmentInMerchantZone.withZoneSameInstant(ZoneOffset.UTC);

                    // 计算当前时间到预约时间的时间差（分钟）
                    long minutesUntilAppointment = ChronoUnit.MINUTES.between(nowUtc, appointmentUtc);

                    log.debug("预约ID: {}, 商户时区: {}, 预约本地时间: {}, 预约UTC时间: {}, 距离预约还有: {} 分钟",
                        appointment.getId(), merchantTimezone, appointmentLocalDateTime,
                        appointmentUtc, minutesUntilAppointment);

                    // 24小时提醒：在预约前23.5到24.5小时之间发送（1410-1470分钟）
                    if (minutesUntilAppointment >= 1410 && minutesUntilAppointment <= 1470) {
                        // 检查是否已发送24小时提醒
                        if (appointment.getReminder24hSent() == null || !appointment.getReminder24hSent()) {
                            log.info("发送24小时提醒 - 预约ID: {}, 客户ID: {}, 商户时区: {}, 预约本地时间: {}",
                                appointment.getId(), appointment.getCustomerId(), merchantTimezone, appointmentLocalDateTime);
                            try {
                                appointmentNotificationService.sendReminderNotification(appointment);
                                // 标记为已发送
                                appointment.setReminder24hSent(true);
                                appointment.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
                                appointmentMapper.update(appointment);
                                reminder24hCount++;
                                log.info("24小时提醒已发送并标记 - 预约ID: {}", appointment.getId());
                            } catch (Exception e) {
                                log.error("发送24小时提醒失败 - 预约ID: {}, 错误: {}", appointment.getId(), e.getMessage());
                            }
                        } else {
                            log.debug("跳过已发送的24小时提醒 - 预约ID: {}", appointment.getId());
                        }
                    }
                    // 30分钟提醒：在预约前20到40分钟之间发送
                    else if (minutesUntilAppointment >= 20 && minutesUntilAppointment <= 40) {
                        // 检查是否已发送30分钟提醒
                        if (appointment.getReminder30minSent() == null || !appointment.getReminder30minSent()) {
                            log.info("发送30分钟提醒 - 预约ID: {}, 客户ID: {}, 商户时区: {}, 预约本地时间: {}",
                                appointment.getId(), appointment.getCustomerId(), merchantTimezone, appointmentLocalDateTime);
                            try {
                                appointmentNotificationService.sendReminderNotification(appointment);
                                // 标记为已发送
                                appointment.setReminder30minSent(true);
                                appointment.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
                                appointmentMapper.update(appointment);
                                reminder30minCount++;
                                log.info("30分钟提醒已发送并标记 - 预约ID: {}", appointment.getId());
                            } catch (Exception e) {
                                log.error("发送30分钟提醒失败 - 预约ID: {}, 错误: {}", appointment.getId(), e.getMessage());
                            }
                        } else {
                            log.debug("跳过已发送的30分钟提醒 - 预约ID: {}", appointment.getId());
                        }
                    }
                } catch (Exception e) {
                    log.error("处理预约提醒时发生错误 - 预约ID: {}, 错误: {}", appointment.getId(), e.getMessage(), e);
                }
            }

            if (reminder24hCount > 0 || reminder30minCount > 0) {
                log.info("预约提醒发送完成 - 24小时提醒: {} 个, 30分钟提醒: {} 个",
                    reminder24hCount, reminder30minCount);
            }

        } catch (Exception e) {
            log.error("发送预约提醒时发生错误", e);
        }
    }
}