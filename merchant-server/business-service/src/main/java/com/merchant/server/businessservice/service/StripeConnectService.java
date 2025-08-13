package com.merchant.server.businessservice.service;

import com.merchant.server.businessservice.dto.stripe.*;
import com.stripe.model.Account;
import com.stripe.model.AccountLink;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Refund;
import com.stripe.model.terminal.Reader;

import java.util.List;
import java.util.Map;

/**
 * Stripe Connect 多租户支付服务接口
 */
public interface StripeConnectService {
    
    /**
     * 创建Stripe Connect账户
     * @param tenantId 租户ID
     * @param request 创建请求
     * @return Stripe账户信息
     */
    StripeAccountDTO createConnectAccount(Long tenantId, CreateStripeAccountRequest request);
    
    /**
     * 创建账户链接URL（用于完成入驻流程）
     * @param tenantId 租户ID
     * @param returnUrl 完成后返回的URL
     * @param refreshUrl 需要刷新时的URL
     * @return 账户链接信息
     */
    AccountLinkDTO createAccountLink(Long tenantId, String returnUrl, String refreshUrl);
    
    /**
     * 处理Stripe OAuth回调
     * @param tenantId 租户ID
     * @param code OAuth授权码
     * @return 账户信息
     */
    StripeAccountDTO handleOAuthCallback(Long tenantId, String code);
    
    /**
     * 获取租户的Stripe账户信息
     * @param tenantId 租户ID
     * @return Stripe账户信息
     */
    StripeAccountDTO getStripeAccount(Long tenantId);
    
    /**
     * 更新Stripe账户信息（从Stripe同步）
     * @param tenantId 租户ID
     * @return 更新后的账户信息
     */
    StripeAccountDTO syncAccountStatus(Long tenantId);
    
    /**
     * 创建支付意图（Payment Intent）
     * @param tenantId 租户ID
     * @param request 支付请求
     * @return 支付意图信息
     */
    PaymentIntentDTO createPaymentIntent(Long tenantId, CreatePaymentIntentRequest request);
    
    /**
     * 确认支付意图
     * @param tenantId 租户ID
     * @param paymentIntentId 支付意图ID
     * @return 确认后的支付意图
     */
    PaymentIntentDTO confirmPaymentIntent(Long tenantId, String paymentIntentId);
    
    /**
     * 取消支付意图
     * @param tenantId 租户ID
     * @param paymentIntentId 支付意图ID
     * @return 取消后的支付意图
     */
    PaymentIntentDTO cancelPaymentIntent(Long tenantId, String paymentIntentId);
    
    /**
     * 创建Location
     * @param tenantId 租户ID
     * @param request 创建请求
     * @return Location信息
     */
    LocationDTO createLocation(Long tenantId, CreateLocationRequest request);
    
    /**
     * 获取租户的所有Location
     * @param tenantId 租户ID
     * @return Location列表
     */
    List<LocationDTO> listLocations(Long tenantId);
    
    /**
     * 创建Terminal读卡器
     * @param tenantId 租户ID
     * @param request 创建请求
     * @return Terminal信息
     */
    TerminalDTO createTerminal(Long tenantId, CreateTerminalRequest request);
    
    /**
     * 获取租户的所有Terminal
     * @param tenantId 租户ID
     * @return Terminal列表
     */
    List<TerminalDTO> listTerminals(Long tenantId);
    
    /**
     * 更新Terminal状态
     * @param tenantId 租户ID
     * @param terminalId Terminal ID
     * @return 更新后的Terminal信息
     */
    TerminalDTO updateTerminalStatus(Long tenantId, String terminalId);
    
    /**
     * 在Terminal上收集支付方式
     * @param tenantId 租户ID
     * @param terminalId Terminal ID
     * @param paymentIntentId 支付意图ID
     * @return 收集结果
     */
    CollectPaymentResultDTO collectPaymentMethod(Long tenantId, String terminalId, String paymentIntentId);
    
    /**
     * 在Terminal上处理支付
     * @param tenantId 租户ID
     * @param terminalId Terminal ID
     * @param paymentIntentId 支付意图ID
     * @return 处理结果
     */
    ProcessPaymentResultDTO processPayment(Long tenantId, String terminalId, String paymentIntentId);
    
    /**
     * 创建退款
     * @param tenantId 租户ID
     * @param request 退款请求
     * @return 退款信息
     */
    RefundDTO createRefund(Long tenantId, CreateRefundRequest request);
    
    /**
     * 处理Webhook事件
     * @param payload Webhook负载
     * @param signature Stripe签名
     * @return 处理结果
     */
    WebhookResultDTO handleWebhook(String payload, String signature);
    
    /**
     * 计算平台费用
     * @param amount 交易金额
     * @return 平台费用
     */
    Long calculateApplicationFee(Long amount);
    
    /**
     * 获取Stripe Dashboard URL
     * @param tenantId 租户ID
     * @return Dashboard URL
     */
    String getStripeDashboardUrl(Long tenantId);
    
    /**
     * 强制完成入驻（仅用于测试环境）
     * @param tenantId 租户ID
     * @return 更新后的账户信息
     */
    StripeAccountDTO forceCompleteOnboarding(Long tenantId);
    
    /**
     * 模拟账户审核完成（测试环境）
     * @param tenantId 租户ID
     * @return 更新后的账户信息
     */
    StripeAccountDTO simulateAccountVerification(Long tenantId);
    
    /**
     * 手动触发账户更新webhook（测试环境）
     * @param tenantId 租户ID
     * @return 处理结果
     */
    String triggerAccountUpdateWebhook(Long tenantId);
    
    /**
     * 解绑Stripe账户（仅测试环境）
     * @param tenantId 租户ID
     * @return 操作结果
     */
    Boolean disconnectAccount(Long tenantId);
}