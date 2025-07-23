package com.merchant.server.notificationservice.mapper;

import com.merchant.server.notificationservice.entity.NotificationLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface NotificationLogMapper {
    
    /**
     * 根据租户ID查询通知日志
     */
    List<NotificationLog> findByTenantId(@Param("tenantId") Long tenantId, 
                                         @Param("offset") int offset, 
                                         @Param("limit") int limit);
    
    /**
     * 根据租户ID查询通知日志（带分页）
     */
    List<NotificationLog> findByTenantIdWithPaging(@Param("tenantId") Long tenantId, 
                                                   @Param("offset") int offset, 
                                                   @Param("limit") int limit);
    
    /**
     * 根据业务ID查询通知日志
     */
    List<NotificationLog> findByBusinessId(@Param("businessId") String businessId);
    
    /**
     * 查询待发送的通知
     */
    List<NotificationLog> findPendingNotifications(@Param("limit") int limit);
    
    /**
     * 查询失败的通知
     */
    List<NotificationLog> findFailedNotifications();
    
    /**
     * 插入通知日志
     */
    void insert(NotificationLog log);
    
    /**
     * 更新通知日志
     */
    void update(NotificationLog log);
    
    /**
     * 统计通知数量
     */
    long countByTenantId(@Param("tenantId") Long tenantId);
    
    /**
     * 根据租户ID和筛选条件查询通知日志
     */
    List<NotificationLog> findByTenantIdWithFilters(@Param("tenantId") Long tenantId,
                                                   @Param("offset") int offset,
                                                   @Param("limit") int limit,
                                                   @Param("templateCode") String templateCode,
                                                   @Param("type") String type,
                                                   @Param("status") String status,
                                                   @Param("recipient") String recipient,
                                                   @Param("businessId") String businessId);
}