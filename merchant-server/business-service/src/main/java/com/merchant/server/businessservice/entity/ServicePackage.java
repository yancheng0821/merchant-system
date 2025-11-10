package com.merchant.server.businessservice.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 服务套餐实体类
 *
 * @author System
 * @since 2025-01-21
 */
@Data
public class ServicePackage implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 套餐ID
     */
    private Long id;

    /**
     * 租户ID
     */
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
     * 包含的服务列表（JSON格式）
     */
    private String includedServices;

    /**
     * 原价
     */
    private BigDecimal originalPrice;

    /**
     * 套餐价格
     */
    private BigDecimal packagePrice;

    /**
     * 折扣百分比
     */
    private BigDecimal discountPercentage;

    /**
     * 有效天数
     */
    private Integer validityDays;

    /**
     * 最大共享用户数
     */
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
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
}