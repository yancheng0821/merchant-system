package com.merchant.server.authservice.service;

import com.merchant.server.authservice.dto.UserProfileRequest;
import com.merchant.server.authservice.dto.UserProfileResponse;
import com.merchant.server.authservice.dto.AvatarUploadResponse;
import com.merchant.server.authservice.entity.User;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

public interface UserService {
    
    // 用户信息管理相关方法
    /**
     * 获取用户信息
     * @param token JWT令牌
     * @return 用户信息响应
     */
    UserProfileResponse getUserProfile(String token);
    
    /**
     * 更新用户信息
     * @param token JWT令牌
     * @param request 用户信息更新请求
     * @return 更新后的用户信息响应
     */
    UserProfileResponse updateUserProfile(String token, UserProfileRequest request);
    
    /**
     * 上传用户头像
     * @param token JWT令牌
     * @param file 头像文件
     * @return 头像上传响应
     */
    AvatarUploadResponse uploadAvatar(String token, MultipartFile file);
    
    // 基础CRUD方法
    Optional<User> findById(Long id);
    
    Optional<User> findByUsername(String username);
    
    Optional<User> findByUsernameAndTenantId(String username, Long tenantId);
    
    Optional<User> findByEmail(String email);
    
    Optional<User> findByEmailAndTenantId(String email, Long tenantId);
    
    List<User> findByTenantId(Long tenantId);
    
    User save(User user);
    
    void deleteById(Long id);
    
    boolean existsByUsername(String username);
    
    boolean existsByUsernameAndTenantId(String username, Long tenantId);
    
    boolean existsByEmail(String email);
    
    boolean existsByEmailAndTenantId(String email, Long tenantId);
} 