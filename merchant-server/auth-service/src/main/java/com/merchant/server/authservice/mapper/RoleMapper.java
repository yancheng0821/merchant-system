package com.merchant.server.authservice.mapper;

import com.merchant.server.authservice.entity.Role;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 角色 Mapper 接口
 */
@Mapper
public interface RoleMapper {

    /**
     * 根据ID查询角色
     */
    Role selectById(@Param("id") Long id);

    /**
     * 根据角色代码查询角色（系统级别）
     */
    Role selectByRoleCodeOnly(@Param("roleCode") String roleCode);

    /**
     * 查询所有角色（系统级别）
     */
    List<Role> selectAll();

    /**
     * 查询所有系统角色
     */
    List<Role> selectSystemRoles();

    /**
     * 根据用户ID查询角色列表
     */
    List<Role> selectByUserId(@Param("userId") Long userId);

    /**
     * 查询所有激活的角色
     */
    List<Role> selectAllActive();

    /**
     * 插入角色
     */
    int insert(Role role);

    /**
     * 更新角色
     */
    int update(Role role);

    /**
     * 删除角色
     */
    int deleteById(@Param("id") Long id);

    /**
     * 根据层级范围查询角色
     */
    List<Role> selectByLevelRange(@Param("minLevel") Integer minLevel, @Param("maxLevel") Integer maxLevel);

    /**
     * 查询角色总数
     */
    int countAll();

    /**
     * 分页查询角色
     */
    List<Role> selectAllPaged(@Param("offset") int offset, @Param("limit") int limit);

    /**
     * 检查角色代码是否存在（系统级别）
     */
    int checkRoleCodeExists(@Param("roleCode") String roleCode);
}
