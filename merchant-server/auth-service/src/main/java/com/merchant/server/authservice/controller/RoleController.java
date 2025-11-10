package com.merchant.server.authservice.controller;

import com.merchant.server.common.annotation.RequiresPermission;
import com.merchant.server.authservice.entity.Role;
import com.merchant.server.authservice.service.RoleService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 角色管理 Controller
 */
@Slf4j
@RestController
@RequestMapping("/api/auth/roles")
public class RoleController {

    private final RoleService roleService;

    public RoleController(RoleService roleService) {
        this.roleService = roleService;
    }

    /**
     * 获取所有角色
     */
    @RequiresPermission("rbac:view_roles")
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllRoles(@RequestParam(required = false) Long tenantId) {
        log.debug("Getting all system roles");

        // 角色现在是系统级别，不再区分租户
        List<Role> roles = roleService.getAllRoles();

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
        Role role = roleService.getById(id);

        Map<String, Object> response = new HashMap<>();
        if (role != null) {
            response.put("success", true);
            response.put("data", role);
        } else {
            response.put("success", false);
            response.put("message", "角色不存在");
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
        List<Role> roles = roleService.getSystemRoles();

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
        log.debug("Getting roles by user id: {}", userId);
        List<Role> roles = roleService.getRolesByUserId(userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", roles);
        response.put("total", roles.size());

        return ResponseEntity.ok(response);
    }

    /**
     * 获取可分配的角色列表（用于分配角色功能）
     * 只需要 users:assign_roles 权限即可访问
     */
    @RequiresPermission("users:assign_roles")
    @GetMapping("/assignable")
    public ResponseEntity<Map<String, Object>> getAssignableRoles(@RequestParam(required = false) Long tenantId) {
        log.debug("Getting assignable roles for role assignment");

        // 获取所有系统角色，排除超级管理员角色
        List<Role> roles = roleService.getAllRoles();
        List<Role> assignableRoles = roles.stream()
            .filter(role -> !role.getRoleCode().equals("SUPER_ADMIN") && !role.getRoleCode().equals("SYSTEM_ADMIN"))
            .collect(java.util.stream.Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", assignableRoles);
        response.put("total", assignableRoles.size());

        return ResponseEntity.ok(response);
    }

    /**
     * 创建角色
     */
    @RequiresPermission("rbac:create_role")
    @PostMapping
    public ResponseEntity<Map<String, Object>> createRole(@RequestBody Role role) {
        log.info("Creating role: {}", role.getRoleCode());

        try {
            Role created = roleService.create(role);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", created);
            response.put("message", "角色创建成功");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to create role", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * 更新角色
     */
    @RequiresPermission("rbac:update_role")
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateRole(
            @PathVariable Long id,
            @RequestBody Role role) {
        log.info("Updating role: {}", id);

        try {
            Role updated = roleService.update(id, role);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", updated);
            response.put("message", "角色更新成功");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to update role", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * 删除角色
     */
    @RequiresPermission("rbac:delete_role")
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteRole(@PathVariable Long id) {
        log.info("Deleting role: {}", id);

        try {
            roleService.delete(id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "角色删除成功");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to delete role", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * 为角色分配权限
     */
    @RequiresPermission("rbac:assign_permissions")
    @PostMapping("/{roleId}/permissions")
    public ResponseEntity<Map<String, Object>> assignPermissionsToRole(
            @PathVariable Long roleId,
            @RequestBody Map<String, Object> request) {
        log.info("Assigning permissions to role: {}", roleId);

        try {
            // 类型转换：处理 Integer 到 Long 的转换
            List<Long> permissionIds = new java.util.ArrayList<>();
            Object permissionIdsObj = request.get("permissionIds");
            if (permissionIdsObj instanceof List) {
                List<?> rawList = (List<?>) permissionIdsObj;
                permissionIds = rawList.stream()
                    .map(obj -> {
                        if (obj instanceof Number) {
                            return ((Number) obj).longValue();
                        }
                        return Long.parseLong(obj.toString());
                    })
                    .collect(java.util.stream.Collectors.toList());
            }

            roleService.assignPermissionsToRole(roleId, permissionIds);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "权限分配成功");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to assign permissions to role", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * 获取角色的权限ID列表
     */
    @RequiresPermission("rbac:view_permissions")
    @GetMapping("/{roleId}/permission-ids")
    public ResponseEntity<Map<String, Object>> getRolePermissionIds(@PathVariable Long roleId) {
        log.debug("Getting permission IDs for role: {}", roleId);

        try {
            List<Long> permissionIds = roleService.getRolePermissionIds(roleId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", permissionIds);
            response.put("total", permissionIds.size());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to get role permission IDs", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * 分页获取角色
     */
    @RequiresPermission("rbac:view_roles")
    @GetMapping("/page")
    public ResponseEntity<Map<String, Object>> getRolesPage(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Long tenantId) {
        log.debug("Getting roles page: {}, size: {}", page, size);

        // 角色现在是系统级别，不再需要tenantId参数
        List<Role> roles = roleService.getPage(page, size);
        int total = roleService.count();

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", roles);
        response.put("total", total);
        response.put("page", page);
        response.put("size", size);

        return ResponseEntity.ok(response);
    }
}
