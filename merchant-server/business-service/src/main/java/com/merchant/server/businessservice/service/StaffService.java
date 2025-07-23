package com.merchant.server.businessservice.service;

import com.merchant.server.businessservice.entity.Staff;

import java.util.List;

public interface StaffService {
    
    /**
     * 根据租户ID查询所有员工
     */
    List<Staff> getAllStaffByTenantId(Long tenantId);
    
    /**
     * 根据租户ID查询活跃员工
     */
    List<Staff> getActiveStaffByTenantId(Long tenantId);
    
    /**
     * 根据ID查询员工
     */
    Staff getStaffById(Long id);
    
    /**
     * 创建员工
     */
    Staff createStaff(Staff staff);
    
    /**
     * 更新员工
     */
    Staff updateStaff(Staff staff);
    
    /**
     * 删除员工
     */
    void deleteStaff(Long id);
}