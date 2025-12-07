package com.merchant.server.merchantservice.controller;

import com.merchant.server.common.dto.ApiResponse;
import com.merchant.server.merchantservice.entity.TenantSubscription;
import com.merchant.server.merchantservice.service.StripeSubscriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Stripe 订阅控制器
 * 管理 Stripe 自动订阅支付
 */
@Slf4j
@RestController
@RequestMapping("/api/merchant/stripe/subscription")
@RequiredArgsConstructor
public class StripeSubscriptionController {

    private final StripeSubscriptionService stripeSubscriptionService;

    /**
     * 创建 Hosted Checkout Session 用于订阅支付
     * 前端收到 url 后直接跳转到 Stripe 托管页面
     */
    @PostMapping("/checkout-session")
    public ResponseEntity<ApiResponse<Map<String, String>>> createCheckoutSession(
            @RequestParam Long tenantId,
            @RequestParam String planCode,
            @RequestParam TenantSubscription.BillingCycle billingCycle,
            @RequestParam String successUrl,
            @RequestParam(required = false) String cancelUrl,
            @RequestParam(required = false) String customerEmail) {

        log.info("创建 Stripe Hosted Checkout Session - 租户ID: {}, 计划: {}, 周期: {}",
                tenantId, planCode, billingCycle);

        try {
            String checkoutUrl = stripeSubscriptionService.createCheckoutSession(
                    tenantId, planCode, billingCycle, successUrl, cancelUrl, customerEmail);

            return ResponseEntity.ok(ApiResponse.success(Map.of(
                    "url", checkoutUrl
            )));
        } catch (Exception e) {
            log.error("创建 Checkout Session 失败 - 租户ID: {}", tenantId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("创建支付会话失败: " + e.getMessage()));
        }
    }

    /**
     * 创建 Customer Portal Session
     * 用户可以在Portal中管理支付方式、查看账单历史、取消订阅等
     */
    @PostMapping("/customer-portal")
    public ResponseEntity<ApiResponse<Map<String, String>>> createCustomerPortal(
            @RequestParam Long tenantId,
            @RequestParam String returnUrl) {

        log.info("创建 Customer Portal Session - 租户ID: {}", tenantId);

        try {
            String portalUrl = stripeSubscriptionService.createCustomerPortalSession(tenantId, returnUrl);

            return ResponseEntity.ok(ApiResponse.success(Map.of(
                    "portalUrl", portalUrl
            )));
        } catch (Exception e) {
            log.error("创建 Customer Portal 失败 - 租户ID: {}", tenantId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("创建账单管理页面失败: " + e.getMessage()));
        }
    }

    /**
     * 预览订阅升级/降级的费用（不实际扣款）
     * 用于显示确认对话框
     */
    @GetMapping("/preview-update")
    public ResponseEntity<ApiResponse<Map<String, Object>>> previewSubscriptionUpdate(
            @RequestParam String stripeSubscriptionId,
            @RequestParam String newPlanCode,
            @RequestParam TenantSubscription.BillingCycle newBillingCycle) {

        log.info("预览订阅更新 - 订阅ID: {}, 新计划: {}, 新周期: {}",
                stripeSubscriptionId, newPlanCode, newBillingCycle);

        try {
            Map<String, Object> result = stripeSubscriptionService.previewSubscriptionUpdate(
                    stripeSubscriptionId, newPlanCode, newBillingCycle);

            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (Exception e) {
            log.error("预览订阅更新失败 - 订阅ID: {}", stripeSubscriptionId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("预览升级费用失败: " + e.getMessage()));
        }
    }

    /**
     * 更新订阅（升级/降级）
     * prorationBehavior:
     *   - create_prorations: 按比例计费，升级立即生效
     *   - none: 不按比例计费，降级在下个周期生效
     *   - always_invoice: 总是立即开发票
     */
    @PutMapping("/update")
    public ResponseEntity<ApiResponse<Boolean>> updateSubscription(
            @RequestParam String stripeSubscriptionId,
            @RequestParam String newPlanCode,
            @RequestParam TenantSubscription.BillingCycle newBillingCycle,
            @RequestParam(defaultValue = "create_prorations") String prorationBehavior) {

        log.info("更新 Stripe 订阅 - 订阅ID: {}, 新计划: {}, 新周期: {}, 按比例计费: {}",
                stripeSubscriptionId, newPlanCode, newBillingCycle, prorationBehavior);

        try {
            stripeSubscriptionService.updateSubscription(
                    stripeSubscriptionId, newPlanCode, newBillingCycle, prorationBehavior);

            return ResponseEntity.ok(ApiResponse.success(true));
        } catch (Exception e) {
            log.error("更新订阅失败 - 订阅ID: {}", stripeSubscriptionId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("更新订阅失败: " + e.getMessage()));
        }
    }

    /**
     * 取消订阅
     * cancelAtPeriodEnd: true=在当前周期结束时取消，false=立即取消
     */
    @PutMapping("/cancel")
    public ResponseEntity<ApiResponse<Boolean>> cancelSubscription(
            @RequestParam String stripeSubscriptionId,
            @RequestParam(defaultValue = "true") boolean cancelAtPeriodEnd) {

        log.info("取消 Stripe 订阅 - 订阅ID: {}, 周期结束时取消: {}",
                stripeSubscriptionId, cancelAtPeriodEnd);

        try {
            stripeSubscriptionService.cancelSubscription(stripeSubscriptionId, cancelAtPeriodEnd);

            return ResponseEntity.ok(ApiResponse.success(true));
        } catch (Exception e) {
            log.error("取消订阅失败 - 订阅ID: {}", stripeSubscriptionId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("取消订阅失败: " + e.getMessage()));
        }
    }

    /**
     * 恢复已计划取消的订阅
     * 仅在 cancelAtPeriodEnd=true 且周期未结束时可用
     */
    @PutMapping("/resume")
    public ResponseEntity<ApiResponse<Boolean>> resumeSubscription(
            @RequestParam String stripeSubscriptionId) {

        log.info("恢复 Stripe 订阅 - 订阅ID: {}", stripeSubscriptionId);

        try {
            stripeSubscriptionService.resumeSubscription(stripeSubscriptionId);

            return ResponseEntity.ok(ApiResponse.success(true));
        } catch (Exception e) {
            log.error("恢复订阅失败 - 订阅ID: {}", stripeSubscriptionId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("恢复订阅失败: " + e.getMessage()));
        }
    }

    /**
     * 同步 Stripe 订阅状态到本地数据库
     */
    @PostMapping("/sync")
    public ResponseEntity<ApiResponse<Boolean>> syncSubscriptionStatus(
            @RequestParam String stripeSubscriptionId) {

        log.info("同步订阅状态 - 订阅ID: {}", stripeSubscriptionId);

        try {
            stripeSubscriptionService.syncSubscriptionStatus(stripeSubscriptionId);

            return ResponseEntity.ok(ApiResponse.success(true));
        } catch (Exception e) {
            log.error("同步订阅状态失败 - 订阅ID: {}", stripeSubscriptionId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("同步订阅状态失败: " + e.getMessage()));
        }
    }

    /**
     * 初始化 Stripe Products 和 Prices
     * 管理员接口：将本地订阅计划同步到 Stripe
     */
    @PostMapping("/admin/init-products")
    public ResponseEntity<ApiResponse<Boolean>> initializeStripeProducts() {
        log.info("初始化 Stripe Products 和 Prices");

        try {
            stripeSubscriptionService.initializeStripeProducts();

            return ResponseEntity.ok(ApiResponse.success(true));
        } catch (Exception e) {
            log.error("初始化 Stripe Products 失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("初始化失败: " + e.getMessage()));
        }
    }

    /**
     * 创建 Embedded Subscription（用于 Stripe Elements 嵌入式支付）
     * 返回 clientSecret 供前端使用
     */
    @PostMapping("/embedded")
    public ResponseEntity<ApiResponse<Map<String, String>>> createEmbeddedSubscription(
            @RequestParam Long tenantId,
            @RequestParam String planCode,
            @RequestParam TenantSubscription.BillingCycle billingCycle,
            @RequestParam String customerEmail) {

        log.info("创建 Embedded Subscription - 租户ID: {}, 计划: {}, 周期: {}",
                tenantId, planCode, billingCycle);

        try {
            Map<String, String> result = stripeSubscriptionService.createEmbeddedSubscription(
                    tenantId, planCode, billingCycle, customerEmail);

            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (Exception e) {
            log.error("创建 Embedded Subscription 失败 - 租户ID: {}", tenantId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("创建订阅失败: " + e.getMessage()));
        }
    }

    /**
     * 安排订阅降级（不立即生效，下个计费周期开始时生效）
     * 使用 Stripe Subscription Schedules 自动管理计划变更
     */
    @PostMapping("/schedule-downgrade")
    public ResponseEntity<ApiResponse<Map<String, Object>>> scheduleDowngrade(
            @RequestParam Long tenantId,
            @RequestParam String newPlanCode,
            @RequestParam TenantSubscription.BillingCycle newBillingCycle) {

        log.info("安排订阅降级 - 租户ID: {}, 新计划: {}, 周期: {}",
                tenantId, newPlanCode, newBillingCycle);

        try {
            Map<String, Object> result = stripeSubscriptionService.scheduleDowngrade(
                    tenantId, newPlanCode, newBillingCycle);

            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (Exception e) {
            log.error("安排降级失败 - 租户ID: {}", tenantId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("安排降级失败: " + e.getMessage()));
        }
    }

    /**
     * 取消已安排的降级（释放 Stripe Subscription Schedule）
     */
    @DeleteMapping("/schedule-downgrade")
    public ResponseEntity<ApiResponse<Boolean>> cancelScheduledDowngrade(
            @RequestParam Long tenantId) {

        log.info("取消已安排的降级 - 租户ID: {}", tenantId);

        try {
            stripeSubscriptionService.cancelScheduledDowngrade(tenantId);
            return ResponseEntity.ok(ApiResponse.success(true));
        } catch (Exception e) {
            log.error("取消降级失败 - 租户ID: {}", tenantId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("取消降级失败: " + e.getMessage()));
        }
    }

    /**
     * 获取已安排的计划变更信息（从 Stripe Subscription Schedule 读取）
     * 如果没有已安排的变更，返回 null
     */
    @GetMapping("/scheduled-changes")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getScheduledChanges(
            @RequestParam Long tenantId) {

        log.info("获取已安排的计划变更 - 租户ID: {}", tenantId);

        try {
            Map<String, Object> result = stripeSubscriptionService.getScheduledChanges(tenantId);
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (Exception e) {
            log.error("获取计划变更失败 - 租户ID: {}", tenantId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("获取计划变更失败: " + e.getMessage()));
        }
    }

    /**
     * 获取订阅取消状态
     * 用于显示 "将于 xxx 取消" 的提示
     */
    @GetMapping("/cancellation-status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCancellationStatus(
            @RequestParam Long tenantId) {

        log.info("获取订阅取消状态 - 租户ID: {}", tenantId);

        try {
            Map<String, Object> result = stripeSubscriptionService.getCancellationStatus(tenantId);
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (Exception e) {
            log.error("获取取消状态失败 - 租户ID: {}", tenantId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("获取取消状态失败: " + e.getMessage()));
        }
    }

    // Webhook 统一由 StripeWebhookController (/api/merchant/webhooks/stripe) 处理
}
