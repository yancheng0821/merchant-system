package com.merchant.server.merchantservice.service.impl;

import com.merchant.server.common.exception.BusinessException;
import com.merchant.server.merchantservice.client.AuthServiceInternalClient;
import com.merchant.server.merchantservice.entity.SubscriptionPlan;
import com.merchant.server.merchantservice.entity.TenantSubscription;
import com.merchant.server.merchantservice.mapper.SubscriptionPlanMapper;
import com.merchant.server.merchantservice.mapper.TenantSubscriptionMapper;
import com.merchant.server.merchantservice.service.StripeSubscriptionService;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.*;
import com.stripe.net.Webhook;
import com.stripe.param.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Stripe 订阅服务实现
 */
@Slf4j
@Service
public class StripeSubscriptionServiceImpl implements StripeSubscriptionService {

    private final SubscriptionPlanMapper planMapper;
    private final TenantSubscriptionMapper subscriptionMapper;
    private final AuthServiceInternalClient authServiceInternalClient;

    @Value("${stripe.api.key}")
    private String stripeSecretKey;

    @Value("${stripe.webhook.secret:}")
    private String webhookSecret;

    public StripeSubscriptionServiceImpl(SubscriptionPlanMapper planMapper,
                                         TenantSubscriptionMapper subscriptionMapper,
                                         AuthServiceInternalClient authServiceInternalClient) {
        this.planMapper = planMapper;
        this.subscriptionMapper = subscriptionMapper;
        this.authServiceInternalClient = authServiceInternalClient;
    }

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeSecretKey;
        log.info("Stripe SDK initialized");
    }

    @Override
    public void initializeStripeProducts() {
        log.info("开始初始化 Stripe Products 和 Prices...");

        List<SubscriptionPlan> plans = planMapper.findAllActive();
        for (SubscriptionPlan plan : plans) {
            try {
                // 跳过 FREE 计划
                if ("FREE".equals(plan.getPlanCode())) {
                    continue;
                }

                // 检查是否已有 Product
                if (plan.getStripeProductId() == null || plan.getStripeProductId().isEmpty()) {
                    ProductCreateParams productParams = ProductCreateParams.builder()
                            .setName(plan.getPlanNameEn())
                            .setDescription(plan.getPlanNameZh())
                            .putMetadata("plan_code", plan.getPlanCode())
                            .build();
                    Product product = Product.create(productParams);
                    plan.setStripeProductId(product.getId());
                    log.info("创建 Stripe Product: {} -> {}", plan.getPlanCode(), product.getId());
                }

                // 检查月付 Price
                if (plan.getStripeMonthlyPriceId() == null || plan.getStripeMonthlyPriceId().isEmpty()) {
                    PriceCreateParams monthlyPriceParams = PriceCreateParams.builder()
                            .setProduct(plan.getStripeProductId())
                            .setCurrency("cad")
                            .setUnitAmount(plan.getMonthlyPrice().multiply(BigDecimal.valueOf(100)).longValue())
                            .setRecurring(PriceCreateParams.Recurring.builder()
                                    .setInterval(PriceCreateParams.Recurring.Interval.MONTH)
                                    .build())
                            .setTaxBehavior(PriceCreateParams.TaxBehavior.EXCLUSIVE) // 税费外加
                            .putMetadata("plan_code", plan.getPlanCode())
                            .putMetadata("billing_cycle", "MONTHLY")
                            .build();
                    Price monthlyPrice = Price.create(monthlyPriceParams);
                    plan.setStripeMonthlyPriceId(monthlyPrice.getId());
                    log.info("创建月付 Price: {} -> {}", plan.getPlanCode(), monthlyPrice.getId());
                } else {
                    // 检查并更新现有 Price 的 tax_behavior
                    try {
                        Price existingPrice = Price.retrieve(plan.getStripeMonthlyPriceId());
                        if (existingPrice.getTaxBehavior() == null || !"exclusive".equals(existingPrice.getTaxBehavior())) {
                            log.info("更新月付 Price {} 的 tax_behavior", plan.getStripeMonthlyPriceId());
                            PriceUpdateParams updateParams = PriceUpdateParams.builder()
                                    .setTaxBehavior(PriceUpdateParams.TaxBehavior.EXCLUSIVE)
                                    .build();
                            existingPrice.update(updateParams);
                            log.info("已更新月付 Price {} 的 tax_behavior 为 exclusive", plan.getStripeMonthlyPriceId());
                        }
                    } catch (StripeException e) {
                        log.warn("更新月付 Price tax_behavior 失败: {}", e.getMessage());
                    }
                }

                // 检查年付 Price
                if (plan.getStripeYearlyPriceId() == null || plan.getStripeYearlyPriceId().isEmpty()) {
                    PriceCreateParams yearlyPriceParams = PriceCreateParams.builder()
                            .setProduct(plan.getStripeProductId())
                            .setCurrency("cad")
                            .setUnitAmount(plan.getYearlyPrice().multiply(BigDecimal.valueOf(100)).longValue())
                            .setRecurring(PriceCreateParams.Recurring.builder()
                                    .setInterval(PriceCreateParams.Recurring.Interval.YEAR)
                                    .build())
                            .setTaxBehavior(PriceCreateParams.TaxBehavior.EXCLUSIVE) // 税费外加
                            .putMetadata("plan_code", plan.getPlanCode())
                            .putMetadata("billing_cycle", "YEARLY")
                            .build();
                    Price yearlyPrice = Price.create(yearlyPriceParams);
                    plan.setStripeYearlyPriceId(yearlyPrice.getId());
                    log.info("创建年付 Price: {} -> {}", plan.getPlanCode(), yearlyPrice.getId());
                } else {
                    // 检查并更新现有 Price 的 tax_behavior
                    try {
                        Price existingPrice = Price.retrieve(plan.getStripeYearlyPriceId());
                        if (existingPrice.getTaxBehavior() == null || !"exclusive".equals(existingPrice.getTaxBehavior())) {
                            log.info("更新年付 Price {} 的 tax_behavior", plan.getStripeYearlyPriceId());
                            PriceUpdateParams updateParams = PriceUpdateParams.builder()
                                    .setTaxBehavior(PriceUpdateParams.TaxBehavior.EXCLUSIVE)
                                    .build();
                            existingPrice.update(updateParams);
                            log.info("已更新年付 Price {} 的 tax_behavior 为 exclusive", plan.getStripeYearlyPriceId());
                        }
                    } catch (StripeException e) {
                        log.warn("更新年付 Price tax_behavior 失败: {}", e.getMessage());
                    }
                }

                // 保存到数据库
                planMapper.updateStripeIds(plan.getId(),
                        plan.getStripeProductId(),
                        plan.getStripeMonthlyPriceId(),
                        plan.getStripeYearlyPriceId());

                log.info("计划 {} Stripe 配置: productId={}, monthlyPriceId={}, yearlyPriceId={}",
                        plan.getPlanCode(), plan.getStripeProductId(),
                        plan.getStripeMonthlyPriceId(), plan.getStripeYearlyPriceId());

            } catch (StripeException e) {
                log.error("初始化计划 {} 的 Stripe 信息失败: {}", plan.getPlanCode(), e.getMessage(), e);
            }
        }

        log.info("Stripe Products 和 Prices 初始化完成");
    }

    @Override
    public String getOrCreateStripeCustomer(Long tenantId, String email, String name) {
        log.info("获取或创建 Stripe Customer - tenantId: {}, email: {}", tenantId, email);

        TenantSubscription subscription = subscriptionMapper.findActiveByTenantId(tenantId);
        if (subscription != null && subscription.getStripeCustomerId() != null) {
            return subscription.getStripeCustomerId();
        }

        try {
            // 创建新 Customer
            CustomerCreateParams createParams = CustomerCreateParams.builder()
                    .setEmail(email)
                    .setName(name)
                    .putMetadata("tenant_id", tenantId.toString())
                    .build();
            Customer customer = Customer.create(createParams);
            log.info("创建新 Stripe Customer: {}", customer.getId());

            // 更新本地订阅
            if (subscription != null) {
                subscription.setStripeCustomerId(customer.getId());
                subscriptionMapper.update(subscription);
            }

            return customer.getId();

        } catch (StripeException e) {
            log.error("创建 Stripe Customer 失败: {}", e.getMessage(), e);
            throw new BusinessException("创建支付账户失败: " + e.getMessage());
        }
    }

    @Override
    public String createCheckoutSession(Long tenantId, String planCode,
                                        TenantSubscription.BillingCycle billingCycle,
                                        String successUrl, String cancelUrl, String customerEmail) {
        log.info("创建 Checkout Session - tenantId: {}, plan: {}, cycle: {}",
                tenantId, planCode, billingCycle);

        SubscriptionPlan plan = planMapper.findByPlanCode(planCode);
        if (plan == null) {
            throw new BusinessException("找不到订阅计划: " + planCode);
        }

        String priceId = billingCycle == TenantSubscription.BillingCycle.MONTHLY
                ? plan.getStripeMonthlyPriceId()
                : plan.getStripeYearlyPriceId();

        if (priceId == null || priceId.isEmpty()) {
            throw new BusinessException("计划 " + planCode + " 未配置 Stripe Price");
        }

        try {
            TenantSubscription subscription = subscriptionMapper.findActiveByTenantId(tenantId);
            String customerId = subscription != null ? subscription.getStripeCustomerId() : null;

            // 使用 Hosted Checkout（跳转到 Stripe 托管页面）
            com.stripe.param.checkout.SessionCreateParams.Builder paramsBuilder =
                    com.stripe.param.checkout.SessionCreateParams.builder()
                    .setMode(com.stripe.param.checkout.SessionCreateParams.Mode.SUBSCRIPTION)
                    .setSuccessUrl(successUrl + "?session_id={CHECKOUT_SESSION_ID}")
                    .setCancelUrl(cancelUrl != null ? cancelUrl : successUrl.replace("/settings", "/pricing"))
                    .addLineItem(com.stripe.param.checkout.SessionCreateParams.LineItem.builder()
                            .setPrice(priceId)
                            .setQuantity(1L)
                            .build())
                    .putMetadata("tenant_id", tenantId.toString())
                    .putMetadata("plan_code", planCode)
                    .putMetadata("billing_cycle", billingCycle.name())
                    // 启用自动税费计算
                    .setAutomaticTax(com.stripe.param.checkout.SessionCreateParams.AutomaticTax.builder()
                            .setEnabled(true)
                            .build())
                    .setSubscriptionData(com.stripe.param.checkout.SessionCreateParams.SubscriptionData.builder()
                            .putMetadata("tenant_id", tenantId.toString())
                            .putMetadata("plan_code", planCode)
                            .build());

            if (customerId != null && !customerId.isEmpty()) {
                paramsBuilder.setCustomer(customerId);
            } else if (customerEmail != null && !customerEmail.isEmpty()) {
                // 新客户：预填充邮箱，Stripe 会自动创建 Customer
                paramsBuilder.setCustomerEmail(customerEmail);
            }
            // 注意：subscription 模式下不需要设置 customerCreation，Stripe 会自动创建客户
            // 注意：试用期用户订阅时立即开始付费，不再延续试用期

            com.stripe.model.checkout.Session session =
                    com.stripe.model.checkout.Session.create(paramsBuilder.build());
            log.info("创建 Hosted Checkout Session 成功: {}", session.getId());
            // 返回 URL，前端直接跳转到 Stripe 托管页面
            return session.getUrl();

        } catch (StripeException e) {
            log.error("创建 Checkout Session 失败: {}", e.getMessage(), e);
            throw new BusinessException("创建支付页面失败: " + e.getMessage());
        }
    }

    @Override
    public String createSubscription(Long tenantId, String planCode,
                                     TenantSubscription.BillingCycle billingCycle) {
        log.info("创建 Stripe Subscription - tenantId: {}, plan: {}, cycle: {}",
                tenantId, planCode, billingCycle);

        TenantSubscription subscription = subscriptionMapper.findActiveByTenantId(tenantId);
        if (subscription == null || subscription.getStripeCustomerId() == null) {
            throw new BusinessException("租户没有有效的支付账户");
        }

        SubscriptionPlan plan = planMapper.findByPlanCode(planCode);
        if (plan == null) {
            throw new BusinessException("找不到订阅计划: " + planCode);
        }

        String priceId = billingCycle == TenantSubscription.BillingCycle.MONTHLY
                ? plan.getStripeMonthlyPriceId()
                : plan.getStripeYearlyPriceId();

        try {
            SubscriptionCreateParams params = SubscriptionCreateParams.builder()
                    .setCustomer(subscription.getStripeCustomerId())
                    .addItem(SubscriptionCreateParams.Item.builder()
                            .setPrice(priceId)
                            .build())
                    .putMetadata("tenant_id", tenantId.toString())
                    .putMetadata("plan_code", planCode)
                    .build();

            Subscription stripeSubscription = Subscription.create(params);
            log.info("创建 Stripe Subscription 成功: {}", stripeSubscription.getId());

            subscription.setStripeSubscriptionId(stripeSubscription.getId());
            subscriptionMapper.update(subscription);

            return stripeSubscription.getId();

        } catch (StripeException e) {
            log.error("创建 Stripe Subscription 失败: {}", e.getMessage(), e);
            throw new BusinessException("创建订阅失败: " + e.getMessage());
        }
    }

    @Override
    public void updateSubscription(String stripeSubscriptionId, String newPlanCode,
                                   TenantSubscription.BillingCycle newBillingCycle,
                                   String prorationBehavior) {
        log.info("更新 Stripe Subscription - subscriptionId: {}, newPlan: {}, newCycle: {}, proration: {}",
                stripeSubscriptionId, newPlanCode, newBillingCycle, prorationBehavior);

        SubscriptionPlan newPlan = planMapper.findByPlanCode(newPlanCode);
        if (newPlan == null) {
            throw new BusinessException("找不到订阅计划: " + newPlanCode);
        }

        String newPriceId = newBillingCycle == TenantSubscription.BillingCycle.MONTHLY
                ? newPlan.getStripeMonthlyPriceId()
                : newPlan.getStripeYearlyPriceId();

        try {
            Subscription subscription = Subscription.retrieve(stripeSubscriptionId);

            // 验证 Stripe 订阅状态，只有 active 状态才能升级/降级
            String stripeStatus = subscription.getStatus();
            log.info("Stripe Subscription 当前状态: {}", stripeStatus);
            if (!"active".equals(stripeStatus)) {
                log.warn("Stripe Subscription {} 状态为 {}，不允许直接更新", stripeSubscriptionId, stripeStatus);
                throw new BusinessException("订阅状态不可用，请重新订阅");
            }

            // 检查并设置默认支付方式（如果需要立即收费）
            if ("always_invoice".equals(prorationBehavior)) {
                String customerId = subscription.getCustomer();
                ensureDefaultPaymentMethod(customerId);
            }

            String itemId = subscription.getItems().getData().get(0).getId();

            SubscriptionUpdateParams.ProrationBehavior behavior;
            if ("create_prorations".equals(prorationBehavior)) {
                behavior = SubscriptionUpdateParams.ProrationBehavior.CREATE_PRORATIONS;
            } else if ("none".equals(prorationBehavior)) {
                behavior = SubscriptionUpdateParams.ProrationBehavior.NONE;
            } else {
                behavior = SubscriptionUpdateParams.ProrationBehavior.ALWAYS_INVOICE;
            }

            SubscriptionUpdateParams params = SubscriptionUpdateParams.builder()
                    .addItem(SubscriptionUpdateParams.Item.builder()
                            .setId(itemId)
                            .setPrice(newPriceId)
                            .build())
                    .setProrationBehavior(behavior)
                    // 启用自动税费计算
                    .setAutomaticTax(SubscriptionUpdateParams.AutomaticTax.builder()
                            .setEnabled(true)
                            .build())
                    .putMetadata("plan_code", newPlanCode)
                    .putMetadata("billing_cycle", newBillingCycle.name())
                    .build();

            Subscription updated = subscription.update(params);
            log.info("更新 Stripe Subscription 成功: {}", updated.getId());

        } catch (StripeException e) {
            log.error("更新 Stripe Subscription 失败: {}", e.getMessage(), e);
            throw new BusinessException("更新订阅失败: " + e.getMessage());
        }
    }

    @Override
    public Map<String, Object> previewSubscriptionUpdate(String stripeSubscriptionId, String newPlanCode,
                                                          TenantSubscription.BillingCycle newBillingCycle) {
        log.info("预览订阅更新 - subscriptionId: {}, newPlan: {}, newCycle: {}",
                stripeSubscriptionId, newPlanCode, newBillingCycle);

        SubscriptionPlan newPlan = planMapper.findByPlanCode(newPlanCode);
        if (newPlan == null) {
            throw new BusinessException("找不到订阅计划: " + newPlanCode);
        }

        String newPriceId = newBillingCycle == TenantSubscription.BillingCycle.MONTHLY
                ? newPlan.getStripeMonthlyPriceId()
                : newPlan.getStripeYearlyPriceId();

        try {
            Subscription subscription = Subscription.retrieve(stripeSubscriptionId);
            String customerId = subscription.getCustomer();
            String itemId = subscription.getItems().getData().get(0).getId();

            // 使用 Invoice.upcoming() 预览即将产生的费用（启用自动税费计算）
            InvoiceUpcomingParams.Builder paramsBuilder = InvoiceUpcomingParams.builder()
                    .setCustomer(customerId)
                    .setSubscription(stripeSubscriptionId)
                    .addSubscriptionItem(InvoiceUpcomingParams.SubscriptionItem.builder()
                            .setId(itemId)
                            .setPrice(newPriceId)
                            .build())
                    .setSubscriptionProrationBehavior(
                            InvoiceUpcomingParams.SubscriptionProrationBehavior.ALWAYS_INVOICE);

            // 启用自动税费计算
            paramsBuilder.setAutomaticTax(InvoiceUpcomingParams.AutomaticTax.builder()
                    .setEnabled(true)
                    .build());

            Invoice upcomingInvoice = Invoice.upcoming(paramsBuilder.build());

            Map<String, Object> result = new HashMap<>();
            // 小计（税前金额，分）
            result.put("subtotal", upcomingInvoice.getSubtotal());
            // 税费（分）
            result.put("tax", upcomingInvoice.getTax() != null ? upcomingInvoice.getTax() : 0L);
            // 立即需要支付的金额（含税，分）
            result.put("immediateTotal", upcomingInvoice.getAmountDue());
            // 货币
            result.put("currency", upcomingInvoice.getCurrency());
            // 新计划价格（分）
            long newPlanPrice = newBillingCycle == TenantSubscription.BillingCycle.MONTHLY
                    ? newPlan.getMonthlyPrice().multiply(java.math.BigDecimal.valueOf(100)).longValue()
                    : newPlan.getYearlyPrice().multiply(java.math.BigDecimal.valueOf(100)).longValue();
            result.put("newPlanPrice", newPlanPrice);
            result.put("newPlanName", newPlan.getPlanNameEn());
            result.put("newPlanNameZh", newPlan.getPlanNameZh());

            // 获取客户的默认支付方式
            Customer customer = Customer.retrieve(customerId);
            String defaultPaymentMethodId = null;
            if (customer.getInvoiceSettings() != null) {
                defaultPaymentMethodId = customer.getInvoiceSettings().getDefaultPaymentMethod();
            }

            // 如果客户没有默认支付方式，尝试从订阅获取
            if ((defaultPaymentMethodId == null || defaultPaymentMethodId.isEmpty()) && subscription.getDefaultPaymentMethod() != null) {
                defaultPaymentMethodId = subscription.getDefaultPaymentMethod();
            }

            // 如果仍然没有，列出客户的支付方式并使用第一个
            if (defaultPaymentMethodId == null || defaultPaymentMethodId.isEmpty()) {
                PaymentMethodListParams listParams = PaymentMethodListParams.builder()
                        .setCustomer(customerId)
                        .setType(PaymentMethodListParams.Type.CARD)
                        .build();
                PaymentMethodCollection paymentMethods = PaymentMethod.list(listParams);
                if (!paymentMethods.getData().isEmpty()) {
                    defaultPaymentMethodId = paymentMethods.getData().get(0).getId();
                }
            }

            if (defaultPaymentMethodId != null && !defaultPaymentMethodId.isEmpty()) {
                PaymentMethod pm = PaymentMethod.retrieve(defaultPaymentMethodId);
                Map<String, Object> paymentMethodInfo = new HashMap<>();
                paymentMethodInfo.put("id", pm.getId());
                paymentMethodInfo.put("type", pm.getType());
                if (pm.getCard() != null) {
                    paymentMethodInfo.put("brand", pm.getCard().getBrand());
                    paymentMethodInfo.put("last4", pm.getCard().getLast4());
                    paymentMethodInfo.put("expMonth", pm.getCard().getExpMonth());
                    paymentMethodInfo.put("expYear", pm.getCard().getExpYear());
                }
                result.put("paymentMethod", paymentMethodInfo);
            }

            log.info("预览结果 - 小计: {}, 税费: {}, 总计: {}, total: {} {}",
                    upcomingInvoice.getSubtotal(), upcomingInvoice.getTax(),
                    upcomingInvoice.getAmountDue(), upcomingInvoice.getTotal(), upcomingInvoice.getCurrency());

            // 打印所有 line items 以便调试
            if (upcomingInvoice.getLines() != null && upcomingInvoice.getLines().getData() != null) {
                for (InvoiceLineItem item : upcomingInvoice.getLines().getData()) {
                    log.info("Line item: {} - amount: {}, description: {}, proration: {}",
                            item.getId(), item.getAmount(), item.getDescription(), item.getProration());
                }
            }

            return result;

        } catch (StripeException e) {
            log.error("预览订阅更新失败: {}", e.getMessage(), e);
            throw new BusinessException("预览升级费用失败: " + e.getMessage());
        }
    }

    /**
     * 确保客户有默认支付方式
     * 如果客户有支付方式但没有设置为默认，自动设置第一个为默认
     */
    private void ensureDefaultPaymentMethod(String customerId) throws StripeException {
        Customer customer = Customer.retrieve(customerId);

        // 检查是否已有默认支付方式
        String defaultPaymentMethod = null;
        if (customer.getInvoiceSettings() != null) {
            defaultPaymentMethod = customer.getInvoiceSettings().getDefaultPaymentMethod();
        }

        if (defaultPaymentMethod != null && !defaultPaymentMethod.isEmpty()) {
            log.info("客户 {} 已有默认支付方式: {}", customerId, defaultPaymentMethod);
            return;
        }

        // 获取客户的支付方式列表
        PaymentMethodListParams listParams = PaymentMethodListParams.builder()
                .setCustomer(customerId)
                .setType(PaymentMethodListParams.Type.CARD)
                .build();
        PaymentMethodCollection paymentMethods = PaymentMethod.list(listParams);

        if (paymentMethods.getData().isEmpty()) {
            log.warn("客户 {} 没有任何支付方式", customerId);
            throw new StripeException("客户没有支付方式，请先添加支付方式", null, null, 400) {};
        }

        // 使用第一个支付方式作为默认
        String paymentMethodId = paymentMethods.getData().get(0).getId();
        log.info("为客户 {} 设置默认支付方式: {}", customerId, paymentMethodId);

        CustomerUpdateParams updateParams = CustomerUpdateParams.builder()
                .setInvoiceSettings(CustomerUpdateParams.InvoiceSettings.builder()
                        .setDefaultPaymentMethod(paymentMethodId)
                        .build())
                .build();
        customer.update(updateParams);
        log.info("成功设置客户 {} 的默认支付方式", customerId);
    }

    @Override
    public void cancelSubscription(String stripeSubscriptionId, boolean cancelAtPeriodEnd) {
        log.info("取消 Stripe Subscription - subscriptionId: {}, atPeriodEnd: {}",
                stripeSubscriptionId, cancelAtPeriodEnd);

        try {
            Subscription subscription = Subscription.retrieve(stripeSubscriptionId);

            if (cancelAtPeriodEnd) {
                SubscriptionUpdateParams params = SubscriptionUpdateParams.builder()
                        .setCancelAtPeriodEnd(true)
                        .build();
                subscription.update(params);
                log.info("设置订阅在周期结束时取消: {}", stripeSubscriptionId);
            } else {
                subscription.cancel();
                log.info("立即取消订阅: {}", stripeSubscriptionId);
            }

        } catch (StripeException e) {
            log.error("取消 Stripe Subscription 失败: {}", e.getMessage(), e);
            throw new BusinessException("取消订阅失败: " + e.getMessage());
        }
    }

    @Override
    public void resumeSubscription(String stripeSubscriptionId) {
        log.info("恢复 Stripe Subscription - subscriptionId: {}", stripeSubscriptionId);

        try {
            Subscription subscription = Subscription.retrieve(stripeSubscriptionId);
            SubscriptionUpdateParams params = SubscriptionUpdateParams.builder()
                    .setCancelAtPeriodEnd(false)
                    .build();
            subscription.update(params);
            log.info("恢复订阅成功: {}", stripeSubscriptionId);

        } catch (StripeException e) {
            log.error("恢复 Stripe Subscription 失败: {}", e.getMessage(), e);
            throw new BusinessException("恢复订阅失败: " + e.getMessage());
        }
    }

    @Override
    public String createCustomerPortalSession(Long tenantId, String returnUrl) {
        log.info("创建 Customer Portal Session - tenantId: {}", tenantId);

        TenantSubscription subscription = subscriptionMapper.findActiveByTenantId(tenantId);
        if (subscription == null || subscription.getStripeCustomerId() == null) {
            throw new BusinessException("租户没有有效的支付账户");
        }

        try {
            com.stripe.param.billingportal.SessionCreateParams params =
                    com.stripe.param.billingportal.SessionCreateParams.builder()
                    .setCustomer(subscription.getStripeCustomerId())
                    .setReturnUrl(returnUrl)
                    .build();

            com.stripe.model.billingportal.Session session =
                    com.stripe.model.billingportal.Session.create(params);
            log.info("创建 Customer Portal Session 成功");
            return session.getUrl();

        } catch (StripeException e) {
            log.error("创建 Customer Portal Session 失败: {}", e.getMessage(), e);
            throw new BusinessException("创建账户管理页面失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> handleWebhookEvent(String payload, String sigHeader) {
        Map<String, Object> result = new HashMap<>();

        Event event;
        try {
            if (webhookSecret != null && !webhookSecret.isEmpty()) {
                event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
            } else {
                log.warn("未配置 Webhook Secret，跳过签名验证");
                event = Event.GSON.fromJson(payload, Event.class);
            }
        } catch (SignatureVerificationException e) {
            log.error("Webhook 签名验证失败: {}", e.getMessage());
            result.put("success", false);
            result.put("error", "Invalid signature");
            return result;
        }

        String eventType = event.getType();
        log.info("处理 Stripe Webhook 事件: {}", eventType);

        try {
            switch (eventType) {
                case "checkout.session.completed":
                    handleCheckoutSessionCompleted(event);
                    break;

                case "customer.subscription.created":
                case "customer.subscription.updated":
                    handleSubscriptionUpdated(event);
                    break;

                case "customer.subscription.deleted":
                    handleSubscriptionDeleted(event);
                    break;

                case "invoice.paid":
                    handleInvoicePaid(event);
                    break;

                case "invoice.payment_failed":
                    handleInvoicePaymentFailed(event);
                    break;

                default:
                    log.info("未处理的事件类型: {}", eventType);
            }

            result.put("success", true);
            result.put("eventType", eventType);

        } catch (Exception e) {
            log.error("处理 Webhook 事件失败: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("error", e.getMessage());
        }

        return result;
    }

    private void handleCheckoutSessionCompleted(Event event) {
        com.stripe.model.checkout.Session session =
                (com.stripe.model.checkout.Session) event.getData().getObject();
        log.info("Checkout Session 完成: {}", session.getId());

        String tenantIdStr = session.getMetadata().get("tenant_id");
        String planCode = session.getMetadata().get("plan_code");
        String billingCycleStr = session.getMetadata().get("billing_cycle");

        if (tenantIdStr == null) {
            log.warn("Checkout Session 缺少 tenant_id metadata");
            return;
        }

        Long tenantId = Long.parseLong(tenantIdStr);
        TenantSubscription subscription = subscriptionMapper.findActiveByTenantId(tenantId);

        if (subscription != null) {
            subscription.setStripeCustomerId(session.getCustomer());
            subscription.setStripeSubscriptionId(session.getSubscription());

            if (planCode != null) {
                SubscriptionPlan plan = planMapper.findByPlanCode(planCode);
                if (plan != null) {
                    subscription.setPlanId(plan.getId());
                }
            }

            if (billingCycleStr != null) {
                subscription.setBillingCycle(TenantSubscription.BillingCycle.valueOf(billingCycleStr));
            }

            subscription.setStatus(TenantSubscription.SubscriptionStatus.ACTIVE);

            // 获取 Stripe Subscription 来更新周期日期
            String stripeSubscriptionId = session.getSubscription();
            if (stripeSubscriptionId != null) {
                try {
                    Subscription stripeSubscription = Subscription.retrieve(stripeSubscriptionId);
                    Long periodStartTs = stripeSubscription.getCurrentPeriodStart();
                    Long periodEndTs = stripeSubscription.getCurrentPeriodEnd();
                    log.info("Checkout 完成 - Stripe 周期数据: start={}, end={}", periodStartTs, periodEndTs);

                    if (periodStartTs != null) {
                        LocalDate startDate = Instant.ofEpochSecond(periodStartTs)
                                .atZone(ZoneId.systemDefault())
                                .toLocalDate();
                        subscription.setCurrentPeriodStart(startDate);
                        log.info("设置 currentPeriodStart: {}", startDate);
                    }
                    if (periodEndTs != null) {
                        LocalDate endDate = Instant.ofEpochSecond(periodEndTs)
                                .atZone(ZoneId.systemDefault())
                                .toLocalDate();
                        subscription.setCurrentPeriodEnd(endDate);
                        log.info("设置 currentPeriodEnd: {}", endDate);
                    }
                } catch (StripeException e) {
                    log.error("获取 Stripe Subscription 周期信息失败: {}", e.getMessage());
                }
            }

            subscriptionMapper.update(subscription);
            log.info("更新本地订阅成功 - tenantId: {}", tenantId);

            // 支付成功后激活租户（解除订阅过期限制）
            try {
                authServiceInternalClient.activateTenant(tenantId);
                log.info("租户激活成功 - tenantId: {}", tenantId);
            } catch (Exception e) {
                log.error("租户激活失败 - tenantId: {}, error: {}", tenantId, e.getMessage());
            }
        }
    }

    private void handleSubscriptionUpdated(Event event) {
        Subscription stripeSubscription = (Subscription) event.getData().getObject();
        log.info("Stripe Subscription 更新: {}", stripeSubscription.getId());
        syncFromStripeSubscription(stripeSubscription);
    }

    private void handleSubscriptionDeleted(Event event) {
        Subscription stripeSubscription = (Subscription) event.getData().getObject();
        log.info("Stripe Subscription 删除: {}", stripeSubscription.getId());

        String tenantIdStr = stripeSubscription.getMetadata().get("tenant_id");
        if (tenantIdStr != null) {
            Long tenantId = Long.parseLong(tenantIdStr);
            TenantSubscription subscription = subscriptionMapper.findActiveByTenantId(tenantId);
            if (subscription != null) {
                subscription.setStatus(TenantSubscription.SubscriptionStatus.CANCELLED);
                subscriptionMapper.update(subscription);
                log.info("本地订阅已取消 - tenantId: {}", tenantId);
            }
        }
    }

    private void handleInvoicePaid(Event event) {
        Invoice invoice = (Invoice) event.getData().getObject();
        log.info("Stripe Invoice 已支付: {}", invoice.getId());

        String subscriptionId = invoice.getSubscription();
        if (subscriptionId != null) {
            syncSubscriptionStatus(subscriptionId);
            // 注意：计划变更现在由 Stripe Subscription Schedules 自动处理
            // 不再需要在这里执行本地的 pendingPlanChange
        }
    }

    private void handleInvoicePaymentFailed(Event event) {
        Invoice invoice = (Invoice) event.getData().getObject();
        log.warn("Stripe Invoice 支付失败: {}", invoice.getId());

        String subscriptionId = invoice.getSubscription();
        if (subscriptionId != null) {
            try {
                Subscription stripeSubscription = Subscription.retrieve(subscriptionId);
                String tenantIdStr = stripeSubscription.getMetadata().get("tenant_id");
                if (tenantIdStr != null) {
                    Long tenantId = Long.parseLong(tenantIdStr);
                    TenantSubscription subscription = subscriptionMapper.findActiveByTenantId(tenantId);
                    if (subscription != null) {
                        // 标记订阅为 PAST_DUE
                        subscription.setStatus(TenantSubscription.SubscriptionStatus.PAST_DUE);
                        subscriptionMapper.update(subscription);
                        log.info("本地订阅已标记为 PAST_DUE - tenantId: {}", tenantId);

                        // 禁用商户账户
                        try {
                            authServiceInternalClient.deactivateTenant(tenantId);
                            log.info("租户 {} 商户账户已禁用（Stripe 支付失败）", tenantId);
                        } catch (Exception e) {
                            log.error("禁用租户 {} 失败: {}", tenantId, e.getMessage(), e);
                        }
                    }
                }
            } catch (StripeException e) {
                log.error("获取 Stripe Subscription 失败: {}", e.getMessage());
            }
        }
    }

    private void syncFromStripeSubscription(Subscription stripeSubscription) {
        String tenantIdStr = stripeSubscription.getMetadata().get("tenant_id");
        if (tenantIdStr == null) {
            log.warn("Stripe Subscription 缺少 tenant_id metadata: {}", stripeSubscription.getId());
            return;
        }

        Long tenantId = Long.parseLong(tenantIdStr);
        TenantSubscription subscription = subscriptionMapper.findActiveByTenantId(tenantId);

        if (subscription == null) {
            log.warn("找不到租户的本地订阅 - tenantId: {}", tenantId);
            return;
        }

        subscription.setStripeSubscriptionId(stripeSubscription.getId());
        subscription.setStripeCustomerId(stripeSubscription.getCustomer());

        // 更新状态 - 只在明确的状态变更时才更新
        String stripeStatus = stripeSubscription.getStatus();
        log.info("Stripe Subscription 状态: {}, 本地状态: {}", stripeStatus, subscription.getStatus());

        // 只有在明确的状态时才更新，避免覆盖已经激活的订阅
        if ("active".equals(stripeStatus)) {
            subscription.setStatus(TenantSubscription.SubscriptionStatus.ACTIVE);

            // 激活租户（更新 Tenant 表状态为 ACTIVE）
            try {
                authServiceInternalClient.activateTenant(tenantId);
                log.info("租户激活成功 - tenantId: {}", tenantId);
            } catch (Exception e) {
                log.error("租户激活失败 - tenantId: {}, error: {}", tenantId, e.getMessage());
            }
        } else if ("trialing".equals(stripeStatus)) {
            subscription.setStatus(TenantSubscription.SubscriptionStatus.TRIAL);
        } else if ("past_due".equals(stripeStatus)) {
            subscription.setStatus(TenantSubscription.SubscriptionStatus.PAST_DUE);
        } else if ("canceled".equals(stripeStatus)) {
            // 只有明确取消时才设为CANCELLED
            subscription.setStatus(TenantSubscription.SubscriptionStatus.CANCELLED);
        }
        // 注意：对于 "incomplete", "incomplete_expired", "unpaid" 等状态，保持本地状态不变

        // 更新周期日期
        Long periodStartTs = stripeSubscription.getCurrentPeriodStart();
        Long periodEndTs = stripeSubscription.getCurrentPeriodEnd();
        log.info("Stripe 周期数据 (from event) - start: {}, end: {}", periodStartTs, periodEndTs);

        // 如果 webhook 事件中没有周期数据，从 Stripe API 重新获取
        if (periodStartTs == null || periodEndTs == null) {
            log.info("周期数据为空，从 Stripe API 重新获取订阅信息...");
            try {
                Subscription freshSubscription = Subscription.retrieve(stripeSubscription.getId());
                periodStartTs = freshSubscription.getCurrentPeriodStart();
                periodEndTs = freshSubscription.getCurrentPeriodEnd();
                log.info("Stripe 周期数据 (from API) - start: {}, end: {}", periodStartTs, periodEndTs);
            } catch (StripeException e) {
                log.error("从 Stripe API 获取订阅失败: {}", e.getMessage());
            }
        }

        if (periodStartTs != null) {
            LocalDate startDate = Instant.ofEpochSecond(periodStartTs)
                    .atZone(ZoneId.systemDefault())
                    .toLocalDate();
            subscription.setCurrentPeriodStart(startDate);
            log.info("设置 currentPeriodStart: {}", startDate);
        }
        if (periodEndTs != null) {
            LocalDate endDate = Instant.ofEpochSecond(periodEndTs)
                    .atZone(ZoneId.systemDefault())
                    .toLocalDate();
            subscription.setCurrentPeriodEnd(endDate);
            log.info("设置 currentPeriodEnd: {}", endDate);
        }

        // 只有在订阅已激活（已付款）时才更新计划
        // 避免 incomplete 状态的订阅更新本地计划
        if ("active".equals(stripeStatus)) {
            String planCode = stripeSubscription.getMetadata().get("plan_code");
            if (planCode != null) {
                SubscriptionPlan plan = planMapper.findByPlanCode(planCode);
                if (plan != null) {
                    subscription.setPlanId(plan.getId());
                    log.info("更新本地订阅计划 - planCode: {}", planCode);
                }
            }

            // 更新计费周期
            String billingCycleStr = stripeSubscription.getMetadata().get("billing_cycle");
            if (billingCycleStr != null) {
                try {
                    subscription.setBillingCycle(TenantSubscription.BillingCycle.valueOf(billingCycleStr));
                    log.info("更新 billingCycle: {}", billingCycleStr);
                } catch (IllegalArgumentException e) {
                    log.warn("无效的 billing_cycle: {}", billingCycleStr);
                }
            }
        }

        subscriptionMapper.update(subscription);
        log.info("同步 Stripe Subscription 到本地成功 - tenantId: {}, status: {}",
                tenantId, subscription.getStatus());
    }

    @Override
    public void syncSubscriptionStatus(String stripeSubscriptionId) {
        log.info("同步 Stripe Subscription 状态: {}", stripeSubscriptionId);

        try {
            Subscription stripeSubscription = Subscription.retrieve(stripeSubscriptionId);
            syncFromStripeSubscription(stripeSubscription);
        } catch (StripeException e) {
            log.error("获取 Stripe Subscription 失败: {}", e.getMessage(), e);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Map<String, String> createEmbeddedSubscription(Long tenantId, String planCode,
                                                           TenantSubscription.BillingCycle billingCycle,
                                                           String customerEmail) {
        log.info("创建 Embedded Subscription - tenantId: {}, plan: {}, cycle: {}", tenantId, planCode, billingCycle);

        SubscriptionPlan plan = planMapper.findByPlanCode(planCode);
        if (plan == null) {
            throw new BusinessException("找不到订阅计划: " + planCode);
        }

        String priceId = billingCycle == TenantSubscription.BillingCycle.MONTHLY
                ? plan.getStripeMonthlyPriceId()
                : plan.getStripeYearlyPriceId();

        if (priceId == null || priceId.isEmpty()) {
            throw new BusinessException("计划 " + planCode + " 未配置 Stripe Price");
        }

        try {
            // 获取或创建 Stripe Customer
            TenantSubscription localSubscription = subscriptionMapper.findActiveByTenantId(tenantId);
            String customerId = localSubscription != null ? localSubscription.getStripeCustomerId() : null;

            // 检查是否有未完成的订阅，如果有则先取消
            if (localSubscription != null && localSubscription.getStripeSubscriptionId() != null) {
                try {
                    Subscription existingSub = Subscription.retrieve(localSubscription.getStripeSubscriptionId());
                    String existingStatus = existingSub.getStatus();
                    log.info("检查现有 Stripe Subscription: {}, 状态: {}", existingSub.getId(), existingStatus);

                    // 如果是 incomplete 或 incomplete_expired，取消它
                    if ("incomplete".equals(existingStatus) || "incomplete_expired".equals(existingStatus)) {
                        log.info("取消未完成的订阅: {}", existingSub.getId());
                        existingSub.cancel();
                        // 清除本地记录中的 stripe_subscription_id
                        localSubscription.setStripeSubscriptionId(null);
                        subscriptionMapper.update(localSubscription);
                    } else if ("active".equals(existingStatus) || "trialing".equals(existingStatus)) {
                        // 如果已有活跃订阅，应该走更新流程而不是创建新订阅
                        throw new BusinessException("已有活跃订阅，请使用升级功能");
                    }
                } catch (StripeException e) {
                    log.warn("检查/取消现有订阅失败: {}, 继续创建新订阅", e.getMessage());
                    // 如果获取失败（可能订阅已不存在），清除本地记录
                    localSubscription.setStripeSubscriptionId(null);
                    subscriptionMapper.update(localSubscription);
                }
            }

            if (customerId == null || customerId.isEmpty()) {
                // 创建新 Customer
                CustomerCreateParams customerParams = CustomerCreateParams.builder()
                        .setEmail(customerEmail)
                        .putMetadata("tenant_id", tenantId.toString())
                        .build();
                Customer customer = Customer.create(customerParams);
                customerId = customer.getId();
                log.info("创建新 Stripe Customer: {}", customerId);

                // 更新本地订阅的 customerId
                if (localSubscription != null) {
                    localSubscription.setStripeCustomerId(customerId);
                    subscriptionMapper.update(localSubscription);
                }
            }

            // 创建订阅，使用 payment_behavior=default_incomplete 使其处于等待支付状态
            SubscriptionCreateParams subscriptionParams = SubscriptionCreateParams.builder()
                    .setCustomer(customerId)
                    .addItem(SubscriptionCreateParams.Item.builder()
                            .setPrice(priceId)
                            .build())
                    .setPaymentBehavior(SubscriptionCreateParams.PaymentBehavior.DEFAULT_INCOMPLETE)
                    .addExpand("latest_invoice.payment_intent")
                    // 启用自动税费计算
                    .setAutomaticTax(SubscriptionCreateParams.AutomaticTax.builder()
                            .setEnabled(true)
                            .build())
                    .putMetadata("tenant_id", tenantId.toString())
                    .putMetadata("plan_code", planCode)
                    .putMetadata("billing_cycle", billingCycle.name())
                    .build();

            Subscription stripeSubscription = Subscription.create(subscriptionParams);
            log.info("创建 incomplete Subscription 成功: {}", stripeSubscription.getId());

            // 获取 PaymentIntent 的 clientSecret
            Invoice latestInvoice = stripeSubscription.getLatestInvoiceObject();
            if (latestInvoice == null) {
                throw new BusinessException("无法获取订阅发票信息");
            }

            PaymentIntent paymentIntent = latestInvoice.getPaymentIntentObject();
            if (paymentIntent == null) {
                throw new BusinessException("无法获取支付意向信息");
            }

            String clientSecret = paymentIntent.getClientSecret();
            log.info("获取 clientSecret 成功");

            // 只更新 Stripe 相关 ID，不更新 planId 和 billingCycle
            // planId 和 billingCycle 应该等到 webhook 确认支付成功后再更新
            if (localSubscription != null) {
                localSubscription.setStripeSubscriptionId(stripeSubscription.getId());
                // 不更新 planId 和 billingCycle，等待 invoice.paid webhook
                subscriptionMapper.update(localSubscription);
            }

            Map<String, String> result = new HashMap<>();
            result.put("clientSecret", clientSecret);
            result.put("subscriptionId", stripeSubscription.getId());
            result.put("customerId", customerId);
            return result;

        } catch (StripeException e) {
            log.error("创建 Embedded Subscription 失败: {}", e.getMessage(), e);
            throw new BusinessException("创建订阅失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> scheduleDowngrade(Long tenantId, String newPlanCode,
                                                  TenantSubscription.BillingCycle newBillingCycle) {
        log.info("安排订阅降级 (Stripe Schedule) - tenantId: {}, newPlan: {}, newCycle: {}", tenantId, newPlanCode, newBillingCycle);

        TenantSubscription subscription = subscriptionMapper.findActiveByTenantId(tenantId);
        if (subscription == null) {
            throw new BusinessException("找不到活跃的订阅");
        }

        if (subscription.getStripeSubscriptionId() == null || subscription.getStripeSubscriptionId().isEmpty()) {
            throw new BusinessException("订阅没有关联的 Stripe 订阅");
        }

        SubscriptionPlan newPlan = planMapper.findByPlanCode(newPlanCode);
        if (newPlan == null) {
            throw new BusinessException("找不到订阅计划: " + newPlanCode);
        }

        // 验证是否允许安排变更（降级或年付→月付）
        SubscriptionPlan currentPlan = planMapper.findById(subscription.getPlanId());
        boolean isPlanDowngrade = currentPlan != null && newPlan.getMonthlyPrice().compareTo(currentPlan.getMonthlyPrice()) < 0;
        boolean isBillingCycleDowngrade = currentPlan != null && newPlan.getId().equals(currentPlan.getId())
                && subscription.getBillingCycle() == TenantSubscription.BillingCycle.YEARLY
                && newBillingCycle == TenantSubscription.BillingCycle.MONTHLY;
        // 年付→月付（任何计划）：年付用户有剩余周期，需要安排到周期结束后生效
        boolean isYearlyToMonthlyChange = subscription.getBillingCycle() == TenantSubscription.BillingCycle.YEARLY
                && newBillingCycle == TenantSubscription.BillingCycle.MONTHLY;

        if (!isPlanDowngrade && !isBillingCycleDowngrade && !isYearlyToMonthlyChange) {
            throw new BusinessException("这不是降级操作，请使用升级功能");
        }

        String newPriceId = newBillingCycle == TenantSubscription.BillingCycle.MONTHLY
                ? newPlan.getStripeMonthlyPriceId()
                : newPlan.getStripeYearlyPriceId();

        try {
            // 获取当前 Stripe 订阅
            Subscription stripeSubscription = Subscription.retrieve(subscription.getStripeSubscriptionId());

            // 检查是否已有 Schedule
            if (stripeSubscription.getSchedule() != null) {
                // 已有 Schedule，先取消
                com.stripe.model.SubscriptionSchedule existingSchedule =
                        com.stripe.model.SubscriptionSchedule.retrieve(stripeSubscription.getSchedule());
                existingSchedule.release();
                log.info("已取消现有的 Subscription Schedule: {}", stripeSubscription.getSchedule());
            }

            // 创建新的 Subscription Schedule（从现有订阅创建时不能设置 end_behavior）
            com.stripe.param.SubscriptionScheduleCreateParams scheduleParams =
                    com.stripe.param.SubscriptionScheduleCreateParams.builder()
                            .setFromSubscription(subscription.getStripeSubscriptionId())
                            .build();

            com.stripe.model.SubscriptionSchedule schedule =
                    com.stripe.model.SubscriptionSchedule.create(scheduleParams);
            log.info("创建 Subscription Schedule: {}", schedule.getId());

            // 更新 Schedule，设置下个周期的价格
            // 第一阶段保持当前价格，第二阶段切换到新价格
            String currentPriceId = stripeSubscription.getItems().getData().get(0).getPrice().getId();
            Long currentPeriodStart = stripeSubscription.getCurrentPeriodStart();
            Long currentPeriodEnd = stripeSubscription.getCurrentPeriodEnd();

            com.stripe.param.SubscriptionScheduleUpdateParams updateParams =
                    com.stripe.param.SubscriptionScheduleUpdateParams.builder()
                            .setEndBehavior(com.stripe.param.SubscriptionScheduleUpdateParams.EndBehavior.RELEASE)
                            .addPhase(com.stripe.param.SubscriptionScheduleUpdateParams.Phase.builder()
                                    .addItem(com.stripe.param.SubscriptionScheduleUpdateParams.Phase.Item.builder()
                                            .setPrice(currentPriceId)
                                            .build())
                                    .setStartDate(currentPeriodStart)
                                    .setEndDate(currentPeriodEnd)
                                    .build())
                            .addPhase(com.stripe.param.SubscriptionScheduleUpdateParams.Phase.builder()
                                    .addItem(com.stripe.param.SubscriptionScheduleUpdateParams.Phase.Item.builder()
                                            .setPrice(newPriceId)
                                            .build())
                                    .setIterations(1L)
                                    .build())
                            .build();

            schedule = schedule.update(updateParams);
            log.info("更新 Subscription Schedule 成功，将于周期结束时切换到新价格");

            // 计算生效日期
            LocalDate effectiveDate = Instant.ofEpochSecond(currentPeriodEnd)
                    .atZone(ZoneId.systemDefault())
                    .toLocalDate();

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("scheduleId", schedule.getId());
            result.put("pendingPlanCode", newPlan.getPlanCode());
            result.put("pendingPlanNameEn", newPlan.getPlanNameEn());
            result.put("pendingPlanNameZh", newPlan.getPlanNameZh());
            result.put("pendingBillingCycle", newBillingCycle.name());
            result.put("effectiveDate", effectiveDate.toString());
            return result;

        } catch (StripeException e) {
            log.error("创建 Stripe Subscription Schedule 失败: {}", e.getMessage(), e);
            throw new BusinessException("安排降级失败: " + e.getMessage());
        }
    }

    @Override
    public void cancelScheduledDowngrade(Long tenantId) {
        log.info("取消已安排的降级 (Stripe Schedule) - tenantId: {}", tenantId);

        TenantSubscription subscription = subscriptionMapper.findActiveByTenantId(tenantId);
        if (subscription == null) {
            throw new BusinessException("找不到活跃的订阅");
        }

        if (subscription.getStripeSubscriptionId() == null || subscription.getStripeSubscriptionId().isEmpty()) {
            log.info("订阅没有关联的 Stripe 订阅");
            return;
        }

        try {
            Subscription stripeSubscription = Subscription.retrieve(subscription.getStripeSubscriptionId());

            if (stripeSubscription.getSchedule() == null) {
                log.info("没有待生效的 Stripe Schedule");
                return;
            }

            // 取消 Schedule（释放回普通订阅）
            com.stripe.model.SubscriptionSchedule schedule =
                    com.stripe.model.SubscriptionSchedule.retrieve(stripeSubscription.getSchedule());
            schedule.release();
            log.info("已取消 Stripe Subscription Schedule: {}", stripeSubscription.getSchedule());

        } catch (StripeException e) {
            log.error("取消 Stripe Subscription Schedule 失败: {}", e.getMessage(), e);
            throw new BusinessException("取消降级安排失败: " + e.getMessage());
        }
    }

    @Override
    public Map<String, Object> getScheduledChanges(Long tenantId) {
        log.info("获取计划的变更信息 - tenantId: {}", tenantId);

        TenantSubscription subscription = subscriptionMapper.findActiveByTenantId(tenantId);
        if (subscription == null || subscription.getStripeSubscriptionId() == null) {
            return null;
        }

        try {
            Subscription stripeSubscription = Subscription.retrieve(subscription.getStripeSubscriptionId());

            if (stripeSubscription.getSchedule() == null) {
                return null;
            }

            com.stripe.model.SubscriptionSchedule schedule =
                    com.stripe.model.SubscriptionSchedule.retrieve(stripeSubscription.getSchedule());

            // 获取下一阶段的信息
            List<com.stripe.model.SubscriptionSchedule.Phase> phases = schedule.getPhases();
            if (phases.size() < 2) {
                return null;
            }

            com.stripe.model.SubscriptionSchedule.Phase nextPhase = phases.get(1);
            String nextPriceId = nextPhase.getItems().get(0).getPrice();
            Long effectiveTimestamp = nextPhase.getStartDate();

            // 从价格ID找到对应的计划
            Price nextPrice = Price.retrieve(nextPriceId);
            String planCode = nextPrice.getMetadata().get("plan_code");
            String billingCycle = nextPrice.getMetadata().get("billing_cycle");

            SubscriptionPlan plan = planMapper.findByPlanCode(planCode);

            LocalDate effectiveDate = Instant.ofEpochSecond(effectiveTimestamp)
                    .atZone(ZoneId.systemDefault())
                    .toLocalDate();

            Map<String, Object> result = new HashMap<>();
            result.put("scheduleId", schedule.getId());
            result.put("pendingPlanCode", planCode);
            result.put("pendingBillingCycle", billingCycle);
            result.put("effectiveDate", effectiveDate.toString());
            if (plan != null) {
                result.put("pendingPlanNameEn", plan.getPlanNameEn());
                result.put("pendingPlanNameZh", plan.getPlanNameZh());
            }
            return result;

        } catch (StripeException e) {
            log.error("获取 Stripe Subscription Schedule 失败: {}", e.getMessage(), e);
            return null;
        }
    }

    @Override
    public Map<String, Object> getCancellationStatus(Long tenantId) {
        log.info("获取订阅取消状态 - tenantId: {}", tenantId);

        TenantSubscription subscription = subscriptionMapper.findActiveByTenantId(tenantId);
        if (subscription == null || subscription.getStripeSubscriptionId() == null) {
            return null;
        }

        try {
            Subscription stripeSubscription = Subscription.retrieve(subscription.getStripeSubscriptionId());

            Boolean cancelAtPeriodEnd = stripeSubscription.getCancelAtPeriodEnd();
            Long cancelAt = stripeSubscription.getCancelAt();

            // 如果没有设置取消，返回 null
            if (cancelAtPeriodEnd == null || !cancelAtPeriodEnd) {
                return null;
            }

            Map<String, Object> result = new HashMap<>();
            result.put("cancelAtPeriodEnd", cancelAtPeriodEnd);

            if (cancelAt != null) {
                LocalDate cancelDate = Instant.ofEpochSecond(cancelAt)
                        .atZone(ZoneId.systemDefault())
                        .toLocalDate();
                result.put("cancelAt", cancelDate.toString());
            } else {
                // 如果 cancelAt 为空，使用当前周期结束日期
                Long periodEnd = stripeSubscription.getCurrentPeriodEnd();
                if (periodEnd != null) {
                    LocalDate cancelDate = Instant.ofEpochSecond(periodEnd)
                            .atZone(ZoneId.systemDefault())
                            .toLocalDate();
                    result.put("cancelAt", cancelDate.toString());
                }
            }

            log.info("订阅取消状态 - tenantId: {}, cancelAtPeriodEnd: {}, cancelAt: {}",
                    tenantId, cancelAtPeriodEnd, result.get("cancelAt"));

            return result;

        } catch (StripeException e) {
            log.error("获取 Stripe Subscription 取消状态失败: {}", e.getMessage(), e);
            return null;
        }
    }
}
