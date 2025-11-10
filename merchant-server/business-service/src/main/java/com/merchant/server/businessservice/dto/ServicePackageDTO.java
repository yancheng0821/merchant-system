package com.merchant.server.businessservice.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 服务套餐DTO
 *
 * @author System
 * @since 2025-01-21
 */
@Data
public class ServicePackageDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 套餐ID
     */
    private Long id;

    /**
     * 租户ID
     */
    @JsonProperty("tenant_id")
    private Long tenantId;

    /**
     * 套餐名称
     */
    private String name;

    /**
     * 套餐描述
     */
    private String description;

    /**
     * 图标
     */
    private String icon;

    /**
     * 显示颜色
     */
    private String color;

    /**
     * 包含的服务列表
     */
    @JsonProperty("services")
    private List<ServiceItem> includedServices;

    /**
     * 原价
     */
    @JsonProperty("original_price")
    private BigDecimal originalPrice;

    /**
     * 套餐价格
     */
    @JsonProperty("package_price")
    private BigDecimal packagePrice;

    /**
     * 折扣百分比
     */
    @JsonProperty("discount_percentage")
    private BigDecimal discountPercentage;

    /**
     * 有效天数
     */
    @JsonProperty("validity_days")
    private Integer validityDays;

    /**
     * 最大共享用户数
     */
    @JsonProperty("max_shared_users")
    private Integer maxSharedUsers;

    /**
     * 条款和条件
     */
    private String terms;

    /**
     * 状态：ACTIVE, INACTIVE
     */
    private String status;

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
     * 服务项内部类
     */
    @Data
    public static class ServiceItem {
        /**
         * 服务ID
         */
        @JsonProperty("service_id")
        private Long serviceId;

        /**
         * 包含次数
         */
        @JsonProperty("count")
        private Integer count;
    }
}