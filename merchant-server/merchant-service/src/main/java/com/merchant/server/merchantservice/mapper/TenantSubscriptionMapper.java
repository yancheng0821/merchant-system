package com.merchant.server.merchantservice.mapper;

import com.merchant.server.merchantservice.entity.TenantSubscription;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface TenantSubscriptionMapper {

    /**
     * 根据ID查询订阅
     */
    TenantSubscription findById(@Param("id") Long id);

    /**
     * 根据租户ID查询活跃订阅
     */
    TenantSubscription findActiveByTenantId(@Param("tenantId") Long tenantId);

    /**
     * 根据租户ID查询所有订阅
     */
    List<TenantSubscription> findByTenantId(@Param("tenantId") Long tenantId);

    /**
     * 创建订阅
     */
    int insert(TenantSubscription subscription);

    /**
     * 更新订阅
     */
    int update(TenantSubscription subscription);

    /**
     * 删除订阅
     */
    int delete(@Param("id") Long id);

    /**
     * 查询所有试用期订阅
     */
    List<TenantSubscription> findAllTrialSubscriptions();

    /**
     * 查询所有活跃订阅
     */
    List<TenantSubscription> findAllActiveSubscriptions();

    /**
     * 查询所有待生效的计划变更（用于定时任务）
     */
    List<TenantSubscription> findAllPendingPlanChanges();
}
