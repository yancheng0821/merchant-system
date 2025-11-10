package com.merchant.server.businessservice.service;

import com.merchant.server.businessservice.entity.Appointment;
import com.merchant.server.businessservice.dto.AppointmentCreateDTO;

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
     * 创建预约（包含服务信息）
     */
    Appointment createAppointmentWithServices(AppointmentCreateDTO appointmentDTO);

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
    
    /**
     * 获取即将开始的预约（用于提醒通知）
     */
    List<Appointment> getUpcomingAppointments(String date, String time);
    
    /**
     * 根据客户ID获取客户信息
     */
    com.merchant.server.businessservice.entity.Customer getCustomerById(Long customerId);
    
    /**
     * 获取服务名称
     */
    String getServiceName(Long serviceId);

    /**
     * 处理预约支付
     */
    Appointment processPayment(Long appointmentId, String paymentMethod, Integer customerPackageId, Long tenantId, Long verificationCodeId,
        Double taxRate, Double taxAmount, Double tipAmount, Double tipPercentage, Double subtotal, Double totalAmount);

    /**
     * 处理多服务预约支付
     */
    Appointment processMultiServicePayment(Long appointmentId, String paymentMethod, List<Map<String, Object>> servicePayments, Long tenantId,
        Double taxRate, Double taxAmount, Double tipAmount, Double tipPercentage, Double subtotal, Double totalAmount);
}