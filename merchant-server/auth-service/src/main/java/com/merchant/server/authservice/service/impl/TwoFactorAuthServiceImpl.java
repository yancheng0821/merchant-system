package com.merchant.server.authservice.service.impl;

import com.merchant.server.authservice.client.BusinessServiceClient;
import com.merchant.server.authservice.client.MerchantServiceClient;
import com.merchant.server.common.dto.ApiResponse;
import com.merchant.server.authservice.dto.LoginResponse;
import com.merchant.server.authservice.dto.Send2FACodeRequest;
import com.merchant.server.authservice.dto.Send2FACodeResponse;
import com.merchant.server.authservice.dto.Verify2FACodeRequest;
import com.merchant.server.authservice.entity.Permission;
import com.merchant.server.authservice.entity.Role;
import com.merchant.server.authservice.entity.Tenant;
import com.merchant.server.authservice.entity.User;
import com.merchant.server.authservice.mapper.PermissionMapper;
import com.merchant.server.authservice.mapper.RoleMapper;
import com.merchant.server.authservice.mapper.TenantMapper;
import com.merchant.server.authservice.mapper.UserMapper;
import com.merchant.server.authservice.service.TwoFactorAuthService;
import com.merchant.server.authservice.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TwoFactorAuthServiceImpl implements TwoFactorAuthService {

    private final BusinessServiceClient businessServiceClient;
    private final MerchantServiceClient merchantServiceClient;
    private final UserMapper userMapper;
    private final RoleMapper roleMapper;
    private final PermissionMapper permissionMapper;
    private final TenantMapper tenantMapper;
    private final JwtUtil jwtUtil;

    @Override
    public Send2FACodeResponse send2FACode(Send2FACodeRequest request) {
        log.info("Sending 2FA code for user: {}", request.getUserId());

        try {
            // 查询用户信息获取电话号码
            User user = userMapper.selectById(request.getUserId());
            if (user == null) {
                log.error("User not found: {}", request.getUserId());
                return Send2FACodeResponse.failure("User not found");
            }

            if (user.getPhone() == null || user.getPhone().trim().isEmpty()) {
                log.error("User phone number is empty: {}", request.getUserId());
                return Send2FACodeResponse.failure("Phone number not configured");
            }

            log.info("Sending 2FA code to phone: {} for user: {}", maskPhone(user.getPhone()), request.getUserId());

            // Create verification code request with userId as businessId
            BusinessServiceClient.SendVerificationCodeRequest verificationRequest =
                    new BusinessServiceClient.SendVerificationCodeRequest(
                            request.getTenantId(),
                            "LOGIN_2FA",
                            String.valueOf(request.getUserId()),  // businessId: user ID for LOGIN_2FA
                            user.getPhone(),
                            "PHONE"  // recipientType: PHONE or EMAIL
                    );

            // Get current locale for internationalization
            String acceptLanguage = org.springframework.context.i18n.LocaleContextHolder.getLocale().toLanguageTag();

            // Call business service to send code
            ResponseEntity<BusinessServiceClient.VerificationCodeResponse> response =
                    businessServiceClient.sendVerificationCode(acceptLanguage, verificationRequest);

            if (response.getBody() != null && response.getBody().success) {
                log.info("2FA code sent successfully to user: {}", request.getUserId());
                return Send2FACodeResponse.success(
                        response.getBody().verificationId,
                        response.getBody().expiresIn
                );
            } else {
                String errorMessage = response.getBody() != null ? response.getBody().message : "Failed to send verification code";
                log.error("Failed to send 2FA code: {}", errorMessage);
                return Send2FACodeResponse.failure(errorMessage);
            }
        } catch (feign.FeignException e) {
            // 处理Feign异常，提取有用的错误信息
            log.error("Feign error sending 2FA code: {}", e.getMessage());

            // 尝试从Feign异常中提取JSON响应
            String responseBody = e.contentUTF8();
            if (responseBody != null && !responseBody.isEmpty()) {
                try {
                    // 解析JSON响应
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    BusinessServiceClient.VerificationCodeResponse errorData =
                            mapper.readValue(responseBody, BusinessServiceClient.VerificationCodeResponse.class);

                    String message = errorData.message;
                    if (message != null && !message.isEmpty()) {
                        return Send2FACodeResponse.failure(message);
                    }
                } catch (Exception parseException) {
                    log.error("Failed to parse Feign error response", parseException);
                }
            }
            return Send2FACodeResponse.failure("Failed to send verification code");
        } catch (Exception e) {
            log.error("Error sending 2FA code", e);
            return Send2FACodeResponse.failure("Failed to send verification code");
        }
    }

    // 脱敏电话号码
    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) {
            return phone;
        }
        int visibleDigits = 4;
        int maskLength = phone.length() - visibleDigits;
        String masked = "*".repeat(maskLength);
        return masked + phone.substring(maskLength);
    }

    @Override
    public LoginResponse verify2FACode(Verify2FACodeRequest request, String clientIp) {
        log.info("Verifying 2FA code for user: {}, IP: {}", request.getUserId(), clientIp);

        try {
            // Verify code with business service
            BusinessServiceClient.VerifyCodeRequest verifyRequest =
                    new BusinessServiceClient.VerifyCodeRequest(
                            request.getVerificationId(),
                            request.getCode()
                    );

            // Get current locale for internationalization
            String acceptLanguage = org.springframework.context.i18n.LocaleContextHolder.getLocale().toLanguageTag();

            ResponseEntity<BusinessServiceClient.VerificationCodeResponse> response =
                    businessServiceClient.verifyCode(acceptLanguage, verifyRequest);

            if (response.getBody() != null && response.getBody().success) {
                // Code verified successfully, generate JWT token
                User user = userMapper.selectById(request.getUserId());
                if (user == null) {
                    throw new IllegalArgumentException("User not found");
                }

                // Update last login info
                user.setLastLoginAt(java.time.LocalDateTime.now(java.time.ZoneOffset.UTC));
                user.setLastLoginIp(clientIp);
                user.setLoginAttempts(0);
                userMapper.update(user);

                // 重新查询用户以获取数据库中的完整信息（包括 created_at 等字段）
                User updatedUser = userMapper.selectById(user.getId());
                if (updatedUser != null) {
                    user = updatedUser;
                    log.debug("重新查询用户信息 - createdAt: {}, lastLoginAt: {}", user.getCreatedAt(), user.getLastLoginAt());
                }

                String token = jwtUtil.generateToken(user);
                String refreshToken = jwtUtil.generateRefreshToken(user);

                // 查询用户角色
                log.debug("查询用户角色 - userId: {}", user.getId());
                List<Role> userRoles = roleMapper.selectByUserId(user.getId());
                log.debug("角色查询成功，结果数量: {}", userRoles != null ? userRoles.size() : 0);
                List<String> roleCodes = (userRoles != null && !userRoles.isEmpty()) ?
                    userRoles.stream()
                        .map(Role::getRoleCode)
                        .collect(Collectors.toList()) :
                    new java.util.ArrayList<>();
                log.debug("用户角色: {}", roleCodes);

                // 查询用户权限
                log.debug("查询用户权限 - userId: {}, tenantId: {}", user.getId(), user.getTenantId());
                List<Permission> userPermissions = permissionMapper.selectByUserId(user.getId(), user.getTenantId());
                log.debug("权限查询成功，结果数量: {}", userPermissions != null ? userPermissions.size() : 0);
                List<String> permissionCodes = (userPermissions != null && !userPermissions.isEmpty()) ?
                    userPermissions.stream()
                        .map(Permission::getPermissionCode)
                        .collect(Collectors.toList()) :
                    new java.util.ArrayList<>();
                log.debug("用户权限数量: {}, 前5个权限: {}", permissionCodes.size(),
                         permissionCodes.stream().limit(5).collect(Collectors.toList()));

                LoginResponse loginResponse = new LoginResponse();
                loginResponse.setToken(token);
                loginResponse.setRefreshToken(refreshToken);
                loginResponse.setUserId(user.getId());
                loginResponse.setUsername(user.getUsername());
                loginResponse.setEmail(user.getEmail());
                loginResponse.setPhone(user.getPhone());
                loginResponse.setRealName(user.getRealName());
                loginResponse.setAvatar(user.getAvatarUrl());
                loginResponse.setTenantId(request.getTenantId());
                loginResponse.setCreatedAt(user.getCreatedAt());
                loginResponse.setRoles(roleCodes);
                loginResponse.setPermissions(permissionCodes);

                // 设置租户所有者标识
                Tenant tenant = tenantMapper.selectById(request.getTenantId());
                if (tenant != null) {
                    loginResponse.setTenantName(tenant.getTenantName());
                    loginResponse.setTenantCode(tenant.getTenantCode());
                    loginResponse.setTenantStatus(tenant.getStatus().name());
                    loginResponse.setIsTenantOwner(tenant.getOwnerUserId() != null && tenant.getOwnerUserId().equals(user.getId()));

                    // 检查订阅过期状态
                    if (tenant.getStatus() == Tenant.TenantStatus.INACTIVE) {
                        loginResponse.setSubscriptionExpired(true);
                    }
                } else {
                    loginResponse.setIsTenantOwner(false);
                }

                // 获取订阅状态和计划代码
                try {
                    ApiResponse<Map<String, Object>> subscriptionResponse = merchantServiceClient.getSubscriptionStatus(request.getTenantId());
                    if (subscriptionResponse != null && subscriptionResponse.isSuccess() && subscriptionResponse.getData() != null) {
                        String subscriptionStatus = (String) subscriptionResponse.getData().get("status");
                        String planCode = (String) subscriptionResponse.getData().get("planCode");
                        loginResponse.setSubscriptionStatus(subscriptionStatus);
                        loginResponse.setPlanCode(planCode);
                        log.debug("设置订阅状态: {}, 计划代码: {}", subscriptionStatus, planCode);
                    }
                } catch (Exception e) {
                    log.warn("获取订阅状态失败: {}", e.getMessage());
                }

                log.info("2FA verification successful for user: {}, roles: {}, permissions: {}, isTenantOwner: {}",
                         user.getUsername(), roleCodes.size(), permissionCodes.size(), loginResponse.getIsTenantOwner());
                return loginResponse;
            } else {
                String errorMessage = response.getBody() != null ? response.getBody().message : "Invalid verification code";
                log.warn("2FA verification failed: {}", errorMessage);
                throw new IllegalArgumentException(errorMessage);
            }
        } catch (IllegalArgumentException e) {
            // 直接抛出已经格式化好的错误消息
            throw e;
        } catch (feign.FeignException e) {
            // 处理Feign异常，提取有用的错误信息
            log.error("Feign error verifying 2FA code: {}", e.getMessage());

            // 尝试从Feign异常中提取JSON响应
            String responseBody = e.contentUTF8();
            if (responseBody != null && !responseBody.isEmpty()) {
                try {
                    // 解析JSON响应
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    BusinessServiceClient.VerificationCodeResponse errorData =
                            mapper.readValue(responseBody, BusinessServiceClient.VerificationCodeResponse.class);

                    String message = errorData.message;
                    if (message != null && !message.isEmpty()) {
                        throw new IllegalArgumentException(message);
                    }
                } catch (IllegalArgumentException iae) {
                    throw iae;
                } catch (Exception parseException) {
                    log.error("Failed to parse Feign error response", parseException);
                }
            }
            throw new IllegalArgumentException("Verification code validation failed");
        } catch (Exception e) {
            log.error("Error verifying 2FA code", e);
            throw new IllegalArgumentException("Verification service temporarily unavailable, please try again later");
        }
    }
}
