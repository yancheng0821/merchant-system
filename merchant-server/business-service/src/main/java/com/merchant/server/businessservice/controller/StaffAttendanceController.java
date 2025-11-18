package com.merchant.server.businessservice.controller;

import com.merchant.server.businessservice.entity.StaffAttendance;
import com.merchant.server.businessservice.service.StaffAttendanceService;
import com.merchant.server.common.annotation.Auditable;
import com.merchant.server.common.annotation.RequiresPermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * 员工签到签退控制器
 */
@RestController
@RequestMapping("/api/business/attendance")
@RequiredArgsConstructor
@Slf4j
public class StaffAttendanceController {

    private final StaffAttendanceService staffAttendanceService;

    /**
     * 保存或更新员工签到签退记录
     */
    @Auditable(resource = "STAFF_ATTENDANCE", action = "UPDATE", resourceIdParam = "id", recordOldValue = true, description = "Adjust staff check-in/check-out time")
    @RequiresPermission("schedule:adjust_attendance")
    @PostMapping
    public ResponseEntity<StaffAttendance> saveOrUpdateAttendance(@RequestBody StaffAttendance staffAttendance) {
        log.debug("Saving/updating staff attendance: resourceId={}, date={}, checkIn={}, checkOut={}",
                staffAttendance.getResourceId(),
                staffAttendance.getAttendanceDate(),
                staffAttendance.getCheckInTime(),
                staffAttendance.getCheckOutTime());

        StaffAttendance saved = staffAttendanceService.saveOrUpdate(staffAttendance);
        return ResponseEntity.ok(saved);
    }

    /**
     * 根据资源ID和日期查询签到记录
     */
    @RequiresPermission("schedule:view")
    @GetMapping("/resource/{resourceId}")
    public ResponseEntity<StaffAttendance> getAttendanceByResourceAndDate(
            @PathVariable Long resourceId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        log.debug("Getting attendance for resourceId={}, date={}", resourceId, date);

        StaffAttendance attendance = staffAttendanceService.getByResourceIdAndDate(resourceId, date);
        if (attendance != null) {
            return ResponseEntity.ok(attendance);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * 根据租户ID和日期查询所有员工的签到记录
     */
    @RequiresPermission("schedule:view")
    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<List<StaffAttendance>> getAttendanceByTenantAndDate(
            @PathVariable Long tenantId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        log.debug("Getting all attendance for tenantId={}, date={}", tenantId, date);

        List<StaffAttendance> attendanceList = staffAttendanceService.getByTenantIdAndDate(tenantId, date);
        return ResponseEntity.ok(attendanceList);
    }

    /**
     * 根据资源ID和日期范围查询签到记录
     */
    @RequiresPermission("schedule:view")
    @GetMapping("/resource/{resourceId}/range")
    public ResponseEntity<List<StaffAttendance>> getAttendanceByDateRange(
            @PathVariable Long resourceId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        log.debug("Getting attendance for resourceId={}, startDate={}, endDate={}", resourceId, startDate, endDate);

        List<StaffAttendance> attendanceList = staffAttendanceService.getByResourceIdAndDateRange(
                resourceId, startDate, endDate);
        return ResponseEntity.ok(attendanceList);
    }

    /**
     * 删除签到记录（恢复为使用原始排班）
     */
    @RequiresPermission("schedule:update")
    @DeleteMapping("/resource/{resourceId}")
    public ResponseEntity<Void> deleteAttendance(
            @PathVariable Long resourceId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        log.debug("Deleting attendance for resourceId={}, date={}", resourceId, date);

        boolean deleted = staffAttendanceService.deleteByResourceIdAndDate(resourceId, date);
        if (deleted) {
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
