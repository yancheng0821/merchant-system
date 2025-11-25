package com.merchant.server.merchantservice.service.impl;

import com.merchant.server.merchantservice.entity.SubscriptionPlan;
import com.merchant.server.merchantservice.mapper.SubscriptionPlanMapper;
import com.merchant.server.merchantservice.service.SubscriptionPlanService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 订阅计划服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SubscriptionPlanServiceImpl implements SubscriptionPlanService {

    private final SubscriptionPlanMapper subscriptionPlanMapper;

    @Override
    public SubscriptionPlan getPlanById(Long id) {
        log.debug("根据ID查询订阅计划: {}", id);
        return subscriptionPlanMapper.findById(id);
    }

    @Override
    public SubscriptionPlan getPlanByCode(String planCode) {
        log.debug("根据计划代码查询订阅计划: {}", planCode);
        return subscriptionPlanMapper.findByPlanCode(planCode);
    }

    @Override
    public List<SubscriptionPlan> getAllActivePlans() {
        log.debug("查询所有激活的订阅计划");
        return subscriptionPlanMapper.findAllActive();
    }

    @Override
    public List<SubscriptionPlan> getAllPlans() {
        log.debug("查询所有订阅计划");
        return subscriptionPlanMapper.findAll();
    }
}
