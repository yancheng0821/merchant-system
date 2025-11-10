package com.merchant.server.authservice.controller;

import com.merchant.server.common.annotation.RequiresPermission;
import com.merchant.server.authservice.entity.AuditLog;
import com.merchant.server.authservice.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 审计日志控制器
 * Audit Log Controller
 */
@Slf4j
@RestController
@RequestMapping("/api/auth/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    /**
     * 分页查询审计日志
     * Get audit logs with pagination
     */
    @RequiresPermission("audit:view")
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAuditLogs(
            @RequestParam Long tenantId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(required = false) String resource,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {

        log.info("Fetching audit logs for tenant: {}, page: {}, size: {}", tenantId, page, size);

        Map<String, Object> response = auditLogService.getAuditLogs(
                tenantId, resource, action, status, search, startDate, endDate, page, size);

        return ResponseEntity.ok(response);
    }

    /**
     * 导出审计日志为CSV
     * Export audit logs as CSV
     */
    @RequiresPermission("audit:export")
    @GetMapping("/export")
    public ResponseEntity<String> exportAuditLogs(
            @RequestParam Long tenantId,
            @RequestParam(required = false) String resource,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {

        log.info("Exporting audit logs for tenant: {}", tenantId);

        List<Map<String, Object>> logs = auditLogService.getAuditLogsForExport(
                tenantId, resource, action, status, startDate, endDate);

        StringBuilder csv = new StringBuilder();
        // CSV Header
        csv.append("Date Time,User ID,Username,Resource,Action,Resource ID,Status,IP Address,Error Message\n");

        // CSV Rows
        for (Map<String, Object> log : logs) {
            csv.append(String.format("\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"\n",
                    log.get("createdAt"),
                    log.get("userId"),
                    log.get("username") != null ? log.get("username") : "",
                    log.get("resource"),
                    log.get("action"),
                    log.get("resourceId") != null ? log.get("resourceId") : "",
                    log.get("status"),
                    log.get("ipAddress") != null ? log.get("ipAddress") : "",
                    log.get("errorMessage") != null ? log.get("errorMessage") : ""
            ));
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment",
                "audit-logs-" + LocalDateTime.now(ZoneOffset.UTC).format(DateTimeFormatter.ofPattern("yyyy-MM-dd-HHmmss")) + ".csv");

        return ResponseEntity.ok()
                .headers(headers)
                .body(csv.toString());
    }

    /**
     * 获取特定资源的审计日志历史
     * Get audit log history for specific resource
     */
    @RequiresPermission("audit:view")
    @GetMapping("/resource/{resource}/{resourceId}")
    public ResponseEntity<List<Map<String, Object>>> getResourceHistory(
            @PathVariable String resource,
            @PathVariable Long resourceId,
            @RequestParam Long tenantId) {

        log.info("Fetching audit history for resource: {} with ID: {}", resource, resourceId);

        List<Map<String, Object>> history = auditLogService.getResourceHistory(resource, resourceId, tenantId);
        return ResponseEntity.ok(history);
    }

    /**
     * 获取失败和拒绝的操作
     * Get failed and denied operations
     */
    @RequiresPermission("audit:view_sensitive")
    @GetMapping("/failed")
    public ResponseEntity<List<Map<String, Object>>> getFailedOperations(
            @RequestParam Long tenantId,
            @RequestParam(defaultValue = "100") int limit) {

        log.info("Fetching failed operations for tenant: {}", tenantId);

        List<Map<String, Object>> failedLogs = auditLogService.getFailedOperations(tenantId, limit);
        return ResponseEntity.ok(failedLogs);
    }

    /**
     * 内部API：创建审计日志
     * Internal API: Create audit log (for other services)
     *
     * 此接口供内部服务调用，不需要权限检查
     */
    @PostMapping("/internal/create")
    public ResponseEntity<Map<String, Object>> createAuditLog(@RequestBody AuditLog auditLog) {
        log.debug("Received audit log creation request: resource={}, action={}",
                auditLog.getResource(), auditLog.getAction());

        // 设置创建时间
        if (auditLog.getCreatedAt() == null) {
            auditLog.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
        }

        // 异步记录审计日志
        auditLogService.recordAuditAsync(auditLog);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Audit log recorded");
        return ResponseEntity.ok(response);
    }

    /**
     * 获取审计统计信息
     * Get audit statistics
     */
    @RequiresPermission("audit:view")
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getAuditStats(
            @RequestParam Long tenantId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {

        log.info("Fetching audit statistics for tenant: {}", tenantId);

        Map<String, Object> stats = auditLogService.getAuditStats(tenantId, startDate, endDate);
        return ResponseEntity.ok(stats);
    }
}
