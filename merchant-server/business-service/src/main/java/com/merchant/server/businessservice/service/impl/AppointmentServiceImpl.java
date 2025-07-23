package com.merchant.server.businessservice.service.impl;

import com.merchant.server.businessservice.entity.Appointment;
import com.merchant.server.businessservice.mapper.AppointmentMapper;
import com.merchant.server.businessservice.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentServiceImpl implements AppointmentService {

    private final AppointmentMapper appointmentMapper;

    @Override
    public List<Appointment> getAllAppointmentsByTenantId(Long tenantId) {
        log.info("Getting all appointments for tenant: {}", tenantId);
        List<Appointment> appointments = appointmentMapper.findByTenantId(tenantId);
        
        // 为每个预约获取服务详情
        for (Appointment appointment : appointments) {
            List<com.merchant.server.businessservice.entity.AppointmentService> services = appointmentMapper.findAppointmentServicesByAppointmentId(appointment.getId());
            appointment.setAppointmentServices(services);
        }
        
        return appointments;
    }

    @Override
    public List<Appointment> getAppointmentsByCustomerId(Long customerId, Long tenantId) {
        log.info("Getting appointments for customer: {} in tenant: {}", customerId, tenantId);
        return appointmentMapper.findByCustomerIdAndTenantId(customerId, tenantId);
    }

    @Override
    public Map<String, Object> getAppointmentStats(Long customerId, Long tenantId) {
        log.info("Getting appointment stats for customer: {} in tenant: {}", customerId, tenantId);
        
        List<Appointment> appointments = appointmentMapper.findByCustomerIdAndTenantId(customerId, tenantId);
        
        Map<String, Object> stats = new HashMap<>();
        
        // 总预约数
        stats.put("totalAppointments", appointments.size());
        
        // 已完成预约数
        long completedCount = appointments.stream()
                .filter(apt -> apt.getStatus() == Appointment.AppointmentStatus.COMPLETED)
                .count();
        stats.put("completedAppointments", completedCount);
        
        // 总消费金额
        BigDecimal totalSpent = appointments.stream()
                .filter(apt -> apt.getStatus() == Appointment.AppointmentStatus.COMPLETED)
                .map(apt -> apt.getTotalAmount() != null ? apt.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.put("totalSpent", totalSpent);
        
        // 平均评分
        double avgRating = appointments.stream()
                .filter(apt -> apt.getRating() != null && apt.getRating() > 0)
                .mapToInt(Appointment::getRating)
                .average()
                .orElse(0.0);
        stats.put("avgRating", avgRating);
        
        return stats;
    }

    @Override
    public Appointment createAppointment(Appointment appointment) {
        log.info("Creating appointment for customer: {}", appointment.getCustomerId());
        log.info("Appointment details: {}", appointment);
        
        // 设置默认值
        if (appointment.getCreatedAt() == null) {
            appointment.setCreatedAt(LocalDateTime.now());
        }
        if (appointment.getUpdatedAt() == null) {
            appointment.setUpdatedAt(LocalDateTime.now());
        }
        if (appointment.getTotalAmount() == null) {
            appointment.setTotalAmount(BigDecimal.ZERO);
        }
        
        try {
            appointmentMapper.insert(appointment);
            log.info("Appointment created successfully with ID: {}", appointment.getId());
            return appointment;
        } catch (Exception e) {
            log.error("Error creating appointment: ", e);
            throw e;
        }
    }

    @Override
    public Appointment updateAppointmentStatus(Long id, String status) {
        log.info("Updating appointment status: {} to {}", id, status);
        Appointment appointment = appointmentMapper.findById(id);
        if (appointment != null) {
            appointment.setStatus(Appointment.AppointmentStatus.valueOf(status));
            appointment.setUpdatedAt(LocalDateTime.now());
            appointmentMapper.update(appointment);
        }
        return appointment;
    }

    @Override
    public Appointment updateAppointment(Appointment appointment) {
        log.info("Updating appointment: {}", appointment.getId());
        appointment.setUpdatedAt(LocalDateTime.now());
        appointmentMapper.update(appointment);
        return appointment;
    }

    @Override
    public void deleteAppointment(Long id) {
        log.info("Deleting appointment: {}", id);
        appointmentMapper.deleteById(id);
    }

    @Override
    public Appointment getAppointmentById(Long id) {
        log.info("Getting appointment by id: {}", id);
        return appointmentMapper.findById(id);
    }
}