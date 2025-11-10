package com.merchant.server.authservice.controller;

import com.merchant.server.common.annotation.RequiresPermission;
import com.merchant.server.authservice.dto.AssignPermissionsRequest;
import com.merchant.server.authservice.dto.AssignRoleRequest;
import com.merchant.server.authservice.entity.Role;
import com.merchant.server.authservice.entity.RolePermission;
import com.merchant.server.authservice.entity.UserRole;
import com.merchant.server.authservice.mapper.RoleMapper;
import com.merchant.server.authservice.mapper.RolePermissionMapper;
import com.merchant.server.authservice.mapper.UserRoleMapper;
import com.merchant.server.authservice.service.AuthorizationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 角色管理 Controller
 */
@Slf4j
@RestController
@RequestMapping("/api/auth/role-management")
public class RoleManagementController {

    private final RoleMapper roleMapper;
    private final RolePermissionMapper rolePermissionMapper;
    private final UserRoleMapper userRoleMapper;
    private final AuthorizationService authorizationService;

    public RoleManagementController(RoleMapper roleMapper,
                                   RolePermissionMapper rolePermissionMapper,
                                   UserRoleMapper userRoleMapper,
                                   AuthorizationService authorizationService) {
        this.roleMapper = roleMapper;
        this.rolePermissionMapper = rolePermissionMapper;
        this.userRoleMapper = userRoleMapper;
        this.authorizationService = authorizationService;
    }

    /**
     * 获取所有角色
     */
    @RequiresPermission("rbac:view_roles")
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllRoles(@RequestParam(required = false) Long tenantId) {
        log.debug("Getting all system roles");

        // 角色现在是系统级别，不再区分租户
        List<Role> roles = roleMapper.selectAllActive();

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", roles);
        response.put("total", roles.size());

        return ResponseEntity.ok(response);
    }

    /**
     * 根据ID获取角色
     */
    @RequiresPermission("rbac:view_roles")
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getRoleById(@PathVariable Long id) {
        log.debug("Getting role by id: {}", id);
        Role role = roleMapper.selectById(id);

        Map<String, Object> response = new HashMap<>();
        if (role != null) {
            response.put("success", true);
            response.put("data", role);
        } else {
            response.put("success", false);
            response.put("message", "Role not found");
        }

        return ResponseEntity.ok(response);
    }

    /**
     * 获取系统角色
     */
    @RequiresPermission("rbac:view_roles")
    @GetMapping("/system")
    public ResponseEntity<Map<String, Object>> getSystemRoles() {
        log.debug("Getting system roles");
        List<Role> roles = roleMapper.selectSystemRoles();

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", roles);
        response.put("total", roles.size());

        return ResponseEntity.ok(response);
    }

    /**
     * 根据用户ID获取角色列表
     */
    @RequiresPermission("rbac:view_roles")
    @GetMapping("/user/{userId}")
    public ResponseEntity<Map<String, Object>> getRolesByUserId(@PathVariable Long userId) {
        log.debug("Getting roles for user: {}", userId);
        List<Role> roles = roleMapper.selectByUserId(userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", roles);
        response.put("total", roles.size());

        return ResponseEntity.ok(response);
    }

    /**
     * 创建角色
     */
    @RequiresPermission("rbac:create_role")
    @PostMapping
    @Transactional
    public ResponseEntity<Map<String, Object>> createRole(@RequestBody Role role) {
        log.info("Creating role: {}", role.getRoleCode());

        // 检查角色代码是否已存在（系统级别）
        int exists = roleMapper.checkRoleCodeExists(role.getRoleCode());
        if (exists > 0) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Role code already exists");
            return ResponseEntity.badRequest().body(response);
        }

        roleMapper.insert(role);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", role);
        response.put("message", "Role created successfully");

        return ResponseEntity.ok(response);
    }

    /**
     * 更新角色
     */
    @RequiresPermission("rbac:update_role")
    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<Map<String, Object>> updateRole(@PathVariable Long id, @RequestBody Role role) {
        log.info("Updating role: {}", id);

        Role existing = roleMapper.selectById(id);
        if (existing == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Role not found");
            return ResponseEntity.badRequest().body(response);
        }

        role.setId(id);
        roleMapper.update(role);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", role);
        response.put("message", "Role updated successfully");

        return ResponseEntity.ok(response);
    }

    /**
     * 删除角色
     */
    @RequiresPermission("rbac:delete_role")
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Map<String, Object>> deleteRole(@PathVariable Long id) {
        log.info("Deleting role: {}", id);

        Role role = roleMapper.selectById(id);
        if (role == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Role not found");
            return ResponseEntity.badRequest().body(response);
        }

        // 不允许删除系统角色
        if (Boolean.TRUE.equals(role.getIsSystem())) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Cannot delete system role");
            return ResponseEntity.badRequest().body(response);
        }

        roleMapper.deleteById(id);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Role deleted successfully");

        return ResponseEntity.ok(response);
    }

    /**
     * 为角色分配权限
     */
    @RequiresPermission("rbac:assign_permissions")
    @PostMapping("/{roleId}/permissions")
    @Transactional
    public ResponseEntity<Map<String, Object>> assignPermissionsToRole(
            @PathVariable Long roleId,
            @RequestBody AssignPermissionsRequest request) {
        log.info("Assigning permissions to role: {}", roleId);

        // 删除原有权限
        rolePermissionMapper.deleteByRoleId(roleId);

        // 分配新权限
        if (request.getPermissionIds() != null && !request.getPermissionIds().isEmpty()) {
            List<RolePermission> rolePermissions = request.getPermissionIds().stream()
                    .map(permissionId -> {
                        RolePermission rp = new RolePermission();
                        rp.setRoleId(roleId);
                        rp.setPermissionId(permissionId);
                        return rp;
                    })
                    .collect(Collectors.toList());

            rolePermissionMapper.batchInsert(rolePermissions);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Permissions assigned successfully");
        response.put("total", request.getPermissionIds().size());

        return ResponseEntity.ok(response);
    }

    /**
     * 为用户分配角色
     */
    @RequiresPermission("rbac:assign_permissions")
    @PostMapping("/assign")
    @Transactional
    public ResponseEntity<Map<String, Object>> assignRolesToUser(@RequestBody AssignRoleRequest request) {
        log.info("Assigning roles to user: {}", request.getUserId());

        // 删除用户原有角色
        userRoleMapper.deleteByUserId(request.getUserId());

        // 分配新角色
        if (request.getRoleIds() != null && !request.getRoleIds().isEmpty()) {
            List<UserRole> userRoles = request.getRoleIds().stream()
                    .map(roleId -> {
                        UserRole ur = new UserRole();
                        ur.setUserId(request.getUserId());
                        ur.setRoleId(roleId);
                        ur.setTenantId(request.getTenantId());
                        ur.setEffectiveFrom(request.getEffectiveFrom());
                        ur.setEffectiveTo(request.getEffectiveTo());

                        // 设置主角色
                        if (request.getPrimaryRoleId() != null && request.getPrimaryRoleId().equals(roleId)) {
                            ur.setIsPrimary(true);
                        } else {
                            ur.setIsPrimary(false);
                        }

                        return ur;
                    })
                    .collect(Collectors.toList());

            userRoleMapper.batchInsert(userRoles);
        }

        // 刷新用户权限缓存
        authorizationService.refreshUserPermissions(request.getUserId(), request.getTenantId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Roles assigned successfully");
        response.put("total", request.getRoleIds().size());

        return ResponseEntity.ok(response);
    }

    /**
     * 获取角色的权限ID列表
     */
    @RequiresPermission("rbac:view_permissions")
    @GetMapping("/{roleId}/permission-ids")
    public ResponseEntity<Map<String, Object>> getRolePermissionIds(@PathVariable Long roleId) {
        log.debug("Getting permission IDs for role: {}", roleId);
        List<Long> permissionIds = rolePermissionMapper.selectPermissionIdsByRoleId(roleId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", permissionIds);
        response.put("total", permissionIds.size());

        return ResponseEntity.ok(response);
    }
}
