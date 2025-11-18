package com.merchant.server.businessservice.service;

import com.merchant.server.businessservice.entity.MembershipTier;

import java.util.List;

/**
 * 会员等级服务接口
 */
public interface MembershipTierService {

    /**
     * 根据ID查询会员等级
     */
    MembershipTier getById(Long id);

    /**
     * 根据租户ID查询所有会员等级
     */
    List<MembershipTier> getByTenantId(Long tenantId);

    /**
     * 根据租户ID查询启用的会员等级
     */
    List<MembershipTier> getActiveTiersByTenantId(Long tenantId);

    /**
     * 根据租户ID和等级代码查询会员等级
     */
    MembershipTier getByTenantIdAndCode(Long tenantId, String code);

    /**
     * 创建会员等级
     */
    MembershipTier create(MembershipTier membershipTier);

    /**
     * 更新会员等级
     */
    MembershipTier update(MembershipTier membershipTier);

    /**
     * 删除会员等级
     */
    void delete(Long id);

    /**
     * 检查等级代码是否存在
     */
    boolean existsByCode(Long tenantId, String code, Long excludeId);

    /**
     * 从模板租户（tenantId=1）复制会员等级数据到新租户
     * @param targetTenantId 目标租户ID
     */
    void copyMembershipTiersFromTemplate(Long targetTenantId);
}
