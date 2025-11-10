package com.merchant.server.businessservice.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 客户套餐关联实体类
 *
 * @author System
 * @since 2025-01-21
 */
@Data
public class CustomerPackage implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键ID
     */
    private Long id;

    /**
     * 租户ID
     */
    private Long tenantId;

    /**
     * 客户ID (购买者)
     */
    private Long customerId;

    /**
     * 套餐模板ID
     */
    private Long packageId;

    /**
     * 购买日期
     */
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate purchaseDate;

    /**
     * 过期日期
     */
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate expirationDate;

    /**
     * 购买价格
     */
    private BigDecimal purchasePrice;

    /**
     * 支付状态：PENDING, PAID, REFUNDED
     */
    private String paymentStatus;

    /**
     * 使用详情（JSON格式）
     * 示例: [{"service_id": 1, "allowed": 2, "used": 1, "remaining": 1, "last_used": "2024-10-15"}, ...]
     */
    private String usageDetails;

    /**
     * 套餐状态：ACTIVE, COMPLETED, EXPIRED, CANCELLED
     */
    private String status;

    /**
     * 首次使用时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime firstUsedAt;

    /**
     * 最后使用时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime lastUsedAt;

    /**
     * 完成时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime completedAt;

    /**
     * 共享用户（JSON数组）
     * 示例: [{"customer_id": 1, "is_primary": true}, {"customer_id": 2, "is_primary": false}]
     */
    private String sharedUsers;

    /**
     * 是否为礼品
     */
    private Boolean isGift;

    /**
     * 赠送者客户ID
     */
    private Long giftedByCustomerId;

    /**
     * 备注
     */
    private String notes;

    /**
     * 退款金额
     */
    private BigDecimal refundAmount;

    /**
     * 退款日期
     */
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate refundDate;

    /**
     * 创建时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
}