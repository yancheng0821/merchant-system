package com.merchant.server.authservice.service.impl;

import com.merchant.server.authservice.entity.UserRole;
import com.merchant.server.authservice.service.UserRoleService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
public class UserRoleServiceImpl implements UserRoleService {
    
    @Override
    public void assignRole(Long userId, Long roleId) {
        // 临时实现：只记录日志
        log.info("分配角色 - 用户ID: {}, 角色ID: {} (临时实现)", userId, roleId);
    }
    
    @Override
    public List<UserRole> findByUserId(Long userId) {
        // 临时实现：返回空列表
        return List.of();
    }
    
    @Override
    public void deleteByUserId(Long userId) {
        // 临时实现：只记录日志
        log.info("删除用户角色 - 用户ID: {} (临时实现)", userId);
    }
}