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
} 