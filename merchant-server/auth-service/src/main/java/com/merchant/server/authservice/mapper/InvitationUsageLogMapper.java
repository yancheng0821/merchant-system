package com.merchant.server.authservice.mapper;

import com.merchant.server.authservice.entity.InvitationUsageLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface InvitationUsageLogMapper {
    
    void insert(InvitationUsageLog log);
    
    List<InvitationUsageLog> findByInvitationId(@Param("invitationId") Long invitationId);
    
    List<InvitationUsageLog> findByUserId(@Param("userId") Long userId);
}