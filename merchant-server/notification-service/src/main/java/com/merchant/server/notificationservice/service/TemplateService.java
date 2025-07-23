package com.merchant.server.notificationservice.service;

import com.merchant.server.notificationservice.dto.NotificationTemplateDTO;
import com.merchant.server.notificationservice.entity.NotificationTemplate;

import java.util.List;
import java.util.Map;

public interface TemplateService {
    
    /**
     * 根据租户ID查询所有模板
     */
    List<NotificationTemplate> getTemplatesByTenantId(Long tenantId);
    
    /**
     * 根据租户ID和模板代码查询模板
     */
    NotificationTemplate getTemplate(Long tenantId, String templateCode, NotificationTemplate.NotificationType type);
    
    /**
     * 根据模板代码和租户ID查询所有类型的模板
     */
    List<NotificationTemplate> getTemplatesByCodeAndTenantId(String templateCode, Long tenantId);
    
    /**
     * 创建模板
     */
    NotificationTemplate createTemplate(NotificationTemplateDTO templateDTO);
    
    /**
     * 创建模板
     */
    NotificationTemplate createTemplate(NotificationTemplate template);
    
    /**
     * 更新模板
     */
    NotificationTemplate updateTemplate(Long id, NotificationTemplateDTO templateDTO);
    
    /**
     * 更新模板
     */
    NotificationTemplate updateTemplate(NotificationTemplate template);
    
    /**
     * 删除模板
     */
    void deleteTemplate(Long id);
    
    /**
     * 渲染模板内容
     */
    String renderTemplate(String templateContent, Map<String, Object> variables);
    
    /**
     * 初始化默认模板
     */
    void initDefaultTemplates(Long tenantId);
}