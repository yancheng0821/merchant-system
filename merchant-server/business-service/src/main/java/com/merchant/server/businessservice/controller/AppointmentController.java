package com.merchant.server.businessservice.controller;

import com.merchant.server.businessservice.entity.Appointment;
import com.merchant.server.businessservice.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    /**
     * 根据客户ID获取预约记录
     */
    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<Appointment>> getAppointmentsByCustomerId(
            @PathVariable Long customerId,
            @RequestParam Long tenantId) {
        List<Appointment> appointments = appointmentService.getAppointmentsByCustomerId(customerId, tenantId);
        return ResponseEntity.ok(appointments);
    }

    /**
     * 获取预约统计信息
     */
    @GetMapping("/customer/{customerId}/stats")
    public ResponseEntity<Map<String, Object>> getAppointmentStats(
            @PathVariable Long customerId,
            @RequestParam Long tenantId) {
        Map<String, Object> stats = appointmentService.getAppointmentStats(customerId, tenantId);
        return ResponseEntity.ok(stats);
    }

    /**
     * 创建新预约
     */
    @PostMapping
    public ResponseEntity<Appointment> createAppointment(@RequestBody Appointment appointment) {
        Appointment created = appointmentService.createAppointment(appointment);
        return ResponseEntity.ok(created);
    }

    /**
     * 更新预约
     */
    @PutMapping("/{id}")
    public ResponseEntity<Appointment> updateAppointment(
            @PathVariable Long id,
            @RequestBody Appointment appointment) {
        appointment.setId(id);
        Appointment updated = appointmentService.updateAppointment(appointment);
        return ResponseEntity.ok(updated);
    }

    /**
     * 删除预约
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAppointment(@PathVariable Long id) {
        appointmentService.deleteAppointment(id);
        return ResponseEntity.ok().build();
    }
}