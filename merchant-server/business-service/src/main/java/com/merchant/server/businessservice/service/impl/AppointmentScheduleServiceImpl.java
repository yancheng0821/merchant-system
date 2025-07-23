package com.merchant.server.businessservice.service.impl;

import com.merchant.server.businessservice.entity.Appointment;
import com.merchant.server.businessservice.mapper.AppointmentMapper;
import com.merchant.server.businessservice.service.AppointmentScheduleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentScheduleServiceImpl implements AppointmentScheduleService {

    private final AppointmentMapper appointmentMapper;

    /**
     * 每小时执行一次，检查过期的预约
     */
    @Scheduled(fixedRate = 3600000) // 1小时 = 3,600,000毫秒
    @Override
    public void markOverdueAppointmentsAsNoShow() {
        log.info("开始检查过期预约...");
        
        try {
            // 获取所有CONFIRMED状态的预约
            List<Appointment> confirmedAppointments = appointmentMapper.findConfirmedAppointments();
            
            LocalDateTime now = LocalDateTime.now();
            int updatedCount = 0;
            
            for (Appointment appointment : confirmedAppointments) {
                // 计算预约的完整时间
                LocalDateTime appointmentDateTime = LocalDateTime.of(
                    appointment.getAppointmentDate(), 
                    appointment.getAppointmentTime()
                );
                
                // 如果预约时间过后24小时，标记为NO_SHOW
                LocalDateTime noShowThreshold = appointmentDateTime.plusHours(24);
                
                if (now.isAfter(noShowThreshold)) {
                    log.info("标记预约为NO_SHOW: 预约ID={}, 客户ID={}, 预约时间={}", 
                        appointment.getId(), appointment.getCustomerId(), appointmentDateTime);
                    
                    appointment.setStatus(Appointment.AppointmentStatus.NO_SHOW);
                    appointment.setUpdatedAt(now);
                    appointment.setNotes(appointment.getNotes() + " [系统自动标记：预约时间过后24小时未到]");
                    
                    appointmentMapper.update(appointment);
                    updatedCount++;
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
     * 每小时执行一次，发送预约提醒
     */
    @Scheduled(fixedRate = 3600000) // 1小时 = 3,600,000毫秒
    @Override
    public void sendAppointmentReminders() {
        log.info("开始发送预约提醒...");
        
        try {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime tomorrow = now.plusDays(1);
            LocalDateTime oneHourLater = now.plusHours(1);
            
            // 获取明天的预约（24小时提醒）
            List<Appointment> tomorrowAppointments = appointmentMapper.findAppointmentsByDateRange(
                tomorrow.toLocalDate(), tomorrow.toLocalDate()
            );
            
            // 获取1小时后的预约（1小时提醒）
            List<Appointment> upcomingAppointments = appointmentMapper.findAppointmentsByTimeRange(
                now.toLocalDate(), 
                now.toLocalTime(), 
                oneHourLater.toLocalTime()
            );
            
            // TODO: 实现发送短信/邮件提醒的逻辑
            log.info("需要发送24小时提醒的预约数量: {}", tomorrowAppointments.size());
            log.info("需要发送1小时提醒的预约数量: {}", upcomingAppointments.size());
            
        } catch (Exception e) {
            log.error("发送预约提醒时发生错误", e);
        }
    }
}