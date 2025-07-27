package com.merchant.server.businessservice.client;

import com.merchant.server.businessservice.dto.pos.*;
import java.util.concurrent.CompletableFuture;

/**
 * POS客户端通用接口
 * 支持多种POS供应商的统一接入
 */
public interface POSClient {
    
    /**
     * 初始化支付
     * @param request 支付请求
     * @return 支付初始化响应
     */
    POSInitResponse initPayment(POSPaymentRequest request);
    
    /**
     * 异步初始化支付
     * @param request 支付请求
     * @return 异步支付初始化响应
     */
    CompletableFuture<POSInitResponse> initPaymentAsync(POSPaymentRequest request);
    
    /**
     * 查询交易状态
     * @param transactionId 交易ID
     * @return 交易状态响应
     */
    POSTransactionStatus queryTransactionStatus(String transactionId);
    
    /**
     * 取消交易
     * @param transactionId 交易ID
     * @return 取消响应
     */
    POSCancelResponse cancelTransaction(String transactionId);
    
    /**
     * 退款
     * @param request 退款请求
     * @return 退款响应
     */
    POSRefundResponse refund(POSRefundRequest request);
    
    /**
     * 检查终端状态
     * @param terminalId 终端ID
     * @return 终端状态
     */
    POSTerminalStatus checkTerminalStatus(String terminalId);
    
    /**
     * 获取POS提供商名称
     * @return 提供商名称
     */
    String getProviderName();
    
    /**
     * 是否支持异步支付
     * @return 是否支持
     */
    boolean supportsAsyncPayment();
    
    /**
     * 是否支持状态轮询
     * @return 是否支持
     */
    boolean supportsStatusPolling();
}