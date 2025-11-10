package com.merchant.server.businessservice.client.impl;

import com.merchant.server.businessservice.client.AbstractPOSClient;
import com.merchant.server.businessservice.dto.pos.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;

/**
 * 模拟POS客户端实现
 * 用于开发和测试
 */
@Slf4j
@Component("mockPOSClient")
public class MockPOSClient extends AbstractPOSClient {
    
    @Value("${pos.mock.enabled:true}")
    private boolean mockEnabled;
    
    @Value("${pos.mock.success-rate:90}")
    private int mockSuccessRate;
    
    @Value("${pos.mock.processing-delay:3}")
    private int mockProcessingDelay;
    
    // 模拟交易存储
    private final Map<String, POSTransactionStatus> transactions = new ConcurrentHashMap<>();
    
    @Override
    public POSInitResponse initPayment(POSPaymentRequest request) {
        logRequest("initPayment", request);
        
        String transactionId = "TXN-" + UUID.randomUUID().toString();
        
        // 模拟交易处理
        POSTransactionStatus transaction = POSTransactionStatus.builder()
            .transactionId(transactionId)
            .status("pending")
            .amount(request.getAmount())
            .paymentMethod(request.getPaymentMethod())
            .createdAt(LocalDateTime.now(ZoneOffset.UTC))
            .build();
            
        transactions.put(transactionId, transaction);
        
        // 模拟异步处理支付
        simulatePaymentProcessing(transactionId, request);
        
        POSInitResponse response = POSInitResponse.builder()
            .transactionId(transactionId)
            .status("initiated")
            .terminalStatus("ready")
            .message("Payment initiated, waiting for card")
            .initiatedAt(LocalDateTime.now(ZoneOffset.UTC))
            .actionRequired("insert_card")
            .displayMessage("Please insert or tap your card")
            .timeout(120)
            .build();
            
        logResponse("initPayment", response);
        return response;
    }
    
    @Override
    public POSTransactionStatus queryTransactionStatus(String transactionId) {
        logRequest("queryTransactionStatus", transactionId);
        
        POSTransactionStatus status = transactions.get(transactionId);
        if (status == null) {
            status = POSTransactionStatus.builder()
                .transactionId(transactionId)
                .status("not_found")
                .errorMessage("Transaction not found")
                .build();
        }
        
        logResponse("queryTransactionStatus", status);
        return status;
    }
    
    @Override
    public POSCancelResponse cancelTransaction(String transactionId) {
        logRequest("cancelTransaction", transactionId);
        
        POSTransactionStatus transaction = transactions.get(transactionId);
        if (transaction != null && !transaction.isFinal()) {
            transaction.setStatus("cancelled");
            transaction.setCompletedAt(LocalDateTime.now(ZoneOffset.UTC));
            
            return POSCancelResponse.builder()
                .transactionId(transactionId)
                .success(true)
                .status("cancelled")
                .message("Transaction cancelled successfully")
                .cancelledAt(LocalDateTime.now(ZoneOffset.UTC))
                .build();
        }
        
        return POSCancelResponse.builder()
            .transactionId(transactionId)
            .success(false)
            .message("Cannot cancel transaction")
            .build();
    }
    
    @Override
    public POSRefundResponse refund(POSRefundRequest request) {
        logRequest("refund", request);
        
        String refundTransactionId = "REF-" + UUID.randomUUID().toString();
        
        POSRefundResponse response = POSRefundResponse.builder()
            .refundTransactionId(refundTransactionId)
            .originalTransactionId(request.getOriginalTransactionId())
            .success(true)
            .status("refunded")
            .refundedAmount(request.getRefundAmount())
            .message("Refund processed successfully")
            .refundedAt(LocalDateTime.now(ZoneOffset.UTC))
            .build();
            
        logResponse("refund", response);
        return response;
    }
    
    @Override
    public POSTerminalStatus checkTerminalStatus(String terminalId) {
        return POSTerminalStatus.builder()
            .terminalId(terminalId)
            .status("online")
            .connected(true)
            .firmwareVersion("1.0.0")
            .lastHeartbeat(LocalDateTime.now(ZoneOffset.UTC))
            .batteryLevel("85%")
            .networkStatus("connected")
            .build();
    }
    
    @Override
    public String getProviderName() {
        return "MOCK_POS";
    }
    
    /**
     * 模拟支付处理过程
     */
    private void simulatePaymentProcessing(String transactionId, POSPaymentRequest request) {
        executorService.schedule(() -> {
            POSTransactionStatus transaction = transactions.get(transactionId);
            if (transaction != null && "pending".equals(transaction.getStatus())) {
                // 模拟处理延迟
                try {
                    TimeUnit.SECONDS.sleep(mockProcessingDelay);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                
                // 根据配置决定交易结果
                boolean approved;
                if (mockEnabled) {
                    // Mock模式：根据配置的成功率决定结果
                    approved = ThreadLocalRandom.current().nextInt(100) < mockSuccessRate;
                    log.info("Mock payment processing: transactionId={}, approved={}, mockSuccessRate={}", 
                        transactionId, approved, mockSuccessRate);
                } else {
                    // 生产模式：这里应该调用真实的POS API
                    // 目前暂时返回成功，实际实现时需要替换为真实的POS调用
                    approved = true;
                    log.info("Production payment processing: transactionId={} (using mock for now)", transactionId);
                }
                
                if (approved) {
                    transaction.setStatus("approved");
                    transaction.setApprovedAmount(request.getAmount());
                    transaction.setAuthorizationCode("AUTH-" + UUID.randomUUID().toString().substring(0, 8));
                    transaction.setReferenceNumber("REF-" + System.currentTimeMillis());
                    transaction.setCardBrand("visa");
                    transaction.setCardLast4("1234");
                    transaction.setResponseCode("00");
                    transaction.setResponseMessage("Approved");
                } else {
                    transaction.setStatus("declined");
                    transaction.setResponseCode("05");
                    transaction.setResponseMessage("Do not honor");
                    transaction.setErrorCode("INSUFFICIENT_FUNDS");
                    transaction.setErrorMessage("Insufficient funds");
                }
                
                transaction.setCompletedAt(LocalDateTime.now(ZoneOffset.UTC));
                
                log.info("Mock payment processed: {} - {}, mockEnabled={}", 
                    transactionId, transaction.getStatus(), mockEnabled);
            }
        }, 2, TimeUnit.SECONDS);
    }
}