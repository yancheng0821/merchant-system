package com.merchant.server.authservice.service.impl;

import com.merchant.server.authservice.dto.ForgotPasswordRequest;
import com.merchant.server.authservice.dto.ResetPasswordRequest;
import com.merchant.server.authservice.entity.PasswordResetToken;
import com.merchant.server.authservice.entity.User;
import com.merchant.server.authservice.mapper.PasswordResetTokenMapper;
import com.merchant.server.authservice.mapper.UserMapper;
import com.merchant.server.authservice.service.PasswordResetService;
import com.merchant.server.authservice.util.PasswordUtil;
import com.merchant.server.common.dto.NotificationMessage;
import com.merchant.server.common.dto.NotificationRequest;
import com.merchant.server.common.enums.NotificationScene;
import com.merchant.server.common.mq.NotificationMessageProducer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetServiceImpl implements PasswordResetService {

    private final UserMapper userMapper;
    private final PasswordResetTokenMapper passwordResetTokenMapper;
    private final NotificationMessageProducer notificationMessageProducer;
    private final PasswordUtil passwordUtil;
    private final com.merchant.server.authservice.mapper.TenantMapper tenantMapper;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${app.password-reset.token-validity-hours:24}")
    private int tokenValidityHours;

    @Override
    @Transactional
    public void sendPasswordResetEmail(ForgotPasswordRequest request) {
        log.info("Processing forgot password request for email: {}, tenantCode: {}",
                request.getEmail(), request.getTenantCode());

        // 验证租户是否存在
        var tenant = tenantMapper.selectByTenantCode(request.getTenantCode());
        if (tenant == null) {
            log.warn("Tenant not found with code: {}", request.getTenantCode());
            // Don't reveal whether the tenant exists for security reasons
            return;
        }
        Long tenantId = tenant.getId();

        // Find user by email and tenantId
        User user = userMapper.selectByEmailAndTenantId(request.getEmail(), tenantId);

        if (user == null) {
            log.warn("User not found with email: {} and tenantId: {}", request.getEmail(), tenantId);
            // Don't reveal whether the email exists for security reasons
            return;
        }

        // Generate reset token
        String token = UUID.randomUUID().toString();
        LocalDateTime expiryTime = LocalDateTime.now(ZoneOffset.UTC).plusHours(tokenValidityHours);

        // Save token to database
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setUserId(user.getId());
        resetToken.setToken(token);
        resetToken.setExpiryTime(expiryTime);
        resetToken.setUsed(false);
        resetToken.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));

        passwordResetTokenMapper.insert(resetToken);

        // Generate reset link
        String resetLink = frontendUrl + "/reset-password?token=" + token;

        // Create email content
        String subject = "Password Reset Request";
        String content = buildPasswordResetEmailContent(user.getRealName(), resetLink, tokenValidityHours);

        // Send email via MQ
        try {
            log.info("Sending password reset email via MQ to: {}", user.getEmail());

            // 构建邮件变量
            Map<String, Object> variables = new HashMap<>();
            variables.put("resetLink", resetLink);
            variables.put("userName", user.getRealName());
            variables.put("validHours", tokenValidityHours);
            variables.put("email", user.getEmail());

            // 构建统一的 NotificationRequest
            NotificationRequest notificationRequest = NotificationRequest.builder()
                    .scene(NotificationScene.USER_FORGOT_PASSWORD.getCode())
                    .tenantId(user.getTenantId())
                    .recipient(NotificationRequest.RecipientInfo.builder()
                            .email(user.getEmail())
                            .name(user.getRealName())
                            .build())
                    .channel("EMAIL")
                    .variables(variables)
                    .businessId(user.getId().toString())
                    .build();

            // 将 NotificationRequest 作为 payload
            Map<String, Object> payload = new HashMap<>();
            payload.put("scene", notificationRequest.getScene());
            payload.put("tenantId", notificationRequest.getTenantId());
            payload.put("recipient", notificationRequest.getRecipient());
            payload.put("channel", notificationRequest.getChannel());
            payload.put("variables", notificationRequest.getVariables());
            payload.put("businessId", notificationRequest.getBusinessId());
            payload.put("templateCode", notificationRequest.getTemplateCode());

            // 创建通知消息
            NotificationMessage message = NotificationMessage.builder()
                    .messageType(NotificationMessage.MessageType.EMAIL)
                    .priority(NotificationMessage.Priority.URGENT)
                    .tenantId(user.getTenantId())
                    .payload(payload)
                    .build();

            // 通过 MQ 发送到忘记密码队列
            notificationMessageProducer.sendUserForgotPassword(message);

            log.info("Password reset email sent to MQ successfully - email: {}, messageId: {}, scene: {}",
                    user.getEmail(), message.getMessageId(), notificationRequest.getScene());
        } catch (Exception e) {
            log.error("Failed to send password reset email to MQ - email: {}, error: {}",
                    user.getEmail(), e.getMessage(), e);
            // 密码重置邮件发送失败不应阻止 token 创建（已经保存到数据库）
            // 只记录错误，不抛出异常
        }
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        log.info("Processing password reset request");

        // Validate passwords match
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }

        // Find and validate token
        PasswordResetToken resetToken = passwordResetTokenMapper.findByToken(request.getToken());
        if (resetToken == null) {
            log.warn("Invalid or expired reset token");
            throw new IllegalArgumentException("Invalid or expired reset token");
        }

        // Get user
        User user = userMapper.selectById(resetToken.getUserId());
        if (user == null) {
            log.error("User not found for reset token");
            throw new IllegalArgumentException("User not found");
        }

        // Update password
        String salt = passwordUtil.generateSalt();
        String passwordHash = passwordUtil.hashPassword(request.getNewPassword(), salt);

        user.setPasswordHash(passwordHash);
        user.setSalt(salt);
        user.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));

        userMapper.update(user);

        // Mark token as used
        passwordResetTokenMapper.markAsUsed(resetToken.getId());

        log.info("Password reset successfully for user: {}", user.getUsername());
    }

    @Override
    public boolean validateResetToken(String token) {
        PasswordResetToken resetToken = passwordResetTokenMapper.findByToken(token);
        return resetToken != null;
    }

    private String buildPasswordResetEmailContent(String realName, String resetLink, int validityHours) {
        return String.format("""
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #667eea;">Password Reset Request</h2>

                        <p>Dear %s,</p>

                        <p>We received a request to reset your password. Click the button below to reset it:</p>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="%s"
                               style="background-color: #667eea; color: white; padding: 12px 30px;
                                      text-decoration: none; border-radius: 5px; display: inline-block;">
                                Reset Password
                            </a>
                        </div>

                        <p>Or copy and paste this link into your browser:</p>
                        <p style="background-color: #f4f4f4; padding: 10px; border-radius: 5px; word-break: break-all;">
                            %s
                        </p>

                        <p><strong>This link will expire in %d hours.</strong></p>

                        <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>

                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

                        <p style="font-size: 12px; color: #999;">
                            This is an automated email, please do not reply.
                        </p>
                    </div>
                </body>
                </html>
                """, realName, resetLink, resetLink, validityHours);
    }
}
