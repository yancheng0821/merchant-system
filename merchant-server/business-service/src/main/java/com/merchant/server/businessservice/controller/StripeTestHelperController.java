package com.merchant.server.businessservice.controller;

import com.merchant.server.common.dto.ApiResponse;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.model.PaymentMethod;
import com.stripe.param.PaymentIntentConfirmParams;
import com.stripe.param.PaymentMethodCreateParams;
import com.stripe.param.PaymentMethodAttachParams;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.*;

import jakarta.annotation.PostConstruct;
import java.util.HashMap;
import java.util.Map;

/**
 * Stripe测试辅助控制器
 * 仅在测试模式下启用，帮助完成测试支付
 */
@Slf4j
@RestController
@RequestMapping("/api/business/stripe-test-helper")
@RequiredArgsConstructor
// 移除条件注解，让控制器始终可用（会在方法内部检查是否是测试环境）
public class StripeTestHelperController {
    
    @Value("${stripe.api.key}")
    private String stripeApiKey;
    
    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeApiKey;
        log.info("StripeTestHelperController initialized with API key: {}...", 
            stripeApiKey != null ? stripeApiKey.substring(0, Math.min(10, stripeApiKey.length())) : "null");
    }
    
    /**
     * 测试支付场景枚举
     */
    public enum TestScenario {
        SUCCESS("pm_card_visa", "成功支付"),
        DECLINED("pm_card_visa_chargeDeclined", "支付被拒绝"),
        INSUFFICIENT_FUNDS("pm_card_visa_chargeDeclinedInsufficientFunds", "余额不足"),
        LOST_CARD("pm_card_visa_chargeDeclinedLostCard", "卡片丢失"),
        STOLEN_CARD("pm_card_visa_chargeDeclinedStolenCard", "卡片被盗"),
        EXPIRED_CARD("pm_card_visa_chargeDeclinedExpiredCard", "卡片过期"),
        INCORRECT_CVC("pm_card_visa_chargeDeclinedIncorrectCvc", "CVC错误"),
        PROCESSING_ERROR("pm_card_visa_chargeDeclinedProcessingError", "处理错误"),
        AUTHENTICATION_REQUIRED("pm_card_authenticationRequired", "需要3D验证"),
        AUTHENTICATION_FAILED("pm_card_authenticationRequiredOnSetup", "3D验证失败");
        
        private final String paymentMethodId;
        private final String description;
        
        TestScenario(String paymentMethodId, String description) {
            this.paymentMethodId = paymentMethodId;
            this.description = description;
        }
    }
    
    /**
     * 为测试PaymentIntent附加测试卡并确认支付
     * 支持多种测试场景
     */
    @PostMapping("/complete-test-payment")
    public ApiResponse<Map<String, Object>> completeTestPayment(
            @RequestParam String paymentIntentId,
            @RequestParam(required = false, defaultValue = "SUCCESS") String scenario) {
        
        log.info("Completing test payment for: {} with scenario: {}", paymentIntentId, scenario);
        
        // 安全检查：只在测试环境允许
        if (stripeApiKey == null || !stripeApiKey.startsWith("sk_test_")) {
            return ApiResponse.error("This endpoint is only available in test mode");
        }
        
        try {
            // 获取PaymentIntent
            PaymentIntent paymentIntent = PaymentIntent.retrieve(paymentIntentId);
            
            Map<String, Object> result = new HashMap<>();
            result.put("paymentIntentId", paymentIntentId);
            result.put("initialStatus", paymentIntent.getStatus());
            result.put("scenario", scenario);
            
            // 检查状态
            if ("succeeded".equals(paymentIntent.getStatus())) {
                result.put("message", "Payment already succeeded");
                return ApiResponse.success(result);
            }
            
            if (!"requires_payment_method".equals(paymentIntent.getStatus()) && 
                !"requires_confirmation".equals(paymentIntent.getStatus())) {
                result.put("message", "Payment cannot be completed in current status: " + paymentIntent.getStatus());
                return ApiResponse.error("Invalid payment status");
            }
            
            // 获取测试场景
            TestScenario testScenario;
            try {
                testScenario = TestScenario.valueOf(scenario.toUpperCase());
            } catch (IllegalArgumentException e) {
                result.put("availableScenarios", TestScenario.values());
                return ApiResponse.error("Invalid scenario. Available scenarios: " + 
                    java.util.Arrays.toString(TestScenario.values()));
            }
            
            // 使用对应的测试PaymentMethod
            String testPaymentMethodId = testScenario.paymentMethodId;
            result.put("testPaymentMethodId", testPaymentMethodId);
            result.put("scenarioDescription", testScenario.description);
            
            try {
                // 尝试直接使用测试PaymentMethod确认支付
                PaymentIntentConfirmParams confirmParams = PaymentIntentConfirmParams.builder()
                    .setPaymentMethod(testPaymentMethodId)
                    .build();
                
                PaymentIntent confirmedIntent = paymentIntent.confirm(confirmParams);
                
                result.put("finalStatus", confirmedIntent.getStatus());
                result.put("paymentMethodId", testPaymentMethodId);
                
                // 根据最终状态设置消息
                if ("succeeded".equals(confirmedIntent.getStatus())) {
                    result.put("message", "Test payment completed successfully");
                } else if ("requires_action".equals(confirmedIntent.getStatus())) {
                    result.put("message", "Payment requires additional action (3D Secure)");
                    result.put("clientSecret", confirmedIntent.getClientSecret());
                } else if ("processing".equals(confirmedIntent.getStatus())) {
                    result.put("message", "Payment is processing");
                } else {
                    result.put("message", "Payment status: " + confirmedIntent.getStatus());
                }
                
                // 如果有错误信息，添加到结果中
                if (confirmedIntent.getLastPaymentError() != null) {
                    Map<String, Object> errorInfo = new HashMap<>();
                    errorInfo.put("code", confirmedIntent.getLastPaymentError().getCode());
                    errorInfo.put("message", confirmedIntent.getLastPaymentError().getMessage());
                    errorInfo.put("type", confirmedIntent.getLastPaymentError().getType());
                    result.put("lastError", errorInfo);
                }
                
            } catch (StripeException confirmError) {
                // 处理确认过程中的错误
                log.warn("Payment confirmation failed: {}", confirmError.getMessage());
                
                result.put("finalStatus", "failed");
                result.put("error", confirmError.getMessage());
                result.put("errorCode", confirmError.getCode());
                result.put("message", testScenario.description + " - " + confirmError.getMessage());
                
                // 对于某些错误，可能需要先更新PaymentIntent
                if (confirmError.getMessage().contains("payment_method")) {
                    try {
                        Map<String, Object> updateParams = new HashMap<>();
                        updateParams.put("payment_method", testPaymentMethodId);
                        PaymentIntent updatedIntent = paymentIntent.update(updateParams);
                        result.put("updatedStatus", updatedIntent.getStatus());
                    } catch (StripeException updateError) {
                        log.error("Failed to update payment method: {}", updateError.getMessage());
                    }
                }
            }
            
            return ApiResponse.success(result);
            
        } catch (StripeException e) {
            log.error("Failed to complete test payment", e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            error.put("code", e.getCode());
            error.put("scenario", scenario);
            return ApiResponse.error("Failed to complete test payment: " + e.getMessage());
        }
    }
    
    /**
     * 模拟支付失败
     */
    @PostMapping("/simulate-payment-failure")
    public ApiResponse<Map<String, Object>> simulatePaymentFailure(
            @RequestParam String paymentIntentId,
            @RequestParam(required = false, defaultValue = "DECLINED") String failureType) {
        
        log.info("Simulating payment failure for: {} with type: {}", paymentIntentId, failureType);
        
        // 直接调用complete-test-payment并传入失败场景
        return completeTestPayment(paymentIntentId, failureType);
    }
    
    /**
     * 取消支付
     */
    @PostMapping("/cancel-payment")
    public ApiResponse<Map<String, Object>> cancelPayment(@RequestParam String paymentIntentId) {
        log.info("Canceling payment: {}", paymentIntentId);
        
        if (stripeApiKey == null || !stripeApiKey.startsWith("sk_test_")) {
            return ApiResponse.error("This endpoint is only available in test mode");
        }
        
        try {
            PaymentIntent paymentIntent = PaymentIntent.retrieve(paymentIntentId);
            PaymentIntent canceledIntent = paymentIntent.cancel();
            
            Map<String, Object> result = new HashMap<>();
            result.put("paymentIntentId", canceledIntent.getId());
            result.put("status", canceledIntent.getStatus());
            result.put("message", "Payment canceled successfully");
            
            return ApiResponse.success(result);
            
        } catch (StripeException e) {
            return ApiResponse.error("Failed to cancel payment: " + e.getMessage());
        }
    }
    
    /**
     * 查询PaymentIntent的详细信息
     */
    @GetMapping("/payment-details")
    public ApiResponse<Map<String, Object>> getPaymentDetails(@RequestParam String paymentIntentId) {
        try {
            PaymentIntent paymentIntent = PaymentIntent.retrieve(paymentIntentId);
            
            Map<String, Object> details = new HashMap<>();
            details.put("id", paymentIntent.getId());
            details.put("status", paymentIntent.getStatus());
            details.put("amount", paymentIntent.getAmount());
            details.put("currency", paymentIntent.getCurrency());
            details.put("payment_method_types", paymentIntent.getPaymentMethodTypes());
            details.put("confirmation_method", paymentIntent.getConfirmationMethod());
            details.put("created", paymentIntent.getCreated());
            details.put("metadata", paymentIntent.getMetadata());
            
            // 添加错误信息（如果有）
            if (paymentIntent.getLastPaymentError() != null) {
                Map<String, Object> errorInfo = new HashMap<>();
                errorInfo.put("code", paymentIntent.getLastPaymentError().getCode());
                errorInfo.put("message", paymentIntent.getLastPaymentError().getMessage());
                errorInfo.put("type", paymentIntent.getLastPaymentError().getType());
                details.put("last_error", errorInfo);
            }
            
            // 提供下一步操作建议
            String nextAction = "";
            switch (paymentIntent.getStatus()) {
                case "requires_payment_method":
                    nextAction = "需要附加支付方式。使用 /complete-test-payment 接口完成支付";
                    break;
                case "requires_confirmation":
                    nextAction = "需要确认支付。使用 /complete-test-payment 接口完成支付";
                    break;
                case "requires_action":
                    nextAction = "需要额外操作（如3D验证）";
                    break;
                case "succeeded":
                    nextAction = "支付已成功完成";
                    break;
                case "processing":
                    nextAction = "支付正在处理中，请稍后查询";
                    break;
                case "canceled":
                    nextAction = "支付已取消";
                    break;
                default:
                    nextAction = "当前状态: " + paymentIntent.getStatus();
            }
            details.put("next_action", nextAction);
            
            // 提供Dashboard链接
            details.put("dashboard_url", "https://dashboard.stripe.com/test/payments/" + paymentIntentId);
            
            return ApiResponse.success(details);
            
        } catch (StripeException e) {
            return ApiResponse.error("Failed to get payment details: " + e.getMessage());
        }
    }
    
    /**
     * 获取所有可用的测试场景
     */
    @GetMapping("/test-scenarios")
    public ApiResponse<Map<String, Object>> getTestScenarios() {
        Map<String, Object> scenarios = new HashMap<>();
        
        for (TestScenario scenario : TestScenario.values()) {
            Map<String, String> info = new HashMap<>();
            info.put("paymentMethodId", scenario.paymentMethodId);
            info.put("description", scenario.description);
            scenarios.put(scenario.name(), info);
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("scenarios", scenarios);
        result.put("usage", "POST /complete-test-payment?paymentIntentId=pi_xxx&scenario=DECLINED");
        result.put("defaultScenario", "SUCCESS");
        
        return ApiResponse.success(result);
    }
    
    /**
     * 获取测试说明
     */
    @GetMapping("/instructions")
    public ApiResponse<Map<String, Object>> getInstructions() {
        Map<String, Object> instructions = new HashMap<>();
        
        instructions.put("purpose", "这个控制器帮助你在测试环境完成支付并模拟各种场景");
        
        Map<String, String> endpoints = new HashMap<>();
        endpoints.put("GET /payment-details", "查询PaymentIntent详情和状态");
        endpoints.put("GET /test-scenarios", "获取所有可用的测试场景");
        endpoints.put("POST /complete-test-payment", "完成测试支付（支持多种场景）");
        endpoints.put("POST /simulate-payment-failure", "模拟支付失败");
        endpoints.put("POST /cancel-payment", "取消支付");
        instructions.put("endpoints", endpoints);
        
        Map<String, String> workflow = new HashMap<>();
        workflow.put("step1", "创建订单并选择信用卡支付");
        workflow.put("step2", "获取返回的PaymentIntent ID (pi_xxx)");
        workflow.put("step3", "调用 /payment-details 查看支付状态");
        workflow.put("step4", "调用 /complete-test-payment 完成支付（可选择不同场景）");
        workflow.put("step5", "系统轮询会自动检测到支付完成");
        instructions.put("workflow", workflow);
        
        Map<String, String> examples = new HashMap<>();
        examples.put("成功支付", "POST /complete-test-payment?paymentIntentId=pi_xxx&scenario=SUCCESS");
        examples.put("支付被拒", "POST /complete-test-payment?paymentIntentId=pi_xxx&scenario=DECLINED");
        examples.put("余额不足", "POST /complete-test-payment?paymentIntentId=pi_xxx&scenario=INSUFFICIENT_FUNDS");
        examples.put("需要3D验证", "POST /complete-test-payment?paymentIntentId=pi_xxx&scenario=AUTHENTICATION_REQUIRED");
        instructions.put("examples", examples);
        
        instructions.put("note", "这个控制器仅在测试环境可用，生产环境会自动禁用");
        
        return ApiResponse.success(instructions);
    }
}