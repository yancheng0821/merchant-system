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

    /**
     * 修改订阅的计费周期
     *
     * @param subscriptionId 订阅ID
     * @param newBillingCycle 新的计费周期
     * @return 是否修改成功
     */
    boolean changeBillingCycle(Long subscriptionId, TenantSubscription.BillingCycle newBillingCycle);

    /**
     * 处理试用期到期：转换订阅状态并生成首个账单
     * 此方法在事务中执行，确保订阅状态更新和账单生成的原子性
     *
     * @param subscriptionId 订阅ID
     * @return 生成的账单，如果失败则返回null
     */
    boolean convertTrialToActiveWithInvoice(Long subscriptionId);

    /**
     * 检查并处理逾期订阅：将订阅状态改为PAST_DUE
     * 此方法在事务中执行
     *
     * @param subscriptionId 订阅ID
     * @return 是否成功标记为逾期
     */
    boolean markSubscriptionAsPastDue(Long subscriptionId);
}
