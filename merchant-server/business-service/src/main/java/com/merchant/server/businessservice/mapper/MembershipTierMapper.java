package com.merchant.server.businessservice.mapper;

import com.merchant.server.businessservice.entity.MembershipTier;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 会员等级Mapper接口
 */
@Mapper
public interface MembershipTierMapper {

    /**
     * 根据ID查询会员等级
     */
    MembershipTier selectById(@Param("id") Long id);

    /**
     * 根据租户ID查询所有会员等级
     */
    List<MembershipTier> selectByTenantId(@Param("tenantId") Long tenantId);

    /**
     * 根据租户ID查询启用的会员等级
     */
    List<MembershipTier> selectActiveTiersByTenantId(@Param("tenantId") Long tenantId);

    /**
     * 根据租户ID和等级代码查询会员等级
     */
    MembershipTier selectByTenantIdAndCode(@Param("tenantId") Long tenantId, @Param("code") String code);

    /**
     * 插入会员等级
     */
    int insert(MembershipTier membershipTier);

    /**
     * 更新会员等级
     */
    int update(MembershipTier membershipTier);

    /**
     * 删除会员等级
     */
    int deleteById(@Param("id") Long id);

    /**
     * 检查等级代码是否存在（用于唯一性验证）
     */
    boolean existsByTenantIdAndCode(@Param("tenantId") Long tenantId, @Param("code") String code, @Param("excludeId") Long excludeId);
}
