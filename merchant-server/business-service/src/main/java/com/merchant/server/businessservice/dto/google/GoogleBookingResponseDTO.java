package com.merchant.server.businessservice.dto.google;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Google Booking 响应 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoogleBookingResponseDTO {

    /**
     * 预约详情
     */
    @JsonProperty("booking")
    private GoogleBooking booking;

    /**
     * 用户预约失败原因（可选）
     */
    @JsonProperty("user_payment_option_failure_reason")
    private String userPaymentOptionFailureReason;

    /**
     * 预约失败详情
     */
    @JsonProperty("booking_failure")
    private BookingFailure bookingFailure;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GoogleBooking {
        /**
         * 合作伙伴预约ID (本地系统生成的ID)
         */
        @JsonProperty("booking_id")
        private String bookingId;

        /**
         * 预约的时间段
         */
        @JsonProperty("slot")
        private GoogleSlotDTO slot;

        /**
         * 用户信息
         */
        @JsonProperty("user_information")
        private GoogleBookingRequestDTO.UserInformation userInformation;

        /**
         * 预约状态
         * PENDING, CONFIRMED, CANCELLED, NO_SHOW, NO_SHOW_PENALIZED
         */
        @JsonProperty("status")
        private String status;

        /**
         * 支付信息
         */
        @JsonProperty("payment_information")
        private GoogleBookingRequestDTO.PaymentInformation paymentInformation;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BookingFailure {
        /**
         * 失败原因
         * CAUSE_UNSPECIFIED, SLOT_UNAVAILABLE, SLOT_ALREADY_BOOKED_BY_USER,
         * LEASE_EXPIRED, OUTSIDE_CANCELLATION_WINDOW, PAYMENT_ERROR_CARD_TYPE_REJECTED,
         * PAYMENT_ERROR_CARD_DECLINED, BOOKING_ALREADY_CANCELLED, BOOKING_NOT_CANCELLABLE,
         * OVERLAPPING_RESERVATION, USER_CANNOT_USE_PAYMENT_OPTION, BOOKING_NOT_FOUND
         */
        @JsonProperty("cause")
        private String cause;

        /**
         * 失败描述（用于调试）
         */
        @JsonProperty("description")
        private String description;
    }
}
