package com.merchant.server.authservice.service.impl;

import com.merchant.server.authservice.entity.User;
import com.merchant.server.authservice.entity.UserRole;
import com.merchant.server.authservice.mapper.UserMapper;
import com.merchant.server.authservice.mapper.UserRoleMapper;
import com.merchant.server.authservice.service.UserRoleService;
import com.merchant.server.authservice.util.MessageUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserRoleServiceImpl implements UserRoleService {

    private final UserRoleMapper userRoleMapper;
    private final UserMapper userMapper;
    private final MessageUtil messageUtil;

    @Override
    @Transactional
    public void assignRole(Long userId, Long roleId) {
        log.info("分配角色 - 用户ID: {}, 角色ID: {}", userId, roleId);

        // 获取用户信息以获取tenantId
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new RuntimeException(messageUtil.getMessage("user.not.found.with.id", new Object[]{userId}));
        }

        // 检查用户是否已经拥有该角色
        UserRole existing = userRoleMapper.selectByUserIdAndRoleId(userId, roleId);
        if (existing != null) {
            log.warn("用户已拥有该角色 - 用户ID: {}, 角色ID: {}", userId, roleId);
            return;
        }

        // 创建用户角色关联
        UserRole userRole = new UserRole();
        userRole.setUserId(userId);
        userRole.setRoleId(roleId);
        userRole.setTenantId(user.getTenantId());
        userRole.setIsPrimary(true); // 默认设置为主角色
        userRole.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));

        userRoleMapper.insert(userRole);
        log.info("角色分配成功 - 用户ID: {}, 角色ID: {}", userId, roleId);
    }

    @Override
    public List<UserRole> findByUserId(Long userId) {
        log.debug("查询用户角色 - 用户ID: {}", userId);
        return userRoleMapper.selectByUserId(userId);
    }

    @Override
    @Transactional
    public void deleteByUserId(Long userId) {
        log.info("删除用户所有角色 - 用户ID: {}", userId);
        int count = userRoleMapper.deleteByUserId(userId);
        log.info("已删除 {} 条用户角色关联", count);
    }
}