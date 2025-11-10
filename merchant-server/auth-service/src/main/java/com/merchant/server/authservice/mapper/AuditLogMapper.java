package com.merchant.server.authservice.mapper;

import com.merchant.server.authservice.entity.AuditLog;
import org.apache.ibatis.annotations.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 审计日志Mapper接口
 * Audit Log Mapper Interface
 */
@Mapper
public interface AuditLogMapper {

    /**
     * 创建审计日志
     */
    @Insert("INSERT INTO audit_logs (user_id, tenant_id, resource, action, resource_id, " +
            "old_value, new_value, ip_address, user_agent, status, error_message) " +
            "VALUES (#{userId}, #{tenantId}, #{resource}, #{action}, #{resourceId}, " +
            "#{oldValue}, #{newValue}, #{ipAddress}, #{userAgent}, #{status}, #{errorMessage})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(AuditLog auditLog);

    /**
     * 根据用户ID查询日志
     */
    @Select("SELECT * FROM audit_logs WHERE user_id = #{userId} ORDER BY created_at DESC LIMIT #{limit}")
    List<AuditLog> findByUserId(@Param("userId") Long userId, @Param("limit") int limit);

    /**
     * 根据租户ID查询日志
     */
    @Select("SELECT * FROM audit_logs WHERE tenant_id = #{tenantId} ORDER BY created_at DESC LIMIT #{limit}")
    List<AuditLog> findByTenantId(@Param("tenantId") Long tenantId, @Param("limit") int limit);

    /**
     * 根据资源查询日志
     */
    @Select("SELECT * FROM audit_logs WHERE resource = #{resource} AND resource_id = #{resourceId} " +
            "ORDER BY created_at DESC")
    List<AuditLog> findByResource(@Param("resource") String resource, @Param("resourceId") Long resourceId);

    /**
     * 查询失败/拒绝的操作
     */
    @Select("SELECT * FROM audit_logs WHERE tenant_id = #{tenantId} " +
            "AND status IN ('failed', 'denied') " +
            "ORDER BY created_at DESC LIMIT #{limit}")
    List<AuditLog> findFailedLogs(@Param("tenantId") Long tenantId, @Param("limit") int limit);

    /**
     * 按时间范围查询日志
     */
    @Select("SELECT * FROM audit_logs WHERE tenant_id = #{tenantId} " +
            "AND created_at BETWEEN #{startTime} AND #{endTime} " +
            "ORDER BY created_at DESC")
    List<AuditLog> findByTimeRange(@Param("tenantId") Long tenantId,
                                    @Param("startTime") LocalDateTime startTime,
                                    @Param("endTime") LocalDateTime endTime);

    /**
     * 删除旧日志（超过保留期限）
     */
    @Delete("DELETE FROM audit_logs WHERE created_at < #{beforeDate}")
    int deleteOldLogs(LocalDateTime beforeDate);

    /**
     * 动态条件查询审计日志
     */
    List<Map<String, Object>> findByConditions(Map<String, Object> params);

    /**
     * 统计符合条件的日志总数
     */
    long countByConditions(Map<String, Object> params);

    /**
     * 按操作类型统计
     */
    List<Map<String, Object>> countByAction(Map<String, Object> params);

    /**
     * 按资源类型统计
     */
    List<Map<String, Object>> countByResource(Map<String, Object> params);
}
