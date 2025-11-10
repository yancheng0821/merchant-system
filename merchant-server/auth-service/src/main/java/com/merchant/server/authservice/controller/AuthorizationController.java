package com.merchant.server.authservice.controller;

import com.merchant.server.authservice.dto.CheckPermissionRequest;
import com.merchant.server.authservice.dto.CheckPermissionResponse;
import com.merchant.server.authservice.dto.UserPermissionsDTO;
import com.merchant.server.authservice.service.AuthorizationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 授权检查 Controller
 */
@Slf4j
@RestController
@RequestMapping("/api/authorization")
public class AuthorizationController {

    private final AuthorizationService authorizationService;

    public AuthorizationController(AuthorizationService authorizationService) {
        this.authorizationService = authorizationService;
    }

    /**
     * 检查用户权限
     */
    @PostMapping("/check")
    public ResponseEntity<Map<String, Object>> checkPermission(@RequestBody CheckPermissionRequest request) {
        log.debug("Checking permission for user: {}, resource: {}, action: {}",
                request.getUserId(), request.getResource(), request.getAction());

        CheckPermissionResponse result;
        if (request.getPermissionCode() != null) {
            result = authorizationService.checkPermissionByCode(
                    request.getUserId(),
                    request.getTenantId(),
                    request.getPermissionCode()
            );
        } else {
            result = authorizationService.checkPermission(
                    request.getUserId(),
                    request.getTenantId(),
                    request.getResource(),
                    request.getAction()
            );
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", result);

        return ResponseEntity.ok(response);
    }

    /**
     * 获取用户的所有权限
     */
    @GetMapping("/user/{userId}/permissions")
    public ResponseEntity<Map<String, Object>> getUserPermissions(
            @PathVariable Long userId,
            @RequestParam(required = false) Long tenantId) {
        log.debug("Getting permissions for user: {}, tenant: {}", userId, tenantId);

        UserPermissionsDTO permissions = authorizationService.getUserPermissions(userId, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", permissions);

        return ResponseEntity.ok(response);
    }

    /**
     * 检查用户是否是超级管理员
     */
    @GetMapping("/user/{userId}/is-super-admin")
    public ResponseEntity<Map<String, Object>> isSuperAdmin(
            @PathVariable Long userId,
            @RequestParam(required = false) Long tenantId) {
        log.debug("Checking if user {} is super admin", userId);

        boolean isSuperAdmin = authorizationService.isSuperAdmin(userId, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", isSuperAdmin);

        return ResponseEntity.ok(response);
    }

    /**
     * 检查用户是否拥有指定角色
     */
    @GetMapping("/user/{userId}/has-role/{roleCode}")
    public ResponseEntity<Map<String, Object>> hasRole(
            @PathVariable Long userId,
            @PathVariable String roleCode,
            @RequestParam(required = false) Long tenantId) {
        log.debug("Checking if user {} has role {}", userId, roleCode);

        boolean hasRole = authorizationService.hasRole(userId, roleCode, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", hasRole);

        return ResponseEntity.ok(response);
    }

    /**
     * 检查操作者是否有足够权限操作目标用户
     */
    @GetMapping("/user/{operatorUserId}/can-manage/{targetUserId}")
    public ResponseEntity<Map<String, Object>> canManageUser(
            @PathVariable Long operatorUserId,
            @PathVariable Long targetUserId,
            @RequestParam(required = false) Long tenantId) {
        log.debug("Checking if user {} can manage user {}", operatorUserId, targetUserId);

        boolean canManage = authorizationService.hasHigherRoleLevel(operatorUserId, targetUserId, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", canManage);

        return ResponseEntity.ok(response);
    }

    /**
     * 刷新用户权限缓存
     */
    @PostMapping("/user/{userId}/refresh")
    public ResponseEntity<Map<String, Object>> refreshUserPermissions(
            @PathVariable Long userId,
            @RequestParam(required = false) Long tenantId) {
        log.info("Refreshing permissions cache for user: {}, tenant: {}", userId, tenantId);

        authorizationService.refreshUserPermissions(userId, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Permissions cache refreshed successfully");

        return ResponseEntity.ok(response);
    }
}
