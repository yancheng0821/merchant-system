package com.merchant.server.businessservice.mapper;

import com.merchant.server.businessservice.entity.StripeLocation;
import org.apache.ibatis.annotations.*;
import java.util.List;

/**
 * Stripe Location Mapper
 */
@Mapper
public interface StripeLocationMapper {
    
    /**
     * 插入Location
     */
    @Insert("INSERT INTO stripe_locations (tenant_id, stripe_account_id, location_id, display_name, " +
            "address_line1, address_line2, address_city, address_state, address_country, address_postal_code, " +
            "metadata, created_at, updated_at, deleted) " +
            "VALUES (#{tenantId}, #{stripeAccountId}, #{locationId}, #{displayName}, " +
            "#{addressLine1}, #{addressLine2}, #{addressCity}, #{addressState}, #{addressCountry}, #{addressPostalCode}, " +
            "#{metadata}, #{createdAt}, #{updatedAt}, #{deleted})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(StripeLocation location);
    
    /**
     * 更新Location
     */
    @Update("UPDATE stripe_locations SET " +
            "display_name = #{displayName}, " +
            "address_line1 = #{addressLine1}, address_line2 = #{addressLine2}, " +
            "address_city = #{addressCity}, address_state = #{addressState}, " +
            "address_country = #{addressCountry}, address_postal_code = #{addressPostalCode}, " +
            "metadata = #{metadata}, updated_at = #{updatedAt} " +
            "WHERE id = #{id}")
    int updateById(StripeLocation location);
    
    /**
     * 根据租户ID查询所有位置
     */
    @Select("SELECT * FROM stripe_locations WHERE tenant_id = #{tenantId} AND deleted = 0")
    List<StripeLocation> selectByTenantId(@Param("tenantId") Long tenantId);
    
    /**
     * 根据Location ID查询
     */
    @Select("SELECT * FROM stripe_locations WHERE location_id = #{locationId} AND deleted = 0")
    StripeLocation selectByLocationId(@Param("locationId") String locationId);
    
    /**
     * 根据Stripe账户ID查询所有位置
     */
    @Select("SELECT * FROM stripe_locations WHERE stripe_account_id = #{stripeAccountId} AND deleted = 0")
    List<StripeLocation> selectByStripeAccountId(@Param("stripeAccountId") String stripeAccountId);
    
    /**
     * 根据ID查询
     */
    @Select("SELECT * FROM stripe_locations WHERE id = #{id} AND deleted = 0")
    StripeLocation selectById(@Param("id") Long id);
    
    /**
     * 根据Stripe账户ID删除所有位置（软删除）
     */
    @Update("UPDATE stripe_locations SET deleted = 1, updated_at = NOW() " +
            "WHERE stripe_account_id = #{stripeAccountId}")
    int deleteByStripeAccountId(@Param("stripeAccountId") String stripeAccountId);
    
    /**
     * 根据租户ID删除所有位置（软删除）
     */
    @Update("UPDATE stripe_locations SET deleted = 1, updated_at = NOW() " +
            "WHERE tenant_id = #{tenantId}")
    int deleteByTenantId(@Param("tenantId") Long tenantId);
}