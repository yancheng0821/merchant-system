package com.merchant.server.businessservice.mapper;

import com.merchant.server.businessservice.entity.StripeAccount;
import org.apache.ibatis.annotations.*;

/**
 * Stripe账户Mapper
 */
@Mapper
public interface StripeAccountMapper {
    
    /**
     * 插入Stripe账户
     */
    @Insert("INSERT INTO stripe_accounts (tenant_id, stripe_account_id, stripe_user_id, account_type, " +
            "onboarding_completed, charges_enabled, payouts_enabled, details_submitted, " +
            "business_name, business_type, country, default_currency, " +
            "dashboard_url, onboarding_url, return_url, refresh_url, " +
            "metadata, created_at, updated_at, created_by, updated_by, deleted) " +
            "VALUES (#{tenantId}, #{stripeAccountId}, #{stripeUserId}, #{accountType}, " +
            "#{onboardingCompleted}, #{chargesEnabled}, #{payoutsEnabled}, #{detailsSubmitted}, " +
            "#{businessName}, #{businessType}, #{country}, #{defaultCurrency}, " +
            "#{dashboardUrl}, #{onboardingUrl}, #{returnUrl}, #{refreshUrl}, " +
            "#{metadata}, #{createdAt}, #{updatedAt}, #{createdBy}, #{updatedBy}, #{deleted})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(StripeAccount account);
    
    /**
     * 更新Stripe账户
     */
    @Update("UPDATE stripe_accounts SET " +
            "stripe_account_id = #{stripeAccountId}, " +
            "charges_enabled = #{chargesEnabled}, payouts_enabled = #{payoutsEnabled}, " +
            "details_submitted = #{detailsSubmitted}, onboarding_completed = #{onboardingCompleted}, " +
            "dashboard_url = #{dashboardUrl}, onboarding_url = #{onboardingUrl}, " +
            "return_url = #{returnUrl}, refresh_url = #{refreshUrl}, " +
            "metadata = #{metadata}, updated_at = #{updatedAt}, updated_by = #{updatedBy}, " +
            "deleted = #{deleted} " +
            "WHERE id = #{id}")
    int updateById(StripeAccount account);
    
    /**
     * 根据租户ID查询Stripe账户
     */
    @Select("SELECT * FROM stripe_accounts WHERE tenant_id = #{tenantId} AND deleted = 0")
    StripeAccount selectByTenantId(@Param("tenantId") Long tenantId);
    
    /**
     * 根据Stripe账户ID查询
     */
    @Select("SELECT * FROM stripe_accounts WHERE stripe_account_id = #{stripeAccountId} AND deleted = 0")
    StripeAccount selectByStripeAccountId(@Param("stripeAccountId") String stripeAccountId);
    
    /**
     * 根据租户ID查询Stripe账户（包括已删除的，返回最新的一条）
     */
    @Select("SELECT * FROM stripe_accounts WHERE tenant_id = #{tenantId} ORDER BY created_at DESC LIMIT 1")
    StripeAccount selectByTenantIdIncludeDeleted(@Param("tenantId") Long tenantId);
}