package com.merchant.server.businessservice.dto.google;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Google CheckAvailability 请求 DTO
 * 用于批量检查时间段可用性
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoogleAvailabilityRequestDTO {

    /**
     * 要检查的时间段
     */
    @JsonProperty("slot")
    private GoogleSlotDTO slot;
}
