package com.merchant.server.businessservice.controller;

import com.merchant.server.businessservice.dto.PaymentRequestDTO;
import com.merchant.server.businessservice.dto.PaymentResponseDTO;
import com.merchant.server.businessservice.dto.pos.POSTransactionStatus;
import com.merchant.server.businessservice.service.POSPaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.HashMap;
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
     */
    @PostMapping("/orders/{orderId}/refund")
    public ResponseEntity<Map<String, Object>> initiateRefund(
            @PathVariable Long orderId,
            @RequestParam Double amount,
            @RequestParam String reason) {
        log.info("Initiating refund for order: {}, amount: {}", orderId, amount);
        
        Map<String, Object> response = new HashMap<>();
        try {
            boolean success = posPaymentService.initiateRefund(orderId, amount, reason);
            response.put("success", success);
            response.put("message", success ? "Refund initiated successfully" : "Failed to initiate refund");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to initiate refund", e);
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * 重试支付
     */
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