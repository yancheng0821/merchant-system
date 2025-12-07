package com.merchant.server.merchantservice.service;

import com.merchant.server.merchantservice.entity.SubscriptionPlan;
import com.merchant.server.merchantservice.entity.TenantSubscription;

import java.util.Map;

/**
 * Stripe 订阅服务接口
 * 管理 Stripe 自动订阅扣款
 */
public interface StripeSubscriptionService {

    /**
     * 初始化所有订阅计划的 Stripe Products 和 Prices
     * 如果已存在则跳过
     */
    void initializeStripeProducts();

    /**
     * 为租户创建或获取 Stripe Customer
     * @param tenantId 租户ID
     * @param email 邮箱
     * @param name 名称
     * @return Stripe Customer ID
     */
    String getOrCreateStripeCustomer(Long tenantId, String email, String name);

    /**
     * 创建 Stripe Checkout Session 用于订阅支付
     * @param tenantId 租户ID
     * @param planCode 计划代码
     * @param billingCycle 计费周期 (MONTHLY/YEARLY)
     * @param successUrl 支付成功后跳转URL
     * @param cancelUrl 支付取消后跳转URL
     * @return Checkout Session URL
     */
    String createCheckoutSession(Long tenantId, String planCode,
                                  TenantSubscription.BillingCycle billingCycle,
                                  String successUrl, String cancelUrl, String customerEmail);

    /**
     * 创建 Stripe Subscription（直接创建，用于已有支付方式的客户）
     * @param tenantId 租户ID
     * @param planCode 计划代码
     * @param billingCycle 计费周期
     * @return Stripe Subscription ID
     */
    String createSubscription(Long tenantId, String planCode, TenantSubscription.BillingCycle billingCycle);

    /**
     * 更新 Stripe Subscription（升级/降级）
     * @param stripeSubscriptionId Stripe 订阅ID
     * @param newPlanCode 新计划代码
     * @param newBillingCycle 新计费周期
     * @param prorationBehavior 按比例计费行为: create_prorations(升级立即生效), none(降级下周期生效)
     */
    void updateSubscription(String stripeSubscriptionId, String newPlanCode,
                           TenantSubscription.BillingCycle newBillingCycle,
                           String prorationBehavior);

    /**
     * 取消 Stripe Subscription
     * @param stripeSubscriptionId Stripe 订阅ID
     * @param cancelAtPeriodEnd 是否在当前周期结束时取消（true=下周期取消，false=立即取消）
     */
    void cancelSubscription(String stripeSubscriptionId, boolean cancelAtPeriodEnd);

    /**
     * 恢复已取消的订阅（仅在 cancelAtPeriodEnd=true 且周期未结束时可用）
     * @param stripeSubscriptionId Stripe 订阅ID
     */
    void resumeSubscription(String stripeSubscriptionId);

    /**
     * 获取 Stripe Customer Portal URL（用户管理支付方式、查看账单）
     * @param tenantId 租户ID
     * @param returnUrl 返回URL
     * @return Portal Session URL
     */
    String createCustomerPortalSession(Long tenantId, String returnUrl);

    /**
     * 处理 Stripe Webhook 事件
     * @param payload 原始请求体
     * @param sigHeader Stripe 签名头
     * @return 处理结果
     */
    Map<String, Object> handleWebhookEvent(String payload, String sigHeader);

    /**
     * 同步 Stripe 订阅状态到本地数据库
     * @param stripeSubscriptionId Stripe 订阅ID
     */
    void syncSubscriptionStatus(String stripeSubscriptionId);

    /**
     * 创建 Embedded Checkout 订阅（用于 Stripe Elements 嵌入式支付）
     * 返回 clientSecret 供前端使用 confirmPayment
     * @param tenantId 租户ID
     * @param planCode 计划代码
     * @param billingCycle 计费周期
     * @param customerEmail 客户邮箱
     * @return 包含 clientSecret, subscriptionId, customerId 的 Map
     */
    Map<String, String> createEmbeddedSubscription(Long tenantId, String planCode,
                                                    TenantSubscription.BillingCycle billingCycle,
                                                    String customerEmail);

    /**
     * 预览订阅升级/降级的费用（不实际扣款）
     * @param stripeSubscriptionId Stripe 订阅ID
     * @param newPlanCode 新计划代码
     * @param newBillingCycle 新计费周期
     * @return 包含 prorationAmount(分), immediateTotal(分), currency 的 Map
     */
    Map<String, Object> previewSubscriptionUpdate(String stripeSubscriptionId, String newPlanCode,
                                                   TenantSubscription.BillingCycle newBillingCycle);

    /**
     * 安排订阅降级（使用 Stripe Subscription Schedule，在下个计费周期自动生效）
     * @param tenantId 租户ID
     * @param newPlanCode 新计划代码（较低级别的计划）
     * @param newBillingCycle 新计费周期
     * @return 包含 scheduleId, pendingPlanCode, effectiveDate 等信息的 Map
     */
    Map<String, Object> scheduleDowngrade(Long tenantId, String newPlanCode,
                                           TenantSubscription.BillingCycle newBillingCycle);

    /**
     * 取消已安排的降级（释放 Stripe Subscription Schedule）
     * @param tenantId 租户ID
     */
    void cancelScheduledDowngrade(Long tenantId);

    /**
     * 获取已安排的计划变更信息（从 Stripe Subscription Schedule 读取）
     * @param tenantId 租户ID
     * @return 包含 pendingPlanCode, pendingBillingCycle, effectiveDate 的 Map，如果没有则返回 null
     */
    Map<String, Object> getScheduledChanges(Long tenantId);

    /**
     * 获取订阅的取消状态（从 Stripe 读取 cancel_at_period_end 和 cancel_at）
     * @param tenantId 租户ID
     * @return 包含 cancelAtPeriodEnd, cancelAt 的 Map，如果没有取消计划则返回 null
     */
    Map<String, Object> getCancellationStatus(Long tenantId);
}
