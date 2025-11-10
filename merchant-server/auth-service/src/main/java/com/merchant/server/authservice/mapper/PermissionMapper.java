package com.merchant.server.authservice.mapper;

import com.merchant.server.authservice.entity.Permission;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 权限 Mapper 接口
 */
@Mapper
public interface PermissionMapper {

    /**
     * 根据ID查询权限
     */
    Permission selectById(@Param("id") Long id);

    /**
     * 根据权限代码查询权限
     */
    Permission selectByPermissionCode(@Param("permissionCode") String permissionCode);

    /**
     * 查询所有激活的权限
     */
    List<Permission> selectAllActive();

    /**
     * 根据资源和操作查询权限
     */
    Permission selectByResourceAndAction(@Param("resource") String resource, @Param("action") String action);

    /**
     * 根据资源类型查询权限列表
     */
    List<Permission> selectByResourceType(@Param("resourceType") String resourceType);

    /**
     * 根据资源模块查询权限列表
     */
    List<Permission> selectByResource(@Param("resource") String resource);

    /**
     * 插入权限
     */
    int insert(Permission permission);

    /**
     * 更新权限
     */
    int update(Permission permission);

    /**
     * 删除权限
     */
    int deleteById(@Param("id") Long id);

    /**
     * 批量插入权限
     */
    int batchInsert(@Param("list") List<Permission> permissions);

    /**
     * 根据角色ID查询权限列表
     */
    List<Permission> selectByRoleId(@Param("roleId") Long roleId);

    /**
     * 根据用户ID查询权限列表（通过用户角色）
     */
    List<Permission> selectByUserId(@Param("userId") Long userId, @Param("tenantId") Long tenantId);

    /**
     * 查询权限总数
     */
    int count();

    /**
     * 分页查询权限
     */
    List<Permission> selectPage(@Param("offset") int offset, @Param("limit") int limit);
}
