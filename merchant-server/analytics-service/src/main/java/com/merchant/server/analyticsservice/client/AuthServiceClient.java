package com.merchant.server.analyticsservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;
import java.util.Map;

/**
 * Auth Service客户端 - 用于获取租户信息
 */
@FeignClient(name = "auth-service")
public interface AuthServiceClient {
    
    /**
     * 获取所有活跃租户
     */
    @GetMapping("/api/auth/tenants/active")
    List<Map<String, Object>> getActiveTenants();
} 