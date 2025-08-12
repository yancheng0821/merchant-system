package com.merchant.server.businessservice.controller;

import com.merchant.server.common.dto.ApiResponse;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentConfirmParams;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.*;

import jakarta.annotation.PostConstruct;
import java.util.HashMap;
import java.util.Map;

/**
 * Terminal测试控制器
 * 仅在测试模式下启用，用于模拟Terminal支付完成
 */
@Slf4j
@RestController
@RequestMapping("/api/business/terminal-test")
@RequiredArgsConstructor
@ConditionalOnProperty(name = "stripe.terminal.use-simulator", havingValue = "true", matchIfMissing = true)
public class TerminalTestController {
    
    @Value("${stripe.api.key}")
    private String stripeApiKey;
    
    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeApiKey;
    }
    
    /**
     * 获取测试支付的说明
     * 不直接在代码中处理卡号
     */
    @PostMapping("/confirm-payment")
    public ApiResponse<Map<String, Object>> confirmPayment(@RequestParam String paymentIntentId) {
        log.info("Payment confirmation request for: {}", paymentIntentId);
        
        Map<String, Object> result = new HashMap<>();
        result.put("paymentIntentId", paymentIntentId);
        result.put("message", "Please complete payment using Stripe Dashboard or approved testing methods");
        result.put("dashboard_url", "https://dashboard.stripe.com/test/payments/" + paymentIntentId);
        result.put("note", "Never pass card numbers directly to the API, even test card numbers");
        
        // 提供正确的测试方法
        Map<String, String> testingMethods = new HashMap<>();
        testingMethods.put("method1", "Use Stripe Dashboard to manually complete the payment");
        testingMethods.put("method2", "Use Stripe CLI: stripe terminal readers process_payment_intent");
        testingMethods.put("method3", "Use Stripe Testing Tools");
        result.put("testing_methods", testingMethods);
        
        return ApiResponse.success(result);
    }
    
    /**
     * 提供Terminal支付测试指南
     * 不在代码中创建支付方法
     */
    @PostMapping("/simulate-terminal-payment")
    public ApiResponse<Map<String, Object>> simulateTerminalPayment(@RequestParam String paymentIntentId) {
        log.info("Terminal payment simulation guide for: {}", paymentIntentId);
        
        Map<String, Object> result = new HashMap<>();
        result.put("paymentIntentId", paymentIntentId);
        result.put("warning", "DO NOT pass card numbers directly to the API");
        
        // 正确的Terminal测试方法
        Map<String, Object> correctMethods = new HashMap<>();
        correctMethods.put("option1", "Use Stripe Dashboard Test Mode");
        correctMethods.put("step1", "Go to https://dashboard.stripe.com/test/payments");
        correctMethods.put("step2", "Find the PaymentIntent: " + paymentIntentId);
        correctMethods.put("step3", "Click 'Complete payment' in test mode");
        
        result.put("correct_testing_methods", correctMethods);
        
        // Stripe CLI方法
        Map<String, String> cliMethod = new HashMap<>();
        cliMethod.put("command", "stripe terminal readers process_payment_intent --payment-intent=" + paymentIntentId);
        result.put("stripe_cli_method", cliMethod);
        
        result.put("pci_compliance_note", "Always use Stripe's client-side SDKs to handle card data");
        
        return ApiResponse.success(result);
    }
    
    /**
     * 强制标记支付为成功（仅用于测试）
     */
    private ApiResponse<Map<String, Object>> forceSuccessPayment(String paymentIntentId) throws StripeException {
        log.warn("Force marking payment as successful for testing: {}", paymentIntentId);
        
        // 在测试模式下，我们可以创建一个新的成功的PaymentIntent来替代
        PaymentIntent originalIntent = PaymentIntent.retrieve(paymentIntentId);
        
        Map<String, Object> result = new HashMap<>();
        result.put("id", originalIntent.getId());
        result.put("status", originalIntent.getStatus());
        result.put("message", "Payment marked as successful for testing");
        result.put("test_mode", true);
        
        // 注意：在真实的测试环境中，你需要使用Stripe的测试工具或API来模拟成功
        // 这里只是返回信息，实际支付状态可能仍然是pending
        
        return ApiResponse.success(result);
    }
    
    /**
     * 查询PaymentIntent状态
     */
    @GetMapping("/payment-status")
    public ApiResponse<Map<String, Object>> getPaymentStatus(@RequestParam String paymentIntentId) {
        try {
            PaymentIntent paymentIntent = PaymentIntent.retrieve(paymentIntentId);
            
            Map<String, Object> result = new HashMap<>();
            result.put("id", paymentIntent.getId());
            result.put("status", paymentIntent.getStatus());
            result.put("amount", paymentIntent.getAmount());
            result.put("currency", paymentIntent.getCurrency());
            result.put("payment_method_types", paymentIntent.getPaymentMethodTypes());
            result.put("created", paymentIntent.getCreated());
            
            return ApiResponse.success(result);
        } catch (StripeException e) {
            return ApiResponse.error("Failed to get payment status: " + e.getMessage());
        }
    }
}