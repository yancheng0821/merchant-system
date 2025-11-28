package com.merchant.server.businessservice.dto.google;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Google CheckAvailability 响应 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoogleAvailabilityResponseDTO {

    /**
     * 查询的时间段
     */
    @JsonProperty("slot")
    private GoogleSlotDTO slot;

    /**
     * 可用数量
     */
    @JsonProperty("count_available")
    private Integer countAvailable;

    /**
     * 时长要求
     * DURATION_REQUIREMENT_UNSPECIFIED, REQUIRE_DURATION, DO_NOT_SHOW_DURATION
     */
    @JsonProperty("duration_requirement")
    private String durationRequirement;

    /**
     * 可用性标签
     */
    @JsonProperty("availability_tag")
    private String availabilityTag;

    /**
     * 可用的资源列表
     */
    @JsonProperty("resources")
    private GoogleResourcesDTO resources;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GoogleResourcesDTO {
        @JsonProperty("staff_id")
        private String staffId;

        @JsonProperty("staff_name")
        private String staffName;

        @JsonProperty("room_id")
        private String roomId;
    }
}
