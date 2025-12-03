package com.merchant.server.authservice.service.impl;

import com.merchant.server.authservice.entity.User;
import com.merchant.server.authservice.entity.Role;
import com.merchant.server.authservice.entity.Permission;
import com.merchant.server.authservice.mapper.UserMapper;
import com.merchant.server.authservice.mapper.RoleMapper;
import com.merchant.server.authservice.mapper.PermissionMapper;
import com.merchant.server.authservice.service.UserService;
import com.merchant.server.authservice.dto.UserProfileRequest;
import com.merchant.server.authservice.dto.UserProfileResponse;
import com.merchant.server.authservice.dto.AvatarUploadResponse;
import com.merchant.server.authservice.util.JwtUtil;
import com.merchant.server.authservice.util.MessageUtil;
import com.merchant.server.authservice.entity.Tenant;
import com.merchant.server.authservice.mapper.TenantMapper;
import com.merchant.server.authservice.dto.ChangePasswordRequest;
import com.merchant.server.authservice.util.PasswordUtil;
import com.merchant.server.authservice.client.MerchantServiceClient;
import com.merchant.server.common.dto.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.Locale;
import java.util.stream.Collectors;
import org.springframework.context.i18n.LocaleContextHolder;

@Service
public class UserServiceImpl implements UserService {
    
    private static final Logger logger = LoggerFactory.getLogger(UserServiceImpl.class);
    
    @Autowired
    private UserMapper userMapper;
    
    @Autowired
    private TenantMapper tenantMapper;
    
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
    private MerchantServiceClient merchantServiceClient;

    @Value("${app.avatar.upload.path:/tmp/avatars}")
    private String avatarUploadPath;
    
    @Value("${app.avatar.url.prefix:/api/users/avatar/}")
    private String avatarUrlPrefix;
    
    @Override
    public Optional<User> findById(Long id) {
        logger.debug("根据ID查找用户: {}", id);
        User user = userMapper.selectById(id);
        if (user != null) {
            logger.debug("找到用户: userId={}, username={}", user.getId(), user.getUsername());
        } else {
            logger.debug("未找到用户: userId={}", id);
        }
        return Optional.ofNullable(user);
    }
    
    @Override
    public Optional<User> findByUsername(String username) {
        logger.debug("根据用户名查找用户: {}", username);
        User user = userMapper.selectByUsername(username);
        if (user != null) {
            logger.debug("找到用户: userId={}, username={}, status={}", user.getId(), user.getUsername(), user.getStatus());
        } else {
            logger.debug("未找到用户: username={}", username);
        }
        return Optional.ofNullable(user);
    }
    
    @Override
    public Optional<User> findByUsernameAndTenantId(String username, Long tenantId) {
        logger.debug("根据用户名和租户ID查找用户: username={}, tenantId={}", username, tenantId);
        User user = userMapper.selectByUsernameAndTenantId(username, tenantId);
        if (user != null) {
            logger.debug("找到用户: userId={}, username={}, tenantId={}", user.getId(), user.getUsername(), user.getTenantId());
        } else {
            logger.debug("未找到用户: username={}, tenantId={}", username, tenantId);
        }
        return Optional.ofNullable(user);
    }
    
    @Override
    public Optional<User> findByEmail(String email) {
        logger.debug("根据邮箱查找用户: {}", email);
        User user = userMapper.selectByEmail(email);
        if (user != null) {
            logger.debug("找到用户: userId={}, email={}", user.getId(), user.getEmail());
        } else {
            logger.debug("未找到用户: email={}", email);
        }
        return Optional.ofNullable(user);
    }
    
    @Override
    public Optional<User> findByEmailAndTenantId(String email, Long tenantId) {
        logger.debug("根据邮箱和租户ID查找用户: email={}, tenantId={}", email, tenantId);
        User user = userMapper.selectByEmailAndTenantId(email, tenantId);
        if (user != null) {
            logger.debug("找到用户: userId={}, email={}, tenantId={}", user.getId(), user.getEmail(), user.getTenantId());
        } else {
            logger.debug("未找到用户: email={}, tenantId={}", email, tenantId);
        }
        return Optional.ofNullable(user);
    }
    
    @Override
    public List<User> findByTenantId(Long tenantId) {
        logger.debug("根据租户ID查找用户列表: tenantId={}", tenantId);
        List<User> users = userMapper.selectByTenantId(tenantId);
        logger.debug("找到 {} 个用户: tenantId={}", users.size(), tenantId);
        return users;
    }
    
    @Override
    public User save(User user) {
        if (user.getId() == null) {
            logger.debug("创建新用户: username={}, email={}", user.getUsername(), user.getEmail());
            userMapper.insert(user);
            logger.info("新用户创建成功: userId={}, username={}", user.getId(), user.getUsername());
        } else {
            logger.debug("更新用户信息: userId={}, username={}", user.getId(), user.getUsername());
            userMapper.update(user);
            logger.info("用户信息更新成功: userId={}, username={}", user.getId(), user.getUsername());
        }
        return user;
    }
    
    @Override
    public void deleteById(Long id) {
        logger.debug("删除用户: userId={}", id);
        userMapper.deleteById(id);
        logger.info("用户删除成功: userId={}", id);
    }
    
    @Override
    public boolean existsByUsername(String username) {
        logger.debug("检查用户名是否存在: {}", username);
        boolean exists = userMapper.existsByUsername(username);
        logger.debug("用户名存在检查结果: username={}, exists={}", username, exists);
        return exists;
    }
    
    @Override
    public boolean existsByUsernameAndTenantId(String username, Long tenantId) {
        logger.debug("检查用户名在指定租户中是否存在: username={}, tenantId={}", username, tenantId);
        boolean exists = userMapper.existsByUsernameAndTenantId(username, tenantId);
        logger.debug("用户名租户存在检查结果: username={}, tenantId={}, exists={}", username, tenantId, exists);
        return exists;
    }
    
    @Override
    public boolean existsByEmail(String email) {
        logger.debug("检查邮箱是否存在: {}", email);
        boolean exists = userMapper.existsByEmail(email);
        logger.debug("邮箱存在检查结果: email={}, exists={}", email, exists);
        return exists;
    }
    
    @Override
    public boolean existsByEmailAndTenantId(String email, Long tenantId) {
        logger.debug("检查邮箱在指定租户中是否存在: email={}, tenantId={}", email, tenantId);
        boolean exists = userMapper.existsByEmailAndTenantId(email, tenantId);
        logger.debug("邮箱租户存在检查结果: email={}, tenantId={}, exists={}", email, tenantId, exists);
        return exists;
    }
    
    /**
     * 填充用户资料响应的完整信息（角色、权限、时区等）
     * 这是一个公共方法，避免代码重复
     */
    private void fillUserProfileDetails(User user, UserProfileResponse response) {
        // 获取商户时区信息
        try {
            ApiResponse<Map<String, Object>> merchantResponse = merchantServiceClient.getMerchantByTenantId(user.getTenantId());
            if (merchantResponse != null && merchantResponse.isSuccess() && merchantResponse.getData() != null) {
                String timezone = (String) merchantResponse.getData().get("timezone");
                if (timezone != null && !timezone.isEmpty()) {
                    response.setTimezone(timezone);
                    logger.debug("设置商户时区: {}", timezone);
                } else {
                    response.setTimezone("America/Vancouver");
                    logger.warn("商户时区为空，使用默认时区: America/Vancouver");
                }
            } else {
                response.setTimezone("America/Vancouver");
                logger.warn("获取商户信息失败，使用默认时区: America/Vancouver");
            }
        } catch (Exception e) {
            logger.error("获取商户时区失败: {}", e.getMessage(), e);
            response.setTimezone("America/Vancouver");
        }

        // 查询用户角色
        logger.debug("查询用户角色 - userId: {}", user.getId());
        List<Role> userRoles = roleMapper.selectByUserId(user.getId());
        List<String> roleCodes = (userRoles != null && !userRoles.isEmpty()) ?
            userRoles.stream().map(Role::getRoleCode).collect(Collectors.toList()) :
            new java.util.ArrayList<>();
        response.setRoles(roleCodes);
        logger.debug("用户角色数量: {}, 角色: {}", roleCodes.size(), roleCodes);

        // 查询用户权限
        logger.debug("查询用户权限 - userId: {}, tenantId: {}", user.getId(), user.getTenantId());
        List<Permission> userPermissions = permissionMapper.selectByUserId(user.getId(), user.getTenantId());
        List<String> permissionCodes = (userPermissions != null && !userPermissions.isEmpty()) ?
            userPermissions.stream().map(Permission::getPermissionCode).collect(Collectors.toList()) :
            new java.util.ArrayList<>();
        response.setPermissions(permissionCodes);
        logger.debug("用户权限数量: {}", permissionCodes.size());
    }

    @Override
    public UserProfileResponse getUserProfile(String token) {
        logger.debug("获取用户信息 - token: {}", token.substring(0, Math.min(20, token.length())) + "...");

        // 从token中提取用户ID，而不是用户名，避免多租户中相同用户名的问题
        Long userId = jwtUtil.getUserIdFromToken(token.replace("Bearer ", ""));
        Optional<User> userOpt = findById(userId);

        if (userOpt.isEmpty()) {
            throw new RuntimeException(messageUtil.getMessage("user.not.found"));
        }

        User user = userOpt.get();
        Tenant tenant = tenantMapper.selectById(user.getTenantId());

        UserProfileResponse response = new UserProfileResponse();
        response.setUserId(user.getId());
        response.setUsername(user.getUsername());
        response.setRealName(user.getRealName());
        response.setEmail(user.getEmail());
        response.setPhone(user.getPhone());
        response.setAvatar(user.getAvatarUrl());
        response.setTenantId(user.getTenantId());
        response.setTenantName(tenant != null ? tenant.getTenantName() : null);
        response.setLastLoginTime(user.getLastLoginAt());
        response.setUpdateTime(user.getUpdatedAt());
        response.setSmsVerificationEnabled(user.getSmsVerificationEnabled() != null ? user.getSmsVerificationEnabled() : true);
        // 设置是否为租户所有者
        response.setIsTenantOwner(tenant != null && tenant.getOwnerUserId() != null && tenant.getOwnerUserId().equals(user.getId()));

        // 填充完整信息（角色、权限、时区）
        fillUserProfileDetails(user, response);

        logger.info("获取用户信息成功 - userId: {}, roles: {}, permissions: {}",
                    user.getId(), response.getRoles().size(), response.getPermissions().size());
        return response;
    }

    @Override
    public UserProfileResponse updateUserProfile(String token, UserProfileRequest request) {
        try {
            logger.info("开始更新用户信息 - 请求userId: {}, email: {}, realName: {}",
                       request.getUserId(), request.getEmail(), request.getRealName());

            // 从token中提取用户ID，而不是用户名，避免多租户中相同用户名的问题
            Long userId = jwtUtil.getUserIdFromToken(token.replace("Bearer ", ""));
            logger.debug("从token提取的userId: {}", userId);

            Optional<User> userOpt = findById(userId);

            if (userOpt.isEmpty()) {
                logger.error("用户不存在 - userId: {}", userId);
                throw new RuntimeException(messageUtil.getMessage("user.not.found"));
            }

            User user = userOpt.get();

            // 详细日志
            logger.info("token userId: {}, request userId: {}, 匹配检查", userId, request.getUserId());

            // 验证用户ID是否匹配
            if (!user.getId().equals(request.getUserId())) {
                logger.error("用户ID不匹配 - token userId: {}, request userId: {}", userId, request.getUserId());
                throw new RuntimeException(messageUtil.getMessage("error.user.id.mismatch"));
            }

            // 检查用户名是否已被其他用户使用（在同一租户内）
            logger.debug("检查用户名 - 当前用户名: {}, 新用户名: {}, 租户ID: {}", user.getUsername(), request.getUsername(), user.getTenantId());
            if (request.getUsername() != null && !user.getUsername().equals(request.getUsername())) {
                User existingUser = userMapper.selectByUsernameAndTenantId(request.getUsername(), user.getTenantId());
                if (existingUser != null && !existingUser.getId().equals(user.getId())) {
                    logger.error("Username already in use - username: {}, existing user ID: {}, tenant ID: {}",
                                request.getUsername(), existingUser.getId(), user.getTenantId());
                    throw new RuntimeException(messageUtil.getMessage("error.user.username.already.in.use"));
                }
            }

            // 检查邮箱是否已被其他用户使用（在同一租户内）
            logger.debug("检查邮箱 - 当前邮箱: {}, 新邮箱: {}, 租户ID: {}", user.getEmail(), request.getEmail(), user.getTenantId());
            if (!user.getEmail().equals(request.getEmail())) {
                // 使用 selectByEmailAndTenantId 避免跨租户冲突
                User existingUser = userMapper.selectByEmailAndTenantId(request.getEmail(), user.getTenantId());
                if (existingUser != null && !existingUser.getId().equals(user.getId())) {
                    logger.error("Email already in use - email: {}, existing user ID: {}, tenant ID: {}",
                                request.getEmail(), existingUser.getId(), user.getTenantId());
                    throw new RuntimeException(messageUtil.getMessage("error.user.email.already.in.use"));
                }
            }

            // 更新用户信息
            logger.debug("更新用户信息 - username: {} -> {}, realName: {} -> {}, email: {} -> {}, phone: {} -> {}",
                        user.getUsername(), request.getUsername(),
                        user.getRealName(), request.getRealName(),
                        user.getEmail(), request.getEmail(),
                        user.getPhone(), request.getPhone());
            if (request.getUsername() != null) {
                user.setUsername(request.getUsername());
            }
            user.setRealName(request.getRealName());
            user.setEmail(request.getEmail());
            user.setPhone(request.getPhone());
            // 更新短信验证设置（如果请求中包含此字段）
            if (request.getSmsVerificationEnabled() != null) {
                user.setSmsVerificationEnabled(request.getSmsVerificationEnabled());
            }
            user.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));

            logger.debug("保存用户信息到数据库");
            save(user);

            // 构建响应
            logger.debug("构建响应数据");
            Tenant tenant = tenantMapper.selectById(user.getTenantId());
            UserProfileResponse response = new UserProfileResponse();
            response.setUserId(user.getId());
            response.setUsername(user.getUsername());
            response.setRealName(user.getRealName());
            response.setEmail(user.getEmail());
            response.setPhone(user.getPhone());
            response.setAvatar(user.getAvatarUrl());
            response.setTenantId(user.getTenantId());
            response.setTenantName(tenant != null ? tenant.getTenantName() : null);
            response.setLastLoginTime(user.getLastLoginAt());
            response.setUpdateTime(user.getUpdatedAt());
            response.setSmsVerificationEnabled(user.getSmsVerificationEnabled() != null ? user.getSmsVerificationEnabled() : true);

            // 填充完整信息（角色、权限、时区） - 使用公共方法避免重复代码
            fillUserProfileDetails(user, response);

            logger.info("更新用户信息成功 - userId: {}, roles: {}, permissions: {}",
                        user.getId(), response.getRoles().size(), response.getPermissions().size());
            return response;
        } catch (Exception e) {
            logger.error("更新用户信息异常 - 请求userId: {}, 错误类型: {}, 错误信息: {}",
                        request.getUserId(), e.getClass().getName(), e.getMessage(), e);
            throw e;
        }
    }
    
    @Override
    public AvatarUploadResponse uploadAvatar(String token, MultipartFile file) {
        logger.debug("上传头像 - 文件名: {}, 大小: {} bytes", file.getOriginalFilename(), file.getSize());
        
        // 从token中提取用户ID，而不是用户名，避免多租户中相同用户名的问题
        Long userId = jwtUtil.getUserIdFromToken(token.replace("Bearer ", ""));
        Optional<User> userOpt = findById(userId);
        
        if (userOpt.isEmpty()) {
            throw new RuntimeException(messageUtil.getMessage("user.not.found"));
        }
        
        User user = userOpt.get();
        
        // 验证文件类型
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException(messageUtil.getMessage("error.file.invalid.type"));
        }
        
        // 验证文件大小（5MB）
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new RuntimeException(messageUtil.getMessage("error.file.too.large", new Object[]{5}));
        }
        
        try {
            // 创建上传目录
            Path uploadDir = Paths.get(avatarUploadPath);
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }
            
            // 生成唯一文件名
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String filename = UUID.randomUUID().toString() + extension;
            
            // 保存文件
            Path filePath = uploadDir.resolve(filename);
            Files.copy(file.getInputStream(), filePath);
            
            // 更新用户头像信息
            String avatarUrl = avatarUrlPrefix + filename;
            user.setAvatarUrl(avatarUrl);
            user.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
            save(user);
            
            // 构建响应
            AvatarUploadResponse response = new AvatarUploadResponse();
            response.setUserId(user.getId());
            response.setAvatarUrl(avatarUrl);
            response.setOriginalFileName(originalFilename);
            response.setFileSize(file.getSize());
            response.setFileType(contentType);
            
            logger.info("头像上传成功 - userId: {}, 文件路径: {}", user.getId(), filePath);
            return response;
            
        } catch (IOException e) {
            logger.error("头像上传失败: {}", e.getMessage(), e);
            throw new RuntimeException(messageUtil.getMessage("error.file.upload.failed", new Object[]{e.getMessage()}));
        }
    }

    @Override
    public AvatarUploadResponse updateUserAvatar(String token, String avatarUrl) {
        logger.debug("更新用户头像URL - avatarUrl: {}", avatarUrl);
        
        // 从token中提取用户ID，而不是用户名，避免多租户中相同用户名的问题
        Long userId = jwtUtil.getUserIdFromToken(token.replace("Bearer ", ""));
        Optional<User> userOpt = findById(userId);
        
        if (userOpt.isEmpty()) {
            throw new RuntimeException(messageUtil.getMessage("user.not.found"));
        }
        
        User user = userOpt.get();
        
        // 更新用户头像信息
        user.setAvatarUrl(avatarUrl);
        user.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
        save(user);
        
        // 构建响应
        AvatarUploadResponse response = new AvatarUploadResponse();
        response.setUserId(user.getId());
        response.setAvatarUrl(avatarUrl);
        
        logger.info("头像URL更新成功 - userId: {}, avatarUrl: {}", user.getId(), avatarUrl);
        return response;
    }

    @Override
    public void changePassword(String token, ChangePasswordRequest request) {
        // 打印当前线程的Locale
        logger.info("当前线程的Locale: {}", LocaleContextHolder.getLocale());
        logger.info("国际化内容: {}", messageUtil.getMessage("user.old.password.mismatch"));
        // 1. 从token获取用户ID，而不是用户名，避免多租户中相同用户名的问题
        Long userId = jwtUtil.getUserIdFromToken(token.replace("Bearer ", ""));
        Optional<User> userOpt = findById(userId);
        if (userOpt.isEmpty()) {
            throw new RuntimeException(messageUtil.getMessage("user.not.found"));
        }
        User user = userOpt.get();
        // 2. 校验原密码
        if (!passwordUtil.verifyPassword(request.getOldPassword(), user.getPasswordHash(), user.getSalt())) {
            throw new RuntimeException(messageUtil.getMessage("user.old.password.mismatch"));
        }
        // 3. 校验新密码一致性
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException(messageUtil.getMessage("user.new.passwords.mismatch"));
        }
        // 4. 新密码不能与原密码相同
        if (request.getOldPassword().equals(request.getNewPassword())) {
            throw new RuntimeException(messageUtil.getMessage("user.password.no.repeat"));
        }
        // 5. 加密新密码并保存
        String newSalt = passwordUtil.generateSalt();
        String newHash = passwordUtil.hashPassword(request.getNewPassword(), newSalt);
        user.setSalt(newSalt);
        user.setPasswordHash(newHash);
        user.setUpdatedAt(java.time.LocalDateTime.now(ZoneOffset.UTC));
        save(user);
    }

    @Override
    public void updateUserStatus(Long userId, User.UserStatus status) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new RuntimeException(messageUtil.getMessage("user.not.found"));
        }
        user.setStatus(status);
        user.setUpdatedAt(java.time.LocalDateTime.now(ZoneOffset.UTC));
        userMapper.update(user);
    }

    @Override
    public void deleteAccount(String token, String password) {
        logger.info("收到注销账户请求");

        // 1. 从token获取用户信息
        String jwtToken = token.replace("Bearer ", "");
        Long userId = jwtUtil.getUserIdFromToken(jwtToken);

        if (userId == null) {
            throw new RuntimeException(messageUtil.getMessage("error.token.user.info.extract"));
        }

        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new RuntimeException(messageUtil.getMessage("user.not.found"));
        }

        // 2. 验证密码
        if (!passwordUtil.verifyPassword(password, user.getPasswordHash(), user.getSalt())) {
            throw new RuntimeException(messageUtil.getMessage("user.password.invalid"));
        }

        // 3. 删除用户（软删除：设置状态为 DELETED）
        user.setStatus(User.UserStatus.DELETED);
        user.setUpdatedAt(java.time.LocalDateTime.now(ZoneOffset.UTC));
        userMapper.update(user);

        logger.info("用户账户注销成功 - 用户ID: {}", userId);
    }
} 