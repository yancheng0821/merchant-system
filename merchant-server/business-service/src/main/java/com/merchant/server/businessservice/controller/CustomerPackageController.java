package com.merchant.server.businessservice.controller;

import com.merchant.server.common.annotation.RequiresPermission;
import com.merchant.server.businessservice.dto.CustomerPackageDTO;
import com.merchant.server.businessservice.service.CustomerPackageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 客户套餐管理控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/business/customer-packages")
@RequiredArgsConstructor
public class CustomerPackageController {

    private final CustomerPackageService customerPackageService;

    /**
     * 获取客户的所有套餐
     */
    @RequiresPermission("customer_packages:view")
    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<CustomerPackageDTO>> getCustomerPackages(@PathVariable Long customerId) {
        log.info("Getting packages for customer: {}", customerId);
        List<CustomerPackageDTO> packages = customerPackageService.getPackagesByCustomerId(customerId);
        return ResponseEntity.ok(packages);
    }

    /**
     * 获取客户的活跃套餐
     */
    @RequiresPermission("customer_packages:view")
    @GetMapping("/customer/{customerId}/active")
    public ResponseEntity<List<CustomerPackageDTO>> getActivePackages(
            @PathVariable Long customerId,
            @RequestParam Long tenantId) {
        log.info("Getting active packages for customer: {} in tenant: {}", customerId, tenantId);
        List<CustomerPackageDTO> packages = customerPackageService.getActivePackagesByCustomerId(tenantId, customerId);
        return ResponseEntity.ok(packages);
    }

    /**
     * 购买套餐
     */
    @RequiresPermission("customer_packages:purchase")
    @com.merchant.server.common.annotation.Auditable(resource = "CUSTOMER_PACKAGE", action = "PURCHASE", resourceIdParam = "customerId", recordOldValue = true, description = "Customer purchases package")
    @PostMapping("/purchase")
    public ResponseEntity<Map<String, Object>> purchasePackage(@Valid @RequestBody CustomerPackageDTO dto) {
        log.info("=== purchasePackage API called ===");
        log.info("Request body: {}", dto);

        try {
            CustomerPackageDTO purchasedPackage = customerPackageService.purchasePackage(dto);
            log.info("Package purchased successfully for customer: {}", dto.getCustomerId());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Package purchased successfully");
            response.put("package", purchasedPackage);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to purchase package: {}", e.getMessage(), e);

            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());

            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * 根据客户ID和状态获取套餐
     */
    @RequiresPermission("customer_packages:view")
    @GetMapping("/customer/{customerId}/status/{status}")
    public ResponseEntity<List<CustomerPackageDTO>> getPackagesByStatus(
            @PathVariable Long customerId,
            @PathVariable String status) {
        log.info("Getting packages for customer: {} with status: {}", customerId, status);
        List<CustomerPackageDTO> packages = customerPackageService.getPackagesByCustomerIdAndStatus(customerId, status);
        return ResponseEntity.ok(packages);
    }
}