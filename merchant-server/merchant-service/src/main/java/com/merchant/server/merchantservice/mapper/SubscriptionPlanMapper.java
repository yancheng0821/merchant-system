package com.merchant.server.merchantservice.mapper;

import com.merchant.server.merchantservice.entity.SubscriptionPlan;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SubscriptionPlanMapper {

    /**
     * 根据ID查询订阅计划
     */
    SubscriptionPlan findById(@Param("id") Long id);

    /**
     * 根据计划代码查询订阅计划
     */
    SubscriptionPlan findByPlanCode(@Param("planCode") String planCode);

    /**
     * 查询所有激活的订阅计划
     */
    List<SubscriptionPlan> findAllActive();

    /**
     * 查询所有订阅计划
     */
    List<SubscriptionPlan> findAll();

    /**
     * 更新订阅计划的 Stripe IDs
     */
    int updateStripeIds(@Param("id") Long id,
                        @Param("stripeProductId") String stripeProductId,
                        @Param("stripeMonthlyPriceId") String stripeMonthlyPriceId,
                        @Param("stripeYearlyPriceId") String stripeYearlyPriceId);
}
