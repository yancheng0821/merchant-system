package com.merchant.server.businessservice.mapper;

import com.merchant.server.businessservice.entity.Staff;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface StaffMapper {
    
    /**
     * 根据租户ID查询所有员工
     */
    List<Staff> findByTenantId(@Param("tenantId") Long tenantId);
    
    /**
     * 根据租户ID查询活跃员工
     */
    List<Staff> findActiveByTenantId(@Param("tenantId") Long tenantId);
    
    /**
     * 根据ID查询员工
     */
    Staff findById(@Param("id") Long id);
    
    /**
     * 插入员工
     */
    void insert(Staff staff);
    
    /**
     * 更新员工
     */
    void update(Staff staff);
    
    /**
     * 删除员工
     */
    void deleteById(@Param("id") Long id);
}