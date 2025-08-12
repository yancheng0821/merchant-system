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
     */
    @Select("SELECT * FROM business_notifications " +
            "WHERE tenant_id = #{tenantId} " +
            "AND deleted = 0 " +
            "ORDER BY created_at DESC " +
            "LIMIT #{limit}")
    List<BusinessNotification> getRecentNotifications(@Param("tenantId") Long tenantId, 
                                                      @Param("limit") Integer limit);
    
    /**
     * 获取未读通知数量
     */
    @Select("SELECT COUNT(*) FROM business_notifications " +
            "WHERE tenant_id = #{tenantId} " +
            "AND is_read = 0 " +
            "AND deleted = 0")
    Integer getUnreadCount(@Param("tenantId") Long tenantId);
    
    /**
     * 获取指定时间后的通知
     */
    @Select("SELECT * FROM business_notifications " +
            "WHERE tenant_id = #{tenantId} " +
            "AND created_at > #{afterTime} " +
            "AND deleted = 0 " +
            "ORDER BY created_at DESC")
    List<BusinessNotification> getNotificationsAfter(@Param("tenantId") Long tenantId,
                                                     @Param("afterTime") LocalDateTime afterTime);
    
    /**
     * 标记通知为已读
     */
    @Update("UPDATE business_notifications " +
            "SET is_read = 1, updated_at = NOW() " +
            "WHERE tenant_id = #{tenantId} " +
            "AND id IN (${notificationIds})")
    void markAsRead(@Param("tenantId") Long tenantId,
                   @Param("notificationIds") String notificationIds);
    
    /**
     * 插入通知
     */
    @Insert("INSERT INTO business_notifications " +
            "(tenant_id, notification_type, title, content, level, " +
            "business_id, business_type, related_person, related_service, " +
            "related_time, is_read, created_at, updated_at, deleted) " +
            "VALUES (#{tenantId}, #{notificationType}, #{title}, #{content}, #{level}, " +
            "#{businessId}, #{businessType}, #{relatedPerson}, #{relatedService}, " +
            "#{relatedTime}, #{isRead}, NOW(), NOW(), #{deleted})")
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
}