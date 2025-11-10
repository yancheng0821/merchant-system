package com.merchant.server.businessservice.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 客户套餐DTO
 *
 * @author System
 * @since 2025-01-21
 */
@Data
public class CustomerPackageDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 客户套餐ID
     */
    private Long id;

    /**
     * 租户ID
     */
    @JsonProperty("tenant_id")
    private Long tenantId;

    /**
     * 客户ID
     */
    @JsonProperty("customer_id")
    private Long customerId;

    /**
     * 套餐ID
     */
    @JsonProperty("package_id")
    private Long packageId;

    /**
     * 购买日期
     */
    @JsonFormat(pattern = "yyyy-MM-dd")
    @JsonProperty("purchase_date")
    private LocalDate purchaseDate;

    /**
     * 过期日期
     */
    @JsonFormat(pattern = "yyyy-MM-dd")
    @JsonProperty("expiration_date")
    private LocalDate expirationDate;

    /**
     * 购买价格
     */
    @JsonProperty("purchase_price")
    private BigDecimal purchasePrice;

    /**
     * 支付状态：PENDING, PAID, REFUNDED
     */
    @JsonProperty("payment_status")
    private String paymentStatus;

    /**
     * 使用详情
     */
    @JsonProperty("usage_details")
    private List<UsageDetail> usageDetails;

    /**
     * 套餐状态：ACTIVE, COMPLETED, EXPIRED, CANCELLED
     */
    private String status;

    /**
     * 首次使用时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @JsonProperty("first_used_at")
    private LocalDateTime firstUsedAt;

    /**
     * 最后使用时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @JsonProperty("last_used_at")
    private LocalDateTime lastUsedAt;

    /**
     * 完成时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @JsonProperty("completed_at")
    private LocalDateTime completedAt;

    /**
     * 共享用户列表
     */
    @JsonProperty("shared_users")
    private List<SharedUser> sharedUsers;

    /**
     * 是否为礼品
     */
    @JsonProperty("is_gift")
    private Boolean isGift;

    /**
     * 赠送者客户ID
     */
    @JsonProperty("gifted_by_customer_id")
    private Long giftedByCustomerId;

    /**
     * 备注
     */
    private String notes;

    /**
     * 支付方式
     */
    @JsonProperty("payment_method")
    private String paymentMethod;

    /**
     * 小计金额（不含税）
     */
    private Double subtotal;

    /**
     * 税率
     */
    @JsonProperty("tax_rate")
    private Double taxRate;

    /**
     * 税额
     */
    @JsonProperty("tax_amount")
    private Double taxAmount;

    /**
     * 总金额（含税）
     */
    @JsonProperty("total_amount")
    private Double totalAmount;

    /**
     * 退款金额
     */
    @JsonProperty("refund_amount")
    private BigDecimal refundAmount;

    /**
     * 退款日期
     */
    @JsonFormat(pattern = "yyyy-MM-dd")
    @JsonProperty("refund_date")
    private LocalDate refundDate;

    /**
     * 创建时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @JsonProperty("updated_at")
    private LocalDateTime updatedAt;

    /**
     * 套餐名称（关联查询用）
     */
    @JsonProperty("package_name")
    private String packageName;

    /**
     * 套餐描述（关联查询用）
     */
    @JsonProperty("package_description")
    private String packageDescription;

    /**
     * 剩余天数（计算字段）
     */
    @JsonProperty("days_remaining")
    private Integer daysRemaining;

    /**
     * 商户名称（用于通知）
     */
    @JsonProperty("merchant_name")
    private String merchantName;

    /**
     * 使用详情内部类
     */
    @Data
    public static class UsageDetail {
        /**
         * 服务ID
         */
        @JsonProperty("service_id")
        private Long serviceId;

        /**
         * 允许次数
         */
        private Integer allowed;

        /**
         * 已使用次数
         */
        private Integer used;

        /**
         * 剩余次数
         */
        private Integer remaining;

        /**
         * 最后使用日期
         */
        @JsonFormat(pattern = "yyyy-MM-dd")
        @JsonProperty("last_used")
        private LocalDate lastUsed;
    }

    /**
     * 共享用户内部类
     */
    @Data
    public static class SharedUser {
        /**
         * 客户ID
         */
        @JsonProperty("customer_id")
        private Long customerId;

        /**
         * 是否为主要用户
         */
        @JsonProperty("is_primary")
        private Boolean isPrimary;
    }
}