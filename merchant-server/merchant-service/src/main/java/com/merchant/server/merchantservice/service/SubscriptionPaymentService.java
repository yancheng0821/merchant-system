package com.merchant.server.merchantservice.service;

import com.merchant.server.merchantservice.entity.Invoice;

import java.util.Map;

/**
 * 订阅支付服务接口
 */
public interface SubscriptionPaymentService {

    /**
     * 为账单创建Stripe Payment Intent
     * @param invoiceId 账单ID
     * @return Payment Intent的客户端密钥，用于前端完成支付
     */
    String createPaymentIntent(Long invoiceId);

    /**
     * 处理支付成功回调
     * @param paymentIntentId Stripe Payment Intent ID
     * @return 更新后的账单
     */
    Invoice handlePaymentSuccess(String paymentIntentId);

    /**
     * 处理支付失败回调
     * @param paymentIntentId Stripe Payment Intent ID
     * @param failureReason 失败原因
     */
    void handlePaymentFailure(String paymentIntentId, String failureReason);

    /**
     * 获取支付配置信息（如Stripe Publishable Key）
     * @return 配置信息
     */
    Map<String, String> getPaymentConfig();

    /**
     * 取消Payment Intent
     * @param invoiceId 账单ID
     */
    void cancelPaymentIntent(Long invoiceId);
}
