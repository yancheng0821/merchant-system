package com.merchant.server.authservice.service.impl;

import com.merchant.server.authservice.entity.Role;
import com.merchant.server.authservice.entity.RolePermission;
import com.merchant.server.authservice.entity.UserRole;
import com.merchant.server.authservice.mapper.RoleMapper;
import com.merchant.server.authservice.mapper.RolePermissionMapper;
import com.merchant.server.authservice.mapper.UserRoleMapper;
import com.merchant.server.authservice.service.RoleService;
import com.merchant.server.authservice.util.MessageUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 角色服务实现
 */
@Slf4j
@Service
public class RoleServiceImpl implements RoleService {

    private final RoleMapper roleMapper;
    private final RolePermissionMapper rolePermissionMapper;
    private final UserRoleMapper userRoleMapper;
    private final MessageUtil messageUtil;

    public RoleServiceImpl(RoleMapper roleMapper, RolePermissionMapper rolePermissionMapper, UserRoleMapper userRoleMapper, MessageUtil messageUtil) {
        this.roleMapper = roleMapper;
        this.rolePermissionMapper = rolePermissionMapper;
        this.userRoleMapper = userRoleMapper;
        this.messageUtil = messageUtil;
    }

    @Override
    public Role getById(Long id) {
        log.debug("Getting role by id: {}", id);
        return roleMapper.selectById(id);
    }

    @Override
    public Optional<Role> findByRoleCode(String roleCode) {
        log.debug("Finding role by code: {}", roleCode);
        Role role = roleMapper.selectByRoleCodeOnly(roleCode);
        return Optional.ofNullable(role);
    }

    @Override
    public List<Role> getAllRoles() {
        log.debug("Finding all system roles");
        return roleMapper.selectAll();
    }

    @Override
    public List<Role> getSystemRoles() {
        log.debug("Getting system roles");
        return roleMapper.selectSystemRoles();
    }

    @Override
    public List<Role> getRolesByUserId(Long userId) {
        log.debug("Getting roles by user id: {}", userId);
        return roleMapper.selectByUserId(userId);
    }

    @Override
    @Transactional
    public Role create(Role role) {
        log.info("Creating role: {}", role.getRoleCode());

        // 检查角色代码是否已存在
        int exists = roleMapper.checkRoleCodeExists(role.getRoleCode());
        if (exists > 0) {
            throw new RuntimeException(messageUtil.getMessage("error.role.code.exists", new Object[]{role.getRoleCode()}));
        }

        role.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
        role.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));

        roleMapper.insert(role);
        log.info("Role created successfully: {}", role.getId());
        return role;
    }

    @Override
    @Transactional
    public Role update(Long id, Role role) {
        log.info("Updating role: {}", id);

        Role existing = roleMapper.selectById(id);
        if (existing == null) {
            throw new RuntimeException(messageUtil.getMessage("error.role.not.found", new Object[]{id}));
        }

        // 如果修改了角色代码，检查新代码是否已存在
        if (!existing.getRoleCode().equals(role.getRoleCode())) {
            int exists = roleMapper.checkRoleCodeExists(role.getRoleCode());
            if (exists > 0) {
                throw new RuntimeException(messageUtil.getMessage("error.role.code.exists", new Object[]{role.getRoleCode()}));
            }
        }

        role.setId(id);
        role.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
        roleMapper.update(role);

        log.info("Role updated successfully: {}", id);
        return roleMapper.selectById(id);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        log.info("Deleting role: {}", id);

        Role role = roleMapper.selectById(id);
        if (role == null) {
            throw new RuntimeException(messageUtil.getMessage("error.role.not.found", new Object[]{id}));
        }

        // 删除角色的所有权限关联
        rolePermissionMapper.deleteByRoleId(id);

        // 删除角色
        roleMapper.deleteById(id);
        log.info("Role deleted successfully: {}", id);
    }

    @Override
    @Transactional
    public void assignPermissionsToRole(Long roleId, List<Long> permissionIds) {
        log.info("Assigning {} permissions to role: {}", permissionIds.size(), roleId);

        Role role = roleMapper.selectById(roleId);
        if (role == null) {
            throw new RuntimeException(messageUtil.getMessage("error.role.not.found", new Object[]{roleId}));
        }

        // 删除现有的权限关联
        rolePermissionMapper.deleteByRoleId(roleId);

        // 创建新的权限关联
        if (permissionIds != null && !permissionIds.isEmpty()) {
            List<RolePermission> rolePermissions = permissionIds.stream()
                    .map(permissionId -> {
                        RolePermission rp = new RolePermission();
                        rp.setRoleId(roleId);
                        rp.setPermissionId(permissionId);
                        rp.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
                        return rp;
                    })
                    .collect(Collectors.toList());

            rolePermissionMapper.batchInsert(rolePermissions);
        }

        log.info("Permissions assigned successfully to role: {}", roleId);
    }

    @Override
    public List<Long> getRolePermissionIds(Long roleId) {
        log.debug("Getting permission IDs for role: {}", roleId);
        return rolePermissionMapper.selectPermissionIdsByRoleId(roleId);
    }

    @Override
    @Transactional
    public void initializeSystemRoles() {
        log.info("Initializing system roles");
        // 系统角色已经在数据库初始化脚本中创建
        // 这个方法主要用于确保系统角色存在
        List<Role> existingRoles = getAllRoles();
        if (existingRoles.isEmpty()) {
            log.warn("No system roles found in database. Please run database initialization scripts.");
        } else {
            log.info("System roles already initialized. Found {} roles.", existingRoles.size());
        }
    }

    @Override
    public List<Role> getPage(int page, int size) {
        log.debug("Getting roles page: {}, size: {}", page, size);
        int offset = (page - 1) * size;
        return roleMapper.selectAllPaged(offset, size);
    }

    @Override
    public int count() {
        log.debug("Counting all roles");
        return roleMapper.countAll();
    }

    @Override
    @Transactional
    public void assignRolesToUser(Long userId, Long tenantId, List<Long> roleIds) {
        log.info("Assigning {} roles to user: {}", roleIds.size(), userId);

        // 删除用户现有的角色关联
        userRoleMapper.deleteByUserId(userId);

        // 创建新的角色关联
        if (roleIds != null && !roleIds.isEmpty()) {
            List<UserRole> userRoles = roleIds.stream()
                    .map(roleId -> {
                        UserRole ur = new UserRole();
                        ur.setUserId(userId);
                        ur.setRoleId(roleId);
                        ur.setTenantId(tenantId);
                        ur.setIsPrimary(false);
                        ur.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
                        return ur;
                    })
                    .collect(Collectors.toList());

            // 设置第一个角色为主角色
            if (!userRoles.isEmpty()) {
                userRoles.get(0).setIsPrimary(true);
            }

            userRoleMapper.batchInsert(userRoles);
        }

        log.info("Roles assigned successfully to user: {}", userId);
    }
}
