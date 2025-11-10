package com.merchant.server.merchantservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

@FeignClient(name = "auth-service", path = "/api/auth/audit-logs")
public interface AuditClient {

    @PostMapping("/internal/create")
    Map<String, Object> createAuditLog(@RequestBody Map<String, Object> auditLog);
}
