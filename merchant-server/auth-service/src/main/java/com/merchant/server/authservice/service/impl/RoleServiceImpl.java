package com.merchant.server.authservice.service.impl;

import com.merchant.server.authservice.entity.Role;
import com.merchant.server.authservice.service.RoleService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
public class RoleServiceImpl implements RoleService {
    
    @Override
    public Optional<Role> findByRoleCodeAndTenantId(String roleCode, Long tenantId) {
        // 临时实现：创建一个模拟的管理员角色
        if ("MERCHANT_ADMIN".equals(roleCode)) {
            Role role = new Role();
            role.setId(1L);
            role.setTenantId(tenantId);
            role.setRoleCode("MERCHANT_ADMIN");
            role.setRoleName("商户管理员");
            role.setStatus(Role.RoleStatus.ACTIVE);
            return Optional.of(role);
        }
        return Optional.empty();
    }
    
    @Override
    public List<Role> findByTenantId(Long tenantId) {
        // 临时实现：返回空列表
        return List.of();
    }
    
    @Override
    public void createDefaultRoles(Long tenantId) {
        // 临时实现：什么都不做
        log.info("创建默认角色 - 租户ID: {} (临时实现)", tenantId);
    }
}