package com.merchant.server.notificationservice.mapper;

import com.merchant.server.notificationservice.entity.NotificationTemplate;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface NotificationTemplateMapper {
    
    /**
     * 根据租户ID查询所有模板
     */
    List<NotificationTemplate> findByTenantId(@Param("tenantId") Long tenantId);
    
    /**
     * 根据租户ID和模板代码查询模板
     */
    NotificationTemplate findByTenantIdAndCode(@Param("tenantId") Long tenantId, 
                                               @Param("templateCode") String templateCode,
                                               @Param("type") NotificationTemplate.NotificationType type);
    
    /**
     * 根据模板代码和租户ID查询所有类型的模板
     */
    List<NotificationTemplate> findByCodeAndTenantId(@Param("templateCode") String templateCode,
                                                     @Param("tenantId") Long tenantId);
    
    /**
     * 根据ID查询模板
     */
    NotificationTemplate findById(@Param("id") Long id);
    
    /**
     * 插入模板
     */
    void insert(NotificationTemplate template);
    
    /**
     * 更新模板
     */
    void update(NotificationTemplate template);
    
    /**
     * 删除模板
     */
    void deleteById(@Param("id") Long id);
}