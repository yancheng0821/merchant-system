package com.merchant.server.merchantservice.service;

import com.merchant.server.merchantservice.entity.SubscriptionPlan;

import java.util.List;

/**
 * 订阅计划服务接口
 */
public interface SubscriptionPlanService {

    /**
     * 根据ID查询订阅计划
     */
    SubscriptionPlan getPlanById(Long id);

    /**
     * 根据计划代码查询订阅计划
     */
    SubscriptionPlan getPlanByCode(String planCode);

    /**
     * 查询所有激活的订阅计划
     */
    List<SubscriptionPlan> getAllActivePlans();

    /**
     * 查询所有订阅计划
     */
    List<SubscriptionPlan> getAllPlans();
}
