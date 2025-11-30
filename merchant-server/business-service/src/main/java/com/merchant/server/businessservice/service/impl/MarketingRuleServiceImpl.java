package com.merchant.server.businessservice.service.impl;

import com.merchant.server.businessservice.client.MerchantServiceClient;
import com.merchant.server.businessservice.entity.Customer;
import com.merchant.server.businessservice.entity.MarketingRule;
import com.merchant.server.businessservice.entity.MarketingSendLog;
import com.merchant.server.businessservice.mapper.MarketingRuleMapper;
import com.merchant.server.businessservice.mapper.CustomerMapper;
import com.merchant.server.businessservice.mapper.MarketingSendLogMapper;
import com.merchant.server.businessservice.service.MarketingRuleService;
import com.merchant.server.businessservice.service.NotificationMQService;
import com.merchant.server.common.dto.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 营销规则服务实现类
 */
@Slf4j
@Service
public class MarketingRuleServiceImpl implements MarketingRuleService {

    @Autowired
    private MarketingRuleMapper marketingRuleMapper;

    @Autowired
    private CustomerMapper customerMapper;

    @Autowired
    private MarketingSendLogMapper marketingSendLogMapper;

    @Autowired
    private NotificationMQService notificationMQService;

    @Autowired
    private MerchantServiceClient merchantServiceClient;

    @Override
    public MarketingRule getById(Long id) {
        log.debug("Getting marketing rule by id: {}", id);
        return marketingRuleMapper.selectById(id);
    }

    @Override
    public List<MarketingRule> getByTenantId(Long tenantId) {
        log.debug("Getting marketing rules for tenant: {}", tenantId);
        List<MarketingRule> rules = marketingRuleMapper.selectByTenantId(tenantId);
        // 为每条规则计算匹配客户数
        for (MarketingRule rule : rules) {
            rule.setMatchedCustomerCount(getMatchedCustomerCount(tenantId, rule));
        }
        return rules;
    }

    @Override
    public List<MarketingRule> getEnabledByTenantId(Long tenantId) {
        log.debug("Getting enabled marketing rules for tenant: {}", tenantId);
        return marketingRuleMapper.selectEnabledByTenantId(tenantId);
    }

    @Override
    @Transactional
    public MarketingRule create(MarketingRule marketingRule) {
        log.info("Creating marketing rule: {}", marketingRule.getName());

        // 设置默认值
        if (marketingRule.getEnabled() == null) {
            marketingRule.setEnabled(true);
        }
        if (marketingRule.getCooldownDays() == null) {
            marketingRule.setCooldownDays(30);
        }
        if (marketingRule.getTotalSentCount() == null) {
            marketingRule.setTotalSentCount(0);
        }

        marketingRuleMapper.insert(marketingRule);
        log.info("Marketing rule created successfully with id: {}", marketingRule.getId());

        return marketingRule;
    }

    @Override
    @Transactional
    public MarketingRule update(MarketingRule marketingRule) {
        log.info("Updating marketing rule: {}", marketingRule.getId());

        // 验证规则是否存在
        MarketingRule existing = marketingRuleMapper.selectById(marketingRule.getId());
        if (existing == null) {
            throw new IllegalArgumentException("营销规则不存在: " + marketingRule.getId());
        }

        marketingRuleMapper.update(marketingRule);
        log.info("Marketing rule updated successfully");

        return marketingRuleMapper.selectById(marketingRule.getId());
    }

    @Override
    @Transactional
    public void delete(Long id) {
        log.info("Deleting marketing rule: {}", id);
        marketingRuleMapper.deleteById(id);
        log.info("Marketing rule deleted successfully");
    }

    @Override
    @Transactional
    public void updateEnabled(Long id, Boolean enabled) {
        log.info("Updating marketing rule {} enabled status to: {}", id, enabled);
        marketingRuleMapper.updateEnabled(id, enabled);
    }

    @Override
    public Integer getMatchedCustomerCount(Long tenantId, MarketingRule rule) {
        // 根据触发条件计算匹配的客户数量
        try {
            Integer days = rule.getTriggerDays();
            if (days == null || days <= 0) {
                return 0;
            }

            // 简单实现：统计超过指定天数未到店的客户数
            // 实际实现需要根据 trigger_type 执行不同的查询
            return customerMapper.countInactiveCustomers(tenantId, days);
        } catch (Exception e) {
            log.warn("Failed to get matched customer count for rule {}: {}", rule.getId(), e.getMessage());
            return 0;
        }
    }

    @Override
    public List<com.merchant.server.businessservice.dto.MatchedCustomerDTO> getMatchedCustomers(Long ruleId) {
        log.debug("Getting matched customers for rule: {}", ruleId);

        MarketingRule rule = marketingRuleMapper.selectById(ruleId);
        if (rule == null) {
            throw new IllegalArgumentException("营销规则不存在: " + ruleId);
        }

        Integer days = rule.getTriggerDays();
        if (days == null || days <= 0) {
            return new ArrayList<>();
        }

        List<Customer> customers = customerMapper.selectInactiveCustomers(rule.getTenantId(), days);
        if (customers.isEmpty()) {
            return new ArrayList<>();
        }

        // 获取这些客户的发送记录
        List<Long> customerIds = customers.stream()
                .map(Customer::getId)
                .collect(Collectors.toList());
        List<MarketingSendLogMapper.CustomerLastSentInfo> lastSentInfos =
                marketingSendLogMapper.selectLastSentTimeByCustomerIds(rule.getTenantId(), ruleId, customerIds);

        // 构建客户ID到最后发送时间的映射
        Map<Long, LocalDateTime> lastSentMap = lastSentInfos.stream()
                .collect(Collectors.toMap(
                        MarketingSendLogMapper.CustomerLastSentInfo::getCustomerId,
                        MarketingSendLogMapper.CustomerLastSentInfo::getLastSentAt
                ));

        // 转换为DTO
        return customers.stream().map(customer -> {
            com.merchant.server.businessservice.dto.MatchedCustomerDTO dto = new com.merchant.server.businessservice.dto.MatchedCustomerDTO();
            dto.setId(customer.getId());
            dto.setFirstName(customer.getFirstName());
            dto.setLastName(customer.getLastName());
            dto.setEmail(customer.getEmail());
            dto.setPhone(customer.getPhone());

            LocalDateTime lastSent = lastSentMap.get(customer.getId());
            dto.setSent(lastSent != null);
            dto.setLastSentAt(lastSent);

            return dto;
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public Integer sendNow(Long ruleId) {
        log.info("Sending marketing rule immediately: {}", ruleId);

        // 获取规则
        MarketingRule rule = marketingRuleMapper.selectById(ruleId);
        if (rule == null) {
            throw new IllegalArgumentException("营销规则不存在: " + ruleId);
        }

        // 检查规则是否已启用
        if (rule.getEnabled() == null || !rule.getEnabled()) {
            throw new IllegalArgumentException("营销规则已禁用，无法发送: " + ruleId);
        }

        // 获取商户名称
        String businessName = getMerchantName(rule.getTenantId());

        // 获取匹配的客户列表
        List<Customer> customers = customerMapper.selectInactiveCustomers(rule.getTenantId(), rule.getTriggerDays());
        log.info("Found {} customers matching rule {}", customers.size(), ruleId);

        if (customers.isEmpty()) {
            log.info("No customers to send for rule {}", ruleId);
            return 0;
        }

        // 批量查询客户的最后发送时间（检查冷却期）
        List<Long> customerIds = customers.stream()
                .map(Customer::getId)
                .collect(Collectors.toList());
        List<MarketingSendLogMapper.CustomerLastSentInfo> lastSentInfos =
                marketingSendLogMapper.selectLastSentTimeByCustomerIds(rule.getTenantId(), ruleId, customerIds);

        // 构建客户ID到最后发送时间的映射
        Map<Long, LocalDateTime> lastSentMap = lastSentInfos.stream()
                .collect(Collectors.toMap(
                        MarketingSendLogMapper.CustomerLastSentInfo::getCustomerId,
                        MarketingSendLogMapper.CustomerLastSentInfo::getLastSentAt
                ));

        // 计算冷却期截止时间
        int cooldownDays = rule.getCooldownDays() != null ? rule.getCooldownDays() : 30;
        LocalDateTime cooldownCutoff = LocalDateTime.now(ZoneOffset.UTC).minusDays(cooldownDays);

        // 过滤掉仍在冷却期的客户
        List<Customer> eligibleCustomers = customers.stream()
                .filter(customer -> {
                    LocalDateTime lastSent = lastSentMap.get(customer.getId());
                    if (lastSent == null) {
                        return true; // 从未发送过，可以发送
                    }
                    return lastSent.isBefore(cooldownCutoff); // 超过冷却期，可以发送
                })
                .collect(Collectors.toList());

        int skippedCount = customers.size() - eligibleCustomers.size();
        if (skippedCount > 0) {
            log.info("Skipped {} customers due to cooldown period ({} days)", skippedCount, cooldownDays);
        }

        if (eligibleCustomers.isEmpty()) {
            log.info("All customers are in cooldown period for rule {}", ruleId);
            marketingRuleMapper.updateLastRunAt(ruleId);
            return 0;
        }

        int sentCount = 0;
        List<MarketingSendLog> sendLogs = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);

        // 遍历客户发送通知
        for (Customer customer : eligibleCustomers) {
            String customerName = buildCustomerName(customer);
            String subject = replaceVariables(rule.getCustomSubject(), customer, businessName);
            String content = replaceVariables(rule.getCustomContent(), customer, businessName);
            String notificationType = rule.getNotificationType() != null ? rule.getNotificationType().name() : "EMAIL";

            // 创建发送记录
            MarketingSendLog sendLog = MarketingSendLog.builder()
                    .tenantId(rule.getTenantId())
                    .ruleId(ruleId)
                    .ruleName(rule.getName())
                    .customerId(customer.getId())
                    .customerName(customerName)
                    .customerEmail(customer.getEmail())
                    .customerPhone(customer.getPhone())
                    .notificationType(MarketingSendLog.NotificationType.valueOf(
                            "BOTH".equals(notificationType) ? "EMAIL" : notificationType))
                    .subject(subject)
                    .content(content)
                    .status(MarketingSendLog.Status.PENDING)
                    .sentAt(now)
                    .build();

            try {
                // 发送通知到 MQ
                notificationMQService.sendMarketingNotification(
                        rule.getTenantId(),
                        rule.getId(),
                        customer.getId(),
                        customer.getEmail(),
                        customer.getPhone(),
                        customerName,
                        subject,
                        content,
                        notificationType,
                        businessName
                );

                sendLog.setStatus(MarketingSendLog.Status.SENT);
                sentCount++;
                log.debug("Sent marketing notification to customer: {}", customer.getId());
            } catch (Exception e) {
                log.error("Failed to send marketing notification to customer {}: {}", customer.getId(), e.getMessage());
                sendLog.setStatus(MarketingSendLog.Status.FAILED);
                sendLog.setErrorMessage(e.getMessage());
            }

            sendLogs.add(sendLog);
        }

        // 批量保存发送记录
        if (!sendLogs.isEmpty()) {
            marketingSendLogMapper.batchInsert(sendLogs);
            log.info("Saved {} send log records", sendLogs.size());
        }

        // 更新最后运行时间和发送计数
        marketingRuleMapper.updateLastRunAt(ruleId);
        marketingRuleMapper.incrementSentCount(ruleId, sentCount);

        log.info("Marketing rule {} sent to {} customers (skipped {} in cooldown)", ruleId, sentCount, skippedCount);
        return sentCount;
    }

    /**
     * 获取商户名称
     */
    private String getMerchantName(Long tenantId) {
        try {
            ApiResponse<Map<String, Object>> response = merchantServiceClient.getMerchantByTenantId(tenantId);
            if (response != null && response.getData() != null) {
                Object name = response.getData().get("merchantName");
                if (name != null) {
                    return name.toString();
                }
            }
        } catch (Exception e) {
            log.warn("Failed to get merchant name for tenant {}: {}", tenantId, e.getMessage());
        }
        return "商户";
    }

    /**
     * 构建客户名称
     */
    private String buildCustomerName(Customer customer) {
        String firstName = customer.getFirstName() != null ? customer.getFirstName() : "";
        String lastName = customer.getLastName() != null ? customer.getLastName() : "";
        String fullName = (firstName + " " + lastName).trim();
        return fullName.isEmpty() ? "客户" : fullName;
    }

    /**
     * 替换模板变量
     */
    private String replaceVariables(String template, Customer customer, String businessName) {
        if (template == null) {
            return "";
        }

        String result = template;
        result = result.replace("{{customerName}}", buildCustomerName(customer));
        result = result.replace("{{merchantName}}", businessName != null ? businessName : "");
        result = result.replace("{{merchantPhone}}", ""); // 可以从商户信息获取

        return result;
    }
}
