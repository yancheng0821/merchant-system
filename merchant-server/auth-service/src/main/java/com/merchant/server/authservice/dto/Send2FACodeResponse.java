package com.merchant.server.authservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Send2FACodeResponse {

    private Boolean success;

    private String message;

    private String verificationId;

    private Integer expiresIn; // seconds

    public static Send2FACodeResponse success(String verificationId, Integer expiresIn) {
        return new Send2FACodeResponse(true, "Verification code sent successfully", verificationId, expiresIn);
    }

    public static Send2FACodeResponse failure(String message) {
        return new Send2FACodeResponse(false, message, null, null);
    }
}
