package com.merchant.server.businessservice.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 业务通知实体 - 用于Dashboard显示的业务级通知
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BusinessNotification {
    
    private Long id;
    
    /**
     * 租户ID
     */
    private Long tenantId;
    
    /**
     * 通知类型
     * NEW_APPOINTMENT - 新预约
     * APPOINTMENT_REMINDER - 预约提醒
     * APPOINTMENT_CANCELLED - 预约取消
     * APPOINTMENT_CONFIRMED - 预约确认
     * APPOINTMENT_COMPLETED - 预约完成
     * PENDING_CONFIRMATION - 待确认预约
     * CUSTOMER_REGISTERED - 新客户注册
     * STAFF_STATUS_CHANGE - 员工状态变更
     */
    private String notificationType;
    
    /**
     * 通知标题
     */
    private String title;
    
    /**
     * 通知内容
     */
    private String content;
    
    /**
     * 通知级别
     * INFO - 信息
     * WARNING - 警告
     * SUCCESS - 成功
     * ERROR - 错误
     */
    private String level;
    
    /**
     * 关联业务ID（如预约ID、客户ID等）
     */
    private String businessId;
    
    /**
     * 关联业务类型
     */
    private String businessType;
    
    /**
     * 相关人员姓名（客户或员工）
     */
    private String relatedPerson;
    
    /**
     * 相关服务名称
     */
    private String relatedService;
    
    /**
     * 相关时间（如预约时间）
     */
    private LocalDateTime relatedTime;
    
    /**
     * 是否已读
     */
    private Boolean isRead;
    
    /**
     * 创建时间
     */
    private LocalDateTime createdAt;
    
    /**
     * 更新时间
     */
    private LocalDateTime updatedAt;
    
    /**
     * 逻辑删除
     */
    private Boolean deleted;
}