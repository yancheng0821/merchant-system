package com.merchant.server.notificationservice.service.impl;

import com.merchant.server.notificationservice.dto.NotificationTemplateDTO;
import com.merchant.server.notificationservice.entity.NotificationTemplate;
import com.merchant.server.notificationservice.mapper.NotificationTemplateMapper;
import com.merchant.server.notificationservice.service.TemplateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class TemplateServiceImpl implements TemplateService {

    private final NotificationTemplateMapper templateMapper;

    @Override
    public List<NotificationTemplate> getTemplatesByTenantId(Long tenantId) {
        return templateMapper.findByTenantId(tenantId);
    }

    @Override
    public NotificationTemplate getTemplate(Long tenantId, String templateCode, NotificationTemplate.NotificationType type) {
        return templateMapper.findByTenantIdAndCode(tenantId, templateCode, type);
    }

    @Override
    public List<NotificationTemplate> getTemplatesByCodeAndTenantId(String templateCode, Long tenantId) {
        return templateMapper.findByCodeAndTenantId(templateCode, tenantId);
    }

    @Override
    public NotificationTemplate createTemplate(NotificationTemplateDTO templateDTO) {
        NotificationTemplate template = new NotificationTemplate();
        template.setTenantId(templateDTO.getTenantId());
        template.setTemplateCode(templateDTO.getTemplateCode());
        template.setTemplateName(templateDTO.getTemplateName());
        template.setType(templateDTO.getType());
        template.setSubject(templateDTO.getSubject());
        template.setContent(templateDTO.getContent());
        template.setStatus(templateDTO.getStatus());
        template.setCreatedAt(LocalDateTime.now());
        template.setUpdatedAt(LocalDateTime.now());
        
        templateMapper.insert(template);
        return template;
    }

    @Override
    public NotificationTemplate createTemplate(NotificationTemplate template) {
        template.setCreatedAt(LocalDateTime.now());
        template.setUpdatedAt(LocalDateTime.now());
        templateMapper.insert(template);
        return template;
    }

    @Override
    public NotificationTemplate updateTemplate(Long id, NotificationTemplateDTO templateDTO) {
        NotificationTemplate template = templateMapper.findById(id);
        if (template == null) {
            throw new RuntimeException("模板不存在");
        }
        
        template.setTemplateCode(templateDTO.getTemplateCode());
        template.setTemplateName(templateDTO.getTemplateName());
        template.setType(templateDTO.getType());
        template.setSubject(templateDTO.getSubject());
        template.setContent(templateDTO.getContent());
        template.setStatus(templateDTO.getStatus());
        template.setUpdatedAt(LocalDateTime.now());
        
        templateMapper.update(template);
        return template;
    }

    @Override
    public NotificationTemplate updateTemplate(NotificationTemplate template) {
        template.setUpdatedAt(LocalDateTime.now());
        templateMapper.update(template);
        return template;
    }

    @Override
    public void deleteTemplate(Long id) {
        templateMapper.deleteById(id);
    }

    @Override
    public String renderTemplate(String templateContent, Map<String, Object> variables) {
        if (templateContent == null || variables == null || variables.isEmpty()) {
            return templateContent;
        }
        
        String result = templateContent;
        Pattern pattern = Pattern.compile("\\$\\{([^}]+)\\}");
        Matcher matcher = pattern.matcher(templateContent);
        
        while (matcher.find()) {
            String variableName = matcher.group(1);
            Object value = variables.get(variableName);
            if (value != null) {
                result = result.replace("${" + variableName + "}", value.toString());
            }
        }
        
        return result;
    }

    @Override
    public void initDefaultTemplates(Long tenantId) {
        // 检查是否已经存在默认模板
        List<NotificationTemplate> existingTemplates = templateMapper.findByTenantId(tenantId);
        if (!existingTemplates.isEmpty()) {
            log.info("租户 {} 已存在通知模板，跳过初始化", tenantId);
            return;
        }
        
        log.info("为租户 {} 初始化默认通知模板", tenantId);
        
        // 创建默认模板
        createDefaultTemplate(tenantId, "APPOINTMENT_CONFIRMED", "预约确认短信模板", NotificationTemplate.NotificationType.SMS,
            null, "【${businessName}】尊敬的${customerName}，您的预约已确认！预约时间：${appointmentDate} ${appointmentTime}，服务项目：${serviceName}，服务人员：${staffName}。如需取消或修改，请致电${businessPhone}。");
        
        createDefaultTemplate(tenantId, "APPOINTMENT_CONFIRMED", "预约确认邮件模板", NotificationTemplate.NotificationType.EMAIL,
            "预约确认通知 - ${businessName}", 
            "<html><body><h2>预约确认通知</h2><p>尊敬的 ${customerName}，</p><p>您的预约已成功确认，详情如下：</p><table border=\"1\" style=\"border-collapse: collapse; width: 100%;\"><tr><td><strong>预约时间</strong></td><td>${appointmentDate} ${appointmentTime}</td></tr><tr><td><strong>服务项目</strong></td><td>${serviceName}</td></tr><tr><td><strong>服务人员</strong></td><td>${staffName}</td></tr><tr><td><strong>预计时长</strong></td><td>${duration}</td></tr><tr><td><strong>费用</strong></td><td>${totalAmount}</td></tr></table><p><strong>商家信息：</strong></p><p>名称：${businessName}<br/>地址：${businessAddress}<br/>电话：${businessPhone}</p><p>如需取消或修改预约，请及时联系我们。</p><p>感谢您的信任！</p></body></html>");
        
        createDefaultTemplate(tenantId, "APPOINTMENT_CANCELLED", "预约取消短信模板", NotificationTemplate.NotificationType.SMS,
            null, "【${businessName}】尊敬的${customerName}，您的预约已取消。原预约时间：${appointmentDate} ${appointmentTime}，服务项目：${serviceName}。如有疑问请致电${businessPhone}。期待您的再次光临！");
        
        createDefaultTemplate(tenantId, "APPOINTMENT_CANCELLED", "预约取消邮件模板", NotificationTemplate.NotificationType.EMAIL,
            "预约取消通知 - ${businessName}",
            "<html><body><h2>预约取消通知</h2><p>尊敬的 ${customerName}，</p><p>您的预约已被取消，详情如下：</p><table border=\"1\" style=\"border-collapse: collapse; width: 100%;\"><tr><td><strong>原预约时间</strong></td><td>${appointmentDate} ${appointmentTime}</td></tr><tr><td><strong>服务项目</strong></td><td>${serviceName}</td></tr><tr><td><strong>服务人员</strong></td><td>${staffName}</td></tr></table><p><strong>商家信息：</strong></p><p>名称：${businessName}<br/>地址：${businessAddress}<br/>电话：${businessPhone}</p><p>如有任何疑问，请随时联系我们。期待您的再次光临！</p></body></html>");
        
        createDefaultTemplate(tenantId, "APPOINTMENT_COMPLETED", "预约完成短信模板", NotificationTemplate.NotificationType.SMS,
            null, "【${businessName}】尊敬的${customerName}，您的预约已完成！服务时间：${appointmentDate} ${appointmentTime}，服务项目：${serviceName}，服务人员：${staffName}。感谢您的光临，期待下次为您服务！");
        
        createDefaultTemplate(tenantId, "APPOINTMENT_COMPLETED", "预约完成邮件模板", NotificationTemplate.NotificationType.EMAIL,
            "服务完成通知 - ${businessName}",
            "<html><body><h2>服务完成通知</h2><p>尊敬的 ${customerName}，</p><p>您的预约服务已完成，详情如下：</p><table border=\"1\" style=\"border-collapse: collapse; width: 100%;\"><tr><td><strong>服务时间</strong></td><td>${appointmentDate} ${appointmentTime}</td></tr><tr><td><strong>服务项目</strong></td><td>${serviceName}</td></tr><tr><td><strong>服务人员</strong></td><td>${staffName}</td></tr><tr><td><strong>服务时长</strong></td><td>${duration}</td></tr><tr><td><strong>费用</strong></td><td>${totalAmount}</td></tr></table><p><strong>商家信息：</strong></p><p>名称：${businessName}<br/>地址：${businessAddress}<br/>电话：${businessPhone}</p><p>感谢您选择我们的服务！期待下次为您服务！</p></body></html>");
        
        createDefaultTemplate(tenantId, "APPOINTMENT_REMINDER", "预约提醒短信模板", NotificationTemplate.NotificationType.SMS,
            null, "【${businessName}】温馨提醒：${customerName}，您有一个预约即将到来。预约时间：${appointmentDate} ${appointmentTime}，服务项目：${serviceName}，服务人员：${staffName}。请准时到达，如需调整请致电${businessPhone}。");
        
        createDefaultTemplate(tenantId, "APPOINTMENT_REMINDER", "预约提醒邮件模板", NotificationTemplate.NotificationType.EMAIL,
            "预约提醒 - ${businessName}",
            "<html><body><h2>预约提醒</h2><p>尊敬的 ${customerName}，</p><p>温馨提醒您有一个预约即将到来：</p><table border=\"1\" style=\"border-collapse: collapse; width: 100%;\"><tr><td><strong>预约时间</strong></td><td>${appointmentDate} ${appointmentTime}</td></tr><tr><td><strong>服务项目</strong></td><td>${serviceName}</td></tr><tr><td><strong>服务人员</strong></td><td>${staffName}</td></tr><tr><td><strong>预计时长</strong></td><td>${duration}</td></tr></table><p><strong>商家信息：</strong></p><p>名称：${businessName}<br/>地址：${businessAddress}<br/>电话：${businessPhone}</p><p>请准时到达，如需调整预约时间，请提前联系我们。</p><p>期待为您服务！</p></body></html>");
    }
    
    private void createDefaultTemplate(Long tenantId, String templateCode, String templateName, 
                                     NotificationTemplate.NotificationType type, String subject, String content) {
        NotificationTemplate template = new NotificationTemplate();
        template.setTenantId(tenantId);
        template.setTemplateCode(templateCode);
        template.setTemplateName(templateName);
        template.setType(type);
        template.setSubject(subject);
        template.setContent(content);
        template.setStatus(NotificationTemplate.TemplateStatus.ACTIVE);
        template.setCreatedAt(LocalDateTime.now());
        template.setUpdatedAt(LocalDateTime.now());
        
        templateMapper.insert(template);
    }
}