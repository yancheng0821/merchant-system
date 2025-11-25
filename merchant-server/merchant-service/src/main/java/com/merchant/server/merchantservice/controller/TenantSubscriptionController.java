package com.merchant.server.merchantservice.controller;

import com.merchant.server.common.dto.ApiResponse;
import com.merchant.server.merchantservice.entity.TenantSubscription;
import com.merchant.server.merchantservice.service.TenantSubscriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 商户订阅控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/merchant/subscription")
@RequiredArgsConstructor
public class TenantSubscriptionController {

    private final TenantSubscriptionService tenantSubscriptionService;

    /**
     * 根据ID查询订阅
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TenantSubscription>> getSubscriptionById(@PathVariable Long id) {
        log.info("查询订阅 - ID: {}", id);
        try {
            TenantSubscription subscription = tenantSubscriptionService.getSubscriptionById(id);
            if (subscription != null) {
                return ResponseEntity.ok(ApiResponse.success(subscription));
            } else {
                return ResponseEntity.ok(ApiResponse.error("订阅不存在"));
            }
        } catch (Exception e) {
            log.error("查询订阅失败 - ID: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("查询订阅失败: " + e.getMessage()));
        }
    }

    /**
     * 根据租户ID查询活跃订阅
     */
    @GetMapping("/tenant/{tenantId}/active")
    public ResponseEntity<ApiResponse<TenantSubscription>> getActiveSubscriptionByTenantId(@PathVariable Long tenantId) {
        log.info("查询租户活跃订阅 - 租户ID: {}", tenantId);
        try {
            TenantSubscription subscription = tenantSubscriptionService.getActiveSubscriptionByTenantId(tenantId);
            if (subscription != null) {
                return ResponseEntity.ok(ApiResponse.success(subscription));
            } else {
                return ResponseEntity.ok(ApiResponse.error("未找到活跃订阅"));
            }
        } catch (Exception e) {
            log.error("查询租户活跃订阅失败 - 租户ID: {}", tenantId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("查询活跃订阅失败: " + e.getMessage()));
        }
    }

    /**
     * 根据租户ID查询所有订阅
     */
    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<ApiResponse<List<TenantSubscription>>> getSubscriptionsByTenantId(@PathVariable Long tenantId) {
        log.info("查询租户所有订阅 - 租户ID: {}", tenantId);
        try {
            List<TenantSubscription> subscriptions = tenantSubscriptionService.getSubscriptionsByTenantId(tenantId);
            return ResponseEntity.ok(ApiResponse.success(subscriptions));
        } catch (Exception e) {
            log.error("查询租户所有订阅失败 - 租户ID: {}", tenantId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("查询订阅失败: " + e.getMessage()));
        }
    }

    /**
     * 为新注册的租户创建免费试用订阅
     * 此接口供auth-service在商户注册时调用
     */
    @PostMapping("/tenant/{tenantId}/free-trial")
    public ResponseEntity<ApiResponse<TenantSubscription>> createFreeTrialSubscription(@PathVariable Long tenantId) {
        log.info("创建免费试用订阅 - 租户ID: {}", tenantId);
        try {
            TenantSubscription subscription = tenantSubscriptionService.createFreeTrialSubscription(tenantId);
            return ResponseEntity.ok(ApiResponse.success(subscription));
        } catch (Exception e) {
            log.error("创建免费试用订阅失败 - 租户ID: {}", tenantId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("创建免费试用订阅失败: " + e.getMessage()));
        }
    }

    /**
     * 创建订阅
     */
    @PostMapping
    public ResponseEntity<ApiResponse<TenantSubscription>> createSubscription(@RequestBody TenantSubscription subscription) {
        log.info("创建订阅 - 租户ID: {}", subscription.getTenantId());
        try {
            String planCode = subscription.getPlanId() != null ? subscription.getPlanId().toString() : "FREE";
            TenantSubscription createdSubscription = tenantSubscriptionService.createSubscription(
                    subscription.getTenantId(),
                    planCode,
                    subscription.getBillingCycle()
            );
            return ResponseEntity.ok(ApiResponse.success(createdSubscription));
        } catch (Exception e) {
            log.error("创建订阅失败 - 租户ID: {}", subscription.getTenantId(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("创建订阅失败: " + e.getMessage()));
        }
    }

    /**
     * 更新订阅
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Boolean>> updateSubscription(@PathVariable Long id, @RequestBody TenantSubscription subscription) {
        log.info("更新订阅 - ID: {}", id);
        try {
            subscription.setId(id);
            boolean success = tenantSubscriptionService.updateSubscription(subscription);
            if (success) {
                return ResponseEntity.ok(ApiResponse.success(true));
            } else {
                return ResponseEntity.ok(new ApiResponse<>(false, "更新订阅失败", false));
            }
        } catch (Exception e) {
            log.error("更新订阅失败 - ID: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "更新订阅失败: " + e.getMessage(), false));
        }
    }

    /**
     * 取消订阅
     */
    @PutMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<Boolean>> cancelSubscription(@PathVariable Long id) {
        log.info("取消订阅 - ID: {}", id);
        try {
            boolean success = tenantSubscriptionService.cancelSubscription(id);
            if (success) {
                return ResponseEntity.ok(ApiResponse.success(true));
            } else {
                return ResponseEntity.ok(new ApiResponse<>(false, "取消订阅失败", false));
            }
        } catch (Exception e) {
            log.error("取消订阅失败 - ID: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "取消订阅失败: " + e.getMessage(), false));
        }
    }

    /**
     * 删除订阅
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Boolean>> deleteSubscription(@PathVariable Long id) {
        log.info("删除订阅 - ID: {}", id);
        try {
            boolean success = tenantSubscriptionService.deleteSubscription(id);
            if (success) {
                return ResponseEntity.ok(ApiResponse.success(true));
            } else {
                return ResponseEntity.ok(new ApiResponse<>(false, "删除订阅失败", false));
            }
        } catch (Exception e) {
            log.error("删除订阅失败 - ID: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "删除订阅失败: " + e.getMessage(), false));
        }
    }

    /**
     * 修改订阅的计费周期
     */
    @PutMapping("/{id}/billing-cycle")
    public ResponseEntity<ApiResponse<TenantSubscription>> changeBillingCycle(
            @PathVariable Long id,
            @RequestParam TenantSubscription.BillingCycle billingCycle) {
        log.info("修改订阅计费周期 - 订阅ID: {}, 新周期: {}", id, billingCycle);
        try {
            boolean success = tenantSubscriptionService.changeBillingCycle(id, billingCycle);
            if (success) {
                TenantSubscription updatedSubscription = tenantSubscriptionService.getSubscriptionById(id);
                return ResponseEntity.ok(ApiResponse.success(updatedSubscription));
            } else {
                return ResponseEntity.ok(ApiResponse.error("修改计费周期失败"));
            }
        } catch (Exception e) {
            log.error("修改订阅计费周期失败 - 订阅ID: {}, 新周期: {}", id, billingCycle, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("修改计费周期失败: " + e.getMessage()));
        }
    }
}
