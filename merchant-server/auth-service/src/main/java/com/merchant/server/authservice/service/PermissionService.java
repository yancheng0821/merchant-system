package com.merchant.server.authservice.service;

import com.merchant.server.authservice.dto.PermissionDTO;
import com.merchant.server.authservice.entity.Permission;

import java.util.List;

/**
 * 权限服务接口
 */
public interface PermissionService {

    /**
     * 根据ID查询权限
     */
    PermissionDTO getById(Long id);

    /**
     * 根据权限代码查询权限
     */
    PermissionDTO getByPermissionCode(String permissionCode);

    /**
     * 查询所有激活的权限
     */
    List<PermissionDTO> getAllActive();

    /**
     * 根据资源类型查询权限列表
     */
    List<PermissionDTO> getByResourceType(String resourceType);

    /**
     * 根据资源模块查询权限列表
     */
    List<PermissionDTO> getByResource(String resource);

    /**
     * 根据角色ID查询权限列表
     */
    List<PermissionDTO> getByRoleId(Long roleId);

    /**
     * 根据用户ID查询权限列表
     */
    List<PermissionDTO> getByUserId(Long userId, Long tenantId);

    /**
     * 创建权限
     */
    PermissionDTO create(PermissionDTO permissionDTO);

    /**
     * 更新权限
     */
    PermissionDTO update(Long id, PermissionDTO permissionDTO);

    /**
     * 删除权限
     */
    void delete(Long id);

    /**
     * 批量创建权限
     */
    void batchCreate(List<PermissionDTO> permissions);

    /**
     * 分页查询权限
     */
    List<PermissionDTO> getPage(int page, int size);

    /**
     * 查询权限总数
     */
    int count();

    /**
     * Entity转DTO
     */
    PermissionDTO toDTO(Permission permission);

    /**
     * DTO转Entity
     */
    Permission toEntity(PermissionDTO dto);
}
