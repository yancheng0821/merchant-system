package com.merchant.server.authservice.mapper;

import com.merchant.server.authservice.entity.PasswordResetToken;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface PasswordResetTokenMapper {

    void insert(PasswordResetToken token);

    PasswordResetToken findByToken(@Param("token") String token);

    void markAsUsed(@Param("id") Long id);

    void deleteExpiredTokens();
}
