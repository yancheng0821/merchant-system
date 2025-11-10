package com.merchant.server.authservice.service.impl;

import com.merchant.server.authservice.dto.*;
import com.merchant.server.authservice.entity.Permission;
import com.merchant.server.authservice.entity.Role;
import com.merchant.server.authservice.mapper.PermissionMapper;
import com.merchant.server.authservice.mapper.RoleMapper;
import com.merchant.server.authservice.service.AuthorizationService;
import com.merchant.server.authservice.service.PermissionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 授权服务实现类 - 核心权限检查服务
 */
@Slf4j
@Service
public class AuthorizationServiceImpl implements AuthorizationService {

    private final PermissionMapper permissionMapper;
    private final RoleMapper roleMapper;
    private final PermissionService permissionService;

    public AuthorizationServiceImpl(PermissionMapper permissionMapper,
                                   RoleMapper roleMapper,
                                   PermissionService permissionService) {
        this.permissionMapper = permissionMapper;
        this.roleMapper = roleMapper;
        this.permissionService = permissionService;
    }

    @Override
    @Cacheable(value = "permission_check", key = "#userId + ':' + #tenantId + ':' + #resource + ':' + #action")
    public CheckPermissionResponse checkPermission(Long userId, Long tenantId, String resource, String action) {
        log.debug("Checking permission for user={}, tenant={}, resource={}, action={}",
                 userId, tenantId, resource, action);

        // 检查是否是超级管理员
        if (isSuperAdmin(userId, tenantId)) {
            log.debug("User {} is super admin, permission granted", userId);
            return CheckPermissionResponse.allowed("all", null);
        }

        // 通过数据库查询检查权限
        Permission permission = permissionMapper.selectByResourceAndAction(resource, action);
        if (permission == null) {
            log.warn("Permission not found: {}:{}", resource, action);
            return CheckPermissionResponse.denied("Permission not defined");
        }

        // 查询用户权限列表
        List<Permission> userPermissions = permissionMapper.selectByUserId(userId, tenantId);
        boolean hasPermission = userPermissions.stream()
                .anyMatch(p -> p.getResource().equals(resource) && p.getAction().equals(action));

        if (hasPermission) {
            // 找到对应的权限，返回scope和constraints
            Permission matchedPermission = userPermissions.stream()
                    .filter(p -> p.getResource().equals(resource) && p.getAction().equals(action))
                    .findFirst()
                    .orElse(permission);

            log.debug("Permission granted for user={}, permission={}:{}", userId, resource, action);
            return CheckPermissionResponse.allowed(matchedPermission.getScope(), null);
        }

        log.debug("Permission denied for user={}, permission={}:{}", userId, resource, action);
        return CheckPermissionResponse.denied("User does not have this permission");
    }

    @Override
    public CheckPermissionResponse checkPermissionByCode(Long userId, Long tenantId, String permissionCode) {
        if (permissionCode == null || !permissionCode.contains(":")) {
            return CheckPermissionResponse.denied("Invalid permission code format");
        }

        String[] parts = permissionCode.split(":");
        String resource = parts[0];
        String action = parts.length > 1 ? parts[1] : "view";

        return checkPermission(userId, tenantId, resource, action);
    }

    @Override
    @Cacheable(value = "user_permissions", key = "#userId + ':' + #tenantId")
    public UserPermissionsDTO getUserPermissions(Long userId, Long tenantId) {
        log.debug("Getting permissions for user={}, tenant={}", userId, tenantId);

        UserPermissionsDTO dto = new UserPermissionsDTO();
        dto.setUserId(userId);
        dto.setTenantId(tenantId);

        // 查询用户角色
        List<Role> roles = roleMapper.selectByUserId(userId);
        dto.setRoles(roles.stream()
                .map(this::toRoleDTO)
                .collect(Collectors.toList()));

        // 查询用户权限
        List<Permission> permissions = permissionMapper.selectByUserId(userId, tenantId);
        dto.setPermissions(permissions.stream()
                .map(permissionService::toDTO)
                .collect(Collectors.toList()));

        // 提取权限代码列表
        dto.setPermissionCodes(permissions.stream()
                .map(Permission::getPermissionCode)
                .collect(Collectors.toList()));

        // 按资源分组的权限映射
        Map<String, List<String>> permissionMap = permissions.stream()
                .collect(Collectors.groupingBy(
                        Permission::getResource,
                        Collectors.mapping(Permission::getAction, Collectors.toList())
                ));
        dto.setPermissionMap(permissionMap);

        // 检查是否是超级管理员
        dto.setIsSuperAdmin(isSuperAdmin(userId, tenantId));

        log.debug("User {} has {} roles and {} permissions", userId, roles.size(), permissions.size());
        return dto;
    }

    @Override
    public boolean isSuperAdmin(Long userId, Long tenantId) {
        // SUPER_ADMIN 是系统级角色，不再区分租户
        List<Role> roles = roleMapper.selectByUserId(userId);
        return roles.stream()
                .anyMatch(role ->
                    role.getRoleCode().equals("SUPER_ADMIN") || role.getRoleCode().equals("SYSTEM_ADMIN")
                );
    }

    @Override
    public boolean hasRole(Long userId, String roleCode, Long tenantId) {
        List<Role> roles = roleMapper.selectByUserId(userId);
        return roles.stream()
                .anyMatch(role -> role.getRoleCode().equals(roleCode));
    }

    @Override
    public boolean hasHigherRoleLevel(Long operatorUserId, Long targetUserId, Long tenantId) {
        List<Role> operatorRoles = roleMapper.selectByUserId(operatorUserId);
        List<Role> targetRoles = roleMapper.selectByUserId(targetUserId);

        if (operatorRoles.isEmpty()) {
            return false;
        }

        if (targetRoles.isEmpty()) {
            return true;
        }

        // 获取操作者的最高角色层级
        int operatorMaxLevel = operatorRoles.stream()
                .mapToInt(role -> role.getLevel() != null ? role.getLevel() : 0)
                .max()
                .orElse(0);

        // 获取目标用户的最高角色层级
        int targetMaxLevel = targetRoles.stream()
                .mapToInt(role -> role.getLevel() != null ? role.getLevel() : 0)
                .max()
                .orElse(0);

        return operatorMaxLevel > targetMaxLevel;
    }

    @Override
    @CacheEvict(value = {"permission_check", "user_permissions"}, key = "#userId + ':' + #tenantId")
    public void refreshUserPermissions(Long userId, Long tenantId) {
        log.info("Refreshed permissions cache for user={}, tenant={}", userId, tenantId);
    }

    /**
     * Role Entity 转 DTO
     */
    private RoleDTO toRoleDTO(Role role) {
        if (role == null) {
            return null;
        }
        RoleDTO dto = new RoleDTO();
        dto.setId(role.getId());
        // tenantId 已移除，角色是系统级别
        dto.setRoleName(role.getRoleName());
        dto.setRoleCode(role.getRoleCode());
        dto.setDisplayName(role.getDisplayName());
        dto.setDescription(role.getDescription());
        dto.setLevel(role.getLevel());
        dto.setIsSystem(role.getIsSystem());
        dto.setStatus(role.getStatus() != null ? role.getStatus().name() : null);
        return dto;
    }
}
