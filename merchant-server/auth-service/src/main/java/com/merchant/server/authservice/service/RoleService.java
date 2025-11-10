package com.merchant.server.authservice.service;

import com.merchant.server.authservice.entity.Role;

import java.util.List;
import java.util.Optional;

/**
 * 角色服务接口
 */
public interface RoleService {

    /**
     * 根据ID查询角色
     */
    Role getById(Long id);

    /**
     * 根据角色代码查找角色（系统级别）
     */
    Optional<Role> findByRoleCode(String roleCode);

    /**
     * 获取所有角色（系统级别）
     */
    List<Role> getAllRoles();

    /**
     * 获取所有系统角色
     */
    List<Role> getSystemRoles();

    /**
     * 根据用户ID查询角色列表
     */
    List<Role> getRolesByUserId(Long userId);

    /**
     * 创建角色
     */
    Role create(Role role);

    /**
     * 更新角色
     */
    Role update(Long id, Role role);

    /**
     * 删除角色
     */
    void delete(Long id);

    /**
     * 为角色分配权限
     */
    void assignPermissionsToRole(Long roleId, List<Long> permissionIds);

    /**
     * 获取角色的权限ID列表
     */
    List<Long> getRolePermissionIds(Long roleId);

    /**
     * 初始化系统角色（仅在系统首次启动时调用）
     */
    void initializeSystemRoles();

    /**
     * 分页查询角色
     */
    List<Role> getPage(int page, int size);

    /**
     * 查询角色总数
     */
    int count();

    /**
     * 为用户分配角色
     */
    void assignRolesToUser(Long userId, Long tenantId, List<Long> roleIds);
}