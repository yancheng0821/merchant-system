package com.merchant.server.merchantservice.controller;

import com.merchant.server.common.dto.ApiResponse;
import com.merchant.server.merchantservice.entity.SubscriptionPlan;
import com.merchant.server.merchantservice.service.SubscriptionPlanService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 订阅计划控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/merchant/subscription-plan")
@RequiredArgsConstructor
public class SubscriptionPlanController {

    private final SubscriptionPlanService subscriptionPlanService;

    /**
     * 获取所有激活的订阅计划
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SubscriptionPlan>>> getAllActivePlans() {
        log.info("获取所有激活的订阅计划");
        try {
            List<SubscriptionPlan> plans = subscriptionPlanService.getAllActivePlans();
            return ResponseEntity.ok(ApiResponse.success(plans));
        } catch (Exception e) {
            log.error("获取订阅计划列表失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("获取订阅计划列表失败: " + e.getMessage()));
        }
    }

    /**
     * 根据计划代码获取订阅计划
     */
    @GetMapping("/{planCode}")
    public ResponseEntity<ApiResponse<SubscriptionPlan>> getPlanByCode(@PathVariable String planCode) {
        log.info("获取订阅计划 - planCode: {}", planCode);
        try {
            SubscriptionPlan plan = subscriptionPlanService.getPlanByCode(planCode);
            if (plan != null) {
                return ResponseEntity.ok(ApiResponse.success(plan));
            } else {
                return ResponseEntity.ok(ApiResponse.error("订阅计划不存在"));
            }
        } catch (Exception e) {
            log.error("获取订阅计划失败 - planCode: {}", planCode, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("获取订阅计划失败: " + e.getMessage()));
        }
    }
}
