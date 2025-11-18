package com.merchant.server.authservice.service.impl;

import com.merchant.server.authservice.entity.AuditLog;
import com.merchant.server.authservice.mapper.AuditLogMapper;
import com.merchant.server.authservice.mapper.UserMapper;
import com.merchant.server.authservice.service.AuditLogService;
import com.merchant.server.authservice.util.MessageUtil;
import com.merchant.server.common.util.TimeZoneUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 审计日志服务实现
 * Audit Log Service Implementation
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogMapper auditLogMapper;
    private final UserMapper userMapper;
    private final MessageUtil messageUtil;

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * 异步记录审计日志
     * 使用@Async注解实现异步处理，不阻塞主业务流程
     */
    @Async("auditExecutor")
    @Override
    public void recordAuditAsync(AuditLog auditLog) {
        try {
            auditLogMapper.insert(auditLog);
            log.debug("Audit log recorded asynchronously: id={}, resource={}, action={}",
                    auditLog.getId(), auditLog.getResource(), auditLog.getAction());
        } catch (Exception e) {
            log.error("Failed to record audit log asynchronously: resource={}, action={}, error={}",
                    auditLog.getResource(), auditLog.getAction(), e.getMessage(), e);
            // 这里可以考虑将失败的审计日志写入备份文件或消息队列
        }
    }

    /**
     * 同步记录审计日志
     * 用于关键操作，确保审计日志必须被记录
     */
    @Override
    public void recordAuditSync(AuditLog auditLog) {
        try {
            auditLogMapper.insert(auditLog);
            log.debug("Audit log recorded synchronously: id={}, resource={}, action={}",
                    auditLog.getId(), auditLog.getResource(), auditLog.getAction());
        } catch (Exception e) {
            log.error("Failed to record audit log synchronously: resource={}, action={}, error={}",
                    auditLog.getResource(), auditLog.getAction(), e.getMessage(), e);
            throw new RuntimeException(messageUtil.getMessage("error.audit.log.failed"), e);
        }
    }

    @Override
    public Map<String, Object> getAuditLogs(Long tenantId, String resource, String action,
                                             String status, String search, String startDate,
                                             String endDate, String timezone, int page, int size) {

        Map<String, Object> params = buildQueryParams(tenantId, resource, action, status, search, startDate, endDate, timezone);
        params.put("offset", page * size);
        params.put("limit", size);

        List<Map<String, Object>> logs = auditLogMapper.findByConditions(params);
        long total = auditLogMapper.countByConditions(params);

        // Enrich with username
        enrichWithUsernames(logs);

        Map<String, Object> result = new HashMap<>();
        result.put("content", logs);
        result.put("totalElements", total);
        result.put("totalPages", (int) Math.ceil((double) total / size));
        result.put("currentPage", page);
        result.put("pageSize", size);

        return result;
    }

    @Override
    public List<Map<String, Object>> getAuditLogsForExport(Long tenantId, String resource,
                                                             String action, String status,
                                                             String startDate, String endDate, String timezone) {

        Map<String, Object> params = buildQueryParams(tenantId, resource, action, status, null, startDate, endDate, timezone);
        params.put("limit", 10000); // Export limit

        List<Map<String, Object>> logs = auditLogMapper.findByConditions(params);
        enrichWithUsernames(logs);

        return logs;
    }

    @Override
    public List<Map<String, Object>> getResourceHistory(String resource, Long resourceId, Long tenantId) {
        Map<String, Object> params = new HashMap<>();
        params.put("tenantId", tenantId);
        params.put("resource", resource);
        params.put("resourceId", resourceId);
        params.put("limit", 100);

        List<Map<String, Object>> logs = auditLogMapper.findByConditions(params);
        enrichWithUsernames(logs);

        return logs;
    }

    @Override
    public List<Map<String, Object>> getFailedOperations(Long tenantId, int limit) {
        Map<String, Object> params = new HashMap<>();
        params.put("tenantId", tenantId);
        params.put("statusList", Arrays.asList("failed", "denied"));
        params.put("limit", limit);

        List<Map<String, Object>> logs = auditLogMapper.findByConditions(params);
        enrichWithUsernames(logs);

        return logs;
    }

    @Override
    public Map<String, Object> getAuditStats(Long tenantId, String startDate, String endDate, String timezone) {
        Map<String, Object> params = buildQueryParams(tenantId, null, null, null, null, startDate, endDate, timezone);

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalLogs", auditLogMapper.countByConditions(params));

        // Count by status
        Map<String, Object> successParams = new HashMap<>(params);
        successParams.put("status", "success");
        stats.put("successCount", auditLogMapper.countByConditions(successParams));

        Map<String, Object> failedParams = new HashMap<>(params);
        failedParams.put("status", "failed");
        stats.put("failedCount", auditLogMapper.countByConditions(failedParams));

        Map<String, Object> deniedParams = new HashMap<>(params);
        deniedParams.put("status", "denied");
        stats.put("deniedCount", auditLogMapper.countByConditions(deniedParams));

        // Count by action
        List<Map<String, Object>> actionStats = auditLogMapper.countByAction(params);
        stats.put("actionStats", actionStats);

        // Count by resource
        List<Map<String, Object>> resourceStats = auditLogMapper.countByResource(params);
        stats.put("resourceStats", resourceStats);

        return stats;
    }

    private Map<String, Object> buildQueryParams(Long tenantId, String resource, String action,
                                                   String status, String search, String startDate,
                                                   String endDate, String timezone) {
        Map<String, Object> params = new HashMap<>();
        params.put("tenantId", tenantId);

        if (resource != null && !resource.trim().isEmpty() && !"all".equals(resource)) {
            params.put("resource", resource);
        }

        if (action != null && !action.trim().isEmpty() && !"all".equals(action)) {
            params.put("action", action);
        }

        if (status != null && !status.trim().isEmpty() && !"all".equals(status)) {
            params.put("status", status);
        }

        if (search != null && !search.trim().isEmpty()) {
            params.put("search", "%" + search.trim() + "%");
        }

        // 处理日期范围：将商户本地日期转换为UTC日期时间
        if (startDate != null && !startDate.trim().isEmpty()) {
            try {
                LocalDate localDate = LocalDate.parse(startDate.trim());
                LocalDateTime utcStart = TimeZoneUtils.getMerchantStartOfDayUTC(localDate, timezone);
                params.put("startDate", utcStart.format(DATE_TIME_FORMATTER));
                log.debug("Converted start date: {} (merchant local) -> {} (UTC)", startDate, utcStart);
            } catch (Exception e) {
                log.warn("Failed to parse start date: {}, using original value", startDate, e);
                params.put("startDate", startDate + " 00:00:00");
            }
        }

        if (endDate != null && !endDate.trim().isEmpty()) {
            try {
                LocalDate localDate = LocalDate.parse(endDate.trim());
                LocalDateTime utcEnd = TimeZoneUtils.getMerchantEndOfDayUTC(localDate, timezone);
                params.put("endDate", utcEnd.format(DATE_TIME_FORMATTER));
                log.debug("Converted end date: {} (merchant local) -> {} (UTC)", endDate, utcEnd);
            } catch (Exception e) {
                log.warn("Failed to parse end date: {}, using original value", endDate, e);
                params.put("endDate", endDate + " 23:59:59");
            }
        }

        return params;
    }

    private void enrichWithUsernames(List<Map<String, Object>> logs) {
        // Get unique user IDs
        Set<Long> userIds = logs.stream()
                .map(log -> (Long) log.get("userId"))
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        if (userIds.isEmpty()) {
            return;
        }

        // Fetch usernames in batch
        Map<Long, String> userIdToNameMap = new HashMap<>();
        for (Long userId : userIds) {
            try {
                String username = userMapper.findUsernameById(userId);
                if (username != null) {
                    userIdToNameMap.put(userId, username);
                }
            } catch (Exception e) {
                log.warn("Failed to fetch username for userId: {}", userId);
            }
        }

        // Enrich logs with usernames
        for (Map<String, Object> log : logs) {
            Long userId = (Long) log.get("userId");
            if (userId != null && userIdToNameMap.containsKey(userId)) {
                log.put("username", userIdToNameMap.get(userId));
            }
        }
    }
}
