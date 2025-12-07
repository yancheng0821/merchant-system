package com.merchant.server.merchantservice.controller;

import com.merchant.server.common.dto.ApiResponse;
import com.merchant.server.merchantservice.schedule.SubscriptionScheduler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 订阅定时任务测试控制器
 * 用于手动触发定时任务进行测试
 *
 * 注：续费账单、过期订阅、计划变更等已由 Stripe Subscriptions 自动处理
 */
@Slf4j
@RestController
@RequestMapping("/api/merchant/subscription/scheduler/test")
@RequiredArgsConstructor
public class SubscriptionSchedulerTestController {

    private final SubscriptionScheduler subscriptionScheduler;

    /**
     * 手动触发试用期结束处理
     */
    @PostMapping("/trial-expiration")
    public ResponseEntity<ApiResponse<String>> triggerTrialExpiration() {
        try {
            log.info("手动触发试用期结束处理任务");
            subscriptionScheduler.handleTrialExpiration();
            return ResponseEntity.ok(ApiResponse.success("试用期结束处理任务执行完成"));
        } catch (Exception e) {
            log.error("试用期结束处理任务执行失败: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("任务执行失败: " + e.getMessage()));
        }
    }

    // 以下接口已移除，由 Stripe Subscriptions 自动处理：
    // - /renewal-invoices (Stripe 自动生成账单)
    // - /expired-subscriptions (Stripe invoice.payment_failed webhook 处理)
}
