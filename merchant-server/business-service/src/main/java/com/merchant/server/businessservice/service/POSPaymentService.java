package com.merchant.server.businessservice.service;

import com.merchant.server.businessservice.dto.PaymentRequestDTO;
import com.merchant.server.businessservice.dto.PaymentResponseDTO;
import com.merchant.server.businessservice.dto.pos.POSTransactionStatus;
import com.merchant.server.businessservice.entity.Order;

/**
 * POS支付服务接口
 */
public interface POSPaymentService {
    
    /**
     * 发起POS支付
     * @param orderId 订单ID
     * @param paymentRequest 支付请求
     * @return 支付响应
     */
    PaymentResponseDTO initiatePayment(Long orderId, PaymentRequestDTO paymentRequest);
    
    /**
     * 处理现金支付
     * @param orderId 订单ID
     * @param amount 支付金额
     * @return 支付响应
     */
    PaymentResponseDTO processCashPayment(Long orderId, Double amount);
    
    /**
     * 查询支付状态
     * @param transactionId 交易ID
     * @return 交易状态
     */
    POSTransactionStatus queryPaymentStatus(String transactionId);
    
    /**
     * 处理支付回调
     * @param transactionId 交易ID
     * @param status 交易状态
     */
    void handlePaymentCallback(String transactionId, POSTransactionStatus status);
    
    /**
     * 取消支付
     * @param orderId 订单ID
     * @return 是否成功
     */
    boolean cancelPayment(Long orderId);
    
    /**
     * 发起退款
     * @param orderId 订单ID
     * @param amount 退款金额
     * @param stripeReason Stripe需要的退款原因值
     * @param displayText 用户友好的退款原因文本（存储到数据库）
     * @return 是否成功
     */
    boolean initiateRefund(Long orderId, Double amount, String stripeReason, String displayText);
    
    /**
     * 发起退款（兼容旧版本）
     * @deprecated 请使用新版本的initiateRefund方法
     */
    @Deprecated
    default boolean initiateRefund(Long orderId, Double amount, String reason) {
        return initiateRefund(orderId, amount, reason, reason);
    }
    
    /**
     * 轮询支付状态（用于没有回调的情况）
     * @param transactionId 交易ID
     */
    void pollPaymentStatus(String transactionId);
    
    /**
     * 重试失败的支付
     * @param orderId 订单ID
     * @return 支付响应
     */
    PaymentResponseDTO retryPayment(Long orderId);
}