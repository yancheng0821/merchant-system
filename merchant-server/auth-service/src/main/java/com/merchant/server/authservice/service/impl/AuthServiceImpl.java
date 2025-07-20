package com.merchant.server.authservice.service.impl;

import com.merchant.server.authservice.dto.LoginRequest;
import com.merchant.server.authservice.dto.LoginResponse;
import com.merchant.server.authservice.dto.RegisterRequest;
import com.merchant.server.authservice.entity.Tenant;
import com.merchant.server.authservice.entity.User;
import com.merchant.server.authservice.service.AuthService;
import com.merchant.server.authservice.service.TenantService;
import com.merchant.server.authservice.service.UserService;
import com.merchant.server.authservice.util.JwtUtil;
import com.merchant.server.authservice.util.MessageUtil;
import com.merchant.server.authservice.util.PasswordUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

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
    
    @Override
    public LoginResponse login(LoginRequest loginRequest) {
        logger.debug("开始处理登录请求 - 用户名: {}", loginRequest.getUsername());
        
        // 验证用户名和密码
        Optional<User> userOpt = userService.findByUsername(loginRequest.getUsername());
        if (userOpt.isEmpty()) {
            logger.warn("登录失败 - 用户不存在: {}", loginRequest.getUsername());
            throw new RuntimeException(messageUtil.getMessage("user.invalid.credentials"));
        }
        
        User user = userOpt.get();
        logger.debug("找到用户: userId={}, realName={}, status={}", user.getId(), user.getRealName(), user.getStatus());
        
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
        
        // 更新最后登录信息
        logger.debug("更新用户登录信息");
        user.setLastLoginAt(LocalDateTime.now());
        user.setLastLoginIp(loginRequest.getUsername()); // 这里应该获取真实IP
        user.setLoginAttempts(0);
        userService.save(user);
        
        // 生成JWT令牌
        logger.debug("生成JWT令牌");
        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getUsername());
        String refreshToken = jwtUtil.generateRefreshToken(user.getId());
        
        LoginResponse response = new LoginResponse(accessToken, refreshToken, user);
        logger.info("用户登录成功 - userId: {}, username: {}", user.getId(), user.getUsername());
        logger.debug("登录响应生成完成 - accessToken长度: {}, refreshToken长度: {}", 
                    accessToken.length(), refreshToken.length());
        
        return response;
    }
    
    @Override
    public LoginResponse register(RegisterRequest registerRequest) {
        logger.debug("开始处理注册请求 - 用户名: {}, 邮箱: {}", registerRequest.getUsername(), registerRequest.getEmail());
        
        // 验证密码确认
        if (!registerRequest.getPassword().equals(registerRequest.getConfirmPassword())) {
            logger.warn("注册失败 - 密码不匹配: {}", registerRequest.getUsername());
            throw new RuntimeException(messageUtil.getMessage("user.password.mismatch"));
        }
        
        // 检查用户名是否已存在
        if (userService.existsByUsername(registerRequest.getUsername())) {
            logger.warn("注册失败 - 用户名已存在: {}", registerRequest.getUsername());
            throw new RuntimeException(messageUtil.getMessage("user.username.exists"));
        }
        
        // 检查邮箱是否已存在
        if (registerRequest.getEmail() != null && userService.existsByEmail(registerRequest.getEmail())) {
            logger.warn("注册失败 - 邮箱已存在: {}", registerRequest.getEmail());
            throw new RuntimeException(messageUtil.getMessage("user.email.exists"));
        }
        
        // 获取或创建租户
        logger.debug("处理租户信息 - tenantCode: {}", registerRequest.getTenantCode());
        Tenant tenant = getOrCreateTenant(registerRequest.getTenantCode());
        
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
        
        // 生成JWT令牌
        logger.debug("生成JWT令牌");
        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getUsername());
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
        logger.debug("生成新的访问令牌");
        String newAccessToken = jwtUtil.generateAccessToken(user.getId(), user.getUsername());
        String newRefreshToken = jwtUtil.generateRefreshToken(user.getId());
        
        LoginResponse response = new LoginResponse(newAccessToken, newRefreshToken, user);
        logger.info("令牌刷新成功 - userId: {}", user.getId());
        logger.debug("刷新响应生成完成 - accessToken长度: {}, refreshToken长度: {}", 
                    newAccessToken.length(), newRefreshToken.length());
        
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