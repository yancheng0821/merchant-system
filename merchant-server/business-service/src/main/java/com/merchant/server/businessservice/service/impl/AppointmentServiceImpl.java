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
        appointment.setCreatedAt(LocalDateTime.now());
        appointment.setUpdatedAt(LocalDateTime.now());
        appointmentMapper.insert(appointment);
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