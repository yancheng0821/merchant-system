package com.merchant.server.businessservice.controller;

import com.merchant.server.businessservice.entity.Staff;
import com.merchant.server.businessservice.service.StaffService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
public class StaffController {

    private final StaffService staffService;

    /**
     * 获取租户的所有员工
     */
    @GetMapping
    public ResponseEntity<List<Staff>> getAllStaff(@RequestParam Long tenantId) {
        List<Staff> staff = staffService.getAllStaffByTenantId(tenantId);
        return ResponseEntity.ok(staff);
    }

    /**
     * 获取租户的活跃员工
     */
    @GetMapping("/active")
    public ResponseEntity<List<Staff>> getActiveStaff(@RequestParam Long tenantId) {
        List<Staff> staff = staffService.getActiveStaffByTenantId(tenantId);
        return ResponseEntity.ok(staff);
    }

    /**
     * 根据ID获取员工
     */
    @GetMapping("/{id}")
    public ResponseEntity<Staff> getStaffById(@PathVariable Long id) {
        Staff staff = staffService.getStaffById(id);
        return ResponseEntity.ok(staff);
    }

    /**
     * 创建员工
     */
    @PostMapping
    public ResponseEntity<Staff> createStaff(@RequestBody Staff staff) {
        Staff created = staffService.createStaff(staff);
        return ResponseEntity.ok(created);
    }

    /**
     * 更新员工
     */
    @PutMapping("/{id}")
    public ResponseEntity<Staff> updateStaff(@PathVariable Long id, @RequestBody Staff staff) {
        staff.setId(id);
        Staff updated = staffService.updateStaff(staff);
        return ResponseEntity.ok(updated);
    }

    /**
     * 删除员工
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStaff(@PathVariable Long id) {
        staffService.deleteStaff(id);
        return ResponseEntity.ok().build();
    }
}