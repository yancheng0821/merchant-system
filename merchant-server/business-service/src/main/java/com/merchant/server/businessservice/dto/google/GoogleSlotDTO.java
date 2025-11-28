package com.merchant.server.businessservice.dto.google;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Google Reserve with Google - Slot DTO
 * 遵循 Google Maps Booking API v3 规范
 * https://developers.google.com/maps-booking/reference/rest-api-v3/availability
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoogleSlotDTO {

    /**
     * 商户ID (对应 Google Merchant ID)
     */
    @JsonProperty("merchant_id")
    private String merchantId;

    /**
     * 服务ID
     */
    @JsonProperty("service_id")
    private String serviceId;

    /**
     * 开始时间 (RFC3339 格式)
     * 例如: 2024-01-15T09:00:00-08:00
     */
    @JsonProperty("start_time")
    private String startTime;

    /**
     * 结束时间 (RFC3339 格式)
     */
    @JsonProperty("end_time")
    private String endTime;

    /**
     * 资源ID (可选，指定员工)
     */
    @JsonProperty("resource_ids")
    private GoogleResourceIds resourceIds;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GoogleResourceIds {
        @JsonProperty("staff_id")
        private String staffId;

        @JsonProperty("room_id")
        private String roomId;
    }
}
