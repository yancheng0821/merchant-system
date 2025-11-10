package com.merchant.server.authservice.service.impl;

import com.merchant.server.authservice.dto.TenantInvitationCreateDTO;
import com.merchant.server.authservice.entity.InvitationUsageLog;
import com.merchant.server.authservice.entity.TenantInvitation;
import com.merchant.server.authservice.mapper.InvitationUsageLogMapper;
import com.merchant.server.authservice.mapper.TenantInvitationMapper;
import com.merchant.server.authservice.service.TenantInvitationService;
import com.merchant.server.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TenantInvitationServiceImpl implements TenantInvitationService {
    
    private final TenantInvitationMapper tenantInvitationMapper;
    private final InvitationUsageLogMapper invitationUsageLogMapper;
    
    private static final String INVITATION_CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int INVITATION_CODE_LENGTH = 8;
    private static final SecureRandom random = new SecureRandom();
    
    @Override
    @Transactional
    public TenantInvitation createInvitation(TenantInvitationCreateDTO createDTO, Long createdBy) {
        log.debug("创建邀请码 - tenantId: {}, createdBy: {}", createDTO.getTenantId(), createdBy);
        
        TenantInvitation invitation = new TenantInvitation();
        invitation.setTenantId(createDTO.getTenantId());
        invitation.setInvitationCode(generateInvitationCode());
        invitation.setCreatedBy(createdBy);
        invitation.setMaxUses(createDTO.getMaxUses());
        invitation.setUsedCount(0);
        invitation.setExpiresAt(createDTO.getExpiresAt());
        invitation.setStatus(TenantInvitation.InvitationStatus.ACTIVE);
        invitation.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
        invitation.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
        
        tenantInvitationMapper.insert(invitation);
        
        log.info("邀请码创建成功 - id: {}, code: {}", invitation.getId(), invitation.getInvitationCode());
        return invitation;
    }
    
    @Override
    public TenantInvitation validateInvitationCode(String invitationCode) {
        log.debug("验证邀请码 - code: {}", invitationCode);

        Optional<TenantInvitation> invitationOpt = tenantInvitationMapper.findByInvitationCode(invitationCode);
        if (invitationOpt.isEmpty()) {
            log.warn("邀请码不存在 - code: {}", invitationCode);
            throw new BusinessException("Invitation code does not exist");
        }

        TenantInvitation invitation = invitationOpt.get();

        if (!invitation.isValid()) {
            log.warn("邀请码无效 - code: {}, status: {}, usedCount: {}, maxUses: {}, expiresAt: {}",
                    invitationCode, invitation.getStatus(), invitation.getUsedCount(),
                    invitation.getMaxUses(), invitation.getExpiresAt());

            if (invitation.getStatus() != TenantInvitation.InvitationStatus.ACTIVE) {
                throw new BusinessException("Invitation code is inactive");
            } else if (invitation.getExpiresAt() != null && invitation.getExpiresAt().isBefore(LocalDateTime.now(ZoneOffset.UTC))) {
                throw new BusinessException("Invitation code has expired");
            } else if (invitation.getUsedCount() >= invitation.getMaxUses()) {
                throw new BusinessException("Invitation code usage limit reached");
            }
        }

        log.debug("邀请码验证通过 - code: {}, tenantId: {}", invitationCode, invitation.getTenantId());
        return invitation;
    }
    
    @Override
    @Transactional
    public void useInvitation(Long invitationId, Long userId) {
        log.debug("使用邀请码 - invitationId: {}, userId: {}", invitationId, userId);
        
        // 增加使用次数
        tenantInvitationMapper.incrementUsedCount(invitationId);
        
        // 记录使用日志
        InvitationUsageLog log = new InvitationUsageLog();
        log.setInvitationId(invitationId);
        log.setUserId(userId);
        log.setUsedAt(LocalDateTime.now(ZoneOffset.UTC));
        invitationUsageLogMapper.insert(log);
        
        this.log.info("邀请码使用成功 - invitationId: {}, userId: {}", invitationId, userId);
    }
    
    @Override
    public Optional<TenantInvitation> findByInvitationCode(String invitationCode) {
        return tenantInvitationMapper.findByInvitationCode(invitationCode);
    }
    
    @Override
    public List<TenantInvitation> findByTenantId(Long tenantId) {
        return tenantInvitationMapper.findByTenantId(tenantId);
    }
    
    @Override
    @Transactional
    public void disableInvitation(Long invitationId) {
        log.debug("禁用邀请码 - invitationId: {}", invitationId);
        tenantInvitationMapper.updateStatus(invitationId, TenantInvitation.InvitationStatus.DISABLED);
        log.info("邀请码已禁用 - invitationId: {}", invitationId);
    }
    
    @Override
    public String generateInvitationCode() {
        StringBuilder code = new StringBuilder(INVITATION_CODE_LENGTH);
        for (int i = 0; i < INVITATION_CODE_LENGTH; i++) {
            code.append(INVITATION_CODE_CHARS.charAt(random.nextInt(INVITATION_CODE_CHARS.length())));
        }
        
        // 确保生成的邀请码不重复
        String generatedCode = code.toString();
        if (findByInvitationCode(generatedCode).isPresent()) {
            return generateInvitationCode(); // 递归重新生成
        }
        
        return generatedCode;
    }
}