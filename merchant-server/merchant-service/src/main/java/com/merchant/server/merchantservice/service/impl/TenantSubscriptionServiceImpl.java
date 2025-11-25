package com.merchant.server.merchantservice.service.impl;

import com.merchant.server.common.exception.BusinessException;
import com.merchant.server.merchantservice.entity.Invoice;
import com.merchant.server.merchantservice.entity.SubscriptionPlan;
import com.merchant.server.merchantservice.entity.TenantSubscription;
import com.merchant.server.merchantservice.mapper.InvoiceMapper;
import com.merchant.server.merchantservice.mapper.TenantSubscriptionMapper;
import com.merchant.server.merchantservice.service.InvoiceService;
import com.merchant.server.merchantservice.service.SubscriptionPlanService;
import com.merchant.server.merchantservice.service.TenantSubscriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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
    private final InvoiceMapper invoiceMapper;
    private final InvoiceService invoiceService;

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
        log.info("为租户创建ELITE试用订阅 - 租户ID: {}", tenantId);

        // 检查租户是否已有活跃订阅
        TenantSubscription existingSubscription = tenantSubscriptionMapper.findActiveByTenantId(tenantId);
        if (existingSubscription != null) {
            log.warn("租户已有活跃订阅 - 租户ID: {}, 订阅ID: {}", tenantId, existingSubscription.getId());
            throw new BusinessException("租户已有活跃订阅");
        }

        // 查询ELITE计划
        SubscriptionPlan elitePlan = subscriptionPlanService.getPlanByCode("ELITE");
        if (elitePlan == null) {
            log.error("找不到ELITE订阅计划");
            throw new BusinessException("找不到ELITE订阅计划");
        }

        // 创建试用订阅（默认月付）
        TenantSubscription subscription = new TenantSubscription();
        subscription.setTenantId(tenantId);
        subscription.setPlanId(elitePlan.getId());
        subscription.setBillingCycle(TenantSubscription.BillingCycle.MONTHLY);
        subscription.setStatus(TenantSubscription.SubscriptionStatus.TRIAL);

        // 设置试用期（14天）
        LocalDate now = LocalDate.now();
        subscription.setTrialStartDate(now);
        subscription.setTrialEndDate(now.plusDays(14));

        // 设置当前周期（试用期间）
        subscription.setCurrentPeriodStart(now);
        subscription.setCurrentPeriodEnd(now.plusDays(14));

        int result = tenantSubscriptionMapper.insert(subscription);
        if (result > 0) {
            log.info("ELITE试用订阅创建成功 - 租户ID: {}, 订阅ID: {}, 试用结束日期: {}",
                    tenantId, subscription.getId(), subscription.getTrialEndDate());
            return subscription;
        } else {
            log.error("ELITE试用订阅创建失败 - 租户ID: {}", tenantId);
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

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean changeBillingCycle(Long subscriptionId, TenantSubscription.BillingCycle newBillingCycle) {
        log.info("修改订阅计费周期 - 订阅ID: {}, 新周期: {}", subscriptionId, newBillingCycle);

        TenantSubscription subscription = tenantSubscriptionMapper.findById(subscriptionId);
        if (subscription == null) {
            log.error("订阅不存在 - 订阅ID: {}", subscriptionId);
            throw new BusinessException("订阅不存在");
        }

        if (subscription.getStatus() != TenantSubscription.SubscriptionStatus.ACTIVE &&
            subscription.getStatus() != TenantSubscription.SubscriptionStatus.TRIAL) {
            log.error("只能修改活跃或试用期订阅的计费周期 - 订阅ID: {}, 当前状态: {}",
                    subscriptionId, subscription.getStatus());
            throw new BusinessException("只能修改活跃或试用期订阅的计费周期");
        }

        if (subscription.getBillingCycle() == newBillingCycle) {
            log.warn("计费周期未发生变化 - 订阅ID: {}", subscriptionId);
            return true;
        }

        // 更新计费周期
        subscription.setBillingCycle(newBillingCycle);

        // 如果订阅是ACTIVE状态，需要调整当前周期的结束日期
        if (subscription.getStatus() == TenantSubscription.SubscriptionStatus.ACTIVE) {
            LocalDate periodStart = subscription.getCurrentPeriodStart();
            LocalDate periodEnd;
            if (newBillingCycle == TenantSubscription.BillingCycle.MONTHLY) {
                periodEnd = periodStart.plusMonths(1).minusDays(1);
            } else {
                periodEnd = periodStart.plusYears(1).minusDays(1);
            }
            subscription.setCurrentPeriodEnd(periodEnd);
            log.info("调整订阅周期结束日期 - 订阅ID: {}, 新结束日期: {}", subscriptionId, periodEnd);
        }

        int result = tenantSubscriptionMapper.update(subscription);
        if (result > 0) {
            log.info("订阅计费周期修改成功 - 订阅ID: {}, 新周期: {}", subscriptionId, newBillingCycle);

            // 处理未支付的账单 - 更新金额和描述
            updatePendingInvoicesForBillingCycleChange(subscription, newBillingCycle);

            return true;
        } else {
            log.error("订阅计费周期修改失败 - 订阅ID: {}", subscriptionId);
            return false;
        }
    }

    /**
     * 为计费周期切换更新待支付账单
     * 此方法必须在事务中调用，如果更新失败会抛出异常导致整个事务回滚
     */
    private void updatePendingInvoicesForBillingCycleChange(TenantSubscription subscription, TenantSubscription.BillingCycle newBillingCycle) {
        // 查询该订阅的所有待支付账单
        List<Invoice> invoices = invoiceMapper.findBySubscriptionId(subscription.getId());
        List<Invoice> pendingInvoices = invoices.stream()
                .filter(invoice -> invoice.getStatus() == Invoice.InvoiceStatus.PENDING)
                .toList();

        if (pendingInvoices.isEmpty()) {
            log.info("没有待支付账单需要更新 - 订阅ID: {}", subscription.getId());
            return;
        }

        // 获取订阅计划以获取价格信息
        SubscriptionPlan plan = subscriptionPlanService.getPlanById(subscription.getPlanId());
        if (plan == null) {
            log.error("找不到订阅计划 - 计划ID: {}", subscription.getPlanId());
            throw new BusinessException("找不到订阅计划");
        }

        // 根据新的计费周期确定新的价格和描述
        BigDecimal newAmount;
        String cycleDescription;
        if (newBillingCycle == TenantSubscription.BillingCycle.MONTHLY) {
            newAmount = plan.getMonthlyPrice();
            cycleDescription = "Monthly";
        } else {
            newAmount = plan.getYearlyPrice();
            cycleDescription = "Yearly";
        }

        // 更新每个待支付账单
        for (Invoice invoice : pendingInvoices) {
            log.info("更新待支付账单 - 账单ID: {}, 账单号: {}, 原金额: {}, 新金额: {}, 新周期: {}",
                    invoice.getId(), invoice.getInvoiceNumber(), invoice.getAmount(), newAmount, cycleDescription);

            // 更新金额
            invoice.setAmount(newAmount);

            // 更新描述
            String planName = plan.getPlanNameEn();
            invoice.setDescription(planName + " Subscription - " + cycleDescription + " Billing");

            // 根据新的计费周期调整账单周期结束日期
            LocalDate billingStart = invoice.getBillingPeriodStart();
            LocalDate billingEnd;
            if (newBillingCycle == TenantSubscription.BillingCycle.MONTHLY) {
                billingEnd = billingStart.plusMonths(1).minusDays(1);
            } else {
                billingEnd = billingStart.plusYears(1).minusDays(1);
            }
            invoice.setBillingPeriodEnd(billingEnd);

            // 更新账单 - 如果失败则抛出异常，触发事务回滚
            int updateResult = invoiceMapper.update(invoice);
            if (updateResult > 0) {
                log.info("账单更新成功 - 账单ID: {}, 新金额: {}, 新周期结束日期: {}",
                        invoice.getId(), newAmount, billingEnd);
            } else {
                log.error("账单更新失败 - 账单ID: {}", invoice.getId());
                throw new BusinessException("账单更新失败 - 账单ID: " + invoice.getId());
            }
        }

        log.info("待支付账单更新完成 - 订阅ID: {}, 更新数量: {}", subscription.getId(), pendingInvoices.size());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean convertTrialToActiveWithInvoice(Long subscriptionId) {
        log.info("开始处理试用期到期转换 - 订阅ID: {}", subscriptionId);

        TenantSubscription subscription = tenantSubscriptionMapper.findById(subscriptionId);
        if (subscription == null) {
            log.error("订阅不存在 - 订阅ID: {}", subscriptionId);
            throw new BusinessException("订阅不存在");
        }

        if (subscription.getStatus() != TenantSubscription.SubscriptionStatus.TRIAL) {
            log.warn("订阅状态不是TRIAL，跳过转换 - 订阅ID: {}, 当前状态: {}", subscriptionId, subscription.getStatus());
            return false;
        }

        if (subscription.getTrialEndDate() == null) {
            log.error("订阅没有试用结束日期 - 订阅ID: {}", subscriptionId);
            throw new BusinessException("订阅没有试用结束日期");
        }

        // 检查试用期是否已结束
        LocalDate today = LocalDate.now();
        if (!subscription.getTrialEndDate().isBefore(today)) {
            log.info("试用期尚未结束，跳过转换 - 订阅ID: {}, 结束日期: {}", subscriptionId, subscription.getTrialEndDate());
            return false;
        }

        // 1. 转换为ACTIVE状态
        subscription.setStatus(TenantSubscription.SubscriptionStatus.ACTIVE);

        // 更新当前周期：从试用结束日期的第二天开始
        LocalDate periodStart = subscription.getTrialEndDate().plusDays(1);
        LocalDate periodEnd;
        if (subscription.getBillingCycle() == TenantSubscription.BillingCycle.MONTHLY) {
            periodEnd = periodStart.plusMonths(1).minusDays(1);
        } else {
            periodEnd = periodStart.plusYears(1).minusDays(1);
        }
        subscription.setCurrentPeriodStart(periodStart);
        subscription.setCurrentPeriodEnd(periodEnd);

        // 更新订阅状态
        int updateResult = tenantSubscriptionMapper.update(subscription);
        if (updateResult <= 0) {
            log.error("更新订阅状态失败 - 订阅ID: {}", subscriptionId);
            throw new BusinessException("更新订阅状态失败");
        }

        log.info("订阅已转为ACTIVE状态 - 订阅ID: {}, 新周期: {} ~ {}", subscriptionId, periodStart, periodEnd);

        // 2. 生成首个账单（在同一个事务中）
        Invoice invoice = invoiceService.generateInvoiceForSubscription(subscriptionId);
        if (invoice == null) {
            log.error("生成首个账单失败 - 订阅ID: {}", subscriptionId);
            throw new BusinessException("生成首个账单失败");
        }

        log.info("试用期到期转换完成 - 订阅ID: {}, 账单号: {}", subscriptionId, invoice.getInvoiceNumber());
        return true;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean markSubscriptionAsPastDue(Long subscriptionId) {
        log.info("标记订阅为逾期状态 - 订阅ID: {}", subscriptionId);

        TenantSubscription subscription = tenantSubscriptionMapper.findById(subscriptionId);
        if (subscription == null) {
            log.error("订阅不存在 - 订阅ID: {}", subscriptionId);
            throw new BusinessException("订阅不存在");
        }

        if (subscription.getStatus() != TenantSubscription.SubscriptionStatus.ACTIVE) {
            log.warn("订阅状态不是ACTIVE，跳过 - 订阅ID: {}, 当前状态: {}", subscriptionId, subscription.getStatus());
            return false;
        }

        // 将订阅状态改为PAST_DUE
        subscription.setStatus(TenantSubscription.SubscriptionStatus.PAST_DUE);
        int updateResult = tenantSubscriptionMapper.update(subscription);

        if (updateResult > 0) {
            log.info("订阅已标记为逾期状态 - 订阅ID: {}", subscriptionId);
            return true;
        } else {
            log.error("标记订阅为逾期状态失败 - 订阅ID: {}", subscriptionId);
            throw new BusinessException("标记订阅为逾期状态失败");
        }
    }
}
