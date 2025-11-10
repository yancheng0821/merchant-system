package com.merchant.server.businessservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

/**
 * 审计日志服务客户端
 * Audit Log Service Client
 */
@FeignClient(name = "auth-service", path = "/api/auth/audit-logs")
public interface AuditClient {

    /**
     * 创建审计日志（内部API）
     * Create audit log (internal API)
     */
    @PostMapping("/internal/create")
    Map<String, Object> createAuditLog(@RequestBody Map<String, Object> auditLog);
}
