package com.merchant.server.authservice.controller;

import com.merchant.server.authservice.entity.Tenant;
import com.merchant.server.authservice.service.TenantService;
import com.merchant.server.common.annotation.RequiresPermission;
import com.merchant.server.common.annotation.Auditable;
import com.merchant.server.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.HashMap;
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

    /**
     * 获取所有商户（仅超级管理员可访问）
     */
    @RequiresPermission("SUPER_ADMIN")
    @GetMapping("/all")
    public ApiResponse<List<Map<String, Object>>> getAllTenants() {
        log.info("Getting all tenants");

        try {
            List<Tenant> allTenants = tenantService.findAll();

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

            List<Map<String, Object>> tenantMaps = allTenants.stream()
                .map(tenant -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", tenant.getId());
                    map.put("tenantCode", tenant.getTenantCode());
                    map.put("tenantName", tenant.getTenantName());
                    map.put("tenantType", tenant.getTenantType().toString());
                    map.put("status", tenant.getStatus().toString());
                    map.put("contactPerson", tenant.getContactPerson());
                    map.put("contactPhone", tenant.getContactPhone());
                    map.put("contactEmail", tenant.getContactEmail());
                    map.put("address", tenant.getAddress());
                    map.put("businessLicense", tenant.getBusinessLicense());
                    if (tenant.getCreatedAt() != null) {
                        map.put("createdAt", tenant.getCreatedAt().format(formatter));
                    }
                    return map;
                })
                .collect(Collectors.toList());

            log.info("Found {} tenants", allTenants.size());
            return ApiResponse.success(tenantMaps);

        } catch (Exception e) {
            log.error("Error getting all tenants", e);
            return ApiResponse.error("获取商户列表失败");
        }
    }

    /**
     * 获取所有待激活的租户（仅超级管理员可访问）
     */
    @RequiresPermission("SUPER_ADMIN")
    @GetMapping("/inactive")
    public ApiResponse<List<Map<String, Object>>> getInactiveTenants() {
        log.info("Getting all inactive tenants");

        try {
            List<Tenant> inactiveTenants = tenantService.findInactiveTenants();

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

            List<Map<String, Object>> tenantMaps = inactiveTenants.stream()
                .map(tenant -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", tenant.getId());
                    map.put("tenantCode", tenant.getTenantCode());
                    map.put("tenantName", tenant.getTenantName());
                    map.put("tenantType", tenant.getTenantType().toString());
                    map.put("status", tenant.getStatus().toString());
                    map.put("contactPerson", tenant.getContactPerson());
                    map.put("contactPhone", tenant.getContactPhone());
                    map.put("contactEmail", tenant.getContactEmail());
                    map.put("address", tenant.getAddress());
                    map.put("businessLicense", tenant.getBusinessLicense());
                    if (tenant.getCreatedAt() != null) {
                        map.put("createdAt", tenant.getCreatedAt().format(formatter));
                    }
                    return map;
                })
                .collect(Collectors.toList());

            log.info("Found {} inactive tenants", inactiveTenants.size());
            return ApiResponse.success(tenantMaps);

        } catch (Exception e) {
            log.error("Error getting inactive tenants", e);
            return ApiResponse.error("获取待激活商户列表失败");
        }
    }

    /**
     * 激活租户（仅超级管理员可访问）
     */
    @RequiresPermission("SUPER_ADMIN")
    @Auditable(resource = "TENANT", action = "UPDATE", resourceIdParam = "tenantId", recordOldValue = true, description = "Activate tenant")
    @PutMapping("/{tenantId}/activate")
    public ApiResponse<Void> activateTenant(@PathVariable Long tenantId) {
        log.info("Activating tenant with id: {}", tenantId);

        try {
            tenantService.activateTenant(tenantId);
            log.info("Tenant activated successfully: {}", tenantId);
            return ApiResponse.success(null);

        } catch (Exception e) {
            log.error("Error activating tenant: {}", tenantId, e);
            return ApiResponse.error("激活商户失败");
        }
    }

    /**
     * 停用租户（仅超级管理员可访问）
     */
    @RequiresPermission("SUPER_ADMIN")
    @Auditable(resource = "TENANT", action = "UPDATE", resourceIdParam = "tenantId", recordOldValue = true, description = "Deactivate tenant")
    @PutMapping("/{tenantId}/deactivate")
    public ApiResponse<Void> deactivateTenant(@PathVariable Long tenantId) {
        log.info("Deactivating tenant with id: {}", tenantId);

        try {
            tenantService.deactivateTenant(tenantId);
            log.info("Tenant deactivated successfully: {}", tenantId);
            return ApiResponse.success(null);

        } catch (Exception e) {
            log.error("Error deactivating tenant: {}", tenantId, e);
            return ApiResponse.error("停用商户失败");
        }
    }
} 