package com.merchant.server.businessservice.dto.google;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Google Merchant Feed DTO
 * 用于向 Google 提供商户信息数据
 * https://developers.google.com/maps-booking/reference/feeds/merchant
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoogleMerchantFeedDTO {

    /**
     * 商户数据列表
     */
    @JsonProperty("merchant")
    private List<Merchant> merchants;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Merchant {
        /**
         * 商户ID (唯一标识)
         */
        @JsonProperty("merchant_id")
        private String merchantId;

        /**
         * 商户名称
         */
        @JsonProperty("name")
        private String name;

        /**
         * 电话号码
         */
        @JsonProperty("telephone")
        private String telephone;

        /**
         * 网站URL
         */
        @JsonProperty("url")
        private String url;

        /**
         * 地理位置信息
         */
        @JsonProperty("geo")
        private Geo geo;

        /**
         * 营业时间
         */
        @JsonProperty("time_zone")
        private TimeZone timeZone;

        /**
         * 分类
         */
        @JsonProperty("category")
        private String category;

        /**
         * 是否需要预付款
         */
        @JsonProperty("prepayment_required")
        private Boolean prepaymentRequired;

        /**
         * 支付选项
         */
        @JsonProperty("payment_option")
        private List<PaymentOption> paymentOptions;

        /**
         * 位置信息
         */
        @JsonProperty("location")
        private Location location;

        /**
         * 本地化名称
         */
        @JsonProperty("localized_name")
        private List<LocalizedText> localizedName;

        /**
         * 常规营业时间
         */
        @JsonProperty("regular_hours")
        private RegularHours regularHours;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Geo {
        /**
         * 纬度
         */
        @JsonProperty("latitude")
        private Double latitude;

        /**
         * 经度
         */
        @JsonProperty("longitude")
        private Double longitude;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimeZone {
        /**
         * 时区ID (如 America/Los_Angeles)
         */
        @JsonProperty("time_zone_id")
        private String timeZoneId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentOption {
        /**
         * 支付选项ID
         */
        @JsonProperty("payment_option_id")
        private String paymentOptionId;

        /**
         * 支付选项名称
         */
        @JsonProperty("name")
        private String name;

        /**
         * 支付选项描述
         */
        @JsonProperty("description")
        private String description;

        /**
         * 支付类型
         * PAYMENT_OPTION_TYPE_UNSPECIFIED, PAYMENT_OPTION_SINGLE_USE, PAYMENT_OPTION_MULTI_USE, PAYMENT_OPTION_UNLIMITED
         */
        @JsonProperty("type")
        private String type;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Location {
        /**
         * Google Place ID
         */
        @JsonProperty("place_id")
        private String placeId;

        /**
         * 地址
         */
        @JsonProperty("address")
        private Address address;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Address {
        /**
         * 国家代码
         */
        @JsonProperty("country")
        private String country;

        /**
         * 省/州
         */
        @JsonProperty("administrative_area")
        private String administrativeArea;

        /**
         * 城市
         */
        @JsonProperty("locality")
        private String locality;

        /**
         * 邮编
         */
        @JsonProperty("postal_code")
        private String postalCode;

        /**
         * 街道地址
         */
        @JsonProperty("street_address")
        private String streetAddress;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LocalizedText {
        /**
         * 语言代码
         */
        @JsonProperty("locale")
        private String locale;

        /**
         * 本地化文本
         */
        @JsonProperty("value")
        private String value;
    }

    /**
     * 常规营业时间
     * https://developers.google.com/maps-booking/reference/feeds/merchant#regular_hours
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RegularHours {
        /**
         * 营业时间段列表
         */
        @JsonProperty("time_period")
        private List<TimePeriod> timePeriods;
    }

    /**
     * 营业时间段
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimePeriod {
        /**
         * 开始星期几 (MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY)
         */
        @JsonProperty("open_day")
        private String openDay;

        /**
         * 开始时间 (HH:MM 格式, 如 "09:00")
         */
        @JsonProperty("open_time")
        private String openTime;

        /**
         * 结束星期几
         */
        @JsonProperty("close_day")
        private String closeDay;

        /**
         * 结束时间 (HH:MM 格式, 如 "18:00")
         */
        @JsonProperty("close_time")
        private String closeTime;
    }
}
