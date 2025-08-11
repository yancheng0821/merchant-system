package com.merchant.server.businessservice.controller;

import com.merchant.server.businessservice.entity.Appointment;
import com.merchant.server.businessservice.service.AppointmentService;
import com.merchant.server.businessservice.dto.AppointmentCreateDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/business/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    /**
     * 获取租户的所有预约记录
     */
    @GetMapping
    public ResponseEntity<List<Appointment>> getAllAppointments(@RequestParam Long tenantId) {
        List<Appointment> appointments = appointmentService.getAllAppointmentsByTenantId(tenantId);
        return ResponseEntity.ok(appointments);
    }

    /**
     * 根据ID获取单个预约详情
     */
    @GetMapping("/{id}")
    public ResponseEntity<Appointment> getAppointmentById(
            @PathVariable Long id,
            @RequestParam Long tenantId) {
        Appointment appointment = appointmentService.getAppointmentById(id);
        // 验证预约是否属于该租户
        if (!appointment.getTenantId().equals(tenantId)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(appointment);
    }

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
    public ResponseEntity<Appointment> createAppointment(@RequestBody AppointmentCreateDTO appointmentDTO) {
        Appointment created = appointmentService.createAppointmentWithServices(appointmentDTO);
        return ResponseEntity.ok(created);
    }

    /**
     * 更新预约状态
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<Appointment> updateAppointmentStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> statusUpdate) {
        String status = statusUpdate.get("status");
        Appointment updated = appointmentService.updateAppointmentStatus(id, status);
        return ResponseEntity.ok(updated);
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