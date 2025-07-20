package com.merchant.server.authservice.service.impl;

import com.merchant.server.authservice.entity.User;
import com.merchant.server.authservice.mapper.UserMapper;
import com.merchant.server.authservice.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserServiceImpl implements UserService {
    
    private static final Logger logger = LoggerFactory.getLogger(UserServiceImpl.class);
    
    @Autowired
    private UserMapper userMapper;
    
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
} 