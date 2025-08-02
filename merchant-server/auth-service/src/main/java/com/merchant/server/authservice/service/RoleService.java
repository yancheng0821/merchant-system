package com.merchant.server.authservice.service;

import com.merchant.server.authservice.entity.Role;

import java.util.List;
import java.util.Optional;

public interface RoleService {
    
    /**
     * 根据角色代码和租户ID查找角色
     */
    Optional<Role> findByRoleCodeAndTenantId(String roleCode, Long tenantId);
    
    /**
     * 根据租户ID获取所有角色
     */
    List<Role> findByTenantId(Long tenantId);
    
    /**
     * 创建默认角色
     */
    void createDefaultRoles(Long tenantId);
}