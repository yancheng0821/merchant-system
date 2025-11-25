package com.merchant.server.merchantservice.service.impl;

import com.merchant.server.common.exception.BusinessException;
import com.merchant.server.merchantservice.client.AuthServiceClient;
import com.merchant.server.merchantservice.entity.Invoice;
import com.merchant.server.merchantservice.entity.TenantSubscription;
import com.merchant.server.merchantservice.service.InvoiceService;
import com.merchant.server.merchantservice.service.SubscriptionPaymentService;
import com.merchant.server.merchantservice.service.TenantSubscriptionService;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.model.PaymentMethod;
import com.stripe.param.PaymentIntentCancelParams;
import com.stripe.param.PaymentIntentCreateParams;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 订阅支付服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SubscriptionPaymentServiceImpl implements SubscriptionPaymentService {

    private final InvoiceService invoiceService;
    private final TenantSubscriptionService subscriptionService;
    private final AuthServiceClient authServiceClient;

    @Value("${stripe.api.key:}")
    private String stripeSecretKey;

    @Value("${stripe.publishable.key:}")
    private String stripePublishableKey;

    @PostConstruct
    public void init() {
        if (stripeSecretKey != null && !stripeSecretKey.isEmpty()) {
            Stripe.apiKey = stripeSecretKey;
            log.info("Stripe Payment Service initialized");
        } else {
            log.warn("Stripe API key not configured");
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public String createPaymentIntent(Long invoiceId) {
        log.info("创建Payment Intent - 账单ID: {}", invoiceId);

        // 查询账单
        Invoice invoice = invoiceService.getInvoiceById(invoiceId);
        if (invoice == null) {
            throw new BusinessException("账单不存在");
        }

        // 检查账单状态
        if (invoice.getStatus() != Invoice.InvoiceStatus.PENDING) {
            throw new BusinessException("账单状态不是待支付，无法创建支付");
        }

        // 如果已经有Payment Intent，先取消
        if (invoice.getStripePaymentIntentId() != null && !invoice.getStripePaymentIntentId().isEmpty()) {
            try {
                PaymentIntent existingPI = PaymentIntent.retrieve(invoice.getStripePaymentIntentId());
                if ("requires_payment_method".equals(existingPI.getStatus()) ||
                    "requires_confirmation".equals(existingPI.getStatus()) ||
                    "requires_action".equals(existingPI.getStatus())) {
                    log.info("账单已存在Payment Intent: {}, 状态: {}", existingPI.getId(), existingPI.getStatus());
                    return existingPI.getClientSecret();
                }
            } catch (StripeException e) {
                log.warn("查询现有Payment Intent失败: {}", e.getMessage());
            }
        }

        try {
            // 创建Payment Intent（金额需要转换为cents/分）
            Long amountInCents = invoice.getAmount().multiply(new java.math.BigDecimal("100")).longValue();

            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(amountInCents)
                    .setCurrency(invoice.getCurrency().toLowerCase())
                    .setDescription(String.format("Invoice %s - %s", invoice.getInvoiceNumber(), invoice.getDescription()))
                    .putMetadata("invoice_id", invoice.getId().toString())
                    .putMetadata("invoice_number", invoice.getInvoiceNumber())
                    .putMetadata("tenant_id", invoice.getTenantId().toString())
                    .putMetadata("subscription_id", invoice.getSubscriptionId() != null ? invoice.getSubscriptionId().toString() : "")
                    // 自动支付方式（支持信用卡）
                    .addPaymentMethodType("card")
                    .build();

            PaymentIntent paymentIntent = PaymentIntent.create(params);

            log.info("Payment Intent创建成功 - ID: {}, ClientSecret: {}",
                    paymentIntent.getId(), paymentIntent.getClientSecret());

            // 更新账单，保存Payment Intent ID
            invoice.setStripePaymentIntentId(paymentIntent.getId());
            invoiceService.updateInvoice(invoice);

            return paymentIntent.getClientSecret();

        } catch (StripeException e) {
            log.error("创建Payment Intent失败: {}", e.getMessage(), e);
            throw new BusinessException("创建支付失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Invoice handlePaymentSuccess(String paymentIntentId) {
        log.info("处理支付成功回调 - Payment Intent ID: {}", paymentIntentId);

        try {
            // 查询Payment Intent获取metadata
            PaymentIntent paymentIntent = PaymentIntent.retrieve(paymentIntentId);

            String invoiceIdStr = paymentIntent.getMetadata().get("invoice_id");
            if (invoiceIdStr == null || invoiceIdStr.isEmpty()) {
                log.error("Payment Intent metadata中缺少invoice_id");
                throw new BusinessException("支付信息不完整");
            }

            Long invoiceId = Long.parseLong(invoiceIdStr);
            Invoice invoice = invoiceService.getInvoiceById(invoiceId);

            if (invoice == null) {
                throw new BusinessException("账单不存在");
            }

            // 检查是否已经标记为已支付（幂等性）
            if (invoice.getStatus() == Invoice.InvoiceStatus.PAID) {
                log.info("账单已经标记为已支付，跳过处理 - 账单ID: {}", invoiceId);
                return invoice;
            }

            // 更新账单状态
            invoice.setStatus(Invoice.InvoiceStatus.PAID);
            invoice.setPaymentDate(LocalDateTime.now());

            // 获取支付方式的友好显示名称
            String paymentMethodDisplay = getPaymentMethodDisplay(paymentIntent);
            invoice.setPaymentMethod(paymentMethodDisplay);
            invoice.setStripePaymentIntentId(paymentIntentId);

            Invoice updatedInvoice = invoiceService.updateInvoice(invoice);
            log.info("账单支付成功 - 账单号: {}, 金额: {} {}",
                    invoice.getInvoiceNumber(), invoice.getAmount(), invoice.getCurrency());

            // 如果订阅是PAST_DUE状态，检查是否所有账单都已支付，如果是则恢复为ACTIVE
            if (invoice.getSubscriptionId() != null) {
                TenantSubscription subscription = subscriptionService.getSubscriptionById(invoice.getSubscriptionId());
                if (subscription != null && subscription.getStatus() == TenantSubscription.SubscriptionStatus.PAST_DUE) {
                    // 检查是否还有未支付的账单
                    boolean hasUnpaidInvoice = invoiceService.getInvoicesBySubscriptionId(invoice.getSubscriptionId())
                            .stream()
                            .anyMatch(inv -> inv.getStatus() == Invoice.InvoiceStatus.PENDING);

                    if (!hasUnpaidInvoice) {
                        // 所有账单都已支付，恢复订阅为ACTIVE
                        subscription.setStatus(TenantSubscription.SubscriptionStatus.ACTIVE);
                        subscriptionService.updateSubscription(subscription);

                        // 重新激活商户访问
                        try {
                            authServiceClient.activateTenant(subscription.getTenantId());
                            log.info("订阅恢复为ACTIVE，商户访问已重新激活 - 租户ID: {}", subscription.getTenantId());
                        } catch (Exception e) {
                            log.error("重新激活商户访问失败 - 租户ID: {}", subscription.getTenantId(), e);
                        }
                    }
                }
            }

            return updatedInvoice;

        } catch (StripeException e) {
            log.error("查询Payment Intent失败: {}", e.getMessage(), e);
            throw new BusinessException("处理支付回调失败: " + e.getMessage());
        }
    }

    @Override
    public void handlePaymentFailure(String paymentIntentId, String failureReason) {
        log.warn("处理支付失败回调 - Payment Intent ID: {}, 原因: {}", paymentIntentId, failureReason);

        try {
            PaymentIntent paymentIntent = PaymentIntent.retrieve(paymentIntentId);
            String invoiceIdStr = paymentIntent.getMetadata().get("invoice_id");

            if (invoiceIdStr != null && !invoiceIdStr.isEmpty()) {
                Long invoiceId = Long.parseLong(invoiceIdStr);
                Invoice invoice = invoiceService.getInvoiceById(invoiceId);

                if (invoice != null) {
                    // 可以选择在notes中记录失败原因
                    String notes = invoice.getNotes() != null ? invoice.getNotes() : "";
                    notes += String.format("\n[%s] 支付失败: %s", LocalDateTime.now(), failureReason);
                    invoice.setNotes(notes);
                    invoiceService.updateInvoice(invoice);

                    log.info("账单支付失败已记录 - 账单号: {}", invoice.getInvoiceNumber());
                }
            }
        } catch (Exception e) {
            log.error("处理支付失败回调出错: {}", e.getMessage(), e);
        }
    }

    @Override
    public Map<String, String> getPaymentConfig() {
        Map<String, String> config = new HashMap<>();
        config.put("publishableKey", stripePublishableKey);
        return config;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void cancelPaymentIntent(Long invoiceId) {
        log.info("取消Payment Intent - 账单ID: {}", invoiceId);

        Invoice invoice = invoiceService.getInvoiceById(invoiceId);
        if (invoice == null) {
            throw new BusinessException("账单不存在");
        }

        if (invoice.getStripePaymentIntentId() == null || invoice.getStripePaymentIntentId().isEmpty()) {
            log.info("账单没有关联的Payment Intent，无需取消");
            return;
        }

        try {
            PaymentIntent paymentIntent = PaymentIntent.retrieve(invoice.getStripePaymentIntentId());

            // 只有特定状态的Payment Intent可以取消
            if ("requires_payment_method".equals(paymentIntent.getStatus()) ||
                "requires_confirmation".equals(paymentIntent.getStatus()) ||
                "requires_action".equals(paymentIntent.getStatus())) {

                PaymentIntentCancelParams params = PaymentIntentCancelParams.builder().build();
                paymentIntent.cancel(params);

                log.info("Payment Intent已取消 - ID: {}", paymentIntent.getId());
            } else {
                log.info("Payment Intent状态为 {}, 无法取消", paymentIntent.getStatus());
            }
        } catch (StripeException e) {
            log.error("取消Payment Intent失败: {}", e.getMessage(), e);
            throw new BusinessException("取消支付失败: " + e.getMessage());
        }
    }

    /**
     * 获取支付方式的友好显示名称
     * 例如: "Stripe (Visa •••• 4242)"
     */
    private String getPaymentMethodDisplay(PaymentIntent paymentIntent) {
        try {
            String paymentMethodId = paymentIntent.getPaymentMethod();
            if (paymentMethodId == null || paymentMethodId.isEmpty()) {
                return "Stripe";
            }

            // 查询PaymentMethod详细信息
            PaymentMethod paymentMethod = PaymentMethod.retrieve(paymentMethodId);

            if (paymentMethod.getCard() != null) {
                // 获取卡片信息
                String brand = paymentMethod.getCard().getBrand(); // visa, mastercard, amex等
                String last4 = paymentMethod.getCard().getLast4(); // 后4位

                // 首字母大写
                String brandDisplay = brand.substring(0, 1).toUpperCase() + brand.substring(1);

                return String.format("Stripe (%s •••• %s)", brandDisplay, last4);
            }

            // 其他支付方式类型
            return "Stripe (" + paymentMethod.getType() + ")";

        } catch (Exception e) {
            log.warn("获取支付方式详情失败，使用默认显示: {}", e.getMessage());
            return "Stripe";
        }
    }
}
