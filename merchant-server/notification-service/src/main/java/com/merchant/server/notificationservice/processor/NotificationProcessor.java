package com.merchant.server.notificationservice.processor;

import com.merchant.server.common.dto.ApiResponse;
import com.merchant.server.common.dto.NotificationRequest;
import com.merchant.server.common.enums.NotificationScene;
import com.merchant.server.notificationservice.client.MerchantServiceClient;
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
    private final MerchantServiceClient merchantServiceClient;

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

            // 创建日志记录（先创建，以便记录所有发送尝试）
            notificationLog = createNotificationLog(request, scene, NotificationTemplate.NotificationType.EMAIL,
                    effectiveTenantId, templateCode != null ? templateCode : scene.name());

            // 检查是否是 Walk-in 客户的邮箱，如果是则跳过发送
            if (isWalkInCustomerEmail(request.getRecipient().getEmail())) {
                notificationLog.setContent("Walk-in Customer - Email skipped");
                notificationLog.setStatus(NotificationLog.NotificationStatus.SENT);
                notificationLog.setSentAt(LocalDateTime.now(ZoneOffset.UTC));
                notificationLogMapper.insert(notificationLog);
                log.info("⏭️  Skip Walk-in Customer email - email: {}", request.getRecipient().getEmail());
                return;
            }

            String subject;
            String content;

            // 营销通知场景：直接使用 variables 中的 subject 和 content（用户自定义内容）
            if (scene == NotificationScene.MARKETING_REMINDER) {
                subject = (String) request.getVariables().get("subject");
                content = (String) request.getVariables().get("content");

                if (subject == null || content == null) {
                    throw new RuntimeException("营销通知缺少 subject 或 content");
                }
            } else {
                // 其他场景：使用模板系统
                if (templateCode == null) {
                    throw new RuntimeException("场景 " + scene.getCode() + " 未配置模板代码");
                }

                // 获取并渲染模板
                NotificationTemplate template = templateService.getTemplate(
                        effectiveTenantId, templateCode, NotificationTemplate.NotificationType.EMAIL);

                if (template == null) {
                    throw new RuntimeException("模板不存在: " + templateCode + " (tenantId=" + effectiveTenantId + ")");
                }

                subject = templateService.renderTemplate(template.getSubject(), request.getVariables());
                content = templateService.renderTemplate(template.getContent(), request.getVariables());
            }

            // 保存渲染后的内容
            notificationLog.setSubject(subject);
            notificationLog.setContent(content);

            // 检查邮件数量限制（仅对需要计入用量的场景）
            // 放在内容生成之后，这样即使超限也能保存原始内容用于重试
            if (scene.shouldCountUsage() && request.getTenantId() != null) {
                if (!checkEmailLimit(request.getTenantId())) {
                    log.warn("⚠️ Email limit reached - tenantId: {}, scene: {}", request.getTenantId(), scene.getCode());
                    notificationLog.setStatus(NotificationLog.NotificationStatus.FAILED);
                    notificationLog.setErrorMessage("Monthly email quota exceeded");
                    notificationLogMapper.insert(notificationLog);
                    return;
                }
            }

            // 发送邮件（日历按钮链接已嵌入邮件模板中，无需附件）
            // 如果请求中指定了fromName（如商户名称），使用它；否则使用系统默认
            boolean sent = emailService.sendEmail(request.getRecipient().getEmail(), subject, content, request.getFromName());

            // 更新状态
            if (sent) {
                notificationLog.setStatus(NotificationLog.NotificationStatus.SENT);
                notificationLog.setSentAt(LocalDateTime.now(ZoneOffset.UTC));

                // 增加邮件计数（仅对需要计入用量的场景）
                if (scene.shouldCountUsage() && request.getTenantId() != null) {
                    try {
                        merchantServiceClient.incrementEmailCount(request.getTenantId());
                        log.debug("📧 增加邮件计数 - 租户ID: {}", request.getTenantId());
                    } catch (Exception ex) {
                        log.warn("增加邮件计数失败 - 租户ID: {}", request.getTenantId(), ex);
                    }
                }
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
                    effectiveTenantId, templateCode != null ? templateCode : scene.name());

            // 检查是否是 Walk-in Customer 的特殊号码，直接标记为成功
            if (isWalkInCustomerPhone(request.getRecipient().getPhone())) {
                notificationLog.setContent("Walk-in Customer - SMS skipped");
                notificationLog.setStatus(NotificationLog.NotificationStatus.SENT);
                notificationLog.setSentAt(LocalDateTime.now(ZoneOffset.UTC));
                notificationLogMapper.insert(notificationLog);
                log.info("⏭️  Skip Walk-in Customer SMS - phone: {}", request.getRecipient().getPhone());
                return;
            }

            // 短信内容
            String message;

            // 营销通知场景：直接使用 variables 中的 content（用户自定义内容）
            if (scene == NotificationScene.MARKETING_REMINDER) {
                message = (String) request.getVariables().get("content");
                if (message == null) {
                    throw new RuntimeException("营销通知缺少 content");
                }
            } else if (request.getVariables().containsKey("message")) {
                // 从变量中获取
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

            // 检查短信数量限制（仅对需要计入用量的场景）
            // Basic套餐的maxSmsPerMonth=0，表示不包含短信功能
            // 放在内容生成之后，这样即使超限也能保存原始内容用于重试
            if (scene.shouldCountUsage() && request.getTenantId() != null) {
                if (!checkSmsLimit(request.getTenantId())) {
                    log.warn("⚠️ SMS limit reached or not included - tenantId: {}, scene: {}", request.getTenantId(), scene.getCode());
                    notificationLog.setStatus(NotificationLog.NotificationStatus.FAILED);
                    notificationLog.setErrorMessage("SMS not included in plan or monthly quota exceeded");
                    notificationLogMapper.insert(notificationLog);
                    return;
                }
            }

            // 将渲染后的message放入variables，供AWS SNS使用（阿里云使用场景和变量）
            Map<String, Object> variables = new java.util.HashMap<>(request.getVariables());
            variables.put("message", message);

            // 发送短信 - 使用带场景参数的方法
            boolean sent = smsService.sendSms(
                request.getRecipient().getPhone(),
                templateCode != null ? templateCode : scene.name(),  // 场景标识
                variables                         // 模板变量（包含渲染后的message）
            );

            // 更新状态
            if (sent) {
                notificationLog.setStatus(NotificationLog.NotificationStatus.SENT);
                notificationLog.setSentAt(LocalDateTime.now(ZoneOffset.UTC));

                // 增加短信计数（仅对需要计入用量的场景）
                if (scene.shouldCountUsage() && request.getTenantId() != null) {
                    try {
                        merchantServiceClient.incrementSmsCount(request.getTenantId());
                        log.debug("📱 增加短信计数 - 租户ID: {}", request.getTenantId());
                    } catch (Exception ex) {
                        log.warn("增加短信计数失败 - 租户ID: {}", request.getTenantId(), ex);
                    }
                }
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
     * 支持格式: 0000000000, +10000000000, 10000000000
     */
    private boolean isWalkInCustomerPhone(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            return false;
        }

        // 清理号码，只保留数字
        String cleanNumber = phoneNumber.replaceAll("[^0-9]", "");

        // 检查是否全是0（长度至少10位）或者以10个0结尾（带国家代码的情况）
        return cleanNumber.matches("0{10,}") || cleanNumber.endsWith("0000000000");
    }

    /**
     * 检查是否是 Walk-in Customer 的邮箱
     * Walk-in Customer 邮箱格式: walkinXX@vamerchant.app（XX是商户ID）
     */
    private boolean isWalkInCustomerEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }
        // 检查邮箱格式: walkinXX@vamerchant.app
        return email.toLowerCase().matches("walkin\\d+@vamerchant\\.app");
    }

    /**
     * 检查邮件数量是否在限制内
     * @param tenantId 租户ID
     * @return true 如果可以发送（未达上限或无限制），false 如果已达上限
     */
    private boolean checkEmailLimit(Long tenantId) {
        try {
            // 获取邮件限制
            ApiResponse<Integer> limitResponse = merchantServiceClient.getTenantMaxEmailsPerMonth(tenantId);
            if (limitResponse == null || limitResponse.getData() == null) {
                log.warn("获取邮件限制失败，默认允许发送 - 租户ID: {}", tenantId);
                return true;
            }
            Integer maxEmails = limitResponse.getData();

            // -1 表示无限制
            if (maxEmails == -1) {
                return true;
            }

            // 获取当月使用量
            ApiResponse<Map<String, Object>> statsResponse = merchantServiceClient.getCurrentMonthStats(tenantId);
            int currentCount = 0;
            if (statsResponse != null && statsResponse.getData() != null) {
                Object countObj = statsResponse.getData().get("emailCount");
                if (countObj instanceof Number) {
                    currentCount = ((Number) countObj).intValue();
                }
            }

            boolean withinLimit = currentCount < maxEmails;
            if (!withinLimit) {
                log.info("邮件数量已达上限 - 租户ID: {}, 当前: {}, 限制: {}", tenantId, currentCount, maxEmails);
            }
            return withinLimit;

        } catch (Exception e) {
            log.warn("检查邮件限制时出错，默认允许发送 - 租户ID: {}", tenantId, e);
            return true;
        }
    }

    /**
     * 检查短信数量是否在限制内
     * @param tenantId 租户ID
     * @return true 如果可以发送（未达上限或无限制），false 如果已达上限或套餐不包含短信
     */
    private boolean checkSmsLimit(Long tenantId) {
        try {
            // 获取短信限制
            ApiResponse<Integer> limitResponse = merchantServiceClient.getTenantMaxSmsPerMonth(tenantId);
            if (limitResponse == null || limitResponse.getData() == null) {
                log.warn("获取短信限制失败，默认不允许发送 - 租户ID: {}", tenantId);
                return false;  // 短信功能默认关闭
            }
            Integer maxSms = limitResponse.getData();

            // 0 表示套餐不包含短信功能（如Basic套餐）
            if (maxSms == 0) {
                log.info("套餐不包含短信功能 - 租户ID: {}", tenantId);
                return false;
            }

            // -1 表示无限制
            if (maxSms == -1) {
                return true;
            }

            // 获取当月使用量
            ApiResponse<Map<String, Object>> statsResponse = merchantServiceClient.getCurrentMonthStats(tenantId);
            int currentCount = 0;
            if (statsResponse != null && statsResponse.getData() != null) {
                Object countObj = statsResponse.getData().get("smsCount");
                if (countObj instanceof Number) {
                    currentCount = ((Number) countObj).intValue();
                }
            }

            boolean withinLimit = currentCount < maxSms;
            if (!withinLimit) {
                log.info("短信数量已达上限 - 租户ID: {}, 当前: {}, 限制: {}", tenantId, currentCount, maxSms);
            }
            return withinLimit;

        } catch (Exception e) {
            log.warn("检查短信限制时出错，默认不允许发送 - 租户ID: {}", tenantId, e);
            return false;  // 短信功能出错时默认关闭
        }
    }
}
