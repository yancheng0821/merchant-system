package com.merchant.server.authservice.service;

import com.merchant.server.authservice.entity.UserRole;

import java.util.List;

public interface UserRoleService {
    
    /**
     * 为用户分配角色
     */
    void assignRole(Long userId, Long roleId);
    
    /**
     * 根据用户ID获取角色关联
     */
    List<UserRole> findByUserId(Long userId);
    
    /**
     * 删除用户的所有角色
     */
    void deleteByUserId(Long userId);
}