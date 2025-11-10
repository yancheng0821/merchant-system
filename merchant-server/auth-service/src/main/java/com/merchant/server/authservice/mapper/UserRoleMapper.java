package com.merchant.server.authservice.mapper;

import com.merchant.server.authservice.entity.UserRole;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 用户角色关联 Mapper 接口
 */
@Mapper
public interface UserRoleMapper {

    /**
     * 根据ID查询用户角色关联
     */
    UserRole selectById(@Param("id") Long id);

    /**
     * 根据用户ID查询所有角色关联
     */
    List<UserRole> selectByUserId(@Param("userId") Long userId);

    /**
     * 根据用户ID和租户ID查询角色关联
     */
    List<UserRole> selectByUserIdAndTenantId(@Param("userId") Long userId, @Param("tenantId") Long tenantId);

    /**
     * 根据角色ID查询所有用户关联
     */
    List<UserRole> selectByRoleId(@Param("roleId") Long roleId);

    /**
     * 根据用户ID和角色ID查询
     */
    UserRole selectByUserIdAndRoleId(@Param("userId") Long userId, @Param("roleId") Long roleId);

    /**
     * 查询用户的主角色
     */
    UserRole selectPrimaryByUserId(@Param("userId") Long userId, @Param("tenantId") Long tenantId);

    /**
     * 查询用户的有效角色（在生效日期范围内）
     */
    List<UserRole> selectEffectiveByUserId(@Param("userId") Long userId, @Param("tenantId") Long tenantId);

    /**
     * 插入用户角色关联
     */
    int insert(UserRole userRole);

    /**
     * 更新用户角色关联
     */
    int update(UserRole userRole);

    /**
     * 删除用户角色关联
     */
    int deleteById(@Param("id") Long id);

    /**
     * 根据用户ID删除所有关联
     */
    int deleteByUserId(@Param("userId") Long userId);

    /**
     * 根据角色ID删除所有关联
     */
    int deleteByRoleId(@Param("roleId") Long roleId);

    /**
     * 批量插入用户角色关联
     */
    int batchInsert(@Param("list") List<UserRole> userRoles);

    /**
     * 取消用户的所有主角色标记
     */
    int clearPrimaryByUserId(@Param("userId") Long userId, @Param("tenantId") Long tenantId);

    /**
     * 检查用户是否拥有指定角色
     */
    int checkUserHasRole(@Param("userId") Long userId, @Param("roleId") Long roleId);

    /**
     * 获取用户的角色ID列表
     */
    List<Long> selectRoleIdsByUserId(@Param("userId") Long userId, @Param("tenantId") Long tenantId);
}
