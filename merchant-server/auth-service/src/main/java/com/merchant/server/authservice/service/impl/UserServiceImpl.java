package com.merchant.server.authservice.service.impl;

import com.merchant.server.authservice.entity.User;
import com.merchant.server.authservice.mapper.UserMapper;
import com.merchant.server.authservice.service.UserService;
import com.merchant.server.authservice.dto.UserProfileRequest;
import com.merchant.server.authservice.dto.UserProfileResponse;
import com.merchant.server.authservice.dto.AvatarUploadResponse;
import com.merchant.server.authservice.util.JwtUtil;
import com.merchant.server.authservice.entity.Tenant;
import com.merchant.server.authservice.mapper.TenantMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserServiceImpl implements UserService {
    
    private static final Logger logger = LoggerFactory.getLogger(UserServiceImpl.class);
    
    @Autowired
    private UserMapper userMapper;
    
    @Autowired
    private TenantMapper tenantMapper;
    
    @Autowired
    private JwtUtil jwtUtil;
    
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
    
    @Override
    public UserProfileResponse getUserProfile(String token) {
        logger.debug("获取用户信息 - token: {}", token.substring(0, Math.min(20, token.length())) + "...");
        
        // 从token中提取用户ID
        String username = jwtUtil.getUsernameFromToken(token.replace("Bearer ", ""));
        Optional<User> userOpt = findByUsername(username);
        
        if (userOpt.isEmpty()) {
            throw new RuntimeException("用户不存在");
        }
        
        User user = userOpt.get();
        Tenant tenant = tenantMapper.selectById(user.getTenantId());
        
        UserProfileResponse response = new UserProfileResponse();
        response.setUserId(user.getId());
        response.setUsername(user.getUsername());
        response.setRealName(user.getRealName());
        response.setEmail(user.getEmail());
        response.setAvatar(user.getAvatarUrl());
        response.setTenantId(user.getTenantId());
        response.setTenantName(tenant != null ? tenant.getTenantName() : null);
        response.setLastLoginTime(user.getLastLoginAt());
        response.setUpdateTime(user.getUpdatedAt());
        
        // 设置角色和权限（这里简化处理，实际应该从数据库查询）
        response.setRoles(List.of("ROLE_MERCHANT_ADMIN"));
        response.setPermissions(List.of("READ", "WRITE"));
        
        logger.info("获取用户信息成功 - userId: {}", user.getId());
        return response;
    }
    
    @Override
    public UserProfileResponse updateUserProfile(String token, UserProfileRequest request) {
        logger.debug("更新用户信息 - userId: {}, token: {}", request.getUserId(), 
                    token.substring(0, Math.min(20, token.length())) + "...");
        
        // 从token中提取用户ID
        String username = jwtUtil.getUsernameFromToken(token.replace("Bearer ", ""));
        Optional<User> userOpt = findByUsername(username);
        
        if (userOpt.isEmpty()) {
            throw new RuntimeException("用户不存在");
        }
        
        User user = userOpt.get();
        
        // 验证用户ID是否匹配
        if (!user.getId().equals(request.getUserId())) {
            throw new RuntimeException("用户ID不匹配");
        }
        
        // 用户名不允许修改，忽略请求中的用户名
        // 保持原有的用户名不变
        
        // 检查邮箱是否已被其他用户使用
        if (!user.getEmail().equals(request.getEmail())) {
            Optional<User> existingUser = findByEmail(request.getEmail());
            if (existingUser.isPresent() && !existingUser.get().getId().equals(user.getId())) {
                throw new RuntimeException("邮箱已被使用");
            }
        }
        
        // 更新用户信息（不更新用户名）
        user.setRealName(request.getRealName());
        user.setEmail(request.getEmail());
        user.setUpdatedAt(LocalDateTime.now());
        
        save(user);
        
        // 构建响应
        Tenant tenant = tenantMapper.selectById(user.getTenantId());
        UserProfileResponse response = new UserProfileResponse();
        response.setUserId(user.getId());
        response.setUsername(user.getUsername());
        response.setRealName(user.getRealName());
        response.setEmail(user.getEmail());
        response.setAvatar(user.getAvatarUrl());
        response.setTenantId(user.getTenantId());
        response.setTenantName(tenant != null ? tenant.getTenantName() : null);
        response.setLastLoginTime(user.getLastLoginAt());
        response.setUpdateTime(user.getUpdatedAt());
        response.setRoles(List.of("ROLE_MERCHANT_ADMIN"));
        response.setPermissions(List.of("READ", "WRITE"));
        
        logger.info("更新用户信息成功 - userId: {}", user.getId());
        return response;
    }
    
    @Override
    public AvatarUploadResponse uploadAvatar(String token, MultipartFile file) {
        logger.debug("上传头像 - 文件名: {}, 大小: {} bytes", file.getOriginalFilename(), file.getSize());
        
        // 从token中提取用户ID
        String username = jwtUtil.getUsernameFromToken(token.replace("Bearer ", ""));
        Optional<User> userOpt = findByUsername(username);
        
        if (userOpt.isEmpty()) {
            throw new RuntimeException("用户不存在");
        }
        
        User user = userOpt.get();
        
        // 验证文件类型
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("只支持图片文件");
        }
        
        // 验证文件大小（5MB）
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new RuntimeException("文件大小不能超过5MB");
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
            user.setUpdatedAt(LocalDateTime.now());
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
            logger.error("头像上传失败: {}", e.getMessage());
            throw new RuntimeException("头像上传失败: " + e.getMessage());
        }
    }
} 