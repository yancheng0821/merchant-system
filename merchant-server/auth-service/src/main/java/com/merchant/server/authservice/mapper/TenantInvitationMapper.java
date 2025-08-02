package com.merchant.server.authservice.mapper;

import com.merchant.server.authservice.entity.TenantInvitation;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Optional;

@Mapper
public interface TenantInvitationMapper {
    
    void insert(TenantInvitation invitation);
    
    void update(TenantInvitation invitation);
    
    Optional<TenantInvitation> findById(@Param("id") Long id);
    
    Optional<TenantInvitation> findByInvitationCode(@Param("invitationCode") String invitationCode);
    
    List<TenantInvitation> findByTenantId(@Param("tenantId") Long tenantId);
    
    List<TenantInvitation> findByCreatedBy(@Param("createdBy") Long createdBy);
    
    void incrementUsedCount(@Param("id") Long id);
    
    void updateStatus(@Param("id") Long id, @Param("status") TenantInvitation.InvitationStatus status);
}