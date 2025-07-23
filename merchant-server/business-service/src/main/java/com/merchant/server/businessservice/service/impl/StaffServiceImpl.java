package com.merchant.server.businessservice.service.impl;

import com.merchant.server.businessservice.entity.Staff;
import com.merchant.server.businessservice.mapper.StaffMapper;
import com.merchant.server.businessservice.service.StaffService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class StaffServiceImpl implements StaffService {

    private final StaffMapper staffMapper;

    @Override
    public List<Staff> getAllStaffByTenantId(Long tenantId) {
        log.info("Getting all staff for tenant: {}", tenantId);
        return staffMapper.findByTenantId(tenantId);
    }

    @Override
    public List<Staff> getActiveStaffByTenantId(Long tenantId) {
        log.info("Getting active staff for tenant: {}", tenantId);
        return staffMapper.findActiveByTenantId(tenantId);
    }

    @Override
    public Staff getStaffById(Long id) {
        log.info("Getting staff by id: {}", id);
        Staff staff = staffMapper.findById(id);
        if (staff == null) {
            throw new RuntimeException("Staff not found with id: " + id);
        }
        return staff;
    }

    @Override
    public Staff createStaff(Staff staff) {
        log.info("Creating staff: {}", staff.getName());
        staff.setCreatedAt(LocalDateTime.now());
        staff.setUpdatedAt(LocalDateTime.now());
        staffMapper.insert(staff);
        return staff;
    }

    @Override
    public Staff updateStaff(Staff staff) {
        log.info("Updating staff: {}", staff.getId());
        staff.setUpdatedAt(LocalDateTime.now());
        staffMapper.update(staff);
        return staff;
    }

    @Override
    public void deleteStaff(Long id) {
        log.info("Deleting staff: {}", id);
        staffMapper.deleteById(id);
    }
}