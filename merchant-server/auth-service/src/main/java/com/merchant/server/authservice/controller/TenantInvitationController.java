package com.merchant.server.authservice.controller;

import com.merchant.server.common.annotation.RequiresPermission;
import com.merchant.server.authservice.dto.InvitationValidationRequest;
import com.merchant.server.authservice.dto.TenantInvitationCreateDTO;
import com.merchant.server.authservice.entity.TenantInvitation;
import com.merchant.server.authservice.service.TenantInvitationService;
import com.merchant.server.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/auth/invitations")
@RequiredArgsConstructor
public class TenantInvitationController {
    
    private final TenantInvitationService tenantInvitationService;
    
    /**
     * 创建邀请码
     */
    @RequiresPermission("users:create")
    @PostMapping
    public ApiResponse<TenantInvitation> createInvitation(
            @Valid @RequestBody TenantInvitationCreateDTO createDTO,
            @RequestHeader("X-User-Id") Long userId) {
        
        log.info("创建邀请码请求 - tenantId: {}, createdBy: {}", createDTO.getTenantId(), userId);
        
        TenantInvitation invitation = tenantInvitationService.createInvitation(createDTO, userId);
        return ApiResponse.success(invitation);
    }
    
    /**
     * 验证邀请码
     */
    @PostMapping("/validate")
    public ApiResponse<TenantInvitation> validateInvitation(
            @Valid @RequestBody InvitationValidationRequest request) {
        
        log.info("验证邀请码请求 - code: {}", request.getInvitationCode());
        
        TenantInvitation invitation = tenantInvitationService.validateInvitationCode(request.getInvitationCode());
        return ApiResponse.success(invitation);
    }
    
    /**
     * 获取租户的邀请码列表
     */
    @RequiresPermission("users:view")
    @GetMapping("/tenant/{tenantId}")
    public ApiResponse<List<TenantInvitation>> getInvitationsByTenant(
            @PathVariable Long tenantId) {
        
        log.info("获取租户邀请码列表 - tenantId: {}", tenantId);
        
        List<TenantInvitation> invitations = tenantInvitationService.findByTenantId(tenantId);
        return ApiResponse.success(invitations);
    }
    
    /**
     * 禁用邀请码
     */
    @RequiresPermission("users:update")
    @PutMapping("/{invitationId}/disable")
    public ApiResponse<Void> disableInvitation(@PathVariable Long invitationId) {
        
        log.info("禁用邀请码请求 - invitationId: {}", invitationId);
        
        tenantInvitationService.disableInvitation(invitationId);
        return ApiResponse.success(null);
    }
}