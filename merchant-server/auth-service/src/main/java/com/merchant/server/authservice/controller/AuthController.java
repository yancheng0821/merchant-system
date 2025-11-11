package com.merchant.server.authservice.controller;

import com.merchant.server.authservice.dto.*;
import com.merchant.server.authservice.entity.TenantInvitation;
import com.merchant.server.authservice.service.AuthService;
import com.merchant.server.authservice.service.PasswordResetService;
import com.merchant.server.authservice.service.TenantInvitationService;
import com.merchant.server.authservice.service.TwoFactorAuthService;
import com.merchant.server.common.dto.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.Locale;

@RestController
@RequestMapping("/api/auth")
@Validated
public class AuthController {
    
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    
    @Autowired
    private AuthService authService;

    @Autowired
    private TenantInvitationService tenantInvitationService;

    @Autowired
    private PasswordResetService passwordResetService;

    @Autowired
    private TwoFactorAuthService twoFactorAuthService;
    
    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(
            @RequestHeader(value = "Accept-Language", required = false) String lang,
            @Valid @RequestBody LoginRequest loginRequest,
            HttpServletRequest request) {
        if (lang != null && !lang.isEmpty()) {
            LocaleContextHolder.setLocale(Locale.forLanguageTag(lang));
        }

        String clientIp = getClientIp(request);
        logger.info("收到登录请求 - 用户名: {}, IP: {}", loginRequest.getUsername(), clientIp);
        logger.debug("登录请求详情: {}", loginRequest);

        try {
            LoginResponse response = authService.login(loginRequest, clientIp);

            // Check if 2FA is required
            if (response.getNeed2FA() != null && response.getNeed2FA()) {
                logger.info("用户 {} 需要进行2FA验证", loginRequest.getUsername());
                logger.debug("2FA响应: userId={}, phone={}", response.getUserId(), response.getPhone());
            } else {
                logger.info("用户 {} 登录成功", loginRequest.getUsername());
                logger.debug("登录响应: userId={}, token={}", response.getUserId(),
                    response.getToken() != null ? response.getToken().substring(0, Math.min(20, response.getToken().length())) + "..." : "null");
            }

            return ApiResponse.success(response);
        } catch (Exception e) {
            logger.error("用户 {} 登录失败: {}", loginRequest.getUsername(), e.getMessage(), e);
            throw e;
        }
    }
    
    @PostMapping("/register")
    public ApiResponse<LoginResponse> register(
            @RequestHeader(value = "Accept-Language", required = false) String lang,
            @Valid @RequestBody RegisterRequest registerRequest) {
        if (lang != null && !lang.isEmpty()) {
            LocaleContextHolder.setLocale(Locale.forLanguageTag(lang));
        }
        logger.info("收到注册请求 - 用户名: {}, 邮箱: {}", registerRequest.getUsername(), registerRequest.getEmail());
        logger.debug("注册请求详情: {}", registerRequest);
        
        try {
            LoginResponse response = authService.register(registerRequest);
            logger.info("用户 {} 注册成功", registerRequest.getUsername());
            logger.debug("注册响应: userId={}, token={}", response.getUserId(),
                response.getToken() != null ? response.getToken().substring(0, Math.min(20, response.getToken().length())) + "..." : "null");
            return ApiResponse.success(response);
        } catch (Exception e) {
            logger.error("用户 {} 注册失败: {}", registerRequest.getUsername(), e.getMessage(), e);
            throw e;
        }
    }
    
    @PostMapping("/logout")
    public ApiResponse<Void> logout(
            @RequestHeader("Authorization") String token,
            @RequestHeader(value = "Accept-Language", required = false) String lang) {
        if (lang != null && !lang.isEmpty()) {
            LocaleContextHolder.setLocale(Locale.forLanguageTag(lang));
        }
        logger.info("收到登出请求 - token: {}", token.substring(0, Math.min(20, token.length())) + "...");
        
        try {
            authService.logout(token);
            logger.info("用户登出成功");
            return ApiResponse.success(null);
        } catch (Exception e) {
            logger.error("用户登出失败: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    @PostMapping("/refresh")
    public ApiResponse<LoginResponse> refreshToken(
            @RequestParam String refreshToken,
            @RequestHeader(value = "Accept-Language", required = false) String lang) {
        if (lang != null && !lang.isEmpty()) {
            LocaleContextHolder.setLocale(Locale.forLanguageTag(lang));
        }

        // BusinessLogAspect 已自动记录 [REQUEST] 和 [RESPONSE]，无需手动记录
        try {
            LoginResponse response = authService.refreshToken(refreshToken);
            return ApiResponse.success(response);
        } catch (Exception e) {
            logger.error("令牌刷新失败: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    @GetMapping("/validate")
    public ApiResponse<Boolean> validateToken(
            @RequestParam String token,
            @RequestHeader(value = "Accept-Language", required = false) String lang) {
        if (lang != null && !lang.isEmpty()) {
            LocaleContextHolder.setLocale(Locale.forLanguageTag(lang));
        }
        logger.debug("收到令牌验证请求 - token: {}", token.substring(0, Math.min(20, token.length())) + "...");
        
        try {
            boolean isValid = authService.validateToken(token);
            logger.debug("令牌验证结果: {}", isValid);
            return ApiResponse.success(isValid);
        } catch (Exception e) {
            logger.error("令牌验证失败: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    @PostMapping("/validate-invitation")
    public ApiResponse<TenantInvitation> validateInvitation(
            @RequestHeader(value = "Accept-Language", required = false) String lang,
            @Valid @RequestBody InvitationValidationRequest request) {
        if (lang != null && !lang.isEmpty()) {
            LocaleContextHolder.setLocale(Locale.forLanguageTag(lang));
        }
        logger.info("收到邀请码验证请求 - code: {}", request.getInvitationCode());
        
        try {
            TenantInvitation invitation = tenantInvitationService.validateInvitationCode(request.getInvitationCode());
            logger.info("邀请码验证成功 - code: {}, tenantId: {}", request.getInvitationCode(), invitation.getTenantId());
            return ApiResponse.success(invitation);
        } catch (Exception e) {
            logger.error("邀请码验证失败 - code: {}, error: {}", request.getInvitationCode(), e.getMessage(), e);
            throw e;
        }
    }
    
    @GetMapping("/health")
    public ApiResponse<String> health(
            @RequestHeader(value = "Accept-Language", required = false) String lang) {
        if (lang != null && !lang.isEmpty()) {
            LocaleContextHolder.setLocale(Locale.forLanguageTag(lang));
        }
        logger.debug("收到健康检查请求");
        return ApiResponse.success("Auth service is running");
    }

    /**
     * 忘记密码 - 发送重置邮件
     */
    @PostMapping("/forgot-password")
    public ApiResponse<Void> forgotPassword(
            @RequestHeader(value = "Accept-Language", required = false) String lang,
            @Valid @RequestBody ForgotPasswordRequest request) {
        if (lang != null && !lang.isEmpty()) {
            LocaleContextHolder.setLocale(Locale.forLanguageTag(lang));
        }
        logger.info("收到忘记密码请求 - email: {}", request.getEmail());

        try {
            passwordResetService.sendPasswordResetEmail(request);
            logger.info("密码重置邮件发送成功 - email: {}", request.getEmail());
            return ApiResponse.success(null);
        } catch (Exception e) {
            logger.error("发送密码重置邮件失败 - email: {}", request.getEmail(), e);
            throw e;
        }
    }

    /**
     * 重置密码
     */
    @PostMapping("/reset-password")
    public ApiResponse<Void> resetPassword(
            @RequestHeader(value = "Accept-Language", required = false) String lang,
            @Valid @RequestBody ResetPasswordRequest request) {
        if (lang != null && !lang.isEmpty()) {
            LocaleContextHolder.setLocale(Locale.forLanguageTag(lang));
        }
        logger.info("收到重置密码请求");

        try {
            passwordResetService.resetPassword(request);
            logger.info("密码重置成功");
            return ApiResponse.success(null);
        } catch (Exception e) {
            logger.error("密码重置失败", e);
            throw e;
        }
    }

    /**
     * 验证重置令牌
     */
    @GetMapping("/validate-reset-token")
    public ApiResponse<Boolean> validateResetToken(
            @RequestParam String token,
            @RequestHeader(value = "Accept-Language", required = false) String lang) {
        if (lang != null && !lang.isEmpty()) {
            LocaleContextHolder.setLocale(Locale.forLanguageTag(lang));
        }
        logger.debug("收到验证重置令牌请求");

        try {
            boolean isValid = passwordResetService.validateResetToken(token);
            logger.debug("重置令牌验证结果: {}", isValid);
            return ApiResponse.success(isValid);
        } catch (Exception e) {
            logger.error("重置令牌验证失败", e);
            throw e;
        }
    }

    /**
     * 发送2FA验证码
     */
    @PostMapping("/send-2fa-code")
    public ApiResponse<Send2FACodeResponse> send2FACode(
            @RequestHeader(value = "Accept-Language", required = false) String lang,
            @Valid @RequestBody Send2FACodeRequest request) {
        if (lang != null && !lang.isEmpty()) {
            LocaleContextHolder.setLocale(Locale.forLanguageTag(lang));
        }
        logger.info("收到发送2FA验证码请求 - userId: {}", request.getUserId());

        try {
            Send2FACodeResponse response = twoFactorAuthService.send2FACode(request);
            logger.info("2FA验证码发送{} - userId: {}", response.getSuccess() ? "成功" : "失败", request.getUserId());
            return ApiResponse.success(response);
        } catch (Exception e) {
            logger.error("发送2FA验证码失败 - userId: {}", request.getUserId(), e);
            throw e;
        }
    }

    /**
     * 验证2FA验证码并完成登录
     */
    @PostMapping("/verify-2fa-code")
    public ApiResponse<LoginResponse> verify2FACode(
            @RequestHeader(value = "Accept-Language", required = false) String lang,
            @Valid @RequestBody Verify2FACodeRequest request,
            HttpServletRequest httpRequest) {
        if (lang != null && !lang.isEmpty()) {
            LocaleContextHolder.setLocale(Locale.forLanguageTag(lang));
        }

        String clientIp = getClientIp(httpRequest);
        logger.info("收到验证2FA验证码请求 - userId: {}, IP: {}", request.getUserId(), clientIp);

        try {
            LoginResponse response = twoFactorAuthService.verify2FACode(request, clientIp);
            logger.info("2FA验证成功 - userId: {}", request.getUserId());
            return ApiResponse.success(response);
        } catch (Exception e) {
            logger.error("2FA验证失败 - userId: {}", request.getUserId(), e);
            throw e;
        }
    }

    /**
     * 获取客户端真实IP地址
     * 支持通过代理、负载均衡器等场景
     */
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
            // X-Forwarded-For可能包含多个IP，第一个是真实客户端IP
            int index = ip.indexOf(',');
            if (index != -1) {
                ip = ip.substring(0, index);
            }
            return ip.trim();
        }

        ip = request.getHeader("X-Real-IP");
        if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
            return ip.trim();
        }

        ip = request.getHeader("Proxy-Client-IP");
        if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
            return ip.trim();
        }

        ip = request.getHeader("WL-Proxy-Client-IP");
        if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
            return ip.trim();
        }

        // 如果没有代理，使用request.getRemoteAddr()
        ip = request.getRemoteAddr();
        return ip != null ? ip : "unknown";
    }
} 