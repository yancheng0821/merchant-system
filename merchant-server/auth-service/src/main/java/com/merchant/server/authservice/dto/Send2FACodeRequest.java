package com.merchant.server.authservice.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class Send2FACodeRequest {

    @NotNull(message = "User ID cannot be null")
    private Long userId;

    @NotNull(message = "Tenant ID cannot be null")
    private Long tenantId;
}
