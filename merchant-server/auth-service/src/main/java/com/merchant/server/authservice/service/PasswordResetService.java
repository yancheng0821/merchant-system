package com.merchant.server.authservice.service;

import com.merchant.server.authservice.dto.ForgotPasswordRequest;
import com.merchant.server.authservice.dto.ResetPasswordRequest;

public interface PasswordResetService {

    /**
     * Send password reset email
     */
    void sendPasswordResetEmail(ForgotPasswordRequest request);

    /**
     * Reset password using token
     */
    void resetPassword(ResetPasswordRequest request);

    /**
     * Validate reset token
     */
    boolean validateResetToken(String token);
}
