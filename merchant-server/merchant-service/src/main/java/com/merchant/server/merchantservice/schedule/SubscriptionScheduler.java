package com.merchant.server.merchantservice.schedule;

import com.merchant.server.merchantservice.client.AuthServiceInternalClient;
import com.merchant.server.merchantservice.entity.TenantSubscription;
import com.merchant.server.merchantservice.service.StripeSubscriptionService;
import com.merchant.server.merchantservice.service.TenantSubscriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

/**
 * 订阅定时任务调度器
 * 负责处理试用期结束、账单生成等定时任务
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SubscriptionScheduler {

    private final TenantSubscriptionService subscriptionService;
    private final StripeSubscriptionService stripeSubscriptionService;
    private final AuthServiceInternalClient authServiceInternalClient;

    /**
     * 处理试用期结束
     * 每天凌晨4点执行
     *
     * 逻辑：
     * - 如果用户已完成 Stripe 订阅支付（有 stripeSubscriptionId）→ 转为 ACTIVE
     * - 如果用户未支付 → 转为 EXPIRED，禁用商户账户
     */
    @Scheduled(cron = "0 0 4 * * ?")
    public void handleTrialExpiration() {
        log.info("=== 开始执行试用期结束处理任务 ===");

        try {
            List<TenantSubscription> trialSubscriptions = subscriptionService.getAllTrialSubscriptions();
            log.info("找到 {} 个试用期订阅", trialSubscriptions.size());

            LocalDate today = LocalDate.now();
            int expiredCount = 0;
            int activatedCount = 0;
            int deactivatedCount = 0;

            for (TenantSubscription subscription : trialSubscriptions) {
                try {
                    if (subscription.getTrialEndDate() == null) {
                        log.warn("订阅ID {} 没有试用结束日期", subscription.getId());
                        continue;
                    }

                    // 检查试用期是否已结束
                    if (!subscription.getTrialEndDate().isBefore(today)) {
                        continue; // 试用期未结束
                    }

                    expiredCount++;
                    log.info("订阅ID {} 试用期已结束，结束日期: {}", subscription.getId(), subscription.getTrialEndDate());

                    // 检查是否已完成 Stripe 订阅支付
                    String stripeSubId = subscription.getStripeSubscriptionId();
                    if (stripeSubId != null && !stripeSubId.trim().isEmpty()) {
                        // 已有 Stripe 订阅，转为 ACTIVE
                        subscription.setStatus(TenantSubscription.SubscriptionStatus.ACTIVE);
                        subscriptionService.updateSubscription(subscription);
                        log.info("订阅ID {} 已有 Stripe 订阅 ({})，转为 ACTIVE", subscription.getId(), stripeSubId);
                        activatedCount++;
                    } else {
                        // 未支付，转为 EXPIRED 并禁用商户
                        subscription.setStatus(TenantSubscription.SubscriptionStatus.EXPIRED);
                        subscriptionService.updateSubscription(subscription);
                        log.info("订阅ID {} 试用期结束未支付，转为 EXPIRED", subscription.getId());

                        // 禁用商户账户
                        try {
                            authServiceInternalClient.deactivateTenant(subscription.getTenantId());
                            log.info("租户 {} 商户账户已禁用（试用期结束未支付）", subscription.getTenantId());
                            deactivatedCount++;
                        } catch (Exception e) {
                            log.error("禁用租户 {} 失败: {}", subscription.getTenantId(), e.getMessage(), e);
                        }
                    }

                } catch (Exception e) {
                    log.error("处理订阅ID {} 的试用期结束失败: {}", subscription.getId(), e.getMessage(), e);
                }
            }

            log.info("=== 试用期结束处理完成：检查 {} 个，过期 {} 个，激活 {} 个，禁用 {} 个 ===",
                    trialSubscriptions.size(), expiredCount, activatedCount, deactivatedCount);

        } catch (Exception e) {
            log.error("试用期结束处理任务执行失败: {}", e.getMessage(), e);
        }
    }

    // 注意：计划变更现在由 Stripe Subscription Schedules 自动处理
    // 不再需要本地定时任务来执行待生效的计划变更
}
