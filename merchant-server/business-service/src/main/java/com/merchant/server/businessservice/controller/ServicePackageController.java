package com.merchant.server.businessservice.controller;

import com.merchant.server.common.annotation.RequiresPermission;
import com.merchant.server.businessservice.dto.ServicePackageDTO;
import com.merchant.server.businessservice.service.ServicePackageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 服务套餐控制器
 *
 * @author System
 * @since 2025-01-21
 */
@Slf4j
@RestController
@RequestMapping("/api/business/packages")
@RequiredArgsConstructor
public class ServicePackageController {

    private final ServicePackageService servicePackageService;

    /**
     * 根据租户ID获取所有套餐
     */
    @RequiresPermission("service_packages:view")
    @GetMapping
    public ResponseEntity<List<ServicePackageDTO>> getPackages(@RequestParam Long tenantId,
                                                               @RequestParam(required = false) String status) {
        try {
            log.info("Getting packages for tenant: {}, status: {}", tenantId, status);
            List<ServicePackageDTO> packages;
            if (status != null && !status.isEmpty()) {
                packages = servicePackageService.getPackagesByTenantIdAndStatus(tenantId, status);
            } else {
                packages = servicePackageService.getPackagesByTenantId(tenantId);
            }
            log.info("Found {} packages for tenant: {}", packages.size(), tenantId);
            return ResponseEntity.ok(packages);
        } catch (Exception e) {
            log.error("Error getting packages for tenant: {}", tenantId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * 根据ID获取套餐
     */
    @RequiresPermission("service_packages:view")
    @GetMapping("/{id}")
    public ResponseEntity<ServicePackageDTO> getPackageById(@PathVariable Long id,
                                                            @RequestParam Long tenantId) {
        try {
            log.info("Getting package by id: {}, tenantId: {}", id, tenantId);
            ServicePackageDTO packageDto = servicePackageService.getPackageById(id, tenantId);
            return ResponseEntity.ok(packageDto);
        } catch (Exception e) {
            log.error("Error getting package by id: {}", id, e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * 创建套餐
     */
    @RequiresPermission("service_packages:create")
    @com.merchant.server.common.annotation.Auditable(resource = "SERVICE_PACKAGE", action = "CREATE", recordOldValue = true, description = "Create new service package")
    @PostMapping
    public ResponseEntity<ServicePackageDTO> createPackage(@RequestBody ServicePackageDTO packageDto) {
        try {
            log.info("Creating package: {}", packageDto.getName());
            ServicePackageDTO created = servicePackageService.createPackage(packageDto);
            log.info("Successfully created package with id: {}", created.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            log.error("Error creating package: {}", packageDto.getName(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * 更新套餐
     */
    @RequiresPermission("service_packages:update")
    @com.merchant.server.common.annotation.Auditable(resource = "SERVICE_PACKAGE", action = "UPDATE", resourceIdParam = "id", recordOldValue = true, description = "Update service package")
    @PutMapping("/{id}")
    public ResponseEntity<ServicePackageDTO> updatePackage(@PathVariable Long id,
                                                           @RequestBody ServicePackageDTO packageDto) {
        try {
            log.info("Updating package with id: {}", id);
            ServicePackageDTO updated = servicePackageService.updatePackage(id, packageDto);
            log.info("Successfully updated package with id: {}", id);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            log.error("Error updating package with id: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * 删除套餐
     */
    @RequiresPermission("service_packages:delete")
    @com.merchant.server.common.annotation.Auditable(resource = "SERVICE_PACKAGE", action = "DELETE", resourceIdParam = "id", recordOldValue = true, description = "Delete service package")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePackage(@PathVariable Long id,
                                              @RequestParam Long tenantId) {
        try {
            log.info("Deleting package with id: {}, tenantId: {}", id, tenantId);
            servicePackageService.deletePackage(id, tenantId);
            log.info("Successfully deleted package with id: {}", id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Error deleting package with id: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}