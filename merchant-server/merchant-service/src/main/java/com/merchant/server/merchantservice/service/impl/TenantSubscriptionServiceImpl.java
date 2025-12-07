package com.merchant.server.merchantservice.service.impl;

import com.merchant.server.common.exception.BusinessException;
import com.merchant.server.merchantservice.entity.SubscriptionPlan;
import com.merchant.server.merchantservice.entity.TenantSubscription;
import com.merchant.server.merchantservice.mapper.TenantSubscriptionMapper;
import com.merchant.server.merchantservice.service.SubscriptionPlanService;
import com.merchant.server.merchantservice.service.TenantSubscriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * 商户订阅服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TenantSubscriptionServiceImpl implements TenantSubscriptionService {

    private final TenantSubscriptionMapper tenantSubscriptionMapper;
    private final SubscriptionPlanService subscriptionPlanService;

    @Override
    public TenantSubscription getSubscriptionById(Long id) {
        log.debug("根据ID查询订阅: {}", id);
        return tenantSubscriptionMapper.findById(id);
    }

    @Override
    public TenantSubscription getActiveSubscriptionByTenantId(Long tenantId) {
        log.debug("根据租户ID查询活跃订阅: {}", tenantId);
        return tenantSubscriptionMapper.findActiveByTenantId(tenantId);
    }

    @Override
    public List<TenantSubscription> getSubscriptionsByTenantId(Long tenantId) {
        log.debug("根据租户ID查询所有订阅: {}", tenantId);
        return tenantSubscriptionMapper.findByTenantId(tenantId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TenantSubscription createFreeTrialSubscription(Long tenantId) {
        log.info("为租户创建BASIC试用订阅 - 租户ID: {}", tenantId);

        // 检查租户是否已有活跃订阅
        TenantSubscription existingSubscription = tenantSubscriptionMapper.findActiveByTenantId(tenantId);
        if (existingSubscription != null) {
            log.warn("租户已有活跃订阅 - 租户ID: {}, 订阅ID: {}", tenantId, existingSubscription.getId());
            throw new BusinessException("租户已有活跃订阅");
        }

        // 查询BASIC计划 - 新商户默认分配BASIC计划试用
        SubscriptionPlan basicPlan = subscriptionPlanService.getPlanByCode("BASIC");
        if (basicPlan == null) {
            log.error("找不到BASIC订阅计划");
            throw new BusinessException("找不到BASIC订阅计划");
        }

        // 获取试用期天数（从计划表获取，默认14天）
        int trialDays = basicPlan.getTrialDays() != null ? basicPlan.getTrialDays() : 14;

        // 创建试用订阅（BASIC计划）
        TenantSubscription subscription = new TenantSubscription();
        subscription.setTenantId(tenantId);
        subscription.setPlanId(basicPlan.getId());
        subscription.setBillingCycle(TenantSubscription.BillingCycle.MONTHLY);
        subscription.setStatus(TenantSubscription.SubscriptionStatus.TRIAL);

        // 设置试用期（从计划表获取天数）
        LocalDate now = LocalDate.now();
        subscription.setTrialStartDate(now);
        subscription.setTrialEndDate(now.plusDays(trialDays));

        // 设置当前周期（试用期间）
        subscription.setCurrentPeriodStart(now);
        subscription.setCurrentPeriodEnd(now.plusDays(trialDays));

        int result = tenantSubscriptionMapper.insert(subscription);
        if (result > 0) {
            log.info("BASIC试用订阅创建成功 - 租户ID: {}, 订阅ID: {}, 试用结束日期: {}",
                    tenantId, subscription.getId(), subscription.getTrialEndDate());
            return subscription;
        } else {
            log.error("BASIC试用订阅创建失败 - 租户ID: {}", tenantId);
            throw new BusinessException("创建订阅失败");
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TenantSubscription createSubscription(Long tenantId, String planCode, TenantSubscription.BillingCycle billingCycle) {
        log.info("为租户创建订阅 - 租户ID: {}, 计划代码: {}, 计费周期: {}", tenantId, planCode, billingCycle);

        // 查询订阅计划
        SubscriptionPlan plan = subscriptionPlanService.getPlanByCode(planCode);
        if (plan == null) {
            log.error("找不到订阅计划 - 计划代码: {}", planCode);
            throw new BusinessException("找不到订阅计划: " + planCode);
        }

        if (!plan.getIsActive()) {
            log.error("订阅计划未激活 - 计划代码: {}", planCode);
            throw new BusinessException("订阅计划未激活");
        }

        // 创建订阅
        TenantSubscription subscription = new TenantSubscription();
        subscription.setTenantId(tenantId);
        subscription.setPlanId(plan.getId());
        subscription.setBillingCycle(billingCycle != null ? billingCycle : TenantSubscription.BillingCycle.MONTHLY);
        subscription.setStatus(TenantSubscription.SubscriptionStatus.ACTIVE);

        // 设置当前周期
        LocalDate now = LocalDate.now();
        subscription.setCurrentPeriodStart(now);

        // 根据计费周期设置结束日期
        if (billingCycle == TenantSubscription.BillingCycle.YEARLY) {
            subscription.setCurrentPeriodEnd(now.plusYears(1));
        } else {
            subscription.setCurrentPeriodEnd(now.plusMonths(1));
        }

        int result = tenantSubscriptionMapper.insert(subscription);
        if (result > 0) {
            log.info("订阅创建成功 - 租户ID: {}, 订阅ID: {}, 周期结束日期: {}",
                    tenantId, subscription.getId(), subscription.getCurrentPeriodEnd());
            return subscription;
        } else {
            log.error("订阅创建失败 - 租户ID: {}", tenantId);
            throw new BusinessException("创建订阅失败");
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean updateSubscription(TenantSubscription subscription) {
        log.info("更新订阅 - 订阅ID: {}", subscription.getId());
        int result = tenantSubscriptionMapper.update(subscription);
        if (result > 0) {
            log.info("订阅更新成功 - 订阅ID: {}", subscription.getId());
            return true;
        } else {
            log.error("订阅更新失败 - 订阅ID: {}", subscription.getId());
            return false;
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean cancelSubscription(Long id) {
        log.info("取消订阅 - 订阅ID: {}", id);

        TenantSubscription subscription = tenantSubscriptionMapper.findById(id);
        if (subscription == null) {
            log.error("订阅不存在 - 订阅ID: {}", id);
            throw new BusinessException("订阅不存在");
        }

        subscription.setStatus(TenantSubscription.SubscriptionStatus.CANCELLED);
        int result = tenantSubscriptionMapper.update(subscription);
        if (result > 0) {
            log.info("订阅取消成功 - 订阅ID: {}", id);
            return true;
        } else {
            log.error("订阅取消失败 - 订阅ID: {}", id);
            return false;
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean deleteSubscription(Long id) {
        log.info("删除订阅 - 订阅ID: {}", id);
        int result = tenantSubscriptionMapper.delete(id);
        if (result > 0) {
            log.info("订阅删除成功 - 订阅ID: {}", id);
            return true;
        } else {
            log.error("订阅删除失败 - 订阅ID: {}", id);
            return false;
        }
    }

    @Override
    public List<TenantSubscription> getAllTrialSubscriptions() {
        log.debug("查询所有试用期订阅");
        return tenantSubscriptionMapper.findAllTrialSubscriptions();
    }

    @Override
    public List<TenantSubscription> getAllActiveSubscriptions() {
        log.debug("查询所有活跃订阅");
        return tenantSubscriptionMapper.findAllActiveSubscriptions();
    }

    // 注意：getAllPendingPlanChanges 已移除
    // 计划变更现在由 Stripe Subscription Schedules 自动处理
}
