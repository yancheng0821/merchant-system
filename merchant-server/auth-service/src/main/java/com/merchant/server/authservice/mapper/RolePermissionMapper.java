package com.merchant.server.authservice.mapper;

import com.merchant.server.authservice.entity.RolePermission;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 角色权限关联 Mapper 接口
 */
@Mapper
public interface RolePermissionMapper {

    /**
     * 根据ID查询角色权限关联
     */
    RolePermission selectById(@Param("id") Long id);

    /**
     * 根据角色ID查询所有权限关联
     */
    List<RolePermission> selectByRoleId(@Param("roleId") Long roleId);

    /**
     * 根据权限ID查询所有角色关联
     */
    List<RolePermission> selectByPermissionId(@Param("permissionId") Long permissionId);

    /**
     * 根据角色ID和权限ID查询
     */
    RolePermission selectByRoleIdAndPermissionId(@Param("roleId") Long roleId, @Param("permissionId") Long permissionId);

    /**
     * 插入角色权限关联
     */
    int insert(RolePermission rolePermission);

    /**
     * 更新角色权限关联
     */
    int update(RolePermission rolePermission);

    /**
     * 删除角色权限关联
     */
    int deleteById(@Param("id") Long id);

    /**
     * 根据角色ID删除所有关联
     */
    int deleteByRoleId(@Param("roleId") Long roleId);

    /**
     * 根据权限ID删除所有关联
     */
    int deleteByPermissionId(@Param("permissionId") Long permissionId);

    /**
     * 批量插入角色权限关联
     */
    int batchInsert(@Param("list") List<RolePermission> rolePermissions);

    /**
     * 批量删除角色权限关联
     */
    int batchDelete(@Param("ids") List<Long> ids);

    /**
     * 检查角色是否拥有指定权限
     */
    int checkRoleHasPermission(@Param("roleId") Long roleId, @Param("permissionId") Long permissionId);

    /**
     * 获取角色的权限ID列表
     */
    List<Long> selectPermissionIdsByRoleId(@Param("roleId") Long roleId);
}
