package com.merchant.server.authservice.service.impl;

import com.merchant.server.authservice.entity.Tenant;
import com.merchant.server.authservice.mapper.TenantMapper;
import com.merchant.server.authservice.service.TenantService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TenantServiceImpl implements TenantService {
    
    @Autowired
    private TenantMapper tenantMapper;
    
    @Override
    public Optional<Tenant> findById(Long id) {
        Tenant tenant = tenantMapper.selectById(id);
        return Optional.ofNullable(tenant);
    }
    
    @Override
    public Optional<Tenant> findByTenantCode(String tenantCode) {
        Tenant tenant = tenantMapper.selectByTenantCode(tenantCode);
        return Optional.ofNullable(tenant);
    }
    
    @Override
    public List<Tenant> findAll() {
        return tenantMapper.selectAll();
    }
    
    @Override
    public List<Tenant> findByParentTenantId(Long parentTenantId) {
        return tenantMapper.selectByParentTenantId(parentTenantId);
    }
    
    @Override
    public Tenant save(Tenant tenant) {
        if (tenant.getId() == null) {
            tenantMapper.insert(tenant);
        } else {
            tenantMapper.update(tenant);
        }
        return tenant;
    }
    
    @Override
    public void deleteById(Long id) {
        tenantMapper.deleteById(id);
    }
    
    @Override
    public boolean existsByTenantCode(String tenantCode) {
        return tenantMapper.existsByTenantCode(tenantCode);
    }
    
    @Override
    public List<Tenant> findActiveTenants() {
        return tenantMapper.selectActiveTenants();
    }

    @Override
    public List<Tenant> findInactiveTenants() {
        return tenantMapper.selectInactiveTenants();
    }

    @Override
    public void activateTenant(Long tenantId) {
        tenantMapper.updateStatus(tenantId, Tenant.TenantStatus.ACTIVE);
    }

    @Override
    public void deactivateTenant(Long tenantId) {
        // 订阅过期时调用，设置为 INACTIVE（允许登录但受限，可续费）
        tenantMapper.updateStatus(tenantId, Tenant.TenantStatus.INACTIVE);
    }

    @Override
    public void suspendTenant(Long tenantId) {
        // 管理员手动禁用，设置为 SUSPENDED（完全禁止登录）
        tenantMapper.updateStatus(tenantId, Tenant.TenantStatus.SUSPENDED);
    }
} 