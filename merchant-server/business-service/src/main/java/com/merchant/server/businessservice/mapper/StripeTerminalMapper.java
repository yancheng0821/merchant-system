package com.merchant.server.businessservice.mapper;

import com.merchant.server.businessservice.entity.StripeTerminal;
import org.apache.ibatis.annotations.*;
import java.util.List;

/**
 * Stripe Terminal Mapper
 */
@Mapper
public interface StripeTerminalMapper {
    
    /**
     * 插入Terminal
     */
    @Insert("INSERT INTO stripe_terminals (tenant_id, stripe_account_id, terminal_id, label, " +
            "device_type, serial_number, location_id, status, last_seen_at, ip_address, " +
            "config, created_at, updated_at, deleted) " +
            "VALUES (#{tenantId}, #{stripeAccountId}, #{terminalId}, #{label}, " +
            "#{deviceType}, #{serialNumber}, #{locationId}, #{status}, #{lastSeenAt}, #{ipAddress}, " +
            "#{config}, #{createdAt}, #{updatedAt}, #{deleted})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(StripeTerminal terminal);
    
    /**
     * 更新Terminal
     */
    @Update("UPDATE stripe_terminals SET " +
            "status = #{status}, last_seen_at = #{lastSeenAt}, ip_address = #{ipAddress}, " +
            "config = #{config}, updated_at = #{updatedAt} " +
            "WHERE id = #{id}")
    int updateById(StripeTerminal terminal);
    
    /**
     * 根据租户ID查询所有终端
     */
    @Select("SELECT * FROM stripe_terminals WHERE tenant_id = #{tenantId} AND deleted = 0")
    List<StripeTerminal> selectByTenantId(@Param("tenantId") Long tenantId);
    
    /**
     * 根据终端ID查询
     */
    @Select("SELECT * FROM stripe_terminals WHERE terminal_id = #{terminalId} AND deleted = 0")
    StripeTerminal selectByTerminalId(@Param("terminalId") String terminalId);
    
    /**
     * 根据Stripe账户ID删除所有终端（软删除）
     */
    @Update("UPDATE stripe_terminals SET deleted = 1, updated_at = NOW() " +
            "WHERE stripe_account_id = #{stripeAccountId}")
    int deleteByStripeAccountId(@Param("stripeAccountId") String stripeAccountId);
    
    /**
     * 根据租户ID删除所有终端（软删除）
     */
    @Update("UPDATE stripe_terminals SET deleted = 1, updated_at = NOW() " +
            "WHERE tenant_id = #{tenantId}")
    int deleteByTenantId(@Param("tenantId") Long tenantId);
}