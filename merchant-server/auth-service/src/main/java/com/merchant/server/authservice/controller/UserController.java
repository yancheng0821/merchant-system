package com.merchant.server.authservice.controller;

import com.merchant.server.authservice.dto.UserProfileRequest;
import com.merchant.server.authservice.dto.UserProfileResponse;
import com.merchant.server.authservice.dto.AvatarUploadResponse;
import com.merchant.server.authservice.dto.ChangePasswordRequest;
import com.merchant.server.authservice.service.UserService;
import com.merchant.server.common.dto.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.context.i18n.LocaleContextHolder;
import java.util.Locale;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

@RestController
@RequestMapping("/api/users")
@Validated
public class UserController {
    
    private static final Logger logger = LoggerFactory.getLogger(UserController.class);
    
    @Autowired
    private UserService userService;
    
    @GetMapping("/profile")
    public ApiResponse<UserProfileResponse> getProfile(@RequestHeader("Authorization") String token) {
        logger.info("收到获取用户信息请求");
        
        try {
            UserProfileResponse response = userService.getUserProfile(token);
            logger.info("获取用户信息成功 - 用户ID: {}", response.getUserId());
            return ApiResponse.success(response);
        } catch (Exception e) {
            logger.error("获取用户信息失败: {}", e.getMessage());
            throw e;
        }
    }
    
    @PutMapping("/profile")
    public ApiResponse<UserProfileResponse> updateProfile(
            @RequestHeader("Authorization") String token,
            @Valid @RequestBody UserProfileRequest request) {
        logger.info("收到更新用户信息请求 - 用户ID: {}", request.getUserId());
        logger.debug("更新请求详情: {}", request);
        
        try {
            UserProfileResponse response = userService.updateUserProfile(token, request);
            logger.info("更新用户信息成功 - 用户ID: {}", response.getUserId());
            return ApiResponse.success(response);
        } catch (Exception e) {
            logger.error("更新用户信息失败: {}", e.getMessage());
            throw e;
        }
    }
    
    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<AvatarUploadResponse> uploadAvatar(
            @RequestHeader("Authorization") String token,
            @NotNull @RequestParam("avatar") MultipartFile file) {
        logger.info("收到头像上传请求 - 文件名: {}, 大小: {} bytes", 
                   file.getOriginalFilename(), file.getSize());
        
        try {
            AvatarUploadResponse response = userService.uploadAvatar(token, file);
            logger.info("头像上传成功 - 用户ID: {}, 文件路径: {}", 
                       response.getUserId(), response.getAvatarUrl());
            return ApiResponse.success(response);
        } catch (Exception e) {
            logger.error("头像上传失败: {}", e.getMessage());
            throw e;
        }
    }

    @PutMapping("/password")
    public ApiResponse<Void> changePassword(
            @RequestHeader("Authorization") String token,
            @RequestHeader(value = "Accept-Language", required = false) String lang,
            @Valid @RequestBody ChangePasswordRequest request) {
        // 设置当前线程的Locale，支持国际化错误信息
        if (lang != null && !lang.isEmpty()) {
            LocaleContextHolder.setLocale(Locale.forLanguageTag(lang));
        }
        logger.info("收到修改密码请求");
        try {
            userService.changePassword(token, request);
            logger.info("修改密码成功");
            return ApiResponse.success(null);
        } catch (Exception e) {
            logger.error("修改密码失败: {}", e.getMessage());
            throw e;
        }
    }
} 