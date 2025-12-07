package com.merchant.server.merchantservice.controller;

import com.merchant.server.merchantservice.service.StripeSubscriptionService;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.net.Webhook;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Stripe Webhook控制器
 * 接收Stripe支付事件回调（订阅事件）
 */
@Slf4j
@RestController
@RequestMapping("/api/merchant/webhooks/stripe")
@RequiredArgsConstructor
public class StripeWebhookController {

    private final StripeSubscriptionService stripeSubscriptionService;

    @Value("${stripe.webhook.secret:}")
    private String webhookSecret;

    /**
     * 处理Stripe Webhook回调
     */
    @PostMapping
    public ResponseEntity<String> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {

        log.info("收到Stripe Webhook回调");

        // 验证webhook签名
        Event event;
        try {
            if (webhookSecret != null && !webhookSecret.isEmpty()) {
                event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
            } else {
                // 开发环境可能没有配置webhook secret，直接解析event
                log.warn("未配置Webhook Secret，跳过签名验证（仅用于开发环境）");
                event = Event.GSON.fromJson(payload, Event.class);
            }
        } catch (SignatureVerificationException e) {
            log.error("Webhook签名验证失败: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid signature");
        } catch (Exception e) {
            log.error("解析Webhook payload失败: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid payload");
        }

        // 处理事件
        String eventType = event.getType();
        log.info("处理Stripe事件: {}", eventType);

        try {
            switch (eventType) {
                // ========== 订阅相关事件 ==========
                case "checkout.session.completed":
                case "customer.subscription.created":
                case "customer.subscription.updated":
                case "customer.subscription.deleted":
                case "invoice.paid":
                case "invoice.payment_failed":
                    // 委托给 StripeSubscriptionService 处理
                    stripeSubscriptionService.handleWebhookEvent(payload, sigHeader);
                    break;

                case "payment_intent.succeeded":
                case "payment_intent.payment_failed":
                case "payment_intent.canceled":
                case "charge.refunded":
                    // 订阅模式下这些事件由 invoice 事件处理，这里只记录日志
                    log.info("收到支付事件: {} (由订阅自动处理)", eventType);
                    break;

                default:
                    log.info("未处理的事件类型: {}", eventType);
                    break;
            }

            return ResponseEntity.ok("Event processed");

        } catch (Exception e) {
            log.error("处理Webhook事件失败: {}", e.getMessage(), e);
            // 返回200以避免Stripe重试，但记录错误
            return ResponseEntity.ok("Event logged with error");
        }
    }
}
