package com.merchant.server.authservice.service;

import com.merchant.server.authservice.dto.TenantInvitationCreateDTO;
import com.merchant.server.authservice.entity.TenantInvitation;

import java.util.List;
import java.util.Optional;

public interface TenantInvitationService {
    
    /**
     * 创建邀请码
     */
    TenantInvitation createInvitation(TenantInvitationCreateDTO createDTO, Long createdBy);
    
    /**
     * 验证邀请码
     */
    TenantInvitation validateInvitationCode(String invitationCode);
    
    /**
     * 使用邀请码
     */
    void useInvitation(Long invitationId, Long userId);
    
    /**
     * 根据邀请码查找
     */
    Optional<TenantInvitation> findByInvitationCode(String invitationCode);
    
    /**
     * 根据租户ID查找邀请码列表
     */
    List<TenantInvitation> findByTenantId(Long tenantId);
    
    /**
     * 禁用邀请码
     */
    void disableInvitation(Long invitationId);
    
    /**
     * 生成邀请码字符串
     */
    String generateInvitationCode();
}