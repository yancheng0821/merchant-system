package com.merchant.server.merchantservice.controller;

import com.merchant.server.merchantservice.service.SubscriptionPaymentService;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Stripe Webhook控制器
 * 接收Stripe支付事件回调
 */
@Slf4j
@RestController
@RequestMapping("/api/merchant/webhooks/stripe")
@RequiredArgsConstructor
public class StripeWebhookController {

    private final SubscriptionPaymentService paymentService;

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
                case "payment_intent.succeeded":
                    handlePaymentIntentSucceeded(event);
                    break;

                case "payment_intent.payment_failed":
                    handlePaymentIntentFailed(event);
                    break;

                case "payment_intent.canceled":
                    handlePaymentIntentCanceled(event);
                    break;

                case "charge.refunded":
                    handleChargeRefunded(event);
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

    /**
     * 处理支付成功事件
     */
    private void handlePaymentIntentSucceeded(Event event) {
        log.info("处理支付成功事件");

        try {
            // 直接从event的data中获取PaymentIntent对象
            PaymentIntent paymentIntent = (PaymentIntent) event.getData().getObject();

            log.info("Payment Intent成功 - ID: {}, 金额: {}, 状态: {}",
                    paymentIntent.getId(),
                    paymentIntent.getAmount(),
                    paymentIntent.getStatus());

            try {
                paymentService.handlePaymentSuccess(paymentIntent.getId());
                log.info("支付成功处理完成 - Payment Intent ID: {}", paymentIntent.getId());
            } catch (Exception e) {
                log.error("处理支付成功回调失败: {}", e.getMessage(), e);
            }
        } catch (Exception e) {
            log.error("无法获取PaymentIntent对象: {}", e.getMessage(), e);
        }
    }

    /**
     * 处理支付失败事件
     */
    private void handlePaymentIntentFailed(Event event) {
        log.warn("处理支付失败事件");

        try {
            // 直接从event的data中获取PaymentIntent对象
            PaymentIntent paymentIntent = (PaymentIntent) event.getData().getObject();

            String failureMessage = paymentIntent.getLastPaymentError() != null ?
                    paymentIntent.getLastPaymentError().getMessage() : "Unknown error";

            log.warn("Payment Intent失败 - ID: {}, 原因: {}",
                    paymentIntent.getId(), failureMessage);

            try {
                paymentService.handlePaymentFailure(paymentIntent.getId(), failureMessage);
                log.info("支付失败处理完成 - Payment Intent ID: {}", paymentIntent.getId());
            } catch (Exception e) {
                log.error("处理支付失败回调失败: {}", e.getMessage(), e);
            }
        } catch (Exception e) {
            log.error("无法获取PaymentIntent对象: {}", e.getMessage(), e);
        }
    }

    /**
     * 处理支付取消事件
     */
    private void handlePaymentIntentCanceled(Event event) {
        log.info("处理支付取消事件");

        try {
            // 直接从event的data中获取PaymentIntent对象
            PaymentIntent paymentIntent = (PaymentIntent) event.getData().getObject();
            log.info("Payment Intent已取消 - ID: {}", paymentIntent.getId());

            // 可以在这里添加取消后的处理逻辑
            // 例如：通知用户、更新账单备注等
        } catch (Exception e) {
            log.error("无法获取PaymentIntent对象: {}", e.getMessage(), e);
        }
    }

    /**
     * 处理退款事件
     */
    private void handleChargeRefunded(Event event) {
        log.info("处理退款事件");

        // 这里可以添加退款的处理逻辑
        // 例如：更新账单状态为REFUNDED
        log.info("退款事件处理（待实现）");
    }
}
