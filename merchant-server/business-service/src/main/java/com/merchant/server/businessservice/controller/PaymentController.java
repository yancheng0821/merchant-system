package com.merchant.server.businessservice.controller;

import com.merchant.server.common.annotation.RequiresPermission;
import com.merchant.server.businessservice.dto.PaymentRequestDTO;
import com.merchant.server.businessservice.dto.PaymentResponseDTO;
import com.merchant.server.businessservice.dto.pos.POSTransactionStatus;
import com.merchant.server.businessservice.service.POSPaymentService;
import com.merchant.server.businessservice.enums.RefundReason;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 支付控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/business/payments")
@RequiredArgsConstructor
public class PaymentController {
    
    private final POSPaymentService posPaymentService;
    
    /**
     * 发起支付
     */
    @RequiresPermission("orders:payment")
    @PostMapping("/orders/{orderId}/pay")
    public ResponseEntity<PaymentResponseDTO> initiatePayment(
            @PathVariable Long orderId,
            @Valid @RequestBody PaymentRequestDTO request) {
        log.info("Initiating payment for order: {}", orderId);
        
        try {
            PaymentResponseDTO response = posPaymentService.initiatePayment(orderId, request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Payment initiation failed", e);
            return ResponseEntity.badRequest().body(
                PaymentResponseDTO.builder()
                    .orderId(orderId.toString())
                    .status("failed")
                    .errorMessage(e.getMessage())
                    .build()
            );
        }
    }
    
    /**
     * 现金支付
     */
    @RequiresPermission("orders:payment")
    @PostMapping("/orders/{orderId}/cash")
    public ResponseEntity<PaymentResponseDTO> processCashPayment(
            @PathVariable Long orderId,
            @RequestParam Double amount) {
        log.info("Processing cash payment for order: {}, amount: {}", orderId, amount);
        
        try {
            PaymentResponseDTO response = posPaymentService.processCashPayment(orderId, amount);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Cash payment failed", e);
            return ResponseEntity.badRequest().body(
                PaymentResponseDTO.builder()
                    .orderId(orderId.toString())
                    .status("failed")
                    .errorMessage(e.getMessage())
                    .build()
            );
        }
    }
    
    /**
     * 查询支付状态
     */
    @RequiresPermission("orders:view")
    @GetMapping("/transactions/{transactionId}/status")
    public ResponseEntity<POSTransactionStatus> queryPaymentStatus(
            @PathVariable String transactionId) {
        log.info("Querying payment status for transaction: {}", transactionId);
        
        try {
            POSTransactionStatus status = posPaymentService.queryPaymentStatus(transactionId);
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            log.error("Failed to query payment status", e);
            return ResponseEntity.badRequest().body(
                POSTransactionStatus.builder()
                    .transactionId(transactionId)
                    .status("error")
                    .errorMessage(e.getMessage())
                    .build()
            );
        }
    }
    
    /**
     * 取消支付
     */
    @RequiresPermission("orders:payment")
    @PostMapping("/orders/{orderId}/cancel")
    public ResponseEntity<Map<String, Object>> cancelPayment(@PathVariable Long orderId) {
        log.info("Cancelling payment for order: {}", orderId);
        
        Map<String, Object> response = new HashMap<>();
        try {
            boolean success = posPaymentService.cancelPayment(orderId);
            response.put("success", success);
            response.put("message", success ? "Payment cancelled successfully" : "Failed to cancel payment");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to cancel payment", e);
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * 发起退款
     * @param reason 退款原因，前端传来的枚举值（如 DUPLICATE_CHARGE）
     * @param language 语言偏好（可选，默认为zh）
     */
    @RequiresPermission("orders:refund")
    @PostMapping("/orders/{orderId}/refund")
    public ResponseEntity<Map<String, Object>> initiateRefund(
            @PathVariable Long orderId,
            @RequestParam Double amount,
            @RequestParam String reason,
            @RequestParam(defaultValue = "zh") String language) {
        log.info("Initiating refund for order: {}, amount: {}, reason: {}, language: {}", orderId, amount, reason, language);
        
        Map<String, Object> response = new HashMap<>();
        try {
            // 验证退款原因是否有效，并获取对应的枚举
            RefundReason refundReason = RefundReason.fromValue(reason);
            
            // 获取Stripe需要的值
            String stripeReason = refundReason.getStripeValue();
            
            // 获取用户友好的显示文本（存储到数据库）
            String displayText = "zh".equalsIgnoreCase(language) ? 
                refundReason.getChineseDisplay() : refundReason.getEnglishDisplay();
            
            // 调用服务，传递Stripe值和显示文本
            boolean success = posPaymentService.initiateRefund(orderId, amount, stripeReason, displayText);
            response.put("success", success);
            response.put("message", success ? "Refund initiated successfully" : "Failed to initiate refund");
            response.put("refundReason", displayText);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to initiate refund", e);
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * 获取可用的退款原因
     */
    @GetMapping("/refund-reasons")
    public ResponseEntity<List<Map<String, String>>> getRefundReasons() {
        List<Map<String, String>> reasons = new ArrayList<>();
        for (RefundReason reason : RefundReason.values()) {
            Map<String, String> reasonMap = new HashMap<>();
            reasonMap.put("value", reason.name());
            reasonMap.put("label_zh", reason.getChineseDisplay());
            reasonMap.put("label_en", reason.getEnglishDisplay());
            reasonMap.put("stripe_value", reason.getStripeValue());
            reasons.add(reasonMap);
        }
        return ResponseEntity.ok(reasons);
    }
    
    /**
     * 重试支付
     */
    @RequiresPermission("orders:payment")
    @PostMapping("/orders/{orderId}/retry")
    public ResponseEntity<PaymentResponseDTO> retryPayment(@PathVariable Long orderId) {
        log.info("Retrying payment for order: {}", orderId);
        
        try {
            PaymentResponseDTO response = posPaymentService.retryPayment(orderId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Payment retry failed", e);
            return ResponseEntity.badRequest().body(
                PaymentResponseDTO.builder()
                    .orderId(orderId.toString())
                    .status("failed")
                    .errorMessage(e.getMessage())
                    .build()
            );
        }
    }
    
    /**
     * 支付回调（用于POS系统的webhook）
     */
    @PostMapping("/callback/{provider}")
    public ResponseEntity<String> handlePaymentCallback(
            @PathVariable String provider,
            @RequestBody String callbackData,
            @RequestHeader Map<String, String> headers) {
        log.info("Received payment callback from provider: {}", provider);
        
        try {
            // 这里需要根据不同的POS提供商解析回调数据
            // 示例代码，实际实现需要根据具体的POS系统
            
            return ResponseEntity.ok("OK");
        } catch (Exception e) {
            log.error("Failed to process payment callback", e);
            return ResponseEntity.internalServerError().body("ERROR");
        }
    }
}