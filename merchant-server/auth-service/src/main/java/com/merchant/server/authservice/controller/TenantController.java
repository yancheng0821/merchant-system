package com.merchant.server.authservice.controller;

import com.merchant.server.authservice.entity.Tenant;
import com.merchant.server.authservice.service.TenantService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 租户管理控制器
 */
@RestController
@RequestMapping("/api/auth/tenants")
@RequiredArgsConstructor
@Slf4j
public class TenantController {
    
    private final TenantService tenantService;
    
    /**
     * 获取所有活跃租户
     */
    @GetMapping("/active")
    public ResponseEntity<List<Map<String, Object>>> getActiveTenants() {
        log.info("Getting all active tenants");
        
        try {
            List<Tenant> activeTenants = tenantService.findActiveTenants();
            
            List<Map<String, Object>> tenantMaps = activeTenants.stream()
                .map(tenant -> {
                    Map<String, Object> map = Map.of(
                        "id", tenant.getId(),
                        "tenantCode", tenant.getTenantCode(),
                        "tenantName", tenant.getTenantName(),
                        "status", tenant.getStatus().toString()
                    );
                    return map;
                })
                .collect(Collectors.toList());
            
            log.info("Found {} active tenants", activeTenants.size());
            return ResponseEntity.ok(tenantMaps);
            
        } catch (Exception e) {
            log.error("Error getting active tenants", e);
            return ResponseEntity.internalServerError().build();
        }
    }
} 