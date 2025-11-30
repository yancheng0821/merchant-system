package com.merchant.server.businessservice.mapper;

import com.merchant.server.businessservice.entity.MarketingRule;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 营销规则Mapper接口
 */
@Mapper
public interface MarketingRuleMapper {

    /**
     * 根据ID查询营销规则
     */
    MarketingRule selectById(@Param("id") Long id);

    /**
     * 根据租户ID查询所有营销规则
     */
    List<MarketingRule> selectByTenantId(@Param("tenantId") Long tenantId);

    /**
     * 根据租户ID查询启用的营销规则
     */
    List<MarketingRule> selectEnabledByTenantId(@Param("tenantId") Long tenantId);

    /**
     * 插入营销规则
     */
    int insert(MarketingRule marketingRule);

    /**
     * 更新营销规则
     */
    int update(MarketingRule marketingRule);

    /**
     * 删除营销规则
     */
    int deleteById(@Param("id") Long id);

    /**
     * 更新规则启用状态
     */
    int updateEnabled(@Param("id") Long id, @Param("enabled") Boolean enabled);

    /**
     * 更新规则执行统计
     */
    int updateStats(@Param("id") Long id, @Param("sentCount") Integer sentCount);

    /**
     * 更新最后运行时间
     */
    int updateLastRunAt(@Param("id") Long id);

    /**
     * 增加发送计数
     */
    int incrementSentCount(@Param("id") Long id, @Param("count") Integer count);

    /**
     * 获取所有启用的自动执行规则（非手动触发）
     */
    List<MarketingRule> selectAllEnabledAutoRules();
}
