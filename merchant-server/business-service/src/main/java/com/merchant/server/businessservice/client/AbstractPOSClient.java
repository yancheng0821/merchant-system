package com.merchant.server.businessservice.client;

import com.merchant.server.businessservice.dto.pos.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.client.RestTemplate;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;

/**
 * POS客户端抽象基类
 * 提供通用功能实现
 */
@Slf4j
public abstract class AbstractPOSClient implements POSClient {
    
    @Autowired
    protected RestTemplate restTemplate;
    
    protected final ScheduledExecutorService executorService = 
        Executors.newScheduledThreadPool(5);
    
    protected String apiEndpoint;
    protected String apiKey;
    protected String merchantId;
    
    @Override
    public CompletableFuture<POSInitResponse> initPaymentAsync(POSPaymentRequest request) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                return initPayment(request);
            } catch (Exception e) {
                log.error("Async payment init failed", e);
                return POSInitResponse.builder()
                    .status("failed")
                    .message(e.getMessage())
                    .build();
            }
        }, executorService);
    }
    
    @Override
    public boolean supportsAsyncPayment() {
        return true;
    }
    
    @Override
    public boolean supportsStatusPolling() {
        return true;
    }
    
    /**
     * 记录请求日志
     */
    protected void logRequest(String operation, Object request) {
        log.info("POS {} request - Provider: {}, Request: {}", 
            operation, getProviderName(), request);
    }
    
    /**
     * 记录响应日志
     */
    protected void logResponse(String operation, Object response) {
        log.info("POS {} response - Provider: {}, Response: {}", 
            operation, getProviderName(), response);
    }
    
    /**
     * 处理异常
     */
    protected void handleException(String operation, Exception e) {
        log.error("POS {} error - Provider: {}", operation, getProviderName(), e);
    }
}