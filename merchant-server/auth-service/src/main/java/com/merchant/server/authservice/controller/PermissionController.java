package com.merchant.server.authservice.controller;

import com.merchant.server.common.annotation.RequiresPermission;
import com.merchant.server.authservice.dto.PermissionDTO;
import com.merchant.server.authservice.service.PermissionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 权限管理 Controller
 */
@Slf4j
@RestController
@RequestMapping("/api/auth/permissions")
public class PermissionController {

    private final PermissionService permissionService;

    public PermissionController(PermissionService permissionService) {
        this.permissionService = permissionService;
    }

    /**
     * 获取所有激活的权限
     */
    @RequiresPermission("rbac:view_permissions")
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllPermissions() {
        log.debug("Getting all active permissions");
        List<PermissionDTO> permissions = permissionService.getAllActive();

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", permissions);
        response.put("total", permissions.size());

        return ResponseEntity.ok(response);
    }

    /**
     * 根据ID获取权限
     */
    @RequiresPermission("rbac:view_permissions")
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getPermissionById(@PathVariable Long id) {
        log.debug("Getting permission by id: {}", id);
        PermissionDTO permission = permissionService.getById(id);

        Map<String, Object> response = new HashMap<>();
        if (permission != null) {
            response.put("success", true);
            response.put("data", permission);
        } else {
            response.put("success", false);
            response.put("message", "Permission not found");
        }

        return ResponseEntity.ok(response);
    }

    /**
     * 根据权限代码获取权限
     */
    @RequiresPermission("rbac:view_permissions")
    @GetMapping("/code/{permissionCode}")
    public ResponseEntity<Map<String, Object>> getPermissionByCode(@PathVariable String permissionCode) {
        log.debug("Getting permission by code: {}", permissionCode);
        PermissionDTO permission = permissionService.getByPermissionCode(permissionCode);

        Map<String, Object> response = new HashMap<>();
        if (permission != null) {
            response.put("success", true);
            response.put("data", permission);
        } else {
            response.put("success", false);
            response.put("message", "Permission not found");
        }

        return ResponseEntity.ok(response);
    }

    /**
     * 根据资源模块获取权限列表
     */
    @RequiresPermission("rbac:view_permissions")
    @GetMapping("/resource/{resource}")
    public ResponseEntity<Map<String, Object>> getPermissionsByResource(@PathVariable String resource) {
        log.debug("Getting permissions by resource: {}", resource);
        List<PermissionDTO> permissions = permissionService.getByResource(resource);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", permissions);
        response.put("total", permissions.size());

        return ResponseEntity.ok(response);
    }

    /**
     * 根据角色ID获取权限列表
     */
    @RequiresPermission("rbac:view_permissions")
    @GetMapping("/role/{roleId}")
    public ResponseEntity<Map<String, Object>> getPermissionsByRoleId(@PathVariable Long roleId) {
        log.debug("Getting permissions by role id: {}", roleId);
        List<PermissionDTO> permissions = permissionService.getByRoleId(roleId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", permissions);
        response.put("total", permissions.size());

        return ResponseEntity.ok(response);
    }

    /**
     * 根据用户ID获取权限列表
     */
    @RequiresPermission("rbac:view_permissions")
    @GetMapping("/user/{userId}")
    public ResponseEntity<Map<String, Object>> getPermissionsByUserId(
            @PathVariable Long userId,
            @RequestParam(required = false) Long tenantId) {
        log.debug("Getting permissions by user id: {}, tenant: {}", userId, tenantId);
        List<PermissionDTO> permissions = permissionService.getByUserId(userId, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", permissions);
        response.put("total", permissions.size());

        return ResponseEntity.ok(response);
    }

    /**
     * 创建权限
     */
    @RequiresPermission("rbac:manage_permissions")
    @PostMapping
    public ResponseEntity<Map<String, Object>> createPermission(@RequestBody PermissionDTO permissionDTO) {
        log.info("Creating permission: {}", permissionDTO.getPermissionCode());
        PermissionDTO created = permissionService.create(permissionDTO);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", created);
        response.put("message", "Permission created successfully");

        return ResponseEntity.ok(response);
    }

    /**
     * 更新权限
     */
    @RequiresPermission("rbac:manage_permissions")
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updatePermission(
            @PathVariable Long id,
            @RequestBody PermissionDTO permissionDTO) {
        log.info("Updating permission: {}", id);
        PermissionDTO updated = permissionService.update(id, permissionDTO);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", updated);
        response.put("message", "Permission updated successfully");

        return ResponseEntity.ok(response);
    }

    /**
     * 删除权限
     */
    @RequiresPermission("rbac:manage_permissions")
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deletePermission(@PathVariable Long id) {
        log.info("Deleting permission: {}", id);
        permissionService.delete(id);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Permission deleted successfully");

        return ResponseEntity.ok(response);
    }

    /**
     * 批量创建权限
     */
    @RequiresPermission("rbac:manage_permissions")
    @PostMapping("/batch")
    public ResponseEntity<Map<String, Object>> batchCreatePermissions(@RequestBody List<PermissionDTO> permissions) {
        log.info("Batch creating {} permissions", permissions.size());
        permissionService.batchCreate(permissions);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Permissions created successfully");
        response.put("total", permissions.size());

        return ResponseEntity.ok(response);
    }

    /**
     * 分页获取权限
     */
    @RequiresPermission("rbac:view_permissions")
    @GetMapping("/page")
    public ResponseEntity<Map<String, Object>> getPermissionsPage(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.debug("Getting permissions page: {}, size: {}", page, size);
        List<PermissionDTO> permissions = permissionService.getPage(page, size);
        int total = permissionService.count();

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", permissions);
        response.put("total", total);
        response.put("page", page);
        response.put("size", size);

        return ResponseEntity.ok(response);
    }
}
