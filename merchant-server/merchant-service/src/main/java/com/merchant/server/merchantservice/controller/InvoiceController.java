package com.merchant.server.merchantservice.controller;

import com.merchant.server.common.annotation.RequiresPermission;
import com.merchant.server.common.dto.ApiResponse;
import com.merchant.server.merchantservice.entity.Invoice;
import com.merchant.server.merchantservice.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/merchant/invoice")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    /**
     * 根据租户ID查询账单列表
     */
    @RequiresPermission("billing:view")
    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<ApiResponse<List<Invoice>>> getInvoicesByTenantId(@PathVariable Long tenantId) {
        try {
            log.info("查询租户账单列表，tenantId: {}", tenantId);
            List<Invoice> invoices = invoiceService.getInvoicesByTenantId(tenantId);
            return ResponseEntity.ok(ApiResponse.success(invoices));
        } catch (Exception e) {
            log.error("查询租户账单列表失败: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("查询账单列表失败: " + e.getMessage()));
        }
    }

    /**
     * 根据ID查询账单
     */
    @RequiresPermission("billing:view")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Invoice>> getInvoiceById(@PathVariable Long id) {
        try {
            log.info("查询账单，id: {}", id);
            Invoice invoice = invoiceService.getInvoiceById(id);

            if (invoice == null) {
                return ResponseEntity.ok(ApiResponse.error("账单不存在"));
            }

            return ResponseEntity.ok(ApiResponse.success(invoice));
        } catch (Exception e) {
            log.error("查询账单失败: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("查询账单失败: " + e.getMessage()));
        }
    }

    /**
     * 创建账单
     */
    @RequiresPermission("billing:create")
    @PostMapping
    public ResponseEntity<ApiResponse<Invoice>> createInvoice(@RequestBody Invoice invoice) {
        try {
            log.info("创建账单，tenantId: {}, amount: {}", invoice.getTenantId(), invoice.getAmount());
            Invoice created = invoiceService.createInvoice(invoice);
            return ResponseEntity.ok(ApiResponse.success(created));
        } catch (Exception e) {
            log.error("创建账单失败: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("创建账单失败: " + e.getMessage()));
        }
    }

    /**
     * 更新账单
     */
    @RequiresPermission("billing:update")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Invoice>> updateInvoice(@PathVariable Long id, @RequestBody Invoice invoice) {
        try {
            log.info("更新账单，id: {}", id);
            invoice.setId(id);
            Invoice updated = invoiceService.updateInvoice(invoice);
            return ResponseEntity.ok(ApiResponse.success(updated));
        } catch (Exception e) {
            log.error("更新账单失败: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("更新账单失败: " + e.getMessage()));
        }
    }

    /**
     * 删除账单
     */
    @RequiresPermission("billing:delete")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Boolean>> deleteInvoice(@PathVariable Long id) {
        try {
            log.info("删除账单，id: {}", id);
            boolean success = invoiceService.deleteInvoice(id);
            return ResponseEntity.ok(ApiResponse.success(success));
        } catch (Exception e) {
            log.error("删除账单失败: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("删除账单失败: " + e.getMessage()));
        }
    }

    /**
     * 为订阅生成账单
     */
    @PostMapping("/generate/subscription/{subscriptionId}")
    public ResponseEntity<ApiResponse<Invoice>> generateInvoiceForSubscription(@PathVariable Long subscriptionId) {
        try {
            log.info("为订阅生成账单，subscriptionId: {}", subscriptionId);
            Invoice invoice = invoiceService.generateInvoiceForSubscription(subscriptionId);

            if (invoice == null) {
                return ResponseEntity.ok(ApiResponse.error("订阅处于试用期，无需生成账单"));
            }

            return ResponseEntity.ok(ApiResponse.success(invoice));
        } catch (Exception e) {
            log.error("生成账单失败: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("生成账单失败: " + e.getMessage()));
        }
    }

    /**
     * 根据订阅ID查询账单列表
     */
    @RequiresPermission("billing:view")
    @GetMapping("/subscription/{subscriptionId}")
    public ResponseEntity<ApiResponse<List<Invoice>>> getInvoicesBySubscriptionId(@PathVariable Long subscriptionId) {
        try {
            log.info("查询订阅账单列表，subscriptionId: {}", subscriptionId);
            List<Invoice> invoices = invoiceService.getInvoicesBySubscriptionId(subscriptionId);
            return ResponseEntity.ok(ApiResponse.success(invoices));
        } catch (Exception e) {
            log.error("查询订阅账单列表失败: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("查询账单列表失败: " + e.getMessage()));
        }
    }
}
