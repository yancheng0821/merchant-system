package com.merchant.server.businessservice.controller;

import com.merchant.server.businessservice.entity.Certificate;
import com.merchant.server.businessservice.entity.FixedCost;
import com.merchant.server.businessservice.entity.MaterialPurchase;
import com.merchant.server.businessservice.service.CostManagementService;
import com.merchant.server.common.annotation.Auditable;
import com.merchant.server.common.annotation.RequiresPermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 成本管理控制器
 */
@RestController
@RequestMapping("/api/business/costs")
@RequiredArgsConstructor
@Slf4j
public class CostManagementController {

    private final CostManagementService costManagementService;

    // ============ 证书管理 ============

    /**
     * 获取租户所有证书
     */
    @RequiresPermission("costs:view_certificates")
    @GetMapping("/certificates")
    public ResponseEntity<List<Certificate>> getCertificates(@RequestParam Long tenantId) {
        log.debug("Getting certificates for tenant: {}", tenantId);
        List<Certificate> certificates = costManagementService.getCertificatesByTenantId(tenantId);
        return ResponseEntity.ok(certificates);
    }

    /**
     * 创建证书
     */
    @RequiresPermission("costs:create_certificate")
    @Auditable(resource = "COST_MANAGEMENT", action = "CREATE", description = "Create new certificate")
    @PostMapping("/certificates")
    public ResponseEntity<Certificate> createCertificate(@RequestBody Certificate certificate) {
        log.info("Creating certificate: {}", certificate.getCertificateName());
        Certificate created = costManagementService.createCertificate(certificate);
        return ResponseEntity.ok(created);
    }

    /**
     * 更新证书
     */
    @RequiresPermission("costs:update_certificate")
    @Auditable(resource = "COST_MANAGEMENT", action = "UPDATE", resourceIdParam = "id", recordOldValue = true, description = "Update certificate")
    @PutMapping("/certificates/{id}")
    public ResponseEntity<Certificate> updateCertificate(
            @PathVariable Long id,
            @RequestBody Certificate certificate) {
        log.info("Updating certificate: {}", id);
        certificate.setId(id);
        Certificate updated = costManagementService.updateCertificate(certificate);
        return ResponseEntity.ok(updated);
    }

    /**
     * 删除证书
     */
    @RequiresPermission("costs:delete_certificate")
    @Auditable(resource = "COST_MANAGEMENT", action = "DELETE", resourceIdParam = "id", recordOldValue = true, description = "Delete certificate")
    @DeleteMapping("/certificates/{id}")
    public ResponseEntity<Void> deleteCertificate(
            @PathVariable Long id,
            @RequestParam Long tenantId) {
        log.info("Deleting certificate: {}", id);
        costManagementService.deleteCertificate(id, tenantId);
        return ResponseEntity.ok().build();
    }

    // ============ 固定成本记录 ============

    /**
     * 获取租户所有固定成本
     */
    @RequiresPermission("costs:view_fixed_costs")
    @GetMapping("/fixed-costs")
    public ResponseEntity<List<FixedCost>> getFixedCosts(@RequestParam Long tenantId) {
        log.debug("Getting fixed costs for tenant: {}", tenantId);
        List<FixedCost> fixedCosts = costManagementService.getFixedCostsByTenantId(tenantId);
        return ResponseEntity.ok(fixedCosts);
    }

    /**
     * 创建固定成本
     */
    @RequiresPermission("costs:create_fixed_cost")
    @Auditable(resource = "COST_MANAGEMENT", action = "CREATE", description = "Create new fixed cost")
    @PostMapping("/fixed-costs")
    public ResponseEntity<FixedCost> createFixedCost(@RequestBody FixedCost fixedCost) {
        log.info("Creating fixed cost: {}", fixedCost.getCostName());
        FixedCost created = costManagementService.createFixedCost(fixedCost);
        return ResponseEntity.ok(created);
    }

    /**
     * 更新固定成本
     */
    @RequiresPermission("costs:update_fixed_cost")
    @Auditable(resource = "COST_MANAGEMENT", action = "UPDATE", resourceIdParam = "id", recordOldValue = true, description = "Update fixed cost")
    @PutMapping("/fixed-costs/{id}")
    public ResponseEntity<FixedCost> updateFixedCost(
            @PathVariable Long id,
            @RequestBody FixedCost fixedCost) {
        log.info("Updating fixed cost: {}", id);
        fixedCost.setId(id);
        FixedCost updated = costManagementService.updateFixedCost(fixedCost);
        return ResponseEntity.ok(updated);
    }

    /**
     * 删除固定成本
     */
    @RequiresPermission("costs:delete_fixed_cost")
    @Auditable(resource = "COST_MANAGEMENT", action = "DELETE", resourceIdParam = "id", recordOldValue = true, description = "Delete fixed cost")
    @DeleteMapping("/fixed-costs/{id}")
    public ResponseEntity<Void> deleteFixedCost(
            @PathVariable Long id,
            @RequestParam Long tenantId) {
        log.info("Deleting fixed cost: {}", id);
        costManagementService.deleteFixedCost(id, tenantId);
        return ResponseEntity.ok().build();
    }

    // ============ 物料采购记录 ============

    /**
     * 获取租户所有物料采购记录
     */
    @RequiresPermission("costs:view_materials")
    @GetMapping("/materials")
    public ResponseEntity<List<MaterialPurchase>> getMaterialPurchases(@RequestParam Long tenantId) {
        log.debug("Getting material purchases for tenant: {}", tenantId);
        List<MaterialPurchase> materials = costManagementService.getMaterialPurchasesByTenantId(tenantId);
        return ResponseEntity.ok(materials);
    }

    /**
     * 创建物料采购记录
     */
    @RequiresPermission("costs:create_material")
    @Auditable(resource = "COST_MANAGEMENT", action = "CREATE", description = "Create new material purchase")
    @PostMapping("/materials")
    public ResponseEntity<MaterialPurchase> createMaterialPurchase(@RequestBody MaterialPurchase materialPurchase) {
        log.info("Creating material purchase: {}", materialPurchase.getMaterialName());
        MaterialPurchase created = costManagementService.createMaterialPurchase(materialPurchase);
        return ResponseEntity.ok(created);
    }

    /**
     * 更新物料采购记录
     */
    @RequiresPermission("costs:update_material")
    @Auditable(resource = "COST_MANAGEMENT", action = "UPDATE", resourceIdParam = "id", recordOldValue = true, description = "Update material purchase")
    @PutMapping("/materials/{id}")
    public ResponseEntity<MaterialPurchase> updateMaterialPurchase(
            @PathVariable Long id,
            @RequestBody MaterialPurchase materialPurchase) {
        log.info("Updating material purchase: {}", id);
        materialPurchase.setId(id);
        MaterialPurchase updated = costManagementService.updateMaterialPurchase(materialPurchase);
        return ResponseEntity.ok(updated);
    }

    /**
     * 删除物料采购记录
     */
    @RequiresPermission("costs:delete_material")
    @Auditable(resource = "COST_MANAGEMENT", action = "DELETE", resourceIdParam = "id", recordOldValue = true, description = "Delete material purchase")
    @DeleteMapping("/materials/{id}")
    public ResponseEntity<Void> deleteMaterialPurchase(
            @PathVariable Long id,
            @RequestParam Long tenantId) {
        log.info("Deleting material purchase: {}", id);
        costManagementService.deleteMaterialPurchase(id, tenantId);
        return ResponseEntity.ok().build();
    }
}
