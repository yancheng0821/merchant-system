package com.merchant.server.businessservice.mapper;

import com.merchant.server.businessservice.entity.StripePaymentIntent;
import org.apache.ibatis.annotations.*;

/**
 * Stripe支付意图Mapper
 */
@Mapper
public interface StripePaymentIntentMapper {
    
    /**
     * 插入支付意图
     */
    @Insert("INSERT INTO stripe_payment_intents (tenant_id, order_id, stripe_account_id, " +
            "payment_intent_id, client_secret, amount, currency, status, " +
            "payment_method_id, payment_method_type, application_fee_amount, " +
            "transfer_data, metadata, last_error, created_at, confirmed_at, canceled_at) " +
            "VALUES (#{tenantId}, #{orderId}, #{stripeAccountId}, " +
            "#{paymentIntentId}, #{clientSecret}, #{amount}, #{currency}, #{status}, " +
            "#{paymentMethodId}, #{paymentMethodType}, #{applicationFeeAmount}, " +
            "#{transferData}, #{metadata}, #{lastError}, #{createdAt}, #{confirmedAt}, #{canceledAt})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(StripePaymentIntent intent);
    
    /**
     * 更新支付意图
     */
    @Update("UPDATE stripe_payment_intents SET " +
            "status = #{status}, payment_method_id = #{paymentMethodId}, " +
            "last_error = #{lastError}, confirmed_at = #{confirmedAt}, canceled_at = #{canceledAt} " +
            "WHERE id = #{id}")
    int updateById(StripePaymentIntent intent);
    
    /**
     * 根据支付意图ID查询
     */
    @Select("SELECT * FROM stripe_payment_intents WHERE payment_intent_id = #{paymentIntentId}")
    StripePaymentIntent selectByPaymentIntentId(@Param("paymentIntentId") String paymentIntentId);
    
    /**
     * 根据订单ID查询
     */
    @Select("SELECT * FROM stripe_payment_intents WHERE order_id = #{orderId} ORDER BY created_at DESC LIMIT 1")
    StripePaymentIntent selectByOrderId(@Param("orderId") Long orderId);
}