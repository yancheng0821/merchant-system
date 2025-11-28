package com.merchant.server.businessservice.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Google Booking 同步实体
 * 用于跟踪 Google Reserve with Google 的预约同步状态
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoogleBookingSyncEntity {

    private Long id;

    /**
     * 租户ID
     */
    private Long tenantId;

    /**
     * 本地预约ID
     */
    private Long appointmentId;

    /**
     * Google 预约ID
     */
    private String googleBookingId;

    /**
     * 幂等性令牌（用于防止重复预约）
     */
    private String idempotencyToken;

    /**
     * 同步状态
     * SYNCED, PENDING, FAILED
     */
    private String syncStatus;

    /**
     * 最后同步时间
     */
    private LocalDateTime lastSyncAt;

    /**
     * 错误信息
     */
    private String errorMessage;

    /**
     * 创建时间
     */
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    private LocalDateTime updatedAt;
}
