package com.merchant.server.notificationservice.service.impl;

import com.merchant.server.notificationservice.dto.NotificationTemplateDTO;
import com.merchant.server.notificationservice.entity.NotificationTemplate;
import com.merchant.server.notificationservice.mapper.NotificationTemplateMapper;
import com.merchant.server.notificationservice.service.TemplateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
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
    public NotificationTemplate getTemplateById(Long id) {
        return templateMapper.findById(id);
    }

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
        template.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
        template.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
        
        templateMapper.insert(template);
        return template;
    }

    @Override
    public NotificationTemplate createTemplate(NotificationTemplate template) {
        template.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
        template.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
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
        template.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
        
        templateMapper.update(template);
        return template;
    }

    @Override
    public NotificationTemplate updateTemplate(NotificationTemplate template) {
        template.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
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
        initDefaultTemplates(tenantId, "zh");
    }
    
    @Override
    public void initDefaultTemplates(Long tenantId, String language) {
        // 检查是否已经存在默认模板
        List<NotificationTemplate> existingTemplates = templateMapper.findByTenantId(tenantId);
        if (!existingTemplates.isEmpty()) {
            log.info("租户 {} 已存在通知模板，跳过初始化", tenantId);
            return;
        }

        log.info("为租户 {} 初始化默认通知模板，从系统模板（tenant_id=1）复制商户级模板", tenantId);

        // 从 tenant_id=1 复制所有商户级（TENANT scope）模板
        // 根据 NotificationScene 枚举，商户级模板包括：
        // - PACKAGE_VERIFICATION
        // - APPOINTMENT_CONFIRMATION
        // - APPOINTMENT_CANCELLATION
        // - APPOINTMENT_COMPLETION
        // - PACKAGE_PURCHASE_SUCCESS
        // - APPOINTMENT_REMINDER
        // - APPOINTMENT_CHECKOUT_STAFF (员工预约结账通知)
        // - STAFF_DAILY_SUMMARY (员工每日预约汇总)

        List<String> tenantScopedTemplateCodes = List.of(
            "PACKAGE_VERIFICATION",
            "APPOINTMENT_CONFIRMATION",
            "APPOINTMENT_CANCELLATION",
            "APPOINTMENT_COMPLETION",
            "PACKAGE_PURCHASE_SUCCESS",
            "APPOINTMENT_REMINDER",
            "APPOINTMENT_CHECKOUT_STAFF",
            "STAFF_DAILY_SUMMARY"
        );

        int copiedCount = 0;
        for (String templateCode : tenantScopedTemplateCodes) {
            // 获取系统模板（tenant_id=1）中该代码的所有模板（SMS和EMAIL）
            List<NotificationTemplate> systemTemplates = templateMapper.findByCodeAndTenantId(templateCode, 1L);

            for (NotificationTemplate systemTemplate : systemTemplates) {
                // 复制模板到新租户
                NotificationTemplate newTemplate = new NotificationTemplate();
                newTemplate.setTenantId(tenantId);
                newTemplate.setTemplateCode(systemTemplate.getTemplateCode());
                newTemplate.setTemplateName(systemTemplate.getTemplateName());
                newTemplate.setType(systemTemplate.getType());
                newTemplate.setSubject(systemTemplate.getSubject());
                newTemplate.setContent(systemTemplate.getContent());
                newTemplate.setStatus(NotificationTemplate.TemplateStatus.ACTIVE);
                newTemplate.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
                newTemplate.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));

                templateMapper.insert(newTemplate);
                copiedCount++;

                log.info("已复制模板 - 租户: {}, 代码: {}, 类型: {}, 名称: {}",
                    tenantId, templateCode, systemTemplate.getType(), systemTemplate.getTemplateName());
            }
        }

        log.info("租户 {} 初始化完成，共复制 {} 个商户级通知模板", tenantId, copiedCount);
    }
    
    private void initChineseTemplates(Long tenantId) {
        // 创建中文默认模板
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
        template.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
        template.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
        
        templateMapper.insert(template);
    }
    
    private void initEnglishTemplates(Long tenantId) {
        // Create English templates
        createDefaultTemplate(tenantId, "APPOINTMENT_CONFIRMED", "Appointment Confirmation SMS Template", NotificationTemplate.NotificationType.SMS,
            null, "【${businessName}】Dear ${customerName}, your appointment is confirmed! Date: ${appointmentDate} ${appointmentTime}, Service: ${serviceName}, Staff: ${staffName}. To cancel or modify, please call ${businessPhone}.");
        
        createDefaultTemplate(tenantId, "APPOINTMENT_CONFIRMED", "Appointment Confirmation Email Template", NotificationTemplate.NotificationType.EMAIL,
            "Appointment Confirmation - ${businessName}", 
            "<html><body><h2>Appointment Confirmation</h2><p>Dear ${customerName},</p><p>Your appointment has been successfully confirmed. Details below:</p><table border=\"1\" style=\"border-collapse: collapse; width: 100%;\"><tr><td><strong>Appointment Time</strong></td><td>${appointmentDate} ${appointmentTime}</td></tr><tr><td><strong>Service</strong></td><td>${serviceName}</td></tr><tr><td><strong>Staff</strong></td><td>${staffName}</td></tr><tr><td><strong>Duration</strong></td><td>${duration}</td></tr><tr><td><strong>Amount</strong></td><td>${totalAmount}</td></tr></table><p><strong>Business Information:</strong></p><p>Name: ${businessName}<br/>Address: ${businessAddress}<br/>Phone: ${businessPhone}</p><p>To cancel or modify your appointment, please contact us.</p><p>Thank you for your trust!</p></body></html>");
        
        createDefaultTemplate(tenantId, "APPOINTMENT_CANCELLED", "Appointment Cancellation SMS Template", NotificationTemplate.NotificationType.SMS,
            null, "【${businessName}】Dear ${customerName}, your appointment has been cancelled. Original time: ${appointmentDate} ${appointmentTime}, Service: ${serviceName}. For questions, call ${businessPhone}. We look forward to serving you again!");
        
        createDefaultTemplate(tenantId, "APPOINTMENT_CANCELLED", "Appointment Cancellation Email Template", NotificationTemplate.NotificationType.EMAIL,
            "Appointment Cancellation - ${businessName}",
            "<html><body><h2>Appointment Cancellation Notice</h2><p>Dear ${customerName},</p><p>Your appointment has been cancelled. Details below:</p><table border=\"1\" style=\"border-collapse: collapse; width: 100%;\"><tr><td><strong>Original Time</strong></td><td>${appointmentDate} ${appointmentTime}</td></tr><tr><td><strong>Service</strong></td><td>${serviceName}</td></tr><tr><td><strong>Staff</strong></td><td>${staffName}</td></tr></table><p><strong>Business Information:</strong></p><p>Name: ${businessName}<br/>Address: ${businessAddress}<br/>Phone: ${businessPhone}</p><p>If you have any questions, please contact us. We look forward to serving you again!</p></body></html>");
        
        createDefaultTemplate(tenantId, "APPOINTMENT_COMPLETED", "Appointment Completion SMS Template", NotificationTemplate.NotificationType.SMS,
            null, "【${businessName}】Dear ${customerName}, your appointment is complete! Time: ${appointmentDate} ${appointmentTime}, Service: ${serviceName}, Staff: ${staffName}. Thank you for visiting, we look forward to serving you again!");
        
        createDefaultTemplate(tenantId, "APPOINTMENT_COMPLETED", "Appointment Completion Email Template", NotificationTemplate.NotificationType.EMAIL,
            "Service Completion - ${businessName}",
            "<html><body><h2>Service Completion Notice</h2><p>Dear ${customerName},</p><p>Your service has been completed. Details below:</p><table border=\"1\" style=\"border-collapse: collapse; width: 100%;\"><tr><td><strong>Service Time</strong></td><td>${appointmentDate} ${appointmentTime}</td></tr><tr><td><strong>Service</strong></td><td>${serviceName}</td></tr><tr><td><strong>Staff</strong></td><td>${staffName}</td></tr><tr><td><strong>Duration</strong></td><td>${duration}</td></tr><tr><td><strong>Amount</strong></td><td>${totalAmount}</td></tr></table><p><strong>Business Information:</strong></p><p>Name: ${businessName}<br/>Address: ${businessAddress}<br/>Phone: ${businessPhone}</p><p>Thank you for choosing our service! We look forward to serving you again!</p></body></html>");
        
        createDefaultTemplate(tenantId, "APPOINTMENT_REMINDER", "Appointment Reminder SMS Template", NotificationTemplate.NotificationType.SMS,
            null, "【${businessName}】Reminder: ${customerName}, you have an upcoming appointment. Time: ${appointmentDate} ${appointmentTime}, Service: ${serviceName}, Staff: ${staffName}. Please arrive on time. To reschedule, call ${businessPhone}.");
        
        createDefaultTemplate(tenantId, "APPOINTMENT_REMINDER", "Appointment Reminder Email Template", NotificationTemplate.NotificationType.EMAIL,
            "Appointment Reminder - ${businessName}",
            "<html><body><h2>Appointment Reminder</h2><p>Dear ${customerName},</p><p>This is a reminder of your upcoming appointment:</p><table border=\"1\" style=\"border-collapse: collapse; width: 100%;\"><tr><td><strong>Appointment Time</strong></td><td>${appointmentDate} ${appointmentTime}</td></tr><tr><td><strong>Service</strong></td><td>${serviceName}</td></tr><tr><td><strong>Staff</strong></td><td>${staffName}</td></tr><tr><td><strong>Duration</strong></td><td>${duration}</td></tr></table><p><strong>Business Information:</strong></p><p>Name: ${businessName}<br/>Address: ${businessAddress}<br/>Phone: ${businessPhone}</p><p>Please arrive on time. To reschedule, please contact us in advance.</p><p>We look forward to serving you!</p></body></html>");
    }
}