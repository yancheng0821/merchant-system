package com.merchant.server.authservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class Verify2FACodeRequest {

    @NotNull(message = "User ID cannot be null")
    private Long userId;

    @NotBlank(message = "Verification code cannot be empty")
    private String code;

    @NotBlank(message = "Verification ID cannot be empty")
    private String verificationId;

    @NotNull(message = "Tenant ID cannot be null")
    private Long tenantId;
}
