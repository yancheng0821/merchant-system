package com.merchant.server.businessservice.controller;

import com.merchant.server.businessservice.entity.StripeTerminal;
import com.merchant.server.businessservice.service.impl.StripeTerminalSimulatorService;
import com.merchant.server.common.dto.ApiResponse;
import com.stripe.model.terminal.Reader;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Stripe Terminal模拟器控制器
 * 仅在测试模式下启用，用于为每个租户创建模拟的Terminal Reader
 */
@Slf4j
@RestController
@RequestMapping("/api/business/terminal-simulator")
@RequiredArgsConstructor
@ConditionalOnProperty(name = "stripe.terminal.use-simulator", havingValue = "true", matchIfMissing = true)
public class StripeTerminalSimulatorController {
    
    private final StripeTerminalSimulatorService simulatorService;
    
    /**
     * 为租户创建模拟Terminal Reader
     */
    @PostMapping("/create")
    public ApiResponse<Map<String, Object>> createSimulatedReader(
            @RequestParam Long tenantId,
            @RequestParam(required = false) String label) {
        log.info("Creating simulated Terminal reader for tenant: {}", tenantId);
        
        try {
            Reader reader = simulatorService.getOrCreateSimulatedReader(tenantId, label);
            
            Map<String, Object> result = new HashMap<>();
            result.put("readerId", reader.getId());
            result.put("label", reader.getLabel());
            result.put("status", reader.getStatus());
            result.put("deviceType", reader.getDeviceType());
            result.put("location", reader.getLocation());
            result.put("message", "Simulated reader created successfully");
            
            return ApiResponse.success(result);
        } catch (Exception e) {
            log.error("Failed to create simulated reader for tenant: {}", tenantId, e);
            return ApiResponse.error("Failed to create simulated reader: " + e.getMessage());
        }
    }
    
    /**
     * 列出租户的所有Terminal
     */
    @GetMapping("/list")
    public ApiResponse<List<StripeTerminal>> listTerminals(@RequestParam Long tenantId) {
        log.info("Listing terminals for tenant: {}", tenantId);
        
        try {
            List<StripeTerminal> terminals = simulatorService.listTerminalsByTenant(tenantId);
            return ApiResponse.success(terminals);
        } catch (Exception e) {
            log.error("Failed to list terminals for tenant: {}", tenantId, e);
            return ApiResponse.error("Failed to list terminals: " + e.getMessage());
        }
    }
    
    /**
     * 删除模拟Terminal（仅测试用）
     */
    @DeleteMapping("/delete")
    public ApiResponse<Map<String, Boolean>> deleteSimulatedReader(@RequestParam String terminalId) {
        log.info("Deleting simulated Terminal reader: {}", terminalId);
        
        try {
            boolean deleted = simulatorService.deleteSimulatedReader(terminalId);
            Map<String, Boolean> result = new HashMap<>();
            result.put("deleted", deleted);
            return ApiResponse.success(result);
        } catch (Exception e) {
            log.error("Failed to delete simulated reader: {}", terminalId, e);
            return ApiResponse.error("Failed to delete simulated reader: " + e.getMessage());
        }
    }
    
    /**
     * 测试Terminal连接
     */
    @GetMapping("/test-connection")
    public ApiResponse<Map<String, String>> testConnection(@RequestParam String terminalId) {
        log.info("Testing connection for Terminal: {}", terminalId);
        
        try {
            com.stripe.model.terminal.Reader reader = com.stripe.model.terminal.Reader.retrieve(terminalId);
            
            Map<String, String> result = new HashMap<>();
            result.put("terminalId", reader.getId());
            result.put("status", reader.getStatus());
            result.put("deviceType", reader.getDeviceType());
            result.put("label", reader.getLabel());
            
            return ApiResponse.success(result);
        } catch (Exception e) {
            log.error("Failed to test connection for terminal: {}", terminalId, e);
            return ApiResponse.error("Failed to test connection: " + e.getMessage());
        }
    }
    
    /**
     * 获取模拟器使用说明
     */
    @GetMapping("/instructions")
    public ApiResponse<Map<String, Object>> getInstructions() {
        Map<String, Object> instructions = new HashMap<>();
        
        instructions.put("description", "Stripe Terminal Simulator for testing in multi-tenant mode");
        instructions.put("note", "This endpoint is only available in TEST mode (using sk_test_ API key)");
        
        Map<String, String> steps = new HashMap<>();
        steps.put("1", "Call POST /api/business/terminal-simulator/create with tenantId to create a simulated reader");
        steps.put("2", "The simulated reader will be automatically online and ready to process payments");
        steps.put("3", "Use the reader ID in payment requests");
        steps.put("4", "Test payments will be processed using Stripe's test card numbers");
        
        instructions.put("steps", steps);
        
        Map<String, String> testCards = new HashMap<>();
        testCards.put("4242424242424242", "Success");
        testCards.put("4000000000000002", "Decline");
        testCards.put("4000000000009995", "Insufficient funds");
        
        instructions.put("testCards", testCards);
        
        return ApiResponse.success(instructions);
    }
}