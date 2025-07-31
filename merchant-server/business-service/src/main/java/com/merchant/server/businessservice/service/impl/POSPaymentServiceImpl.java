package com.merchant.server.businessservice.service.impl;

import com.merchant.server.businessservice.client.POSClient;
import com.merchant.server.businessservice.dto.PaymentRequestDTO;
import com.merchant.server.businessservice.dto.PaymentResponseDTO;
import com.merchant.server.businessservice.dto.pos.*;
import com.merchant.server.businessservice.entity.*;
import com.merchant.server.businessservice.mapper.*;
import com.merchant.server.businessservice.service.POSPaymentService;
import com.merchant.server.common.util.CurrencyUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * POS支付服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class POSPaymentServiceImpl implements POSPaymentService {
    
    private final OrderMapper orderMapper;
    private final POSTerminalMapper posTerminalMapper;
    private final POSTransactionMapper posTransactionMapper;
    private final PaymentCallbackMapper paymentCallbackMapper;
    private final AppointmentMapper appointmentMapper;
    
    @Qualifier("mockPOSClient")
    private final POSClient posClient;
    
    @Override
    @Transactional
    public PaymentResponseDTO initiatePayment(Long orderId, PaymentRequestDTO paymentRequest) {
        log.info("Initiating payment for order: {}", orderId);
        
        // 获取订单信息
        Order order = orderMapper.selectById(orderId);
        if (order == null) {
            throw new RuntimeException("Order not found: " + orderId);
        }
        
        // 验证订单状态
        if (!"draft".equals(order.getOrderStatus()) && !"confirmed".equals(order.getOrderStatus())) {
            throw new RuntimeException("Order cannot be paid in current status: " + order.getOrderStatus());
        }
        
        // 获取POS终端信息
        POSTerminal terminal = posTerminalMapper.selectByTerminalId(
            paymentRequest.getTerminalId(), order.getTenantId());
        if (terminal == null || !"active".equals(terminal.getTerminalStatus())) {
            throw new RuntimeException("POS terminal not available: " + paymentRequest.getTerminalId());
        }
        
        // 标准化金额，处理前端浮点数精度问题
        Double normalizedTotalAmount = CurrencyUtils.normalizeAmount(order.getTotalAmount());
        BigDecimal normalizedTipAmount = paymentRequest.getTipAmount() != null ? 
            CurrencyUtils.normalizeAmount(paymentRequest.getTipAmount()) : null;
        
        // 构建POS支付请求
        POSPaymentRequest posRequest = POSPaymentRequest.builder()
            .orderId(orderId.toString())
            .terminalId(terminal.getTerminalId())
            .amount(BigDecimal.valueOf(normalizedTotalAmount))
            .currency("USD")
            .paymentMethod(paymentRequest.getPaymentMethod())
            .description("Order #" + order.getOrderNumber())
            .tipAmount(normalizedTipAmount)
            .customerEmail(paymentRequest.getCustomerEmail())
            .customerPhone(paymentRequest.getCustomerPhone())
            .build();
            
        // 创建POS交易记录
        POSTransaction posTransaction = new POSTransaction();
        posTransaction.setTenantId(order.getTenantId());
        posTransaction.setOrderId(orderId);
        posTransaction.setTransactionId(UUID.randomUUID().toString());
        posTransaction.setPosTerminalId(terminal.getTerminalId());
        posTransaction.setPosProvider(terminal.getPosProvider());
        posTransaction.setAmount(normalizedTotalAmount);
        posTransaction.setPaymentMethod(paymentRequest.getPaymentMethod());
        posTransaction.setTransactionStatus("pending");
        posTransaction.setRequestData(convertToJson(posRequest));
        posTransaction.setRetryCount(0); // 设置默认重试次数
        posTransaction.setNextRetryTime(null); // 初始状态不需要重试时间
        posTransaction.setCreatedAt(LocalDateTime.now());
        posTransaction.setUpdatedAt(LocalDateTime.now());
        posTransactionMapper.insert(posTransaction);
        
        try {
            // 调用POS客户端发起支付
            POSInitResponse initResponse = posClient.initPayment(posRequest);
            
            // 更新交易ID
            posTransaction.setTransactionId(initResponse.getTransactionId());
            posTransaction.setResponseData(convertToJson(initResponse));
            posTransactionMapper.updateById(posTransaction);
            
            // 更新订单信息
            order.setPaymentMethod(paymentRequest.getPaymentMethod());
            order.setPaymentStatus("pending");
            order.setPosTerminalId(terminal.getTerminalId());
            order.setTransactionId(initResponse.getTransactionId());
            order.setUpdatedAt(LocalDateTime.now());
            orderMapper.updateById(order);
            
            // 启动状态轮询（如果POS支持）
            if (posClient.supportsStatusPolling()) {
                pollPaymentStatusAsync(initResponse.getTransactionId());
            }
            
            return PaymentResponseDTO.builder()
                .transactionId(initResponse.getTransactionId())
                .orderId(orderId.toString())
                .status("processing")
                .paymentMethod(paymentRequest.getPaymentMethod())
                .amount(BigDecimal.valueOf(normalizedTotalAmount))
                .message(initResponse.getMessage())
                .actionRequired(initResponse.getActionRequired())
                .displayMessage(initResponse.getDisplayMessage())
                .timeout(initResponse.getTimeout())
                .initiatedAt(initResponse.getInitiatedAt())
                .build();
                
        } catch (Exception e) {
            log.error("Payment initiation failed", e);
            
            // 更新交易状态为失败
            posTransaction.setTransactionStatus("failed");
            posTransaction.setResponseData(e.getMessage());
            posTransactionMapper.updateById(posTransaction);
            
            throw new RuntimeException("Payment initiation failed: " + e.getMessage());
        }
    }
    
    @Override
    @Transactional
    public PaymentResponseDTO processCashPayment(Long orderId, Double amount) {
        log.info("Processing cash payment for order: {}, amount: {}", orderId, amount);
        
        Order order = orderMapper.selectById(orderId);
        if (order == null) {
            throw new RuntimeException("Order not found: " + orderId);
        }
        
        // 使用CurrencyUtils标准化金额，处理前端浮点数精度问题
        BigDecimal totalAmount = CurrencyUtils.normalizeAmount(BigDecimal.valueOf(order.getTotalAmount()));
        BigDecimal cashReceived;
        
        // 如果传入的金额等于订单总金额，说明是精确支付（前端当前的逻辑）
        // 如果传入的金额大于订单总金额，说明是客户实际支付的现金金额
        Double normalizedAmount = CurrencyUtils.normalizeAmount(amount);
        Double normalizedOrderTotal = CurrencyUtils.normalizeAmount(order.getTotalAmount());
        
        if (Math.abs(normalizedAmount - normalizedOrderTotal) < 0.01) {
            // 精确支付，假设客户支付了正确的金额
            cashReceived = totalAmount;
            log.info("Exact cash payment - Amount: {}", totalAmount);
        } else {
            // 客户实际支付的现金金额
            cashReceived = CurrencyUtils.normalizeAmount(BigDecimal.valueOf(amount));
            log.info("Cash payment calculation - Received: {}, Total: {}", cashReceived, totalAmount);
            
            if (cashReceived.compareTo(totalAmount) < 0) {
                throw new RuntimeException(String.format("Insufficient cash received. Required: %s, Received: %s", 
                    totalAmount, cashReceived));
            }
        }
        
        BigDecimal change = cashReceived.subtract(totalAmount);
        
        // 更新订单状态
        log.info("Updating order {} status from {} to completed, payment status from {} to paid", 
            order.getId(), order.getOrderStatus(), order.getPaymentStatus());
        
        order.setPaymentMethod("cash");
        order.setPaymentStatus("paid");
        order.setOrderStatus("completed");
        order.setCompletedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());
        
        try {
            orderMapper.updateById(order);
            log.info("Successfully updated order {} status to completed and payment status to paid", order.getId());
        } catch (Exception e) {
            log.error("Failed to update order {} status", order.getId(), e);
            throw e;
        }
        
        // 如果订单关联了预约，更新预约状态为已完成
        if (order.getAppointmentId() != null) {
            updateAppointmentStatusAfterPayment(order.getAppointmentId(), "COMPLETED");
        }
        
        return PaymentResponseDTO.builder()
            .orderId(orderId.toString())
            .status("success")
            .paymentMethod("cash")
            .amount(totalAmount)
            .changeAmount(change)
            .message("Cash payment completed")
            .completedAt(LocalDateTime.now())
            .build();
    }
    
    @Override
    public POSTransactionStatus queryPaymentStatus(String transactionId) {
        log.info("Querying payment status for transaction: {}", transactionId);
        
        POSTransaction posTransaction = posTransactionMapper.selectByTransactionId(transactionId);
        if (posTransaction == null) {
            throw new RuntimeException("Transaction not found: " + transactionId);
        }
        
        // 查询POS客户端获取最新状态
        POSTransactionStatus status = posClient.queryTransactionStatus(transactionId);
        
        // 如果状态有变化，更新数据库
        if (!posTransaction.getTransactionStatus().equals(status.getStatus())) {
            handlePaymentCallback(transactionId, status);
        }
        
        return status;
    }
    
    @Override
    @Transactional
    public void handlePaymentCallback(String transactionId, POSTransactionStatus status) {
        log.info("Handling payment callback for transaction: {}, status: {}", 
            transactionId, status.getStatus());
        
        // 获取交易记录
        POSTransaction posTransaction = posTransactionMapper.selectByTransactionId(transactionId);
        if (posTransaction == null) {
            log.error("Transaction not found for callback: {}", transactionId);
            return;
        }
        
        // 记录回调日志
        PaymentCallback callback = new PaymentCallback();
        callback.setTenantId(posTransaction.getTenantId());
        callback.setOrderId(posTransaction.getOrderId());
        callback.setTransactionId(transactionId);
        callback.setCallbackType("webhook");
        callback.setCallbackData(convertToJson(status));
        callback.setCallbackStatus("processing");
        callback.setCreatedAt(LocalDateTime.now());
        paymentCallbackMapper.insert(callback);
        
        try {
            // 更新交易状态
            posTransaction.setTransactionStatus(status.getStatus());
            posTransaction.setResponseData(convertToJson(status));
            posTransaction.setUpdatedAt(LocalDateTime.now());
            posTransactionMapper.updateById(posTransaction);
            
            // 更新订单状态
            Order order = orderMapper.selectById(posTransaction.getOrderId());
            if (order != null) {
                log.info("Processing payment callback for order {}, current status: {}, payment status: {}", 
                    order.getId(), order.getOrderStatus(), order.getPaymentStatus());
                
                if (status.isSuccess()) {
                    log.info("Payment successful for order {}, updating to completed", order.getId());
                    order.setPaymentStatus("paid");
                    order.setOrderStatus("completed");
                    order.setAuthorizationCode(status.getAuthorizationCode());
                    order.setCardLast4(status.getCardLast4());
                    order.setCompletedAt(LocalDateTime.now());
                    
                    // 如果订单关联了预约，更新预约状态为已完成
                    if (order.getAppointmentId() != null) {
                        updateAppointmentStatusAfterPayment(order.getAppointmentId(), "COMPLETED");
                    }
                } else if (status.isFinal()) {
                    log.info("Payment failed for order {}, updating to failed", order.getId());
                    order.setPaymentStatus("failed");
                    if ("draft".equals(order.getOrderStatus())) {
                        order.setOrderStatus("cancelled");
                    }
                    
                    // 如果支付失败且订单关联了预约，可以选择保持预约状态不变或标记为失败
                    // 这里我们选择保持预约状态不变，让用户可以重新支付
                }
                order.setUpdatedAt(LocalDateTime.now());
                
                try {
                    orderMapper.updateById(order);
                    log.info("Successfully updated order {} after payment callback", order.getId());
                } catch (Exception e) {
                    log.error("Failed to update order {} after payment callback", order.getId(), e);
                    throw e;
                }
            } else {
                log.warn("Order not found for transaction {}", transactionId);
            }
            
            // 更新回调状态
            callback.setCallbackStatus("processed");
            callback.setProcessingResult("Success");
            callback.setUpdatedAt(LocalDateTime.now());
            paymentCallbackMapper.updateById(callback);
            
        } catch (Exception e) {
            log.error("Failed to process payment callback", e);
            callback.setCallbackStatus("failed");
            callback.setErrorMessage(e.getMessage());
            callback.setUpdatedAt(LocalDateTime.now());
            paymentCallbackMapper.updateById(callback);
            throw e;
        }
    }
    
    @Override
    @Transactional
    public boolean cancelPayment(Long orderId) {
        log.info("Cancelling payment for order: {}", orderId);
        
        Order order = orderMapper.selectById(orderId);
        if (order == null || order.getTransactionId() == null) {
            return false;
        }
        
        // 只能取消待支付的订单
        if (!"pending".equals(order.getPaymentStatus())) {
            return false;
        }
        
        try {
            POSCancelResponse cancelResponse = posClient.cancelTransaction(order.getTransactionId());
            
            if (cancelResponse.isSuccess()) {
                order.setPaymentStatus("cancelled");
                order.setOrderStatus("cancelled");
                order.setUpdatedAt(LocalDateTime.now());
                orderMapper.updateById(order);
                return true;
            }
        } catch (Exception e) {
            log.error("Failed to cancel payment", e);
        }
        
        return false;
    }
    
    @Override
    @Transactional
    public boolean initiateRefund(Long orderId, Double amount, String reason) {
        log.info("Initiating refund for order: {}, amount: {}", orderId, amount);
        
        Order order = orderMapper.selectById(orderId);
        if (order == null || !"paid".equals(order.getPaymentStatus())) {
            return false;
        }
        
        // 获取原始交易
        POSTransaction originalTransaction = posTransactionMapper.selectByTransactionId(order.getTransactionId());
        if (originalTransaction == null) {
            return false;
        }
        
        try {
            // 标准化退款金额，处理前端浮点数精度问题
            Double normalizedRefundAmount = CurrencyUtils.normalizeAmount(amount);
            
            POSRefundRequest refundRequest = POSRefundRequest.builder()
                .originalTransactionId(order.getTransactionId())
                .orderId(orderId.toString())
                .refundAmount(BigDecimal.valueOf(normalizedRefundAmount))
                .reason(reason)
                .terminalId(order.getPosTerminalId())
                .build();
                
            POSRefundResponse refundResponse = posClient.refund(refundRequest);
            
            if (refundResponse.isSuccess()) {
                // 创建退款交易记录
                POSTransaction refundTransaction = new POSTransaction();
                refundTransaction.setTenantId(order.getTenantId());
                refundTransaction.setOrderId(orderId);
                refundTransaction.setTransactionId(refundResponse.getRefundTransactionId());
                refundTransaction.setPosTerminalId(order.getPosTerminalId());
                refundTransaction.setPosProvider(originalTransaction.getPosProvider());
                refundTransaction.setAmount(normalizedRefundAmount);
                refundTransaction.setPaymentMethod(order.getPaymentMethod());
                refundTransaction.setTransactionStatus("refunded");
                refundTransaction.setRequestData(convertToJson(refundRequest));
                refundTransaction.setResponseData(convertToJson(refundResponse));
                refundTransaction.setCreatedAt(LocalDateTime.now());
                posTransactionMapper.insert(refundTransaction);
                
                // 更新订单退款信息
                order.setRefundAmount(normalizedRefundAmount);
                order.setRefundReason(reason);
                order.setPaymentStatus("refunded");
                order.setUpdatedAt(LocalDateTime.now());
                orderMapper.updateById(order);
                
                return true;
            }
        } catch (Exception e) {
            log.error("Failed to initiate refund", e);
        }
        
        return false;
    }
    
    @Override
    @Async
    public void pollPaymentStatus(String transactionId) {
        pollPaymentStatusAsync(transactionId);
    }
    
    @Override
    @Transactional
    public PaymentResponseDTO retryPayment(Long orderId) {
        log.info("Retrying payment for order: {}", orderId);
        
        Order order = orderMapper.selectById(orderId);
        if (order == null || !"failed".equals(order.getPaymentStatus())) {
            throw new RuntimeException("Cannot retry payment for this order");
        }
        
        // 获取上次失败的支付信息
        POSTransaction lastTransaction = posTransactionMapper.selectLastByOrderId(orderId);
        if (lastTransaction == null) {
            throw new RuntimeException("No previous payment attempt found");
        }
        
        // 使用上次的支付方式重试，标准化金额
        PaymentRequestDTO retryRequest = new PaymentRequestDTO();
        retryRequest.setPaymentMethod(lastTransaction.getPaymentMethod());
        retryRequest.setTerminalId(lastTransaction.getPosTerminalId());
        retryRequest.setAmount(CurrencyUtils.normalizeAmount(BigDecimal.valueOf(order.getTotalAmount())));
        
        return initiatePayment(orderId, retryRequest);
    }
    
    /**
     * 异步轮询支付状态
     */
    private void pollPaymentStatusAsync(String transactionId) {
        log.info("Starting payment status polling for transaction: {}", transactionId);
        
        // 使用定时任务轮询状态，最多轮询2分钟
        int maxAttempts = 24; // 每5秒一次，共2分钟
        int attempt = 0;
        
        while (attempt < maxAttempts) {
            try {
                TimeUnit.SECONDS.sleep(5);
                
                POSTransactionStatus status = posClient.queryTransactionStatus(transactionId);
                log.debug("Polling attempt {}: transaction {} status {}", 
                    attempt + 1, transactionId, status.getStatus());
                
                if (status.isFinal()) {
                    handlePaymentCallback(transactionId, status);
                    log.info("Payment polling completed for transaction: {}", transactionId);
                    break;
                }
                
                attempt++;
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.error("Payment polling interrupted", e);
                break;
            } catch (Exception e) {
                log.error("Error during payment polling", e);
            }
        }
        
        if (attempt >= maxAttempts) {
            log.warn("Payment polling timeout for transaction: {}", transactionId);
        }
    }
    
    /**
     * 支付成功后更新预约状态
     */
    private void updateAppointmentStatusAfterPayment(Long appointmentId, String status) {
        try {
            Appointment appointment = appointmentMapper.findById(appointmentId);
            if (appointment != null) {
                log.info("Updating appointment {} status from {} to {} after payment", 
                    appointmentId, appointment.getStatus(), status);
                
                // 创建新的预约状态枚举值
                Appointment.AppointmentStatus newStatus;
                try {
                    newStatus = Appointment.AppointmentStatus.valueOf(status);
                } catch (IllegalArgumentException e) {
                    log.warn("Invalid appointment status: {}, using COMPLETED as default", status);
                    newStatus = Appointment.AppointmentStatus.COMPLETED;
                }
                
                appointment.setStatus(newStatus);
                appointment.setUpdatedAt(LocalDateTime.now());
                appointmentMapper.update(appointment);
                
                log.info("Successfully updated appointment {} status to {}", appointmentId, newStatus);
            } else {
                log.warn("Appointment not found with ID: {}", appointmentId);
            }
        } catch (Exception e) {
            log.error("Failed to update appointment status after payment for appointment ID: {}", appointmentId, e);
            // 不抛出异常，避免影响支付流程
        }
    }
    
    /**
     * 转换对象为JSON字符串
     */
    private String convertToJson(Object obj) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        return mapper.writeValueAsString(obj);
        } catch (Exception e) {
            return obj.toString();
        }
    }
}