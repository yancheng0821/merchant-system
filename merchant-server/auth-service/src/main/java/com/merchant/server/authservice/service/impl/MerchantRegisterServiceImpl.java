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
import com.merchant.server.common.mq.NotificationMessageProducer;
import com.merchant.server.common.dto.NotificationMessage;
import com.merchant.server.common.dto.NotificationRequest;
import com.merchant.server.common.enums.NotificationScene;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.merchant.server.authservice.client.MerchantServiceClient;
import com.merchant.server.authservice.client.NotificationServiceClient;
import com.merchant.server.authservice.client.BusinessServiceClient;
import com.merchant.server.common.dto.ApiResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
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
    private final NotificationServiceClient notificationServiceClient;
    private final NotificationMessageProducer notificationMessageProducer;
    private final BusinessServiceClient businessServiceClient;
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public MerchantRegisterResponse registerMerchant(MerchantRegisterRequest request) {
        log.info("开始商户注册 - 商户名: {}, 管理员: {}", request.getMerchantName(), request.getUsername());

        Long merchantId = null;
        Tenant tenant = null;
        boolean merchantSettingsCreated = false;

        try {
            // 1. 验证密码确认
            if (!request.getPassword().equals(request.getConfirmPassword())) {
                throw new BusinessException(messageUtil.getMessage("user.password.mismatch"));
            }

            // 2. 对于商户注册，我们不需要检查用户名和邮箱的全局唯一性
            // 因为数据库约束是 (username, tenant_id) 和 (email, tenant_id) 的组合唯一
            // 每个商户都会创建独立的租户，所以允许不同租户下用户名和邮箱重复

            // 3. 生成唯一的商户代码（用作租户代码）
            String merchantCode = generateMerchantCode();

            // 4. 创建租户，使用商户代码作为租户代码
            tenant = createTenant(request, merchantCode);

            // 5. 创建商户，传入预先生成的商户代码（远程调用，需要补偿）
            try {
                merchantId = createMerchant(tenant.getId(), request, merchantCode);
            } catch (Exception e) {
                log.error("创建商户失败，开始回滚 - 租户ID: {}", tenant.getId(), e);
                // 由于是远程调用失败，本地事务会自动回滚租户数据
                throw new BusinessException("创建商户失败：" + e.getMessage());
            }

            // 6. 创建默认商户设置（远程调用，需要补偿）
            try {
                createDefaultMerchantSettings(tenant.getId(), request.getResourceTypes());
                merchantSettingsCreated = true;
            } catch (Exception e) {
                log.error("创建商户设置失败，开始补偿回滚 - 租户ID: {}, 商户ID: {}", tenant.getId(), merchantId, e);
                // 补偿：删除已创建的商户
                compensateDeleteMerchant(merchantId, tenant.getId());
                throw new BusinessException("创建商户设置失败：" + e.getMessage());
            }

            // 6.1 初始化默认通知模板（远程调用，需要补偿）
            try {
                initDefaultNotificationTemplates(tenant.getId());
            } catch (Exception e) {
                log.error("初始化通知模板失败，开始补偿回滚 - 租户ID: {}, 商户ID: {}", tenant.getId(), merchantId, e);
                // 补偿：删除已创建的商户和设置
                compensateDeleteMerchant(merchantId, tenant.getId());
                throw new BusinessException("初始化通知模板失败：" + e.getMessage());
            }

            // 7. 创建管理员用户（本地事务）
            User adminUser;
            try {
                adminUser = createAdminUser(tenant.getId(), request);
            } catch (Exception e) {
                log.error("创建管理员用户失败，开始补偿回滚 - 租户ID: {}", tenant.getId(), e);
                // 补偿：删除商户和设置
                compensateDeleteMerchant(merchantId, tenant.getId());
                throw new BusinessException("创建管理员用户失败：" + e.getMessage());
            }

            // 8. 分配店长角色（本地事务）
            try {
                assignManagerRole(adminUser.getId(), tenant.getId());
            } catch (Exception e) {
                log.error("分配店长角色失败，开始补偿回滚 - 用户ID: {}", adminUser.getId(), e);
                // 补偿：删除商户和设置，本地事务会自动回滚用户数据
                compensateDeleteMerchant(merchantId, tenant.getId());
                throw new BusinessException("分配店长角色失败：" + e.getMessage());
            }

            // 9. 创建默认邀请码（本地事务）
            TenantInvitation invitation;
            try {
                invitation = createDefaultInvitation(tenant.getId(), adminUser.getId());
            } catch (Exception e) {
                log.error("创建默认邀请码失败，开始补偿回滚 - 租户ID: {}", tenant.getId(), e);
                // 补偿：删除商户和设置，本地事务会自动回滚用户、角色、邀请码数据
                compensateDeleteMerchant(merchantId, tenant.getId());
                throw new BusinessException("创建默认邀请码失败：" + e.getMessage());
            }

            // 10. 创建默认 Walk-in 客户（远程调用，需要补偿）
            try {
                createWalkInCustomer(tenant.getId());
            } catch (Exception e) {
                log.error("创建 Walk-in 客户失败，开始补偿回滚 - 租户ID: {}", tenant.getId(), e);
                // 补偿：删除商户和设置，本地事务会自动回滚用户、角色、邀请码数据
                compensateDeleteMerchant(merchantId, tenant.getId());
                throw new BusinessException("创建 Walk-in 客户失败：" + e.getMessage());
            }

            // 11. 生成JWT令牌
            String accessToken = jwtUtil.generateAccessToken(adminUser.getId(), adminUser.getUsername());
            String refreshToken = jwtUtil.generateRefreshToken(adminUser.getId());

            // 12. 发送欢迎邮件（异步，失败不影响注册）
            sendWelcomeEmail(adminUser, tenant, merchantCode, invitation.getInvitationCode());

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

        } catch (BusinessException e) {
            // 业务异常直接抛出，事务会自动回滚
            throw e;
        } catch (Exception e) {
            // 其他异常也需要补偿
            log.error("商户注册过程中发生未预期的错误", e);
            if (merchantId != null) {
                compensateDeleteMerchant(merchantId, tenant != null ? tenant.getId() : null);
            }
            throw new BusinessException("商户注册失败：" + e.getMessage());
        }
    }

    /**
     * 补偿操作：删除已创建的商户和设置
     * 注意：这个方法不会抛出异常，只记录错误日志
     */
    private void compensateDeleteMerchant(Long merchantId, Long tenantId) {
        if (merchantId == null) {
            return;
        }

        try {
            log.warn("执行补偿操作：删除商户 - 商户ID: {}, 租户ID: {}", merchantId, tenantId);

            // 调用 merchant-service 删除商户（会级联删除相关设置）
            merchantServiceClient.deleteMerchant(merchantId);

            log.info("补偿操作完成：商户已删除 - 商户ID: {}", merchantId);
        } catch (Exception e) {
            // 补偿失败只记录日志，不抛出异常
            // 可以考虑记录到补偿失败表，由定时任务处理
            log.error("补偿操作失败：无法删除商户 - 商户ID: {}, 租户ID: {}", merchantId, tenantId, e);
            // TODO: 将失败记录保存到补偿日志表，供后续人工或定时任务处理
        }
    }
    
    private Tenant createTenant(MerchantRegisterRequest request, String merchantCode) {
        log.debug("创建租户 - 名称: {}, 租户代码: {}", request.getMerchantName(), merchantCode);

        Tenant tenant = new Tenant();
        tenant.setTenantCode(merchantCode); // 使用商户代码作为租户代码
        tenant.setTenantName(request.getMerchantName());
        tenant.setTenantType(Tenant.TenantType.INDEPENDENT);
        tenant.setStatus(Tenant.TenantStatus.INACTIVE); // 租户注册后需要系统管理员审核激活
        tenant.setContactPerson(request.getContactPerson());
        tenant.setContactPhone(request.getContactPhone());
        tenant.setContactEmail(request.getContactEmail());
        tenant.setAddress(request.getAddress());

        tenant = tenantService.save(tenant);
        log.info("租户创建成功 - ID: {}, 代码: {}", tenant.getId(), tenant.getTenantCode());

        return tenant;
    }

    private Long createMerchant(Long tenantId, MerchantRegisterRequest request, String merchantCode) {
        log.debug("创建商户 - 租户ID: {}, 商户名: {}, 商户代码: {}", tenantId, request.getMerchantName(), merchantCode);

        // 调用merchant-service创建商户
        Map<String, Object> merchantData = new HashMap<>();
        merchantData.put("tenantId", tenantId);
        merchantData.put("merchantCode", merchantCode); // 传入预先生成的商户代码
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
        merchantData.put("status", "INACTIVE"); // 商户注册后需要系统管理员审核激活
        
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
    
    private void assignManagerRole(Long userId, Long tenantId) {
        log.debug("为用户分配店长角色 - 用户ID: {}", userId);

        // 查找并分配店长角色（角色代码为 MANAGER，系统级别）
        Optional<Role> managerRoleOpt = roleService.findByRoleCode("MANAGER");
        if (managerRoleOpt.isPresent()) {
            userRoleService.assignRole(userId, managerRoleOpt.get().getId());
            log.info("店长角色分配成功 - 用户ID: {}, 角色ID: {}, 角色代码: MANAGER",
                    userId, managerRoleOpt.get().getId());
        } else {
            log.error("未找到店长角色 - 角色代码: MANAGER");
            throw new BusinessException("系统错误：未找到店长角色");
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
        invitation.setExpiresAt(LocalDateTime.now(ZoneOffset.UTC).plusDays(90)); // 90天后过期（UTC时间）
        invitation.setStatus(TenantInvitation.InvitationStatus.ACTIVE);
        invitation.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
        invitation.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
        
        // 直接保存到数据库
        // 这里需要直接调用mapper，因为service方法需要DTO
        try {
            // 临时使用service的内部方法
            String code = invitation.getInvitationCode();
            invitation = tenantInvitationService.createInvitation(
                    new com.merchant.server.authservice.dto.TenantInvitationCreateDTO() {{
                        setTenantId(tenantId);
                        setMaxUses(50);
                        setExpiresAt(LocalDateTime.now(ZoneOffset.UTC).plusDays(90));
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
    
    /**
     * 发送欢迎邮件（通过 MQ 异步发送）
     */
    private void sendWelcomeEmail(User user, Tenant tenant, String merchantCode, String invitationCode) {
        try {
            log.info("准备通过MQ发送欢迎邮件 - 用户: {}, 邮箱: {}, 租户: {}",
                    user.getUsername(), user.getEmail(), tenant.getTenantName());

            // 构建邮件变量
            Map<String, Object> variables = new HashMap<>();
            variables.put("username", user.getUsername());
            variables.put("realName", user.getRealName());
            variables.put("merchantName", tenant.getTenantName());
            variables.put("tenantCode", merchantCode);
            variables.put("invitationCode", invitationCode);
            variables.put("email", user.getEmail());

            // 构建统一的 NotificationRequest
            NotificationRequest request = NotificationRequest.builder()
                    .scene(NotificationScene.MERCHANT_REGISTER_WELCOME.getCode())
                    .tenantId(tenant.getId())
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
            payload.put("scene", request.getScene());
            payload.put("tenantId", request.getTenantId());
            payload.put("recipient", request.getRecipient());
            payload.put("channel", request.getChannel());
            payload.put("variables", request.getVariables());
            payload.put("businessId", request.getBusinessId());
            payload.put("templateCode", request.getTemplateCode());

            // 创建通知消息
            NotificationMessage message = NotificationMessage.builder()
                    .messageType(NotificationMessage.MessageType.EMAIL)
                    .priority(NotificationMessage.Priority.NORMAL)
                    .tenantId(tenant.getId())
                    .payload(payload)
                    .build();

            // 通过 MQ 发送到商户注册队列
            notificationMessageProducer.sendMerchantRegisterWelcome(message);

            log.info("欢迎邮件已发送到MQ - 用户: {}, 邮箱: {}, messageId: {}, scene: {}",
                    user.getUsername(), user.getEmail(), message.getMessageId(), request.getScene());
        } catch (Exception e) {
            // 发送邮件失败不应该影响注册流程，只记录错误
            log.error("发送欢迎邮件到MQ失败 - 用户: {}, 邮箱: {}",
                    user.getUsername(), user.getEmail(), e);
        }
    }

    /**
     * 生成唯一的商户代码
     * 格式: 8位数字 (7位随机数 + 1位Luhn校验位)
     * 例如: 12345678
     *
     * 特点:
     * 1. 短小易记 - 只有8位数字
     * 2. 安全性高 - 纯随机，无时间戳等可预测信息
     * 3. 防输入错误 - 最后一位是Luhn校验码
     * 4. 数据库唯一性保证 - 检查重复直到生成唯一码
     */
    private String generateMerchantCode() {
        int maxAttempts = 10; // 最多尝试10次

        for (int attempt = 0; attempt < maxAttempts; attempt++) {
            // 生成7位随机数字 (1000000-9999999)
            int baseNumber = 1000000 + (int) (Math.random() * 9000000);

            // 计算Luhn校验位
            int checkDigit = calculateLuhnCheckDigit(baseNumber);

            // 组合成8位商户代码
            String merchantCode = String.valueOf(baseNumber) + checkDigit;

            // 检查是否已存在
            if (!tenantService.existsByTenantCode(merchantCode)) {
                log.info("生成商户代码成功 - 代码: {}, 尝试次数: {}", merchantCode, attempt + 1);
                return merchantCode;
            }

            log.warn("商户代码已存在，重新生成 - 代码: {}, 尝试: {}/{}", merchantCode, attempt + 1, maxAttempts);
        }

        // 如果10次都失败，使用时间戳作为后备方案
        log.error("生成唯一商户代码失败，使用时间戳后备方案");
        String timestamp = String.valueOf(System.currentTimeMillis());
        return timestamp.substring(timestamp.length() - 8); // 取最后8位
    }

    /**
     * 计算Luhn校验位
     * Luhn算法广泛用于信用卡、银行账号等校验
     *
     * @param number 7位基础数字
     * @return 校验位 (0-9)
     */
    private int calculateLuhnCheckDigit(int number) {
        String numStr = String.valueOf(number);
        int sum = 0;
        boolean alternate = true; // 从右往左，第一位（最右边）不翻倍

        // 从右往左处理每一位
        for (int i = numStr.length() - 1; i >= 0; i--) {
            int digit = Character.getNumericValue(numStr.charAt(i));

            if (alternate) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9; // 等同于 digit = digit / 10 + digit % 10
                }
            }

            sum += digit;
            alternate = !alternate;
        }

        // 校验位 = (10 - (sum % 10)) % 10
        return (10 - (sum % 10)) % 10;
    }

    /**
     * 初始化默认通知模板
     * 从系统模板（tenant_id=1）复制商户级通知模板到新租户
     */
    private void initDefaultNotificationTemplates(Long tenantId) {
        log.debug("初始化默认通知模板 - 租户ID: {}", tenantId);

        try {
            // 调用notification-service初始化模板，默认使用英文模板
            ApiResponse<String> response = notificationServiceClient.initDefaultTemplates(tenantId, "en");

            if (response.isSuccess()) {
                log.info("默认通知模板初始化成功 - 租户ID: {}, 结果: {}", tenantId, response.getMessage());
            } else {
                log.warn("默认通知模板初始化失败 - 租户ID: {}, 错误: {}", tenantId, response.getMessage());
            }
        } catch (Exception e) {
            log.error("初始化默认通知模板失败 - 租户ID: {}", tenantId, e);
            throw e; // 抛出异常供上层捕获
        }
    }

    /**
     * 创建默认 Walk-in 客户
     */
    private void createWalkInCustomer(Long tenantId) {
        log.debug("创建默认 Walk-in 客户 - 租户ID: {}", tenantId);

        try {
            Map<String, Object> response = businessServiceClient.createWalkInCustomer(tenantId);

            if (response != null && Boolean.TRUE.equals(response.get("success"))) {
                log.info("Walk-in 客户创建成功 - 租户ID: {}", tenantId);
            } else {
                String errorMsg = response != null ? String.valueOf(response.get("message")) : "未知错误";
                log.error("Walk-in 客户创建失败 - 租户ID: {}, 错误: {}", tenantId, errorMsg);
                throw new BusinessException("创建 Walk-in 客户失败：" + errorMsg);
            }
        } catch (Exception e) {
            log.error("创建 Walk-in 客户失败 - 租户ID: {}", tenantId, e);
            throw new BusinessException("创建 Walk-in 客户失败：" + e.getMessage());
        }
    }
}