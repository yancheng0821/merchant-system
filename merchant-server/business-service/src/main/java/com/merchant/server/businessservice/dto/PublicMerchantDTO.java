package com.merchant.server.businessservice.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;

/**
 * 公开商户信息DTO - 用于客户预约页面展示
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicMerchantDTO {

    private Long tenantId;
    private String merchantCode;
    private String merchantName;
    private String address;
    private String city;
    private String province;
    private String country;
    private String postCode;
    private String contactPhone;
    private String contactEmail;
    private BigDecimal longitude;
    private BigDecimal latitude;
    private String timezone;
    private String logoUrl;

    // 在线预约配置
    private Boolean onlineBookingEnabled;
    private String brandColor;
    private Boolean showTechnicianPhotos;
    private Boolean showPopularServices;
    private String welcomeMessage;
    private Integer minAdvanceHours;
    private Integer maxAdvanceDays;
    private Boolean requireDeposit;
    private BigDecimal depositAmount;
    private String cancellationPolicy;
    private Boolean allowCustomerCancel;
    private Integer cancelDeadlineHours;
    private Boolean allowCustomerReschedule;
    private Integer rescheduleDeadlineHours;
    private String googlePlaceId;

    // Google Business 集成状态
    private Boolean googleBusinessConnected;
    private String bookingPageUrl;
}
