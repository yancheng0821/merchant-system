package com.merchant.server.authservice.service.impl;

import com.merchant.server.authservice.dto.MerchantRegisterRequest;
import com.merchant.server.authservice.dto.MerchantRegisterResponse;
import com.merchant.server.authservice.entity.Role;
import com.merchant.server.authservice.entity.Tenant;
import com.merchant.server.authservice.entity.TenantInvitation;
import com.merchant.server.authservice.entity.User;
import com.merchant.server.authservice.service.MerchantRegisterService;
import com.merchant.server.authservice.service.RoleService;
import com.merchant.server.authservice.service.TenantInvitationService;
import com.merchant.server.authservice.service.TenantService;
import com.merchant.server.authservice.service.UserRoleService;
import com.merchant.server.authservice.service.UserService;
import com.merchant.server.authservice.util.JwtUtil;
import com.merchant.server.authservice.util.MessageUtil;
import com.merchant.server.authservice.util.PasswordUtil;
import com.merchant.server.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.merchant.server.authservice.client.MerchantServiceClient;
import com.merchant.server.common.dto.ApiResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class MerchantRegisterServiceImpl implements MerchantRegisterService {
    
    private final UserService userService;
    private final TenantService tenantService;
    private final TenantInvitationService tenantInvitationService;
    private final RoleService roleService;
    private final UserRoleService userRoleService;
    private final PasswordUtil passwordUtil;
    private final JwtUtil jwtUtil;
    private final MessageUtil messageUtil;
    private final MerchantServiceClient merchantServiceClient;
    
    @Override
    @Transactional
    public MerchantRegisterResponse registerMerchant(MerchantRegisterRequest request) {
        log.info("开始商户注册 - 商户名: {}, 管理员: {}", request.getMerchantName(), request.getUsername());
        
        // 1. 验证密码确认
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new BusinessException(messageUtil.getMessage("user.password.mismatch"));
        }
        
        // 2. 对于商户注册，我们不需要检查用户名和邮箱的全局唯一性
        // 因为数据库约束是 (username, tenant_id) 和 (email, tenant_id) 的组合唯一
        // 每个商户都会创建独立的租户，所以允许不同租户下用户名和邮箱重复
        
        // 3. 创建租户
        Tenant tenant = createTenant(request);
        
        // 4. 创建默认角色
        roleService.createDefaultRoles(tenant.getId());
        
        // 5. 创建商户
        Long merchantId = createMerchant(tenant.getId(), request);
        
        // 6. 创建默认商户设置
        createDefaultMerchantSettings(tenant.getId(), request.getResourceTypes());
        
        // 7. 创建管理员用户
        User adminUser = createAdminUser(tenant.getId(), request);
        
        // 8. 分配管理员角色
        assignAdminRole(adminUser.getId(), tenant.getId());
        
        // 9. 生成JWT令牌
        String accessToken = jwtUtil.generateAccessToken(adminUser.getId(), adminUser.getUsername());
        String refreshToken = jwtUtil.generateRefreshToken(adminUser.getId());
        
        // 10. 创建默认邀请码
        TenantInvitation invitation = createDefaultInvitation(tenant.getId(), adminUser.getId());
        
        log.info("商户注册成功 - 商户ID: {}, 租户ID: {}, 管理员ID: {}", 
                merchantId, tenant.getId(), adminUser.getId());
        log.info("返回响应 - 租户代码: {}, 邀请码: {}", tenant.getTenantCode(), invitation.getInvitationCode());
        
        MerchantRegisterResponse response = new MerchantRegisterResponse(
                accessToken, refreshToken, adminUser.getId(), adminUser.getUsername(),
                adminUser.getRealName(), adminUser.getEmail(), adminUser.getAvatar(),
                tenant.getId(), tenant.getTenantName(), merchantId, request.getMerchantName(),
                invitation.getInvitationCode(), tenant.getTenantCode()
        );
        
        log.info("响应对象创建完成 - tenantCode: {}, invitationCode: {}", 
                response.getTenantCode(), response.getInvitationCode());
        
        return response;
    }
    
    private Tenant createTenant(MerchantRegisterRequest request) {
        log.debug("创建租户 - 名称: {}", request.getMerchantName());
        
        Tenant tenant = new Tenant();
        tenant.setTenantCode(generateTenantCode(request.getMerchantName()));
        tenant.setTenantName(request.getMerchantName());
        tenant.setTenantType(Tenant.TenantType.INDEPENDENT);
        tenant.setStatus(Tenant.TenantStatus.ACTIVE);
        tenant.setContactPerson(request.getContactPerson());
        tenant.setContactPhone(request.getContactPhone());
        tenant.setContactEmail(request.getContactEmail());
        tenant.setAddress(request.getAddress());
        
        tenant = tenantService.save(tenant);
        log.info("租户创建成功 - ID: {}, 代码: {}", tenant.getId(), tenant.getTenantCode());
        
        return tenant;
    }
    
    private Long createMerchant(Long tenantId, MerchantRegisterRequest request) {
        log.debug("创建商户 - 租户ID: {}, 商户名: {}", tenantId, request.getMerchantName());
        
        // 调用merchant-service创建商户
        Map<String, Object> merchantData = new HashMap<>();
        merchantData.put("tenantId", tenantId);
        merchantData.put("merchantName", request.getMerchantName());
        merchantData.put("businessCategory", request.getBusinessCategory());
        merchantData.put("businessLicense", request.getBusinessLicense());
        merchantData.put("contactPerson", request.getContactPerson());
        merchantData.put("contactPhone", request.getContactPhone());
        merchantData.put("contactEmail", request.getContactEmail());
        merchantData.put("address", request.getAddress());
        merchantData.put("province", request.getProvince());
        merchantData.put("city", request.getCity());
        merchantData.put("postCode", request.getPostCode());
        merchantData.put("timezone", request.getTimezone());
        merchantData.put("status", "ACTIVE");
        
        try {
            ApiResponse<Map<String, Object>> response = merchantServiceClient.createMerchant(merchantData);
            
            if (response.isSuccess() && response.getData() != null) {
                Map<String, Object> merchantInfo = response.getData();
                Long merchantId = Long.valueOf(merchantInfo.get("id").toString());
                log.info("商户创建成功 - ID: {}", merchantId);
                return merchantId;
            } else {
                throw new BusinessException("创建商户失败：" + response.getMessage());
            }
        } catch (Exception e) {
            log.error("创建商户失败", e);
            throw new BusinessException("创建商户失败：" + e.getMessage());
        }
    }
    
    private void createDefaultMerchantSettings(Long tenantId, List<String> resourceTypes) {
        log.debug("创建默认商户设置 - 租户ID: {}", tenantId);
        
        try {
            // 构建设置数据
            Map<String, Object> settingsData = new HashMap<>();
            
            Map<String, Object> settings = new HashMap<>();
            
            // 资源类型设置
            settings.put("resource_types", Map.of(
                    "value", resourceTypes,
                    "type", "JSON",
                    "description", "商户支持的资源类型"
            ));
            
            // 预约设置
            settings.put("appointment_settings", Map.of(
                    "value", Map.of(
                            "advance_booking_days", 30,
                            "cancellation_hours", 24,
                            "reminder_hours", 2,
                            "auto_confirm", true
                    ),
                    "type", "JSON",
                    "description", "预约相关设置"
            ));
            
            // 通知设置
            settings.put("notification_settings", Map.of(
                    "value", Map.of(
                            "sms_enabled", true,
                            "email_enabled", true,
                            "push_enabled", false
                    ),
                    "type", "JSON",
                    "description", "通知设置"
            ));
            
            // 税率设置
            settings.put("gst_rate", Map.of(
                    "value", "7",
                    "type", "JSON",
                    "description", "GST/HST税率"
            ));
            
            settings.put("pst_rate", Map.of(
                    "value", "5",
                    "type", "JSON",
                    "description", "PST税率"
            ));
            
            // 会话超时设置
            settings.put("session_timeout", Map.of(
                    "value", "30",
                    "type", "JSON",
                    "description", "会话超时时间(分钟)"
            ));
            
            settingsData.put("settings", settings);
            
            // 调用merchant-service创建设置
            merchantServiceClient.createMerchantSettings(tenantId, settingsData);
            
            log.info("默认商户设置创建成功 - 租户ID: {}", tenantId);
        } catch (Exception e) {
            log.error("创建默认商户设置失败 - 租户ID: {}", tenantId, e);
            // 不抛出异常，允许注册继续
        }
    }
    
    private User createAdminUser(Long tenantId, MerchantRegisterRequest request) {
        log.debug("创建管理员用户 - 租户ID: {}, 用户名: {}", tenantId, request.getUsername());
        
        User user = new User();
        user.setTenantId(tenantId);
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setRealName(request.getRealName());
        user.setStatus(User.UserStatus.ACTIVE);
        user.setLoginAttempts(0);
        
        // 加密密码
        String salt = passwordUtil.generateSalt();
        String passwordHash = passwordUtil.hashPassword(request.getPassword(), salt);
        user.setPasswordHash(passwordHash);
        user.setSalt(salt);
        
        user = userService.save(user);
        log.info("管理员用户创建成功 - ID: {}, 用户名: {}", user.getId(), user.getUsername());
        
        return user;
    }
    
    private void assignAdminRole(Long userId, Long tenantId) {
        log.debug("为用户分配管理员角色 - 用户ID: {}, 租户ID: {}", userId, tenantId);
        
        // 查找商户管理员角色
        Optional<Role> adminRoleOpt = roleService.findByRoleCodeAndTenantId("MERCHANT_ADMIN", tenantId);
        if (adminRoleOpt.isPresent()) {
            userRoleService.assignRole(userId, adminRoleOpt.get().getId());
            log.info("管理员角色分配成功 - 用户ID: {}, 角色ID: {}", userId, adminRoleOpt.get().getId());
        } else {
            log.error("未找到商户管理员角色 - 租户ID: {}", tenantId);
            throw new BusinessException("系统错误：未找到管理员角色");
        }
    }
    
    private TenantInvitation createDefaultInvitation(Long tenantId, Long createdBy) {
        log.debug("创建默认邀请码 - 租户ID: {}, 创建者: {}", tenantId, createdBy);
        
        TenantInvitation invitation = new TenantInvitation();
        invitation.setTenantId(tenantId);
        invitation.setInvitationCode(tenantInvitationService.generateInvitationCode());
        invitation.setCreatedBy(createdBy);
        invitation.setMaxUses(50); // 默认50次使用
        invitation.setUsedCount(0);
        invitation.setExpiresAt(LocalDateTime.now().plusDays(90)); // 90天后过期
        invitation.setStatus(TenantInvitation.InvitationStatus.ACTIVE);
        invitation.setCreatedAt(LocalDateTime.now());
        invitation.setUpdatedAt(LocalDateTime.now());
        
        // 直接保存到数据库
        // 这里需要直接调用mapper，因为service方法需要DTO
        try {
            // 临时使用service的内部方法
            String code = invitation.getInvitationCode();
            invitation = tenantInvitationService.createInvitation(
                    new com.merchant.server.authservice.dto.TenantInvitationCreateDTO() {{
                        setTenantId(tenantId);
                        setMaxUses(50);
                        setExpiresAt(LocalDateTime.now().plusDays(90));
                    }},
                    createdBy
            );
            
            log.info("默认邀请码创建成功 - 代码: {}", invitation.getInvitationCode());
            return invitation;
        } catch (Exception e) {
            log.error("创建默认邀请码失败", e);
            throw new BusinessException("创建默认邀请码失败");
        }
    }
    
    private String generateTenantCode(String merchantName) {
        // 生成租户代码：商户名拼音首字母 + 时间戳后6位
        String timestamp = String.valueOf(System.currentTimeMillis());
        String suffix = timestamp.substring(timestamp.length() - 6);
        
        // 简单处理：取商户名前3个字符（如果是中文会有问题，这里简化处理）
        String prefix = merchantName.length() >= 3 ? 
                merchantName.substring(0, 3).toUpperCase() : 
                merchantName.toUpperCase();
        
        return prefix + suffix;
    }
}