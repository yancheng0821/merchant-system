package com.merchant.server.merchantservice.schedule;

import com.merchant.server.merchantservice.client.AuthServiceInternalClient;
import com.merchant.server.merchantservice.entity.Invoice;
import com.merchant.server.merchantservice.entity.TenantSubscription;
import com.merchant.server.merchantservice.service.InvoiceService;
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
    private final InvoiceService invoiceService;
    private final AuthServiceInternalClient authServiceInternalClient;

    /**
     * 处理试用期结束
     * 每分钟执行一次（测试用）
     */
    @Scheduled(cron = "0 * * * * ?")
    public void handleTrialExpiration() {
        log.info("=== 开始执行试用期结束处理任务 ===");

        try {
            List<TenantSubscription> trialSubscriptions = subscriptionService.getAllTrialSubscriptions();
            log.info("找到 {} 个试用期订阅", trialSubscriptions.size());

            LocalDate today = LocalDate.now();
            int expiredCount = 0;
            int convertedCount = 0;

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

                    // 在事务中转换为ACTIVE状态并生成首个账单
                    boolean success = subscriptionService.convertTrialToActiveWithInvoice(subscription.getId());
                    if (success) {
                        log.info("订阅ID {} 成功转换为ACTIVE并生成账单", subscription.getId());
                        convertedCount++;
                    }

                } catch (Exception e) {
                    log.error("处理订阅ID {} 的试用期结束失败: {}", subscription.getId(), e.getMessage(), e);
                }
            }

            log.info("=== 试用期结束处理完成：检查 {} 个，过期 {} 个，成功转换 {} 个 ===",
                    trialSubscriptions.size(), expiredCount, convertedCount);

        } catch (Exception e) {
            log.error("试用期结束处理任务执行失败: {}", e.getMessage(), e);
        }
    }

    /**
     * 自动生成续费账单
     * 每分钟执行一次（测试用），在周期结束前7天生成下一期账单
     */
    @Scheduled(cron = "0 * * * * ?")
    public void generateRenewalInvoices() {
        log.info("=== 开始执行续费账单生成任务 ===");

        try {
            List<TenantSubscription> activeSubscriptions = subscriptionService.getAllActiveSubscriptions();
            log.info("找到 {} 个活跃订阅", activeSubscriptions.size());

            LocalDate today = LocalDate.now();
            LocalDate checkDate = today.plusDays(7); // 提前7天生成账单
            int generatedCount = 0;

            for (TenantSubscription subscription : activeSubscriptions) {
                try {
                    if (subscription.getCurrentPeriodEnd() == null) {
                        log.warn("订阅ID {} 没有周期结束日期", subscription.getId());
                        continue;
                    }

                    // 检查是否在账单生成窗口期（周期结束前7天内）
                    if (subscription.getCurrentPeriodEnd().isAfter(checkDate)) {
                        continue; // 还不到生成账单的时间
                    }

                    log.info("订阅ID {} 即将到期，结束日期: {}", subscription.getId(), subscription.getCurrentPeriodEnd());

                    // 检查是否已经生成了本周期的账单
                    List<Invoice> existingInvoices = invoiceService.getInvoicesBySubscriptionId(subscription.getId());
                    boolean hasCurrentPeriodInvoice = existingInvoices.stream()
                            .anyMatch(inv -> inv.getBillingPeriodStart().equals(subscription.getCurrentPeriodStart())
                                    && inv.getBillingPeriodEnd().equals(subscription.getCurrentPeriodEnd()));

                    if (hasCurrentPeriodInvoice) {
                        log.info("订阅ID {} 本周期账单已存在，跳过", subscription.getId());
                        continue;
                    }

                    // 生成续费账单
                    Invoice invoice = invoiceService.generateInvoiceForSubscription(subscription.getId());
                    if (invoice != null) {
                        log.info("为订阅ID {} 生成续费账单: {}", subscription.getId(), invoice.getInvoiceNumber());
                        generatedCount++;
                    }

                } catch (Exception e) {
                    log.error("为订阅ID {} 生成续费账单失败: {}", subscription.getId(), e.getMessage(), e);
                }
            }

            log.info("=== 续费账单生成完成：检查 {} 个，生成 {} 个 ===",
                    activeSubscriptions.size(), generatedCount);

        } catch (Exception e) {
            log.error("续费账单生成任务执行失败: {}", e.getMessage(), e);
        }
    }

    /**
     * 更新过期订阅状态
     * 每分钟执行一次（测试用）
     * 检查账单创建后7天未支付，则禁用商户访问
     */
    @Scheduled(cron = "0 * * * * ?")
    public void updateExpiredSubscriptions() {
        log.info("=== 开始执行过期订阅状态更新任务 ===");

        try {
            List<TenantSubscription> activeSubscriptions = subscriptionService.getAllActiveSubscriptions();
            log.info("找到 {} 个活跃订阅", activeSubscriptions.size());

            LocalDate today = LocalDate.now();
            int suspendedCount = 0;

            for (TenantSubscription subscription : activeSubscriptions) {
                try {
                    // 检查是否有未支付的账单
                    List<Invoice> invoices = invoiceService.getInvoicesBySubscriptionId(subscription.getId());

                    boolean hasOverdueInvoice = false;
                    for (Invoice invoice : invoices) {
                        if (invoice.getStatus() == Invoice.InvoiceStatus.PENDING) {
                            // 检查账单创建后是否超过7天未支付
                            LocalDate invoiceCreatedDate = invoice.getCreatedAt().toLocalDate();
                            LocalDate dueDate = invoiceCreatedDate.plusDays(7);

                            if (today.isAfter(dueDate)) {
                                log.warn("订阅ID {} 的账单 {} 已逾期，创建日期: {}, 今天: {}",
                                        subscription.getId(), invoice.getInvoiceNumber(), invoiceCreatedDate, today);
                                hasOverdueInvoice = true;
                                break; // 只要有一个账单逾期就处理
                            }
                        }
                    }

                    if (hasOverdueInvoice) {
                        // 在事务中将订阅状态改为PAST_DUE
                        boolean success = subscriptionService.markSubscriptionAsPastDue(subscription.getId());
                        if (success) {
                            log.info("订阅ID {} 已标记为逾期状态", subscription.getId());

                            // 禁用商户访问（远程调用，不在事务中）
                            try {
                                authServiceInternalClient.deactivateTenant(subscription.getTenantId());
                                log.info("成功禁用租户 {} 的商户访问，账单逾期超过7天", subscription.getTenantId());
                            } catch (Exception e) {
                                log.error("禁用租户 {} 的商户失败: {}", subscription.getTenantId(), e.getMessage(), e);
                            }

                            suspendedCount++;
                        }
                    }

                } catch (Exception e) {
                    log.error("更新订阅ID {} 的状态失败: {}", subscription.getId(), e.getMessage(), e);
                }
            }

            log.info("=== 过期订阅状态更新完成：检查 {} 个，暂停 {} 个 ===",
                    activeSubscriptions.size(), suspendedCount);

        } catch (Exception e) {
            log.error("过期订阅状态更新任务执行失败: {}", e.getMessage(), e);
        }
    }
}
