package com.merchant.server.businessservice.service;

/**
 * 预约调度服务 - 处理预约状态的自动更新
 */
public interface AppointmentScheduleService {
    
    /**
     * 自动标记过期的预约为NO_SHOW
     * 规则：预约时间过后24小时仍为CONFIRMED状态的预约自动标记为NO_SHOW
     */
    void markOverdueAppointmentsAsNoShow();
    
    /**
     * 发送预约提醒
     * 规则：预约前24小时和1小时发送提醒
     */
    void sendAppointmentReminders();
}