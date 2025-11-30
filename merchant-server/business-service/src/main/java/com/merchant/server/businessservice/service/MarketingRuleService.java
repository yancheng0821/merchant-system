package com.merchant.server.businessservice.service;

import com.merchant.server.businessservice.entity.MarketingRule;

import java.util.List;

/**
 * 营销规则服务接口
 */
public interface MarketingRuleService {

    /**
     * 根据ID查询营销规则
     */
    MarketingRule getById(Long id);

    /**
     * 根据租户ID查询所有营销规则
     */
    List<MarketingRule> getByTenantId(Long tenantId);

    /**
     * 根据租户ID查询启用的营销规则
     */
    List<MarketingRule> getEnabledByTenantId(Long tenantId);

    /**
     * 创建营销规则
     */
    MarketingRule create(MarketingRule marketingRule);

    /**
     * 更新营销规则
     */
    MarketingRule update(MarketingRule marketingRule);

    /**
     * 删除营销规则
     */
    void delete(Long id);

    /**
     * 更新规则启用状态
     */
    void updateEnabled(Long id, Boolean enabled);

    /**
     * 获取规则匹配的客户数量
     */
    Integer getMatchedCustomerCount(Long tenantId, MarketingRule rule);

    /**
     * 获取规则匹配的客户列表（包含发送状态）
     */
    List<com.merchant.server.businessservice.dto.MatchedCustomerDTO> getMatchedCustomers(Long ruleId);

    /**
     * 立即执行规则发送
     * @return 发送的客户数量
     */
    Integer sendNow(Long ruleId);
}
