package com.merchant.server.authservice.service;

import com.merchant.server.authservice.entity.Tenant;
import java.util.List;
import java.util.Optional;

public interface TenantService {
    
    Optional<Tenant> findById(Long id);
    
    Optional<Tenant> findByTenantCode(String tenantCode);
    
    List<Tenant> findAll();
    
    List<Tenant> findByParentTenantId(Long parentTenantId);
    
    List<Tenant> findActiveTenants();

    List<Tenant> findInactiveTenants();

    void activateTenant(Long tenantId);

    void deactivateTenant(Long tenantId);

    Tenant save(Tenant tenant);

    void deleteById(Long id);

    boolean existsByTenantCode(String tenantCode);
} 