package com.merchant.server.businessservice.mapper;

import com.merchant.server.businessservice.entity.VerificationCode;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 验证码Mapper接口
 */
@Mapper
public interface VerificationCodeMapper {

    /**
     * 插入验证码记录
     */
    int insert(VerificationCode verificationCode);

    /**
     * 根据ID查询
     */
    VerificationCode selectById(@Param("id") Long id);

    /**
     * 根据业务类型和业务ID查询最新的验证码
     */
    VerificationCode selectLatestByBusiness(
        @Param("tenantId") Long tenantId,
        @Param("businessType") String businessType,
        @Param("businessId") String businessId
    );

    /**
     * 根据接收者查询最新的验证码
     */
    VerificationCode selectLatestByRecipient(
        @Param("tenantId") Long tenantId,
        @Param("recipientType") String recipientType,
        @Param("recipient") String recipient,
        @Param("businessType") String businessType
    );

    /**
     * 更新验证码状态
     */
    int updateStatus(
        @Param("id") Long id,
        @Param("status") String status,
        @Param("verifiedAt") LocalDateTime verifiedAt
    );

    /**
     * 增加尝试次数
     */
    int incrementAttempts(@Param("id") Long id);

    /**
     * 使过期的验证码失效
     */
    int expireOldCodes(@Param("currentTime") LocalDateTime currentTime);

    /**
     * 查询指定时间范围内的验证码发送次数（防止频繁发送）
     */
    int countRecentCodesByRecipient(
        @Param("recipientType") String recipientType,
        @Param("recipient") String recipient,
        @Param("startTime") LocalDateTime startTime
    );

    /**
     * 查询IP地址在指定时间内的发送次数（防止滥用）
     */
    int countRecentCodesByIp(
        @Param("ipAddress") String ipAddress,
        @Param("startTime") LocalDateTime startTime
    );
}
