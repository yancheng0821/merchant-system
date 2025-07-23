package com.merchant.server.authservice.controller;

import com.merchant.server.authservice.dto.GoogleLoginRequest;
import com.merchant.server.authservice.dto.LoginRequest;
import com.merchant.server.authservice.dto.LoginResponse;
import com.merchant.server.authservice.dto.RegisterRequest;
import com.merchant.server.authservice.service.AuthService;
import com.merchant.server.common.dto.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.Locale;

@RestController
@RequestMapping("/api/auth")
@Validated
public class AuthController {
    
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    
    @Autowired
    private AuthService authService;
    
    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(
            @RequestHeader(value = "Accept-Language", required = false) String lang,
            @Valid @RequestBody LoginRequest loginRequest) {
        if (lang != null && !lang.isEmpty()) {
            LocaleContextHolder.setLocale(Locale.forLanguageTag(lang));
        }
        logger.info("收到登录请求 - 用户名: {}, IP: {}", loginRequest.getUsername(), getClientIp());
        logger.debug("登录请求详情: {}", loginRequest);
        
        try {
            LoginResponse response = authService.login(loginRequest);
            logger.info("用户 {} 登录成功", loginRequest.getUsername());
            logger.debug("登录响应: userId={}, token={}", response.getUserId(), response.getToken().substring(0, 20) + "...");
            return ApiResponse.success(response);
        } catch (Exception e) {
            logger.error("用户 {} 登录失败: {}", loginRequest.getUsername(), e.getMessage());
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
            logger.debug("注册响应: userId={}, token={}", response.getUserId(), response.getToken().substring(0, 20) + "...");
            return ApiResponse.success(response);
        } catch (Exception e) {
            logger.error("用户 {} 注册失败: {}", registerRequest.getUsername(), e.getMessage());
            throw e;
        }
    }
    
    @PostMapping("/google")
    public ApiResponse<LoginResponse> googleLogin(
            @RequestHeader(value = "Accept-Language", required = false) String lang,
            @Valid @RequestBody GoogleLoginRequest googleLoginRequest) {
        if (lang != null && !lang.isEmpty()) {
            LocaleContextHolder.setLocale(Locale.forLanguageTag(lang));
        }
        logger.info("收到Google登录请求");
        logger.debug("Google登录请求详情: {}", googleLoginRequest);
        
        try {
            LoginResponse response = authService.googleLogin(googleLoginRequest);
            logger.info("Google登录成功 - userId: {}", response.getUserId());
            logger.debug("Google登录响应: userId={}, token={}", response.getUserId(), response.getToken().substring(0, 20) + "...");
            return ApiResponse.success(response);
        } catch (Exception e) {
            logger.error("Google登录失败: {}", e.getMessage());
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
            logger.error("用户登出失败: {}", e.getMessage());
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
        logger.info("收到令牌刷新请求 - refreshToken: {}", refreshToken.substring(0, Math.min(20, refreshToken.length())) + "...");
        
        try {
            LoginResponse response = authService.refreshToken(refreshToken);
            logger.info("令牌刷新成功");
            logger.debug("刷新响应: userId={}, token={}", response.getUserId(), response.getToken().substring(0, 20) + "...");
            return ApiResponse.success(response);
        } catch (Exception e) {
            logger.error("令牌刷新失败: {}", e.getMessage());
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
            logger.error("令牌验证失败: {}", e.getMessage());
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
    
    @GetMapping("/google/config")
    public ApiResponse<Object> getGoogleConfig() {
        logger.info("获取Google配置信息");
        java.util.Map<String, Object> config = new java.util.HashMap<>();
        config.put("clientId", System.getProperty("google.oauth2.client-id", "未配置"));
        config.put("timestamp", java.time.LocalDateTime.now());
        return ApiResponse.success(config);
    }
    
    /**
     * 获取客户端IP地址
     */
    private String getClientIp() {
        // 这里可以扩展获取真实IP的逻辑
        return "127.0.0.1";
    }
} 