package com.merchant.server.authservice.service.impl;

import com.merchant.server.authservice.dto.PermissionDTO;
import com.merchant.server.authservice.entity.Permission;
import com.merchant.server.authservice.mapper.PermissionMapper;
import com.merchant.server.authservice.service.PermissionService;
import com.merchant.server.authservice.util.MessageUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 权限服务实现类
 */
@Slf4j
@Service
public class PermissionServiceImpl implements PermissionService {

    private final PermissionMapper permissionMapper;
    private final MessageUtil messageUtil;

    public PermissionServiceImpl(PermissionMapper permissionMapper, MessageUtil messageUtil) {
        this.permissionMapper = permissionMapper;
        this.messageUtil = messageUtil;
    }

    @Override
    public PermissionDTO getById(Long id) {
        Permission permission = permissionMapper.selectById(id);
        return permission != null ? toDTO(permission) : null;
    }

    @Override
    public PermissionDTO getByPermissionCode(String permissionCode) {
        Permission permission = permissionMapper.selectByPermissionCode(permissionCode);
        return permission != null ? toDTO(permission) : null;
    }

    @Override
    public List<PermissionDTO> getAllActive() {
        List<Permission> permissions = permissionMapper.selectAllActive();
        return permissions.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<PermissionDTO> getByResourceType(String resourceType) {
        List<Permission> permissions = permissionMapper.selectByResourceType(resourceType);
        return permissions.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<PermissionDTO> getByResource(String resource) {
        List<Permission> permissions = permissionMapper.selectByResource(resource);
        return permissions.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<PermissionDTO> getByRoleId(Long roleId) {
        List<Permission> permissions = permissionMapper.selectByRoleId(roleId);
        return permissions.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<PermissionDTO> getByUserId(Long userId, Long tenantId) {
        List<Permission> permissions = permissionMapper.selectByUserId(userId, tenantId);
        return permissions.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PermissionDTO create(PermissionDTO permissionDTO) {
        Permission permission = toEntity(permissionDTO);

        // 自动解析permission_code设置resource和action
        if (permission.getPermissionCode() != null && permission.getPermissionCode().contains(":")) {
            String[] parts = permission.getPermissionCode().split(":");
            permission.setResource(parts[0]);
            permission.setAction(parts.length > 1 ? parts[1] : "view");
        }

        permissionMapper.insert(permission);
        log.info("Created permission: {}", permission.getPermissionCode());
        return toDTO(permission);
    }

    @Override
    @Transactional
    public PermissionDTO update(Long id, PermissionDTO permissionDTO) {
        Permission existing = permissionMapper.selectById(id);
        if (existing == null) {
            throw new RuntimeException(messageUtil.getMessage("error.permission.not.found", new Object[]{id}));
        }

        Permission permission = toEntity(permissionDTO);
        permission.setId(id);

        // 自动解析permission_code设置resource和action
        if (permission.getPermissionCode() != null && permission.getPermissionCode().contains(":")) {
            String[] parts = permission.getPermissionCode().split(":");
            permission.setResource(parts[0]);
            permission.setAction(parts.length > 1 ? parts[1] : "view");
        }

        permissionMapper.update(permission);
        log.info("Updated permission: {}", permission.getPermissionCode());
        return toDTO(permission);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        permissionMapper.deleteById(id);
        log.info("Deleted permission with id: {}", id);
    }

    @Override
    @Transactional
    public void batchCreate(List<PermissionDTO> permissions) {
        List<Permission> entities = permissions.stream()
                .map(this::toEntity)
                .collect(Collectors.toList());

        // 自动解析permission_code
        entities.forEach(p -> {
            if (p.getPermissionCode() != null && p.getPermissionCode().contains(":")) {
                String[] parts = p.getPermissionCode().split(":");
                p.setResource(parts[0]);
                p.setAction(parts.length > 1 ? parts[1] : "view");
            }
        });

        permissionMapper.batchInsert(entities);
        log.info("Batch created {} permissions", entities.size());
    }

    @Override
    public List<PermissionDTO> getPage(int page, int size) {
        int offset = (page - 1) * size;
        List<Permission> permissions = permissionMapper.selectPage(offset, size);
        return permissions.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public int count() {
        return permissionMapper.count();
    }

    @Override
    public PermissionDTO toDTO(Permission permission) {
        if (permission == null) {
            return null;
        }
        PermissionDTO dto = new PermissionDTO();
        BeanUtils.copyProperties(permission, dto);
        dto.setStatus(permission.getStatus() != null ? permission.getStatus().name() : null);
        return dto;
    }

    @Override
    public Permission toEntity(PermissionDTO dto) {
        if (dto == null) {
            return null;
        }
        Permission permission = new Permission();
        BeanUtils.copyProperties(dto, permission);
        if (dto.getStatus() != null) {
            permission.setStatus(Permission.PermissionStatus.valueOf(dto.getStatus()));
        }
        return permission;
    }
}
