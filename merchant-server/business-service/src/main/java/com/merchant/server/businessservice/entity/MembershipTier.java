package com.merchant.server.businessservice.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 会员等级实体类
 */
@Data
public class MembershipTier {

    private Long id;

    @NotNull(message = "租户ID不能为空")
    private Long tenantId;

    @NotBlank(message = "等级名称不能为空")
    @Size(max = 50, message = "等级名称长度不能超过50个字符")
    private String name;

    @NotBlank(message = "等级代码不能为空")
    @Size(max = 20, message = "等级代码长度不能超过20个字符")
    private String code;

    @NotNull(message = "所需积分不能为空")
    @Min(value = 0, message = "所需积分不能小于0")
    private Integer requiredPoints;

    @NotNull(message = "折扣比例不能为空")
    @DecimalMin(value = "0.00", message = "折扣比例不能小于0")
    @DecimalMax(value = "100.00", message = "折扣比例不能大于100")
    private BigDecimal discountRate;

    @Size(max = 20, message = "颜色代码长度不能超过20个字符")
    private String color;

    @Size(max = 100, message = "图标长度不能超过100个字符")
    private String icon;

    private String benefits;

    @NotNull(message = "启用状态不能为空")
    private Boolean isActive;

    private Boolean isDeleted;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime deletedAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;

    // 辅助方法：获取折扣系数（用于计算）
    public BigDecimal getDiscountMultiplier() {
        if (discountRate == null) {
            return BigDecimal.ONE;
        }
        return discountRate.divide(new BigDecimal("100"), 4, BigDecimal.ROUND_HALF_UP);
    }

    // 辅助方法：判断是否有折扣
    public boolean hasDiscount() {
        return discountRate != null && discountRate.compareTo(new BigDecimal("100")) < 0;
    }
}
