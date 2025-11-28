package com.merchant.server.businessservice.dto.google;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Google CreateBooking 请求 DTO
 * https://developers.google.com/maps-booking/reference/rest-api-v3/booking
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoogleBookingRequestDTO {

    /**
     * 预约的时间段
     */
    @JsonProperty("slot")
    private GoogleSlotDTO slot;

    /**
     * 幂等性令牌，用于防止重复预约
     */
    @JsonProperty("idempotency_token")
    private String idempotencyToken;

    /**
     * 用户信息
     */
    @JsonProperty("user_information")
    private UserInformation userInformation;

    /**
     * 支付信息 (可选)
     */
    @JsonProperty("payment_information")
    private PaymentInformation paymentInformation;

    /**
     * 附加请求 (如优惠券等)
     */
    @JsonProperty("additional_request")
    private String additionalRequest;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInformation {
        /**
         * Google 用户ID
         */
        @JsonProperty("user_id")
        private String userId;

        /**
         * 名
         */
        @JsonProperty("given_name")
        private String givenName;

        /**
         * 姓
         */
        @JsonProperty("family_name")
        private String familyName;

        /**
         * 地址
         */
        @JsonProperty("address")
        private Address address;

        /**
         * 电话号码
         */
        @JsonProperty("telephone")
        private String telephone;

        /**
         * 邮箱
         */
        @JsonProperty("email")
        private String email;

        /**
         * 语言代码
         */
        @JsonProperty("language_code")
        private String languageCode;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Address {
        @JsonProperty("address_line")
        private List<String> addressLine;

        @JsonProperty("locality")
        private String locality;

        @JsonProperty("administrative_area")
        private String administrativeArea;

        @JsonProperty("postal_code")
        private String postalCode;

        @JsonProperty("country_code")
        private String countryCode;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentInformation {
        /**
         * 预付款状态
         * PREPAYMENT_NOT_PROVIDED, PREPAYMENT_PROVIDED, PREPAYMENT_REFUNDED
         */
        @JsonProperty("prepayment_status")
        private String prepaymentStatus;

        /**
         * 支付交易ID
         */
        @JsonProperty("payment_transaction_id")
        private String paymentTransactionId;

        /**
         * 支付金额
         */
        @JsonProperty("price")
        private GooglePrice price;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GooglePrice {
        /**
         * 货币代码 (ISO 4217)
         */
        @JsonProperty("currency_code")
        private String currencyCode;

        /**
         * 单位（整数部分）
         */
        @JsonProperty("units")
        private Long units;

        /**
         * 纳米单位（小数部分，10^-9）
         */
        @JsonProperty("nanos")
        private Integer nanos;
    }
}
