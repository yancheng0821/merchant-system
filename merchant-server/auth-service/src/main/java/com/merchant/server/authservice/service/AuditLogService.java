package com.merchant.server.authservice.service;

import com.merchant.server.authservice.entity.AuditLog;

import java.util.List;
import java.util.Map;

/**
 * 审计日志服务接口
 * Audit Log Service Interface
 */
public interface AuditLogService {

    /**
     * 异步记录审计日志
     * @param auditLog 审计日志实体
     */
    void recordAuditAsync(AuditLog auditLog);

    /**
     * 同步记录审计日志（用于关键操作）
     * @param auditLog 审计日志实体
     */
    void recordAuditSync(AuditLog auditLog);

    /**
     * 分页查询审计日志
     */
    Map<String, Object> getAuditLogs(Long tenantId, String resource, String action,
                                      String status, String search, String startDate,
                                      String endDate, String timezone, int page, int size);

    /**
     * 导出审计日志
     */
    List<Map<String, Object>> getAuditLogsForExport(Long tenantId, String resource,
                                                      String action, String status,
                                                      String startDate, String endDate, String timezone);

    /**
     * 获取资源历史记录
     */
    List<Map<String, Object>> getResourceHistory(String resource, Long resourceId, Long tenantId);

    /**
     * 获取失败的操作
     */
    List<Map<String, Object>> getFailedOperations(Long tenantId, int limit);

    /**
     * 获取审计统计信息
     */
    Map<String, Object> getAuditStats(Long tenantId, String startDate, String endDate, String timezone);
}
