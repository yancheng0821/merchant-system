package com.merchant.server.businessservice.dto.google;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Google Health Check 响应 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoogleHealthCheckResponse {

    /**
     * 服务状态
     * SERVING, NOT_SERVING
     */
    @JsonProperty("status")
    private String status;
}
