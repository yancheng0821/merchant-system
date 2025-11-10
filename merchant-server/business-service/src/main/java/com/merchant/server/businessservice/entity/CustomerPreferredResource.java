package com.merchant.server.businessservice.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 客户偏好技师表
 * 扩展现有customer_preferred_services,增加客户对技师的偏好
 */
@Data
public class CustomerPreferredResource {

    private Long id;

    private Long customerId;

    private Long resourceId;

    private Integer preferenceLevel = 5; // 偏好等级(1-5, 5最高)

    private String notes; // 备注(如:喜欢轻柔手法、过敏信息等)

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    // 关联的Customer和Resource信息
    private Customer customer;
    private Resource resource;

    /**
     * 获取偏好等级的星级显示
     */
    public String getPreferenceLevelStars() {
        if (preferenceLevel == null || preferenceLevel < 1) {
            return "";
        }

        StringBuilder stars = new StringBuilder();
        for (int i = 0; i < Math.min(preferenceLevel, 5); i++) {
            stars.append("⭐");
        }
        return stars.toString();
    }

    /**
     * 判断是否为高偏好(4星及以上)
     */
    public boolean isHighPreference() {
        return preferenceLevel != null && preferenceLevel >= 4;
    }

    /**
     * 判断是否为最爱技师(5星)
     */
    public boolean isFavorite() {
        return preferenceLevel != null && preferenceLevel == 5;
    }
}
