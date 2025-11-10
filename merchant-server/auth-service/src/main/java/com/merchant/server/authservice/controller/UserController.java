package com.merchant.server.authservice.controller;

import com.merchant.server.common.annotation.RequiresPermission;
import com.merchant.server.common.annotation.Auditable;
import com.merchant.server.authservice.dto.UserProfileRequest;
import com.merchant.server.authservice.dto.UserProfileResponse;
import com.merchant.server.authservice.dto.AvatarUploadResponse;
import com.merchant.server.authservice.dto.ChangePasswordRequest;
import com.merchant.server.authservice.entity.User;
import com.merchant.server.authservice.entity.User.UserStatus;
import com.merchant.server.authservice.entity.Role;
import com.merchant.server.authservice.service.UserService;
import com.merchant.server.authservice.service.RoleService;
import com.merchant.server.authservice.util.JwtUtil;
import com.merchant.server.authservice.util.MessageUtil;
import com.merchant.server.common.dto.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.context.i18n.LocaleContextHolder;
import java.util.Locale;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

@RestController
@RequestMapping("/api/auth/users")
@Validated
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    @Autowired
    private UserService userService;

    @Autowired
    private RoleService roleService;

    @Autowired
    private FileUploadController fileUploadController;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private MessageUtil messageUtil;

    /**
     * 获取所有用户列表（当前租户）
     */
    @RequiresPermission("users:view")
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllUsers(@RequestHeader("Authorization") String token) {
        logger.info("收到获取用户列表请求");

        try {
            // 从token获取租户ID
            String jwtToken = token.replace("Bearer ", "");

            Long tenantId = jwtUtil.extractTenantId(jwtToken);

            // 如果从token中获取不到tenantId，尝试从userId获取
            if (tenantId == null) {
                Long userId = jwtUtil.getUserIdFromToken(jwtToken);
                if (userId != null) {
                    // 从用户信息中获取tenantId
                    User currentUser = userService.findById(userId)
                        .orElseThrow(() -> new RuntimeException(messageUtil.getMessage("user.not.found")));
                    tenantId = currentUser.getTenantId();
                    logger.info("从用户信息获取 tenantId: {}", tenantId);
                } else {
                    throw new RuntimeException(messageUtil.getMessage("error.token.user.info.extract"));
                }
            }

            // 获取该租户下的所有用户
            List<User> users = userService.findByTenantId(tenantId);

            // 转换为简单的用户信息（避免暴露敏感信息）
            List<Map<String, Object>> userList = users.stream()
                .map(user -> {
                    Map<String, Object> userMap = new HashMap<>();
                    userMap.put("id", user.getId());
                    userMap.put("username", user.getUsername());
                    userMap.put("email", user.getEmail());
                    userMap.put("phone", user.getPhone());
                    userMap.put("displayName", user.getUsername()); // 使用 username 作为 displayName
                    userMap.put("status", user.getStatus());
                    userMap.put("avatarUrl", user.getAvatar());

                    // 获取用户的角色列表
                    try {
                        List<Role> userRoles = roleService.getRolesByUserId(user.getId());
                        List<Map<String, Object>> rolesList = userRoles.stream()
                            .map(role -> {
                                Map<String, Object> roleMap = new HashMap<>();
                                roleMap.put("id", role.getId());
                                roleMap.put("roleName", role.getRoleName());
                                roleMap.put("displayName", role.getDisplayName());
                                roleMap.put("isSystem", role.getIsSystem());
                                return roleMap;
                            })
                            .collect(Collectors.toList());
                        userMap.put("roles", rolesList);
                    } catch (Exception e) {
                        logger.warn("获取用户 {} 的角色失败: {}", user.getId(), e.getMessage());
                        userMap.put("roles", List.of()); // 如果获取失败，返回空列表
                    }

                    return userMap;
                })
                .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", userList);
            response.put("total", userList.size());

            logger.info("获取用户列表成功 - 租户ID: {}, 用户数: {}", tenantId, userList.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("获取用户列表失败: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @GetMapping("/profile")
    public ApiResponse<UserProfileResponse> getProfile(@RequestHeader("Authorization") String token) {
        logger.info("收到获取用户信息请求");

        try {
            UserProfileResponse response = userService.getUserProfile(token);
            logger.info("获取用户信息成功 - 用户ID: {}", response.getUserId());
            return ApiResponse.success(response);
        } catch (Exception e) {
            logger.error("获取用户信息失败: {}", e.getMessage(), e);
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
            logger.error("更新用户信息失败 - 用户ID: {}, 错误信息: {}", request.getUserId(), e.getMessage(), e);
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
            // 先从token获取用户信息
            UserProfileResponse userProfile = userService.getUserProfile(token);
            Long tenantId = userProfile.getTenantId();
            
            // 使用FileUploadController上传文件
            ResponseEntity<Map<String, String>> uploadResponse = fileUploadController.uploadAvatar(file, tenantId);

            if (!uploadResponse.getStatusCode().is2xxSuccessful() || uploadResponse.getBody() == null) {
                throw new RuntimeException(messageUtil.getMessage("error.file.upload.failed"));
            }
            
            Map<String, String> uploadResult = uploadResponse.getBody();
            String avatarUrl = uploadResult.get("url");
            
            // 更新用户头像URL
            AvatarUploadResponse response = userService.updateUserAvatar(token, avatarUrl);
            
            logger.info("头像上传成功 - 用户ID: {}, 文件路径: {}", 
                       response.getUserId(), response.getAvatarUrl());
            return ApiResponse.success(response);
        } catch (Exception e) {
            logger.error("头像上传失败: {}", e.getMessage(), e);
            throw e;
        }
    }

    @RequiresPermission("users:change_password")
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
            logger.error("修改密码失败: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * 更新用户状态
     */
    @RequiresPermission("users:update_status")
    @Auditable(resource = "USER", action = "UPDATE_STATUS", resourceIdParam = "userId", recordOldValue = true, description = "Update user status")
    @PutMapping("/{userId}/status")
    public ResponseEntity<Map<String, Object>> updateUserStatus(
            @RequestHeader("Authorization") String token,
            @PathVariable Long userId,
            @RequestParam String status) {
        logger.info("收到更新用户状态请求 - 用户ID: {}, 新状态: {}", userId, status);

        try {
            // 验证状态值
            if (!"ACTIVE".equals(status) && !"INACTIVE".equals(status)) {
                throw new IllegalArgumentException("无效的状态值: " + status);
            }

            // 更新用户状态
            userService.updateUserStatus(userId, UserStatus.valueOf(status));

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "用户状态更新成功");

            logger.info("用户状态更新成功 - 用户ID: {}, 新状态: {}", userId, status);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("更新用户状态失败: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * 为用户分配角色
     */
    @RequiresPermission("users:assign_roles")
    @Auditable(resource = "USER_ROLE", action = "ASSIGN_ROLES", resourceIdParam = "userId", recordOldValue = true, description = "Assign roles to user")
    @PostMapping("/{userId}/roles")
    public ResponseEntity<Map<String, Object>> assignRolesToUser(
            @RequestHeader("Authorization") String token,
            @PathVariable Long userId,
            @RequestBody Map<String, Object> request) {
        logger.info("收到分配角色请求 - 用户ID: {}, 角色列表: {}", userId, request.get("roleIds"));

        try {
            // 从token获取租户ID
            String jwtToken = token.replace("Bearer ", "");
            Long tenantId = jwtUtil.extractTenantId(jwtToken);

            if (tenantId == null) {
                Long currentUserId = jwtUtil.getUserIdFromToken(jwtToken);
                if (currentUserId != null) {
                    User currentUser = userService.findById(currentUserId)
                        .orElseThrow(() -> new RuntimeException(messageUtil.getMessage("user.not.found")));
                    tenantId = currentUser.getTenantId();
                } else {
                    throw new RuntimeException(messageUtil.getMessage("error.token.user.info.extract"));
                }
            }

            // 获取角色ID列表，处理Integer到Long的转换
            List<Long> roleIds = List.of();
            Object roleIdsObj = request.get("roleIds");
            if (roleIdsObj instanceof List) {
                List<?> rawList = (List<?>) roleIdsObj;
                roleIds = rawList.stream()
                    .map(obj -> {
                        if (obj instanceof Number) {
                            return ((Number) obj).longValue();
                        }
                        return Long.parseLong(obj.toString());
                    })
                    .collect(java.util.stream.Collectors.toList());
            }

            // 调用RoleService分配角色
            roleService.assignRolesToUser(userId, tenantId, roleIds);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "角色分配成功");
            response.put("total", roleIds.size());

            logger.info("角色分配成功 - 用户ID: {}, 角色数量: {}", userId, roleIds.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("角色分配失败: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
} 