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

    // 注意：changeBillingCycle 已移除，由 Stripe Customer Portal 处理

    /**
     * 获取租户订阅功能配置（供内部服务调用）
     * 返回租户当前订阅计划的 features JSON
     */
    @GetMapping("/tenant/{tenantId}/features")
    public ResponseEntity<ApiResponse<String>> getTenantFeatures(@PathVariable Long tenantId) {
        log.debug("获取租户功能配置 - 租户ID: {}", tenantId);
        try {
            TenantSubscription subscription = tenantSubscriptionService.getActiveSubscriptionByTenantId(tenantId);
            if (subscription != null && subscription.getPlan() != null) {
                String features = subscription.getPlan().getFeatures();
                return ResponseEntity.ok(ApiResponse.success(features));
            } else {
                // 如果没有活跃订阅，返回空features
                return ResponseEntity.ok(ApiResponse.success(null));
            }
        } catch (Exception e) {
            log.error("获取租户功能配置失败 - 租户ID: {}", tenantId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("获取功能配置失败: " + e.getMessage()));
        }
    }

    /**
     * 检查租户是否有特定功能
     * @param tenantId 租户ID
     * @param feature 功能代码（如: customerImport, smsNotification）
     */
    @GetMapping("/tenant/{tenantId}/features/{feature}/check")
    public ResponseEntity<ApiResponse<Boolean>> checkTenantFeature(
            @PathVariable Long tenantId,
            @PathVariable String feature) {
        log.debug("检查租户功能 - 租户ID: {}, 功能: {}", tenantId, feature);
        try {
            TenantSubscription subscription = tenantSubscriptionService.getActiveSubscriptionByTenantId(tenantId);
            if (subscription == null || subscription.getPlan() == null) {
                // 没有活跃订阅，默认无权限
                return ResponseEntity.ok(ApiResponse.success(false));
            }

            String featuresJson = subscription.getPlan().getFeatures();
            if (featuresJson == null || featuresJson.isEmpty()) {
                return ResponseEntity.ok(ApiResponse.success(false));
            }

            // 解析features JSON并检查特定功能
            boolean hasFeature = checkFeatureInJson(featuresJson, feature);
            return ResponseEntity.ok(ApiResponse.success(hasFeature));
        } catch (Exception e) {
            log.error("检查租户功能失败 - 租户ID: {}, 功能: {}", tenantId, feature, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("检查功能失败: " + e.getMessage()));
        }
    }

    // 注意：changePlan 已移除，由 StripeSubscriptionController.updateSubscription 处理

    /**
     * 获取租户订阅状态（供 auth-service 登录时调用）
     * 返回订阅状态和是否过期
     */
    @GetMapping("/tenant/{tenantId}/status")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> getSubscriptionStatus(@PathVariable Long tenantId) {
        log.debug("获取租户订阅状态 - 租户ID: {}", tenantId);
        try {
            // 先查活跃订阅
            TenantSubscription subscription = tenantSubscriptionService.getActiveSubscriptionByTenantId(tenantId);

            java.util.Map<String, Object> result = new java.util.HashMap<>();

            if (subscription != null) {
                result.put("hasActiveSubscription", true);
                result.put("subscriptionStatus", subscription.getStatus().name());
                result.put("planCode", subscription.getPlan() != null ? subscription.getPlan().getPlanCode() : null);
                result.put("expired", false);
            } else {
                // 没有活跃订阅，检查是否有过期订阅
                List<TenantSubscription> allSubscriptions = tenantSubscriptionService.getSubscriptionsByTenantId(tenantId);
                boolean hasExpiredSubscription = allSubscriptions.stream()
                        .anyMatch(s -> s.getStatus() == TenantSubscription.SubscriptionStatus.EXPIRED);

                result.put("hasActiveSubscription", false);
                result.put("subscriptionStatus", hasExpiredSubscription ? "EXPIRED" : "NONE");
                result.put("expired", true);
            }

            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (Exception e) {
            log.error("获取租户订阅状态失败 - 租户ID: {}", tenantId, e);
            // 出错时默认返回未过期，避免阻止用户登录
            java.util.Map<String, Object> result = new java.util.HashMap<>();
            result.put("hasActiveSubscription", true);
            result.put("expired", false);
            return ResponseEntity.ok(ApiResponse.success(result));
        }
    }

    /**
     * 获取租户的员工数量限制
     * @param tenantId 租户ID
     * @return maxStaff 限制，-1表示无限制
     */
    @GetMapping("/tenant/{tenantId}/limits/maxStaff")
    public ResponseEntity<ApiResponse<Integer>> getTenantMaxStaff(@PathVariable Long tenantId) {
        log.debug("获取租户员工限制 - 租户ID: {}", tenantId);
        try {
            TenantSubscription subscription = tenantSubscriptionService.getActiveSubscriptionByTenantId(tenantId);
            if (subscription == null || subscription.getPlan() == null) {
                // 没有活跃订阅，返回默认限制（如基础版限制）
                return ResponseEntity.ok(ApiResponse.success(5)); // 默认5个员工
            }
            Integer maxStaff = subscription.getPlan().getMaxStaff();
            // -1 表示无限制
            return ResponseEntity.ok(ApiResponse.success(maxStaff != null ? maxStaff : -1));
        } catch (Exception e) {
            log.error("获取租户员工限制失败 - 租户ID: {}", tenantId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("获取员工限制失败: " + e.getMessage()));
        }
    }

    /**
     * 获取租户的月预约数量限制
     * @param tenantId 租户ID
     * @return maxAppointmentsPerMonth 限制，-1表示无限制
     */
    @GetMapping("/tenant/{tenantId}/limits/maxAppointmentsPerMonth")
    public ResponseEntity<ApiResponse<Integer>> getTenantMaxAppointmentsPerMonth(@PathVariable Long tenantId) {
        log.debug("获取租户月预约限制 - 租户ID: {}", tenantId);
        try {
            TenantSubscription subscription = tenantSubscriptionService.getActiveSubscriptionByTenantId(tenantId);
            if (subscription == null || subscription.getPlan() == null) {
                // 没有活跃订阅，返回默认限制
                return ResponseEntity.ok(ApiResponse.success(50)); // 默认50个预约
            }
            Integer maxAppointments = subscription.getPlan().getMaxAppointmentsPerMonth();
            // -1 表示无限制
            return ResponseEntity.ok(ApiResponse.success(maxAppointments != null ? maxAppointments : -1));
        } catch (Exception e) {
            log.error("获取租户月预约限制失败 - 租户ID: {}", tenantId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("获取月预约限制失败: " + e.getMessage()));
        }
    }

    /**
     * 获取租户的月短信数量限制
     * @param tenantId 租户ID
     * @return maxSmsPerMonth 限制，0表示不包含短信功能，-1表示无限制
     */
    @GetMapping("/tenant/{tenantId}/limits/maxSmsPerMonth")
    public ResponseEntity<ApiResponse<Integer>> getTenantMaxSmsPerMonth(@PathVariable Long tenantId) {
        log.debug("获取租户月短信限制 - 租户ID: {}", tenantId);
        try {
            TenantSubscription subscription = tenantSubscriptionService.getActiveSubscriptionByTenantId(tenantId);
            if (subscription == null || subscription.getPlan() == null) {
                // 没有活跃订阅，返回0（不包含短信）
                return ResponseEntity.ok(ApiResponse.success(0));
            }
            // 从features JSON中获取maxSmsPerMonth
            Integer maxSms = getLimitFromFeatures(subscription.getPlan().getFeatures(), "maxSmsPerMonth");
            return ResponseEntity.ok(ApiResponse.success(maxSms != null ? maxSms : 0));
        } catch (Exception e) {
            log.error("获取租户月短信限制失败 - 租户ID: {}", tenantId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("获取月短信限制失败: " + e.getMessage()));
        }
    }

    /**
     * 获取租户的月邮件数量限制
     * @param tenantId 租户ID
     * @return maxEmailsPerMonth 限制，-1表示无限制
     */
    @GetMapping("/tenant/{tenantId}/limits/maxEmailsPerMonth")
    public ResponseEntity<ApiResponse<Integer>> getTenantMaxEmailsPerMonth(@PathVariable Long tenantId) {
        log.debug("获取租户月邮件限制 - 租户ID: {}", tenantId);
        try {
            TenantSubscription subscription = tenantSubscriptionService.getActiveSubscriptionByTenantId(tenantId);
            if (subscription == null || subscription.getPlan() == null) {
                // 没有活跃订阅，返回默认限制
                return ResponseEntity.ok(ApiResponse.success(100)); // 默认100封邮件
            }
            // 从features JSON中获取maxEmailsPerMonth
            Integer maxEmails = getLimitFromFeatures(subscription.getPlan().getFeatures(), "maxEmailsPerMonth");
            return ResponseEntity.ok(ApiResponse.success(maxEmails != null ? maxEmails : -1));
        } catch (Exception e) {
            log.error("获取租户月邮件限制失败 - 租户ID: {}", tenantId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("获取月邮件限制失败: " + e.getMessage()));
        }
    }

    /**
     * 从features JSON中获取limit值
     */
    private Integer getLimitFromFeatures(String featuresJson, String limitKey) {
        if (featuresJson == null || featuresJson.isEmpty()) {
            return null;
        }
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(featuresJson);
            com.fasterxml.jackson.databind.JsonNode limitsNode = root.get("limits");
            if (limitsNode != null && limitsNode.has(limitKey)) {
                return limitsNode.get(limitKey).asInt();
            }
            return null;
        } catch (Exception e) {
            log.warn("解析features JSON失败: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 从features JSON中检查特定功能是否启用
     */
    private boolean checkFeatureInJson(String featuresJson, String feature) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(featuresJson);

            // 检查 features 节点
            com.fasterxml.jackson.databind.JsonNode featuresNode = root.get("features");
            if (featuresNode != null && featuresNode.has(feature)) {
                return featuresNode.get(feature).asBoolean(false);
            }

            // 检查 modules 节点（用于模块级别的功能）
            com.fasterxml.jackson.databind.JsonNode modulesNode = root.get("modules");
            if (modulesNode != null && modulesNode.has(feature)) {
                return modulesNode.get(feature).asBoolean(false);
            }

            return false;
        } catch (Exception e) {
            log.warn("解析features JSON失败: {}", e.getMessage());
            return false;
        }
    }
}
