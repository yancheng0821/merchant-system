package com.merchant.server.businessservice.dto.google;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Google Service Feed DTO
 * 用于向 Google 提供服务信息数据
 * https://developers.google.com/maps-booking/reference/feeds/service
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoogleServiceFeedDTO {

    /**
     * 服务数据列表
     */
    @JsonProperty("service")
    private List<Service> services;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Service {
        /**
         * 商户ID
         */
        @JsonProperty("merchant_id")
        private String merchantId;

        /**
         * 服务ID (唯一标识)
         */
        @JsonProperty("service_id")
        private String serviceId;

        /**
         * 服务名称
         */
        @JsonProperty("name")
        private String name;

        /**
         * 服务描述
         */
        @JsonProperty("description")
        private String description;

        /**
         * 服务类别
         */
        @JsonProperty("category")
        private String category;

        /**
         * 价格信息
         */
        @JsonProperty("price")
        private Price price;

        /**
         * 时长（秒）
         */
        @JsonProperty("duration_sec")
        private Long durationSec;

        /**
         * 预约规则
         */
        @JsonProperty("rules")
        private SchedulingRules rules;

        /**
         * 本地化名称
         */
        @JsonProperty("localized_name")
        private List<GoogleMerchantFeedDTO.LocalizedText> localizedName;

        /**
         * 本地化描述
         */
        @JsonProperty("localized_description")
        private List<GoogleMerchantFeedDTO.LocalizedText> localizedDescription;

        /**
         * 服务类型
         * SERVICE_TYPE_UNSPECIFIED, SERVICE_TYPE_DINING_RESERVATION, SERVICE_TYPE_APPOINTMENT
         */
        @JsonProperty("type")
        private String type;

        /**
         * 是否需要预付款
         */
        @JsonProperty("prepayment_type")
        private String prepaymentType;

        /**
         * 服务属性
         */
        @JsonProperty("service_attribute_value_id")
        private List<ServiceAttribute> serviceAttributeValueIds;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Price {
        /**
         * 价格类型
         * FIXED_RATE_DEFAULT, STARTS_AT, NO_FEE
         */
        @JsonProperty("price_type")
        private String priceType;

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

        /**
         * 价格选项（如果有多个价格档位）
         */
        @JsonProperty("price_option")
        private List<PriceOption> priceOptions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PriceOption {
        /**
         * 选项ID
         */
        @JsonProperty("id")
        private String id;

        /**
         * 选项名称
         */
        @JsonProperty("name")
        private String name;

        /**
         * 价格金额
         */
        @JsonProperty("price")
        private GoogleBookingRequestDTO.GooglePrice price;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SchedulingRules {
        /**
         * 最小提前预约时间（秒）
         */
        @JsonProperty("min_advance_booking")
        private Long minAdvanceBooking;

        /**
         * 最大提前预约时间（秒）
         */
        @JsonProperty("max_advance_booking")
        private Long maxAdvanceBooking;

        /**
         * 最小取消提前时间（秒）
         */
        @JsonProperty("min_advance_cancellation")
        private Long minAdvanceCancellation;

        /**
         * 是否允许同一天预约
         */
        @JsonProperty("same_day_scheduling")
        private SameDayScheduling sameDayScheduling;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SameDayScheduling {
        /**
         * 是否允许当天预约
         */
        @JsonProperty("same_day_lead_time_sec")
        private Long sameDayLeadTimeSec;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ServiceAttribute {
        /**
         * 属性ID
         */
        @JsonProperty("attribute_id")
        private String attributeId;

        /**
         * 属性值ID
         */
        @JsonProperty("value_id")
        private String valueId;
    }
}
