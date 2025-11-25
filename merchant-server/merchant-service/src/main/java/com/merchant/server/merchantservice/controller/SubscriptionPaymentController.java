package com.merchant.server.merchantservice.controller;

import com.merchant.server.common.dto.ApiResponse;
import com.merchant.server.merchantservice.entity.Invoice;
import com.merchant.server.merchantservice.service.InvoiceService;
import com.merchant.server.merchantservice.service.SubscriptionPaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 订阅支付控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/merchant/subscription-payment")
@RequiredArgsConstructor
public class SubscriptionPaymentController {

    private final SubscriptionPaymentService paymentService;
    private final InvoiceService invoiceService;

    /**
     * 获取支付配置（Stripe Publishable Key等）
     */
    @GetMapping("/config")
    public ResponseEntity<ApiResponse<Map<String, String>>> getPaymentConfig() {
        log.info("获取支付配置");
        try {
            Map<String, String> config = paymentService.getPaymentConfig();
            return ResponseEntity.ok(ApiResponse.success(config));
        } catch (Exception e) {
            log.error("获取支付配置失败: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("获取支付配置失败: " + e.getMessage()));
        }
    }

    /**
     * 为账单创建Stripe Payment Intent
     */
    @PostMapping("/create-payment-intent/{invoiceId}")
    public ResponseEntity<ApiResponse<Map<String, String>>> createPaymentIntent(@PathVariable Long invoiceId) {
        log.info("创建Payment Intent - 账单ID: {}", invoiceId);

        try {
            String clientSecret = paymentService.createPaymentIntent(invoiceId);

            Map<String, String> response = new HashMap<>();
            response.put("clientSecret", clientSecret);
            response.put("invoiceId", invoiceId.toString());

            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (Exception e) {
            log.error("创建Payment Intent失败: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * 取消账单的Payment Intent
     */
    @PostMapping("/cancel-payment-intent/{invoiceId}")
    public ResponseEntity<ApiResponse<Void>> cancelPaymentIntent(@PathVariable Long invoiceId) {
        log.info("取消Payment Intent - 账单ID: {}", invoiceId);

        try {
            paymentService.cancelPaymentIntent(invoiceId);
            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (Exception e) {
            log.error("取消Payment Intent失败: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * 根据ID查询账单详情
     */
    @GetMapping("/invoice/{invoiceId}")
    public ResponseEntity<ApiResponse<Invoice>> getInvoice(@PathVariable Long invoiceId) {
        log.info("查询账单 - ID: {}", invoiceId);

        try {
            Invoice invoice = invoiceService.getInvoiceById(invoiceId);
            if (invoice == null) {
                return ResponseEntity.ok(ApiResponse.error("账单不存在"));
            }
            return ResponseEntity.ok(ApiResponse.success(invoice));
        } catch (Exception e) {
            log.error("查询账单失败: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("查询账单失败: " + e.getMessage()));
        }
    }

    /**
     * 查询指定租户的所有账单
     */
    @GetMapping("/invoices/tenant/{tenantId}")
    public ResponseEntity<ApiResponse<List<Invoice>>> getInvoicesByTenantId(@PathVariable Long tenantId) {
        log.info("查询租户账单列表 - 租户ID: {}", tenantId);

        try {
            List<Invoice> invoices = invoiceService.getInvoicesByTenantId(tenantId);
            return ResponseEntity.ok(ApiResponse.success(invoices));
        } catch (Exception e) {
            log.error("查询租户账单列表失败: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("查询账单列表失败: " + e.getMessage()));
        }
    }

    /**
     * 查询指定订阅的所有账单
     */
    @GetMapping("/invoices/subscription/{subscriptionId}")
    public ResponseEntity<ApiResponse<List<Invoice>>> getInvoicesBySubscriptionId(@PathVariable Long subscriptionId) {
        log.info("查询订阅账单列表 - 订阅ID: {}", subscriptionId);

        try {
            List<Invoice> invoices = invoiceService.getInvoicesBySubscriptionId(subscriptionId);
            return ResponseEntity.ok(ApiResponse.success(invoices));
        } catch (Exception e) {
            log.error("查询订阅账单列表失败: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("查询账单列表失败: " + e.getMessage()));
        }
    }
}
