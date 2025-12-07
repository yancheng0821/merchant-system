package com.merchant.server.merchantservice.service;

import com.merchant.server.merchantservice.entity.TenantSubscription;

import java.util.List;

/**
 * 商户订阅服务接口
 */
public interface TenantSubscriptionService {

    /**
     * 根据ID查询订阅
     */
    TenantSubscription getSubscriptionById(Long id);

    /**
     * 根据租户ID查询活跃订阅
     */
    TenantSubscription getActiveSubscriptionByTenantId(Long tenantId);

    /**
     * 根据租户ID查询所有订阅
     */
    List<TenantSubscription> getSubscriptionsByTenantId(Long tenantId);

    /**
     * 为新注册的租户创建免费试用订阅
     *
     * @param tenantId 租户ID
     * @return 创建的订阅记录
     */
    TenantSubscription createFreeTrialSubscription(Long tenantId);

    /**
     * 创建订阅
     *
     * @param tenantId 租户ID
     * @param planCode 计划代码
     * @param billingCycle 计费周期
     * @return 创建的订阅记录
     */
    TenantSubscription createSubscription(Long tenantId, String planCode, TenantSubscription.BillingCycle billingCycle);

    /**
     * 更新订阅
     */
    boolean updateSubscription(TenantSubscription subscription);

    /**
     * 取消订阅
     */
    boolean cancelSubscription(Long id);

    /**
     * 删除订阅
     */
    boolean deleteSubscription(Long id);

    /**
     * 获取所有试用期订阅
     */
    List<TenantSubscription> getAllTrialSubscriptions();

    /**
     * 获取所有活跃订阅
     */
    List<TenantSubscription> getAllActiveSubscriptions();

    // 注意：getAllPendingPlanChanges 已移除
    // 计划变更现在由 Stripe Subscription Schedules 自动处理
}
