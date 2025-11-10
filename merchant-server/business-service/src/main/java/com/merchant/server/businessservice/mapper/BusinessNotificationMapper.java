package com.merchant.server.businessservice.mapper;

import com.merchant.server.businessservice.entity.BusinessNotification;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 业务通知Mapper
 */
@Mapper
public interface BusinessNotificationMapper {
    
    /**
     * 获取最近的通知
     * 使用 XML 配置的 ResultMap 以支持多语言字段映射
     */
    List<BusinessNotification> getRecentNotifications(@Param("tenantId") Long tenantId,
                                                      @Param("limit") Integer limit);

    /**
     * 获取未读通知数量
     */
    Integer getUnreadCount(@Param("tenantId") Long tenantId);

    /**
     * 获取指定时间后的通知
     * 使用 XML 配置的 ResultMap 以支持多语言字段映射
     */
    List<BusinessNotification> getNotificationsAfter(@Param("tenantId") Long tenantId,
                                                     @Param("afterTime") LocalDateTime afterTime);
    
    /**
     * 标记通知为已读
     */
    @Update("UPDATE business_notifications " +
            "SET is_read = 1, updated_at = #{updatedAt} " +
            "WHERE tenant_id = #{tenantId} " +
            "AND id IN (${notificationIds})")
    void markAsRead(@Param("tenantId") Long tenantId,
                   @Param("notificationIds") String notificationIds,
                   @Param("updatedAt") LocalDateTime updatedAt);
    
    /**
     * 插入通知
     */
    @Insert("INSERT INTO business_notifications " +
            "(tenant_id, notification_type, title, title_en, title_zh, content, content_en, content_zh, level, " +
            "business_id, business_type, related_person, related_service, " +
            "related_time, is_read, created_at, updated_at, deleted) " +
            "VALUES (#{tenantId}, #{notificationType}, #{title}, #{titleEn}, #{titleZh}, #{content}, #{contentEn}, #{contentZh}, #{level}, " +
            "#{businessId}, #{businessType}, #{relatedPerson}, #{relatedService}, " +
            "#{relatedTime}, #{isRead}, #{createdAt}, #{updatedAt}, #{deleted})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(BusinessNotification notification);

    /**
     * 根据条件查询通知列表
     */
    @Select("SELECT * FROM business_notifications " +
            "WHERE business_id = #{businessId} " +
            "AND notification_type = #{notificationType} " +
            "AND created_at > #{createdAfter} " +
            "AND deleted = 0")
    List<BusinessNotification> selectByBusinessIdAndType(@Param("businessId") String businessId,
                                                         @Param("notificationType") String notificationType,
                                                         @Param("createdAfter") LocalDateTime createdAfter);

    // ================== 系统通知相关方法 ==================

    /**
     * 获取所有系统通知（tenant_id为null的通知）
     */
    List<BusinessNotification> getSystemNotifications();

    /**
     * 根据ID获取系统通知
     */
    BusinessNotification getSystemNotificationById(@Param("id") Long id);

    /**
     * 获取所有租户ID
     */
    @Select("SELECT DISTINCT tenant_id FROM business_notifications WHERE tenant_id IS NOT NULL AND deleted = 0")
    List<Long> getAllTenantIds();

    /**
     * 更新系统通知
     */
    void updateSystemNotification(BusinessNotification notification);

    /**
     * 更新所有租户的系统通知副本
     */
    void updateSystemNotificationCopies(BusinessNotification notification);

    /**
     * 使用原始标题更新所有租户的系统通知副本
     */
    void updateSystemNotificationCopiesByOriginalTitle(
            @Param("originalTitleEn") String originalTitleEn,
            @Param("originalTitleZh") String originalTitleZh,
            @Param("title") String title,
            @Param("titleEn") String titleEn,
            @Param("titleZh") String titleZh,
            @Param("content") String content,
            @Param("contentEn") String contentEn,
            @Param("contentZh") String contentZh,
            @Param("level") String level,
            @Param("updatedAt") LocalDateTime updatedAt
    );

    /**
     * 使用 business_id 更新所有租户的系统通知副本（精确匹配）
     */
    void updateSystemNotificationCopiesByBusinessId(
            @Param("businessId") String businessId,
            @Param("title") String title,
            @Param("titleEn") String titleEn,
            @Param("titleZh") String titleZh,
            @Param("content") String content,
            @Param("contentEn") String contentEn,
            @Param("contentZh") String contentZh,
            @Param("level") String level,
            @Param("updatedAt") LocalDateTime updatedAt
    );

    /**
     * 删除系统通知（逻辑删除）
     */
    void deleteSystemNotification(@Param("id") Long id, @Param("updatedAt") LocalDateTime updatedAt);

    /**
     * 删除所有租户的系统通知副本（逻辑删除）
     */
    void deleteSystemNotificationCopiesByTitleAndContent(
            @Param("titleEn") String titleEn,
            @Param("titleZh") String titleZh,
            @Param("contentEn") String contentEn,
            @Param("contentZh") String contentZh,
            @Param("updatedAt") LocalDateTime updatedAt
    );

    /**
     * 使用 business_id 删除所有租户的系统通知副本（逻辑删除，精确匹配）
     */
    void deleteSystemNotificationCopiesByBusinessId(
            @Param("businessId") String businessId,
            @Param("updatedAt") LocalDateTime updatedAt
    );
}