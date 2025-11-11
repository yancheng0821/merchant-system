package com.merchant.server.businessservice.service;

import com.merchant.server.businessservice.entity.BusinessNotification;
import com.merchant.server.businessservice.mapper.BusinessNotificationMapper;
import com.merchant.server.businessservice.util.MessageUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

/**
 * 系统通知服务
 * 负责管理系统级别的通知，这些通知会应用到所有租户
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SystemNotificationService {

    private final BusinessNotificationMapper notificationMapper;
    private final MessageUtil messageUtil;

    // 系统时区配置 - 使用 UTC
    private static final ZoneId SYSTEM_ZONE = ZoneId.of("UTC");

    /**
     * 获取当前 UTC 时间
     */
    private LocalDateTime getCurrentTime() {
        return LocalDateTime.now(SYSTEM_ZONE);
    }

    /**
     * 获取所有系统通知（租户ID为null的通知）
     */
    public List<BusinessNotification> getAllSystemNotifications() {
        return notificationMapper.getSystemNotifications();
    }

    /**
     * 获取租户的系统通知副本（用于前端顶部通知栏显示）
     * 返回该租户所有的系统通知副本
     */
    public List<BusinessNotification> getTenantSystemNotifications(Long tenantId) {
        return notificationMapper.getTenantSystemNotifications(tenantId);
    }

    /**
     * 创建系统通知
     * 系统通知会被应用到所有租户，所以需要为每个现有租户创建一条通知记录
     */
    @Transactional
    public BusinessNotification createSystemNotification(BusinessNotification notification) {
        LocalDateTime now = getCurrentTime();

        // 设置系统通知固定属性
        notification.setNotificationType("SYSTEM_NOTIFICATION");
        notification.setTenantId(null); // 系统通知没有租户ID
        notification.setIsRead(false);
        notification.setCreatedAt(now);
        notification.setUpdatedAt(now);
        notification.setDeleted(false);

        // 默认使用英文标题和内容（兼容性）
        if (notification.getTitle() == null && notification.getTitleEn() != null) {
            notification.setTitle(notification.getTitleEn());
        }
        if (notification.getContent() == null && notification.getContentEn() != null) {
            notification.setContent(notification.getContentEn());
        }

        // 插入通知
        notificationMapper.insert(notification);

        log.info("System notification created with ID: {}", notification.getId());

        // 为所有租户创建副本
        createNotificationCopiesForAllTenants(notification);

        return notification;
    }

    /**
     * 为所有租户创建系统通知副本
     * 使用 business_id 存储主系统通知的 ID，便于后续更新和删除
     */
    @Transactional
    public void createNotificationCopiesForAllTenants(BusinessNotification template) {
        // 获取所有租户ID
        List<Long> tenantIds = notificationMapper.getAllTenantIds();

        LocalDateTime now = getCurrentTime();

        for (Long tenantId : tenantIds) {
            BusinessNotification copy = BusinessNotification.builder()
                    .tenantId(tenantId)
                    .notificationType("SYSTEM_NOTIFICATION")
                    .businessId(String.valueOf(template.getId())) // 使用主系统通知ID作为关联标识
                    .businessType("SYSTEM_NOTIFICATION")
                    .title(template.getTitle())
                    .titleEn(template.getTitleEn())
                    .titleZh(template.getTitleZh())
                    .content(template.getContent())
                    .contentEn(template.getContentEn())
                    .contentZh(template.getContentZh())
                    .level(template.getLevel())
                    .isRead(false)
                    .createdAt(now)
                    .updatedAt(now)
                    .deleted(false)
                    .build();

            notificationMapper.insert(copy);
        }

        log.info("Created {} copies of system notification for all tenants", tenantIds.size());
    }

    /**
     * 更新系统通知
     * 更新系统通知后，也需要更新所有租户的副本
     * 使用 business_id 精确匹配租户副本
     */
    @Transactional
    public BusinessNotification updateSystemNotification(BusinessNotification notification) {
        LocalDateTime now = getCurrentTime();

        // 先获取原始的系统通知
        BusinessNotification originalNotification = notificationMapper.getSystemNotificationById(notification.getId());

        if (originalNotification == null) {
            throw new RuntimeException(messageUtil.getMessage("error.system.notification.not.found", new Object[]{notification.getId()}));
        }

        notification.setUpdatedAt(now);

        // 更新主系统通知
        notificationMapper.updateSystemNotification(notification);

        // 使用 business_id 来精确匹配并更新所有租户的副本
        notificationMapper.updateSystemNotificationCopiesByBusinessId(
                String.valueOf(notification.getId()),
                notification.getTitle(),
                notification.getTitleEn(),
                notification.getTitleZh(),
                notification.getContent(),
                notification.getContentEn(),
                notification.getContentZh(),
                notification.getLevel(),
                now
        );

        log.info("System notification updated with ID: {}, updated {} tenant copies", notification.getId(), "all");

        return notification;
    }

    /**
     * 删除系统通知
     * 删除系统通知时，也删除所有租户的副本
     * 使用 business_id 精确匹配租户副本
     */
    @Transactional
    public void deleteSystemNotification(Long id) {
        // 先获取系统通知的详情
        BusinessNotification notification = notificationMapper.getSystemNotificationById(id);

        if (notification == null) {
            throw new RuntimeException(messageUtil.getMessage("error.system.notification.not.found", new Object[]{id}));
        }

        // 删除主系统通知（逻辑删除）
        LocalDateTime now = getCurrentTime();
        notificationMapper.deleteSystemNotification(id, now);

        // 使用 business_id 删除所有租户的副本
        notificationMapper.deleteSystemNotificationCopiesByBusinessId(
                String.valueOf(id),
                now
        );

        log.info("System notification deleted with ID: {}", id);
    }
}
