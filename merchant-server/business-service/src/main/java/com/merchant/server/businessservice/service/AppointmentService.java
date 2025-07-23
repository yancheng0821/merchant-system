package com.merchant.server.businessservice.service;

import com.merchant.server.businessservice.entity.Appointment;

import java.util.List;
import java.util.Map;

public interface AppointmentService {

    /**
     * 获取租户的所有预约记录
     */
    List<Appointment> getAllAppointmentsByTenantId(Long tenantId);

    /**
     * 根据客户ID获取预约记录
     */
    List<Appointment> getAppointmentsByCustomerId(Long customerId, Long tenantId);

    /**
     * 获取预约统计信息
     */
    Map<String, Object> getAppointmentStats(Long customerId, Long tenantId);

    /**
     * 创建预约
     */
    Appointment createAppointment(Appointment appointment);

    /**
     * 更新预约状态
     */
    Appointment updateAppointmentStatus(Long id, String status);

    /**
     * 更新预约
     */
    Appointment updateAppointment(Appointment appointment);

    /**
     * 删除预约
     */
    void deleteAppointment(Long id);

    /**
     * 根据ID获取预约
     */
    Appointment getAppointmentById(Long id);
}