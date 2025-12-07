package com.merchant.server.authservice.service.impl;

import com.merchant.server.authservice.dto.LoginRequest;
import com.merchant.server.authservice.dto.LoginResponse;
import com.merchant.server.authservice.dto.RegisterRequest;
import com.merchant.server.authservice.entity.Tenant;
import com.merchant.server.authservice.entity.TenantInvitation;
import com.merchant.server.authservice.entity.User;
import com.merchant.server.authservice.entity.Role;
import com.merchant.server.authservice.entity.Permission;
import com.merchant.server.authservice.entity.UserRole;
import com.merchant.server.authservice.mapper.RoleMapper;
import com.merchant.server.authservice.mapper.PermissionMapper;
import com.merchant.server.authservice.mapper.UserRoleMapper;
import com.merchant.server.authservice.service.AuthService;
import com.merchant.server.authservice.service.TenantInvitationService;
import com.merchant.server.authservice.service.TenantService;
import com.merchant.server.authservice.service.UserService;
import com.merchant.server.authservice.client.MerchantServiceClient;
import com.merchant.server.authservice.util.JwtUtil;
import com.merchant.server.authservice.util.MessageUtil;
import com.merchant.server.authservice.util.PasswordUtil;
import com.merchant.server.common.dto.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AuthServiceImpl implements AuthService {
    
    private static final Logger logger = LoggerFactory.getLogger(AuthServiceImpl.class);
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private TenantService tenantService;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @Autowired
    private PasswordUtil passwordUtil;
    
    @Autowired
    private MessageUtil messageUtil;

    @Autowired
    private RoleMapper roleMapper;

    @Autowired
    private PermissionMapper permissionMapper;

    @Autowired
    private UserRoleMapper userRoleMapper;

    @Autowired
    private TenantInvitationService tenantInvitationService;

    @Autowired
    private MerchantServiceClient merchantServiceClient;
    
    @Override
    public LoginResponse login(LoginRequest loginRequest, String clientIp) {
        logger.debug("开始处理登录请求 - 用户名: {}, 租户代码: {}, IP: {}", loginRequest.getUsername(), loginRequest.getTenantCode(), clientIp);
        
        // 首先验证租户代码
        if (loginRequest.getTenantCode() == null || loginRequest.getTenantCode().trim().isEmpty()) {
            logger.warn("登录失败 - 租户代码为空: {}", loginRequest.getUsername());
            throw new RuntimeException(messageUtil.getMessage("tenant.code.required"));
        }
        
        // 查找租户
        Optional<Tenant> tenantOpt = tenantService.findByTenantCode(loginRequest.getTenantCode());
        if (tenantOpt.isEmpty()) {
            logger.warn("登录失败 - 租户不存在: {}", loginRequest.getTenantCode());
            throw new RuntimeException(messageUtil.getMessage("tenant.not.found"));
        }
        
        Tenant tenant = tenantOpt.get();
        logger.debug("找到租户: tenantId={}, tenantName={}, status={}", tenant.getId(), tenant.getTenantName(), tenant.getStatus());

        // 检查租户状态 - 只有 SUSPENDED 状态才完全禁止登录
        // INACTIVE 状态（订阅过期）允许登录，但会标记为受限模式
        boolean subscriptionExpired = false;
        if (tenant.getStatus() == Tenant.TenantStatus.SUSPENDED) {
            logger.warn("登录失败 - 租户已被暂停: {} (状态: {})", tenant.getTenantCode(), tenant.getStatus());
            throw new RuntimeException(messageUtil.getMessage("tenant.suspended"));
        } else if (tenant.getStatus() == Tenant.TenantStatus.INACTIVE) {
            // 订阅过期，允许登录但标记为受限模式
            logger.info("租户订阅已过期，进入受限登录模式: {} (状态: {})", tenant.getTenantCode(), tenant.getStatus());
            subscriptionExpired = true;
        }

        // 在指定租户下查找用户
        Optional<User> userOpt = userService.findByUsernameAndTenantId(loginRequest.getUsername(), tenant.getId());
        if (userOpt.isEmpty()) {
            logger.warn("登录失败 - 用户在租户{}下不存在: {}", tenant.getId(), loginRequest.getUsername());
            throw new RuntimeException(messageUtil.getMessage("user.invalid.credentials"));
        }
        
        User user = userOpt.get();
        logger.debug("找到用户: userId={}, realName={}, status={}, tenantId={}", user.getId(), user.getRealName(), user.getStatus(), user.getTenantId());
        
        // 验证密码
        logger.debug("开始验证密码");
        if (!passwordUtil.verifyPassword(loginRequest.getPassword(), user.getPasswordHash(), user.getSalt())) {
            logger.warn("登录失败 - 密码错误: {}", loginRequest.getUsername());
            throw new RuntimeException(messageUtil.getMessage("user.invalid.credentials"));
        }
        logger.debug("密码验证成功");
        
        // 检查用户状态
        if (user.getStatus() != User.UserStatus.ACTIVE) {
            logger.warn("登录失败 - 用户状态非活跃: {} (状态: {})", loginRequest.getUsername(), user.getStatus());
            throw new RuntimeException(messageUtil.getMessage("user.account.disabled"));
        }

        // 检查是否需要二次验证（2FA）
        // 只有当用户有电话号码且开启了短信验证时才需要 2FA
        boolean hasSmsVerificationEnabled = user.getSmsVerificationEnabled() == null || user.getSmsVerificationEnabled();
        if (user.getPhone() != null && !user.getPhone().trim().isEmpty() && hasSmsVerificationEnabled) {
            logger.info("用户{}需要进行二次验证", loginRequest.getUsername());
            // 返回需要2FA的响应，不生成JWT token
            return LoginResponse.needTwoFactorAuth(user, tenant.getId());
        }

        // 如果用户没有电话号码或关闭了短信验证，跳过二次验证
        if (user.getPhone() == null || user.getPhone().trim().isEmpty()) {
            logger.warn("用户{}没有设置电话号码，跳过二次验证", loginRequest.getUsername());
        } else if (!hasSmsVerificationEnabled) {
            logger.info("用户{}已关闭短信验证，跳过二次验证", loginRequest.getUsername());
        }

        // 更新最后登录信息
        logger.debug("更新用户登录信息 - IP: {}", clientIp);
        user.setLastLoginAt(LocalDateTime.now(ZoneOffset.UTC));
        user.setLastLoginIp(clientIp);
        user.setLoginAttempts(0);
        userService.save(user);

        // 重新查询用户以获取数据库中的完整信息（包括 created_at 等字段）
        Optional<User> updatedUserOpt = userService.findById(user.getId());
        if (updatedUserOpt.isPresent()) {
            user = updatedUserOpt.get();
            logger.debug("重新查询用户信息 - createdAt: {}, lastLoginAt: {}", user.getCreatedAt(), user.getLastLoginAt());
        }

        // 生成JWT令牌（包含订阅过期标识，用于 Gateway 限制 API 访问）
        logger.debug("生成JWT令牌 - subscriptionExpired: {}", subscriptionExpired);
        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getUsername(), user.getTenantId(), subscriptionExpired);
        String refreshToken = jwtUtil.generateRefreshToken(user.getId());

        // 查询用户角色
        logger.debug("查询用户角色 - userId: {}", user.getId());
        List<Role> userRoles = null;
        try {
            userRoles = roleMapper.selectByUserId(user.getId());
            logger.debug("角色查询成功，结果: {}", userRoles);
        } catch (Exception e) {
            logger.error("查询用户角色失败 - userId: {}, 错误: {}", user.getId(), e.getMessage(), e);
            throw new RuntimeException(messageUtil.getMessage("error.role.query.failed", new Object[]{e.getMessage()}), e);
        }
        List<String> roleCodes = (userRoles != null && !userRoles.isEmpty()) ?
            userRoles.stream()
                .map(Role::getRoleCode)
                .collect(Collectors.toList()) :
            new java.util.ArrayList<>();
        logger.debug("用户角色数量: {}, 角色: {}", roleCodes.size(), roleCodes);

        // 查询用户权限
        logger.debug("查询用户权限 - userId: {}, tenantId: {}", user.getId(), user.getTenantId());
        List<Permission> userPermissions = null;
        try {
            userPermissions = permissionMapper.selectByUserId(user.getId(), user.getTenantId());
            logger.debug("权限查询成功，结果数量: {}", userPermissions != null ? userPermissions.size() : 0);
        } catch (Exception e) {
            logger.error("查询用户权限失败 - userId: {}, tenantId: {}, 错误: {}", user.getId(), user.getTenantId(), e.getMessage(), e);
            throw new RuntimeException(messageUtil.getMessage("error.permission.query.failed", new Object[]{e.getMessage()}), e);
        }
        List<String> permissionCodes = (userPermissions != null && !userPermissions.isEmpty()) ?
            userPermissions.stream()
                .map(Permission::getPermissionCode)
                .collect(Collectors.toList()) :
            new java.util.ArrayList<>();
        logger.debug("用户权限数量: {}, 前5个权限: {}", permissionCodes.size(),
                     permissionCodes.stream().limit(5).collect(Collectors.toList()));

        LoginResponse response = new LoginResponse(accessToken, refreshToken, user);
        response.setRoles(roleCodes);
        response.setPermissions(permissionCodes);
        response.setTenantName(tenant.getTenantName());
        response.setTenantCode(tenant.getTenantCode());
        // 设置租户所有者标识
        boolean isOwner = tenant.getOwnerUserId() != null && tenant.getOwnerUserId().equals(user.getId());
        response.setIsTenantOwner(isOwner);
        logger.info("设置租户所有者标识 - userId: {}, ownerUserId: {}, isTenantOwner: {}",
                    user.getId(), tenant.getOwnerUserId(), isOwner);

        // 设置订阅过期标识和租户状态
        response.setSubscriptionExpired(subscriptionExpired);
        response.setTenantStatus(tenant.getStatus().name());
        if (subscriptionExpired) {
            logger.info("用户登录 - 订阅已过期，进入受限模式: userId={}, tenantId={}", user.getId(), tenant.getId());
        }

        // 获取订阅状态和计划代码
        try {
            ApiResponse<Map<String, Object>> subscriptionResponse = merchantServiceClient.getSubscriptionStatus(user.getTenantId());
            if (subscriptionResponse != null && subscriptionResponse.isSuccess() && subscriptionResponse.getData() != null) {
                String subscriptionStatus = (String) subscriptionResponse.getData().get("status");
                String planCode = (String) subscriptionResponse.getData().get("planCode");
                response.setSubscriptionStatus(subscriptionStatus);
                response.setPlanCode(planCode);
                logger.debug("设置订阅状态: {}, 计划代码: {}", subscriptionStatus, planCode);
            }
        } catch (Exception e) {
            logger.warn("获取订阅状态失败: {}", e.getMessage());
        }

        // 获取商户时区信息
        try {
            ApiResponse<Map<String, Object>> merchantResponse = merchantServiceClient.getMerchantByTenantId(user.getTenantId());
            if (merchantResponse != null && merchantResponse.isSuccess() && merchantResponse.getData() != null) {
                String timezone = (String) merchantResponse.getData().get("timezone");
                if (timezone != null && !timezone.isEmpty()) {
                    response.setTimezone(timezone);
                    logger.debug("设置商户时区: {}", timezone);
                } else {
                    response.setTimezone("America/Vancouver"); // 默认时区
                    logger.warn("商户时区为空，使用默认时区: America/Vancouver");
                }
            } else {
                response.setTimezone("America/Vancouver"); // 默认时区
                logger.warn("获取商户信息失败，使用默认时区: America/Vancouver");
            }
        } catch (Exception e) {
            logger.error("获取商户时区失败: {}", e.getMessage(), e);
            response.setTimezone("America/Vancouver"); // 默认时区
        }

        logger.info("用户登录成功 - userId: {}, username: {}, roles: {}, permissions: {}, timezone: {}",
                    user.getId(), user.getUsername(), roleCodes.size(), permissionCodes.size(), response.getTimezone());
        logger.debug("登录响应生成完成 - accessToken长度: {}, refreshToken长度: {}",
                    accessToken.length(), refreshToken.length());

        return response;
    }
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public LoginResponse register(RegisterRequest registerRequest) {
        logger.debug("开始处理注册请求 - 用户名: {}, 邮箱: {}", registerRequest.getUsername(), registerRequest.getEmail());

        // 验证密码确认
        if (!registerRequest.getPassword().equals(registerRequest.getConfirmPassword())) {
            logger.warn("注册失败 - 密码不匹配: {}", registerRequest.getUsername());
            throw new RuntimeException(messageUtil.getMessage("user.password.mismatch"));
        }

        // 验证邀请码并获取租户
        logger.debug("验证邀请码 - invitationCode: {}", registerRequest.getInvitationCode());
        TenantInvitation invitation = tenantInvitationService.validateInvitationCode(registerRequest.getInvitationCode());

        // 获取租户信息
        Optional<Tenant> tenantOpt = tenantService.findById(invitation.getTenantId());
        if (tenantOpt.isEmpty()) {
            logger.error("邀请码关联的租户不存在 - tenantId: {}", invitation.getTenantId());
            throw new RuntimeException(messageUtil.getMessage("error.tenant.invitation.invalid"));
        }
        Tenant tenant = tenantOpt.get();

        // 检查租户状态 - 只有激活的租户才能注册员工
        if (tenant.getStatus() != Tenant.TenantStatus.ACTIVE) {
            logger.warn("注册失败 - 租户状态非活跃: tenantCode={}, status={}", tenant.getTenantCode(), tenant.getStatus());
            throw new RuntimeException(messageUtil.getMessage("tenant.not.active"));
        }

        // 检查用户名在该租户下是否已存在
        if (userService.existsByUsernameAndTenantId(registerRequest.getUsername(), tenant.getId())) {
            logger.warn("注册失败 - 用户名在租户{}下已存在: {}", tenant.getId(), registerRequest.getUsername());
            throw new RuntimeException(messageUtil.getMessage("user.username.exists"));
        }

        // 检查邮箱在该租户下是否已存在
        if (registerRequest.getEmail() != null && userService.existsByEmailAndTenantId(registerRequest.getEmail(), tenant.getId())) {
            logger.warn("注册失败 - 邮箱在租户{}下已存在: {}", tenant.getId(), registerRequest.getEmail());
            throw new RuntimeException(messageUtil.getMessage("user.email.exists"));
        }

        // 创建用户
        logger.debug("创建新用户");
        User user = new User();
        user.setTenantId(tenant.getId());
        user.setUsername(registerRequest.getUsername());
        user.setEmail(registerRequest.getEmail());
        user.setPhone(registerRequest.getPhone());
        user.setRealName(registerRequest.getRealName());
        user.setStatus(User.UserStatus.ACTIVE);
        user.setLoginAttempts(0);

        // 加密密码
        logger.debug("加密用户密码");
        String salt = passwordUtil.generateSalt();
        String passwordHash = passwordUtil.hashPassword(registerRequest.getPassword(), salt);
        user.setPasswordHash(passwordHash);
        user.setSalt(salt);

        // 保存用户
        user = userService.save(user);
        logger.debug("用户保存成功 - userId: {}", user.getId());

        // 重新查询用户以获取数据库自动设置的字段（如 created_at）
        Optional<User> savedUserOpt = userService.findById(user.getId());
        if (savedUserOpt.isPresent()) {
            user = savedUserOpt.get();
            logger.debug("重新查询用户信息 - createdAt: {}", user.getCreatedAt());
        }

        // 自动分配 staff 角色（必须成功，否则回滚整个事务）
        Role staffRole = roleMapper.selectByRoleCodeOnly("STAFF");
        if (staffRole == null) {
            logger.error("注册失败 - 系统中不存在 STAFF 角色");
            throw new RuntimeException(messageUtil.getMessage("error.role.system.not.found", new Object[]{"STAFF"}));
        }

        UserRole userRole = new UserRole();
        userRole.setUserId(user.getId());
        userRole.setRoleId(staffRole.getId());
        userRole.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
        int insertResult = userRoleMapper.insert(userRole);

        if (insertResult <= 0) {
            logger.error("注册失败 - 角色分配失败: userId={}, roleId={}", user.getId(), staffRole.getId());
            throw new RuntimeException(messageUtil.getMessage("error.role.assign.failed"));
        }
        logger.info("自动分配 STAFF 角色成功 - userId: {}, roleId: {}", user.getId(), staffRole.getId());

        // 记录邀请码使用
        tenantInvitationService.useInvitation(invitation.getId(), user.getId());

        // 生成JWT令牌
        logger.debug("生成JWT令牌");
        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getUsername(), user.getTenantId());
        String refreshToken = jwtUtil.generateRefreshToken(user.getId());

        LoginResponse response = new LoginResponse(accessToken, refreshToken, user);
        logger.info("用户注册成功 - userId: {}, username: {}", user.getId(), user.getUsername());
        logger.debug("注册响应生成完成 - accessToken长度: {}, refreshToken长度: {}",
                    accessToken.length(), refreshToken.length());

        return response;
    }
    @Override
    public void logout(String token) {
        logger.debug("处理登出请求 - token长度: {}", token.length());
        // 将令牌加入黑名单（这里可以扩展实现）
        // 目前简单实现，实际项目中应该将令牌存储到Redis黑名单中
        logger.info("用户登出处理完成");
    }
    
    @Override
    public LoginResponse refreshToken(String refreshToken) {
        logger.debug("处理令牌刷新请求 - refreshToken长度: {}", refreshToken.length());
        
        // 验证刷新令牌
        if (!jwtUtil.validateRefreshToken(refreshToken)) {
            logger.warn("令牌刷新失败 - 刷新令牌无效");
            throw new RuntimeException(messageUtil.getMessage("auth.token.refresh.failed"));
        }
        
        // 从刷新令牌中获取用户信息
        Long userId = jwtUtil.getUserIdFromRefreshToken(refreshToken);
        logger.debug("从刷新令牌中获取用户ID: {}", userId);
        
        Optional<User> userOpt = userService.findById(userId);
        if (userOpt.isEmpty()) {
            logger.warn("令牌刷新失败 - 用户不存在: {}", userId);
            throw new RuntimeException(messageUtil.getMessage("user.not.found"));
        }
        
        User user = userOpt.get();
        logger.debug("找到用户: userId={}, username={}", user.getId(), user.getUsername());
        
        // 生成新的访问令牌
        String newAccessToken = jwtUtil.generateAccessToken(user.getId(), user.getUsername(), user.getTenantId());
        String newRefreshToken = jwtUtil.generateRefreshToken(user.getId());

        LoginResponse response = new LoginResponse(newAccessToken, newRefreshToken, user);
        // BusinessLogAspect 已自动记录，Service 层无需重复记录

        return response;
    }
    
    @Override
    public boolean validateToken(String token) {
        logger.debug("验证令牌 - token长度: {}", token.length());
        boolean isValid = jwtUtil.validateAccessToken(token);
        logger.debug("令牌验证结果: {}", isValid);
        return isValid;
    }
    
    private Tenant getOrCreateTenant(String tenantCode) {
        logger.debug("处理租户 - tenantCode: {}", tenantCode);
        
        if (tenantCode == null || tenantCode.trim().isEmpty()) {
            // 如果没有指定租户代码，创建一个默认租户
            tenantCode = "DEFAULT";
            logger.debug("使用默认租户代码: {}", tenantCode);
        }
        
        Optional<Tenant> tenantOpt = tenantService.findByTenantCode(tenantCode);
        if (tenantOpt.isPresent()) {
            Tenant tenant = tenantOpt.get();
            logger.debug("找到现有租户: tenantId={}, tenantName={}", tenant.getId(), tenant.getTenantName());
            return tenant;
        }
        
        // 创建新租户
        logger.debug("创建新租户: {}", tenantCode);
        Tenant tenant = new Tenant();
        tenant.setTenantCode(tenantCode);
        tenant.setTenantName("默认租户");
        tenant.setTenantType(Tenant.TenantType.INDEPENDENT);
        tenant.setStatus(Tenant.TenantStatus.ACTIVE);
        
        tenant = tenantService.save(tenant);
        logger.info("新租户创建成功: tenantId={}, tenantCode={}", tenant.getId(), tenant.getTenantCode());
        
        return tenant;
    }
} 