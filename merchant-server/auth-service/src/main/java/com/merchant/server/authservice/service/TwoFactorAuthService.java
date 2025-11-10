package com.merchant.server.authservice.service;

import com.merchant.server.authservice.dto.Send2FACodeRequest;
import com.merchant.server.authservice.dto.Send2FACodeResponse;
import com.merchant.server.authservice.dto.Verify2FACodeRequest;
import com.merchant.server.authservice.dto.LoginResponse;

public interface TwoFactorAuthService {

    /**
     * Send 2FA code via SMS
     */
    Send2FACodeResponse send2FACode(Send2FACodeRequest request);

    /**
     * Verify 2FA code and complete login
     */
    LoginResponse verify2FACode(Verify2FACodeRequest request, String clientIp);
}
