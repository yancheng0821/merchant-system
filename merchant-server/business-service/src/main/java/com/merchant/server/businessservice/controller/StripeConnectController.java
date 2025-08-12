package com.merchant.server.businessservice.controller;

import com.merchant.server.businessservice.dto.stripe.*;
import com.merchant.server.businessservice.service.StripeConnectService;
import com.merchant.server.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Stripe Connect 多租户支付控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/business/stripe-connect")
@RequiredArgsConstructor
public class StripeConnectController {
    
    private final StripeConnectService stripeConnectService;
    
    @PostMapping("/account/create")
    public ApiResponse<StripeAccountDTO> createAccount(
            @RequestParam Long tenantId,
            @RequestBody CreateStripeAccountRequest request) {
        log.info("Creating Stripe Connect account for tenant: {}", tenantId);
        StripeAccountDTO account = stripeConnectService.createConnectAccount(tenantId, request);
        return ApiResponse.success(account);
    }
    
    @PostMapping("/account/link")
    public ApiResponse<AccountLinkDTO> createAccountLink(
            @RequestParam Long tenantId,
            @RequestParam String returnUrl,
            @RequestParam String refreshUrl) {
        log.info("Creating account link for tenant: {}", tenantId);
        AccountLinkDTO link = stripeConnectService.createAccountLink(tenantId, returnUrl, refreshUrl);
        return ApiResponse.success(link);
    }
    
    @PostMapping("/account/oauth-callback")
    public ApiResponse<StripeAccountDTO> handleOAuthCallback(
            @RequestParam Long tenantId,
            @RequestParam String code) {
        log.info("Handling OAuth callback for tenant: {}", tenantId);
        StripeAccountDTO account = stripeConnectService.handleOAuthCallback(tenantId, code);
        return ApiResponse.success(account);
    }
    
    @GetMapping("/account/{tenantId}")
    public ApiResponse<StripeAccountDTO> getAccount(@PathVariable Long tenantId) {
        log.info("Getting Stripe account for tenant: {}", tenantId);
        StripeAccountDTO account = stripeConnectService.getStripeAccount(tenantId);
        return ApiResponse.success(account);
    }
    
    @PostMapping("/account/{tenantId}/sync")
    public ApiResponse<StripeAccountDTO> syncAccountStatus(
            @PathVariable Long tenantId,
            @RequestParam(required = false, defaultValue = "false") Boolean forceComplete) {
        log.info("Syncing account status for tenant: {}, forceComplete: {}", tenantId, forceComplete);
        StripeAccountDTO account;
        if (forceComplete) {
            account = stripeConnectService.forceCompleteOnboarding(tenantId);
        } else {
            account = stripeConnectService.syncAccountStatus(tenantId);
        }
        return ApiResponse.success(account);
    }
    
    @GetMapping("/account/{tenantId}/dashboard-url")
    public ApiResponse<Map<String, String>> getDashboardUrl(@PathVariable Long tenantId) {
        log.info("Getting dashboard URL for tenant: {}", tenantId);
        String url = stripeConnectService.getStripeDashboardUrl(tenantId);
        return ApiResponse.success(Map.of("url", url != null ? url : ""));
    }
    
    @PostMapping("/payment-intent/create")
    public ApiResponse<PaymentIntentDTO> createPaymentIntent(
            @RequestParam Long tenantId,
            @RequestBody CreatePaymentIntentRequest request) {
        log.info("Creating payment intent for tenant: {}, order: {}", tenantId, request.getOrderId());
        PaymentIntentDTO paymentIntent = stripeConnectService.createPaymentIntent(tenantId, request);
        return ApiResponse.success(paymentIntent);
    }
    
    @PostMapping("/payment-intent/{paymentIntentId}/confirm")
    public ApiResponse<PaymentIntentDTO> confirmPaymentIntent(
            @RequestParam Long tenantId,
            @PathVariable String paymentIntentId) {
        log.info("Confirming payment intent: {} for tenant: {}", paymentIntentId, tenantId);
        PaymentIntentDTO paymentIntent = stripeConnectService.confirmPaymentIntent(tenantId, paymentIntentId);
        return ApiResponse.success(paymentIntent);
    }
    
    @PostMapping("/payment-intent/{paymentIntentId}/cancel")
    public ApiResponse<PaymentIntentDTO> cancelPaymentIntent(
            @RequestParam Long tenantId,
            @PathVariable String paymentIntentId) {
        log.info("Canceling payment intent: {} for tenant: {}", paymentIntentId, tenantId);
        PaymentIntentDTO paymentIntent = stripeConnectService.cancelPaymentIntent(tenantId, paymentIntentId);
        return ApiResponse.success(paymentIntent);
    }
    
    @PostMapping("/terminal/create")
    public ApiResponse<TerminalDTO> createTerminal(
            @RequestParam Long tenantId,
            @RequestBody CreateTerminalRequest request) {
        log.info("Creating terminal for tenant: {}", tenantId);
        TerminalDTO terminal = stripeConnectService.createTerminal(tenantId, request);
        return ApiResponse.success(terminal);
    }
    
    @GetMapping("/terminal/list")
    public ApiResponse<List<TerminalDTO>> listTerminals(@RequestParam Long tenantId) {
        log.info("Listing terminals for tenant: {}", tenantId);
        List<TerminalDTO> terminals = stripeConnectService.listTerminals(tenantId);
        return ApiResponse.success(terminals);
    }
    
    @PostMapping("/terminal/{terminalId}/update-status")
    public ApiResponse<TerminalDTO> updateTerminalStatus(
            @RequestParam Long tenantId,
            @PathVariable String terminalId) {
        log.info("Updating terminal status: {} for tenant: {}", terminalId, tenantId);
        TerminalDTO terminal = stripeConnectService.updateTerminalStatus(tenantId, terminalId);
        return ApiResponse.success(terminal);
    }
    
    @PostMapping("/terminal/{terminalId}/collect-payment")
    public ApiResponse<CollectPaymentResultDTO> collectPaymentMethod(
            @RequestParam Long tenantId,
            @PathVariable String terminalId,
            @RequestParam String paymentIntentId) {
        log.info("Collecting payment on terminal: {} for payment: {}", terminalId, paymentIntentId);
        CollectPaymentResultDTO result = stripeConnectService.collectPaymentMethod(tenantId, terminalId, paymentIntentId);
        return ApiResponse.success(result);
    }
    
    @PostMapping("/terminal/{terminalId}/process-payment")
    public ApiResponse<ProcessPaymentResultDTO> processPayment(
            @RequestParam Long tenantId,
            @PathVariable String terminalId,
            @RequestParam String paymentIntentId) {
        log.info("Processing payment on terminal: {} for payment: {}", terminalId, paymentIntentId);
        ProcessPaymentResultDTO result = stripeConnectService.processPayment(tenantId, terminalId, paymentIntentId);
        return ApiResponse.success(result);
    }
    
    @PostMapping("/refund/create")
    public ApiResponse<RefundDTO> createRefund(
            @RequestParam Long tenantId,
            @RequestBody CreateRefundRequest request) {
        log.info("Creating refund for payment: {}", request.getPaymentIntentId());
        RefundDTO refund = stripeConnectService.createRefund(tenantId, request);
        return ApiResponse.success(refund);
    }
    
    @PostMapping("/webhook")
    public ApiResponse<WebhookResultDTO> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String signature) {
        log.info("Processing Stripe webhook");
        WebhookResultDTO result = stripeConnectService.handleWebhook(payload, signature);
        return ApiResponse.success(result);
    }
    
    @GetMapping("/platform-fee/calculate")
    public ApiResponse<Map<String, Long>> calculatePlatformFee(@RequestParam Long amount) {
        Long fee = stripeConnectService.calculateApplicationFee(amount);
        return ApiResponse.success(Map.of("fee", fee, "amount", amount));
    }
    
    /**
     * 模拟审核完成（仅测试环境）
     * 用于测试环境中模拟Stripe审核通过
     */
    @PostMapping("/account/{tenantId}/simulate-verification")
    public ApiResponse<StripeAccountDTO> simulateVerification(@PathVariable Long tenantId) {
        log.info("Simulating account verification for tenant: {} (TEST MODE)", tenantId);
        StripeAccountDTO account = stripeConnectService.simulateAccountVerification(tenantId);
        return ApiResponse.success(account);
    }
    
    /**
     * 手动触发webhook事件（仅测试环境）
     * 用于测试环境中手动触发account.updated事件
     */
    @PostMapping("/account/{tenantId}/trigger-webhook")
    public ApiResponse<Map<String, String>> triggerWebhookUpdate(@PathVariable Long tenantId) {
        log.info("Triggering webhook update for tenant: {} (TEST MODE)", tenantId);
        String result = stripeConnectService.triggerAccountUpdateWebhook(tenantId);
        return ApiResponse.success(Map.of("message", result));
    }
    
    /**
     * 解绑Stripe账户（仅测试环境）
     * 用于测试环境中重置账户，以便重新测试入驻流程
     */
    @DeleteMapping("/account/{tenantId}/disconnect")
    public ApiResponse<Map<String, Boolean>> disconnectAccount(@PathVariable Long tenantId) {
        log.info("Disconnecting Stripe account for tenant: {} (TEST MODE)", tenantId);
        Boolean result = stripeConnectService.disconnectAccount(tenantId);
        return ApiResponse.success(Map.of("success", result));
    }
}