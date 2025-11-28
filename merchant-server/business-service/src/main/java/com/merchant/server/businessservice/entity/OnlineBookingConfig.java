package com.merchant.server.businessservice.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 在线预订配置表
 * 集中管理租户的在线预订相关配置
 */
@Data
public class OnlineBookingConfig {

    private Long id;

    private Long tenantId;

    private String bookingUrl; // 预订URL(如: spa123.booking.com)

    private Integer advanceBookingDays = 30; // 提前预订天数

    private Integer minAdvanceHours = 2; // 最少提前小时数

    private Boolean allowCustomerCancel = true; // 允许客户取消

    private Integer cancelDeadlineHours = 24; // 取消截止时间(小时)

    private Boolean allowCustomerReschedule = true; // 允许客户改期

    private Integer rescheduleDeadlineHours = 12; // 改期截止时间(小时)

    private Boolean autoConfirmBooking = true; // 自动确认预订

    private Boolean requireDeposit = false; // 需要押金

    private DepositType depositType = DepositType.PERCENTAGE; // 押金类型

    private BigDecimal depositAmount = BigDecimal.ZERO; // 押金金额(固定金额或百分比)

    private Boolean enableWaitlist = true; // 启用候补名单

    private Boolean showTechnicianPhotos = true; // 显示技师照片

    private Boolean showTechnicianRatings = true; // 显示技师评分

    private String bookingWidgetColor = "#000000"; // 预订组件主色调

    // Google Business 集成相关
    private Boolean googleBusinessEnabled = false;  // 是否启用Google Business集成
    private String googlePlaceId;  // Google Place ID
    private String googleMerchantId;  // Google Merchant Center ID
    private String bookingPageSlug;  // 预约页面短链接slug (如: spa123)
    private String welcomeMessage;  // 欢迎语
    private String cancellationPolicy;  // 取消政策说明
    private String logoUrl;  // Logo URL
    private Boolean enabled = false;  // 是否启用在线预约

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;

    /**
     * 押金类型枚举
     */
    public enum DepositType {
        FIXED,      // 固定金额
        PERCENTAGE  // 百分比
    }

    /**
     * 计算押金金额
     */
    public BigDecimal calculateDeposit(BigDecimal totalAmount) {
        if (!Boolean.TRUE.equals(requireDeposit) || depositAmount == null) {
            return BigDecimal.ZERO;
        }

        if (depositType == DepositType.PERCENTAGE) {
            // 百分比计算
            return totalAmount.multiply(depositAmount).divide(new BigDecimal("100"), 2, BigDecimal.ROUND_HALF_UP);
        } else {
            // 固定金额
            return depositAmount;
        }
    }

    /**
     * 检查是否允许取消预订
     */
    public boolean canCancelAppointment(java.time.LocalDateTime appointmentTime, java.time.LocalDateTime now) {
        if (!Boolean.TRUE.equals(allowCustomerCancel)) {
            return false;
        }

        if (cancelDeadlineHours == null || appointmentTime == null || now == null) {
            return false;
        }

        long hoursUntilAppointment = java.time.Duration.between(now, appointmentTime).toHours();
        return hoursUntilAppointment >= cancelDeadlineHours;
    }

    /**
     * 检查是否允许改期预订
     */
    public boolean canRescheduleAppointment(java.time.LocalDateTime appointmentTime, java.time.LocalDateTime now) {
        if (!Boolean.TRUE.equals(allowCustomerReschedule)) {
            return false;
        }

        if (rescheduleDeadlineHours == null || appointmentTime == null || now == null) {
            return false;
        }

        long hoursUntilAppointment = java.time.Duration.between(now, appointmentTime).toHours();
        return hoursUntilAppointment >= rescheduleDeadlineHours;
    }
}
