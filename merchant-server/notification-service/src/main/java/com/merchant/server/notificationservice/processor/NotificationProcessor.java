package com.merchant.server.notificationservice.processor;

import com.merchant.server.common.dto.NotificationRequest;
import com.merchant.server.common.enums.NotificationScene;
import com.merchant.server.notificationservice.entity.NotificationLog;
import com.merchant.server.notificationservice.entity.NotificationTemplate;
import com.merchant.server.notificationservice.mapper.NotificationLogMapper;
import com.merchant.server.notificationservice.service.EmailService;
import com.merchant.server.notificationservice.service.SmsService;
import com.merchant.server.notificationservice.service.TemplateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Map;

/**
 * 统一通知处理器
 * 根据业务场景自动处理邮件/短信发送和日志记录
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationProcessor {

    private final EmailService emailService;
    private final SmsService smsService;
    private final TemplateService templateService;
    private final NotificationLogMapper notificationLogMapper;

    /**
     * 处理通知请求
     * 统一入口，根据场景自动处理
     */
    public void process(NotificationRequest request) {
        try {
            // 1. 解析场景
            NotificationScene scene = NotificationScene.fromCode(request.getScene());

            // 2. 根据渠道和场景类型决定发送方式
            String channel = request.getChannel() != null ? request.getChannel() : scene.getNotificationType().name();

            if ("EMAIL".equals(channel) || "BOTH".equals(channel)) {
                processEmail(request, scene);
            }

            if ("SMS".equals(channel) || "BOTH".equals(channel)) {
                processSms(request, scene);
            }

        } catch (Exception e) {
            log.error("❌ 通知处理失败 - 场景: {}, 错误: {}", request.getScene(), e.getMessage());
            throw new RuntimeException("通知处理失败", e);
        }
    }

    /**
     * 处理邮件通知
     */
    private void processEmail(NotificationRequest request, NotificationScene scene) {
        NotificationLog notificationLog = null;

        try {
            // 确定租户ID（系统模板使用tenant_id=1）
            Long effectiveTenantId = scene.isSystemTemplate() ? 1L : request.getTenantId();

            // 确定模板代码（优先使用请求中的，否则使用场景默认的）
            String templateCode = request.getTemplateCode() != null
                    ? request.getTemplateCode()
                    : scene.getDefaultTemplateCode();

            if (templateCode == null) {
                throw new RuntimeException("场景 " + scene.getCode() + " 未配置模板代码");
            }

            // 创建日志记录
            notificationLog = createNotificationLog(request, scene, NotificationTemplate.NotificationType.EMAIL,
                    effectiveTenantId, templateCode);

            // 获取并渲染模板
            NotificationTemplate template = templateService.getTemplate(
                    effectiveTenantId, templateCode, NotificationTemplate.NotificationType.EMAIL);

            if (template == null) {
                throw new RuntimeException("模板不存在: " + templateCode + " (tenantId=" + effectiveTenantId + ")");
            }

            String subject = templateService.renderTemplate(template.getSubject(), request.getVariables());
            String content = templateService.renderTemplate(template.getContent(), request.getVariables());

            // 保存渲染后的内容
            notificationLog.setSubject(subject);
            notificationLog.setContent(content);

            // 发送邮件（日历按钮链接已嵌入邮件模板中，无需附件）
            // 如果请求中指定了fromName（如商户名称），使用它；否则使用系统默认
            boolean sent = emailService.sendEmail(request.getRecipient().getEmail(), subject, content, request.getFromName());

            // 更新状态
            if (sent) {
                notificationLog.setStatus(NotificationLog.NotificationStatus.SENT);
                notificationLog.setSentAt(LocalDateTime.now(ZoneOffset.UTC));
            } else {
                notificationLog.setStatus(NotificationLog.NotificationStatus.FAILED);
                notificationLog.setErrorMessage("邮件发送失败");
                log.error("❌ 邮件发送失败 - 收件人: {}", request.getRecipient().getEmail());
            }

            // 插入日志
            notificationLogMapper.insert(notificationLog);

        } catch (Exception e) {
            log.error("❌ 邮件通知失败 - 场景: {}, 错误: {}", scene.getCode(), e.getMessage());

            // 记录失败日志
            if (notificationLog != null && notificationLog.getId() == null) {
                try {
                    notificationLog.setStatus(NotificationLog.NotificationStatus.FAILED);
                    notificationLog.setErrorMessage(e.getMessage());
                    notificationLogMapper.insert(notificationLog);
                } catch (Exception ex) {
                    log.error("插入失败日志记录失败", ex);
                }
            }

            throw new RuntimeException("邮件通知处理失败", e);
        }
    }

    /**
     * 处理短信通知
     */
    private void processSms(NotificationRequest request, NotificationScene scene) {
        NotificationLog notificationLog = null;

        try {
            Long effectiveTenantId = scene.isSystemTemplate() ? 1L : request.getTenantId();

            // 确定模板代码
            String templateCode = request.getTemplateCode() != null
                    ? request.getTemplateCode()
                    : scene.getDefaultTemplateCode();

            // 创建日志记录
            notificationLog = createNotificationLog(request, scene, NotificationTemplate.NotificationType.SMS,
                    effectiveTenantId, templateCode);

            // 检查是否是 Walk-in Customer 的特殊号码，直接标记为成功
            if (isWalkInCustomerPhone(request.getRecipient().getPhone())) {
                notificationLog.setContent("Walk-in Customer - 无需发送短信");
                notificationLog.setStatus(NotificationLog.NotificationStatus.SENT);
                notificationLog.setSentAt(LocalDateTime.now(ZoneOffset.UTC));
                notificationLogMapper.insert(notificationLog);
                log.info("⏭️  跳过Walk-in Customer短信");
                return;
            }

            // 短信内容（从变量中获取或使用模板）
            String message;
            if (request.getVariables().containsKey("message")) {
                message = (String) request.getVariables().get("message");
            } else if (scene.useTemplate()) {
                // 如果场景使用模板，则渲染模板
                NotificationTemplate template = templateService.getTemplate(
                        effectiveTenantId, templateCode, NotificationTemplate.NotificationType.SMS);

                if (template != null) {
                    message = templateService.renderTemplate(template.getContent(), request.getVariables());
                } else {
                    throw new RuntimeException("短信模板不存在: " + templateCode);
                }
            } else {
                throw new RuntimeException("短信内容未提供");
            }

            notificationLog.setContent(message);

            // 将渲染后的message放入variables，供AWS SNS使用（阿里云使用场景和变量）
            Map<String, Object> variables = new java.util.HashMap<>(request.getVariables());
            variables.put("message", message);

            // 发送短信 - 使用带场景参数的方法
            boolean sent = smsService.sendSms(
                request.getRecipient().getPhone(),
                scene.getDefaultTemplateCode(),  // 场景标识
                variables                         // 模板变量（包含渲染后的message）
            );

            // 更新状态
            if (sent) {
                notificationLog.setStatus(NotificationLog.NotificationStatus.SENT);
                notificationLog.setSentAt(LocalDateTime.now(ZoneOffset.UTC));
            } else {
                notificationLog.setStatus(NotificationLog.NotificationStatus.FAILED);
                notificationLog.setErrorMessage("短信发送失败");
                log.error("❌ 短信发送失败 - 收件人: {}", request.getRecipient().getPhone());
            }

            // 插入日志
            notificationLogMapper.insert(notificationLog);

        } catch (Exception e) {
            log.error("❌ 短信通知失败 - 场景: {}, 错误: {}", scene.getCode(), e.getMessage());

            // 记录失败日志
            if (notificationLog != null && notificationLog.getId() == null) {
                try {
                    notificationLog.setStatus(NotificationLog.NotificationStatus.FAILED);
                    notificationLog.setErrorMessage(e.getMessage());
                    notificationLogMapper.insert(notificationLog);
                } catch (Exception ex) {
                    log.error("插入失败日志记录失败", ex);
                }
            }

            throw new RuntimeException("短信通知处理失败", e);
        }
    }

    /**
     * 创建通知日志记录
     */
    private NotificationLog createNotificationLog(NotificationRequest request, NotificationScene scene,
                                                    NotificationTemplate.NotificationType type,
                                                    Long effectiveTenantId, String templateCode) {
        NotificationLog log = new NotificationLog();
        log.setTenantId(effectiveTenantId);
        log.setTemplateCode(templateCode);
        log.setType(type);
        log.setRecipient(type == NotificationTemplate.NotificationType.EMAIL
                ? request.getRecipient().getEmail()
                : request.getRecipient().getPhone());
        log.setBusinessId(request.getBusinessId());
        // 使用 templateCode 作为 business_type（与 verification_codes 表保持一致）
        // 如果没有 templateCode，则使用 scene.name()（枚举名称）
        log.setBusinessType(templateCode != null ? templateCode : scene.name());
        log.setStatus(NotificationLog.NotificationStatus.PENDING);
        log.setRetryCount(0);
        log.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
        return log;
    }

    /**
     * 检查是否是 Walk-in Customer 的特殊号码
     * Walk-in Customer 使用 0000000000 作为占位符号码
     */
    private boolean isWalkInCustomerPhone(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            return false;
        }

        // 清理号码，只保留数字
        String cleanNumber = phoneNumber.replaceAll("[^0-9]", "");

        // 检查是否全是0（长度至少10位）
        return cleanNumber.matches("0{10,}");
    }
}
