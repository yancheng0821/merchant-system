package com.merchant.server.businessservice.task;

import com.merchant.server.businessservice.client.MerchantServiceClient;
import com.merchant.server.businessservice.entity.MarketingRule;
import com.merchant.server.businessservice.mapper.MarketingRuleMapper;
import com.merchant.server.businessservice.service.MarketingRuleService;
import com.merchant.server.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 营销规则定时执行任务
 * 根据商户时区检查并执行自动营销规则
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MarketingScheduleTask {

    private final MarketingRuleMapper marketingRuleMapper;
    private final MarketingRuleService marketingRuleService;
    private final MerchantServiceClient merchantServiceClient;

    // 缓存商户时区，避免频繁调用
    private final Map<Long, String> tenantTimezoneCache = new HashMap<>();
    private LocalDateTime lastCacheClearTime = LocalDateTime.now();

    /**
     * 每分钟检查一次需要执行的营销规则（测试用）
     * TODO: 测试完成后改回每小时执行 @Scheduled(cron = "0 0 * * * ?")
     */
    @Scheduled(cron = "0 * * * * ?")
    public void checkAndExecuteMarketingRules() {
        log.info("=== Starting marketing schedule check ===");

        try {
            // 每小时清理一次缓存
            if (Duration.between(lastCacheClearTime, LocalDateTime.now()).toHours() >= 1) {
                tenantTimezoneCache.clear();
                lastCacheClearTime = LocalDateTime.now();
            }

            // 获取所有启用的自动执行规则（非手动）
            List<MarketingRule> allRules = marketingRuleMapper.selectAllEnabledAutoRules();

            if (allRules.isEmpty()) {
                log.debug("No auto marketing rules to execute");
                return;
            }

            // 按租户分组
            Map<Long, List<MarketingRule>> rulesByTenant = allRules.stream()
                    .collect(Collectors.groupingBy(MarketingRule::getTenantId));

            for (Map.Entry<Long, List<MarketingRule>> entry : rulesByTenant.entrySet()) {
                Long tenantId = entry.getKey();
                List<MarketingRule> tenantRules = entry.getValue();

                try {
                    processRulesForTenant(tenantId, tenantRules);
                } catch (Exception e) {
                    log.error("Failed to process marketing rules for tenant {}: {}", tenantId, e.getMessage());
                }
            }

        } catch (Exception e) {
            log.error("Marketing schedule task failed", e);
        }
    }

    /**
     * 处理单个租户的规则
     */
    private void processRulesForTenant(Long tenantId, List<MarketingRule> rules) {
        // 获取商户时区
        String timezone = getMerchantTimezone(tenantId);
        ZoneId zoneId;
        try {
            zoneId = ZoneId.of(timezone);
        } catch (Exception e) {
            log.warn("Invalid timezone '{}' for tenant {}, using UTC", timezone, tenantId);
            zoneId = ZoneId.of("UTC");
        }

        // 获取商户当前时间
        ZonedDateTime merchantNow = ZonedDateTime.now(zoneId);
        LocalTime currentTime = merchantNow.toLocalTime();
        int currentDayOfWeek = merchantNow.getDayOfWeek().getValue(); // 1=Monday, 7=Sunday
        int currentHour = currentTime.getHour();

        log.debug("Tenant {} timezone: {}, current hour: {}, day of week: {}",
                tenantId, timezone, currentHour, currentDayOfWeek);

        for (MarketingRule rule : rules) {
            try {
                if (shouldExecuteRule(rule, currentHour, currentDayOfWeek)) {
                    log.info("Executing marketing rule {} for tenant {}", rule.getId(), tenantId);

                    // TODO: 测试完成后恢复此检查
                    // 检查是否今天已经执行过（防止重复执行）
                    // if (hasExecutedToday(rule, merchantNow.toLocalDate())) {
                    //     log.debug("Rule {} already executed today, skipping", rule.getId());
                    //     continue;
                    // }

                    int sentCount = marketingRuleService.sendNow(rule.getId());
                    log.info("Marketing rule {} executed, sent to {} customers", rule.getId(), sentCount);
                }
            } catch (Exception e) {
                log.error("Failed to execute marketing rule {}: {}", rule.getId(), e.getMessage());
            }
        }
    }

    /**
     * 判断规则是否应该执行
     * TODO: 测试完成后改回只比较小时
     */
    private boolean shouldExecuteRule(MarketingRule rule, int currentHour, int currentDayOfWeek) {
        if (rule.getScheduleTime() == null) {
            return false;
        }

        // 测试模式：只要是自动执行规则就执行
        // 正式模式应该比较小时：
        // LocalTime scheduleTime = rule.getScheduleTime();
        // int scheduleHour = scheduleTime.getHour();
        // if (currentHour != scheduleHour) { return false; }

        MarketingRule.ScheduleType scheduleType = rule.getScheduleType();

        if (scheduleType == MarketingRule.ScheduleType.DAILY) {
            // 每日执行
            return true;
        } else if (scheduleType == MarketingRule.ScheduleType.WEEKLY) {
            // 每周执行，检查星期几
            Integer ruleDayOfWeek = rule.getScheduleDayOfWeek();
            return ruleDayOfWeek != null && ruleDayOfWeek == currentDayOfWeek;
        }

        return false;
    }

    /**
     * 检查规则今天是否已经执行过
     */
    private boolean hasExecutedToday(MarketingRule rule, LocalDate merchantToday) {
        if (rule.getLastRunAt() == null) {
            return false;
        }

        // lastRunAt 是 UTC 时间，需要转换比较
        LocalDate lastRunDate = rule.getLastRunAt().toLocalDate();
        // 简单比较：如果 lastRunAt 的日期与今天相同（考虑到可能的时区差异，这里做简化处理）
        // 更精确的做法是将 lastRunAt 转换到商户时区再比较
        return lastRunDate.equals(merchantToday) || lastRunDate.equals(merchantToday.minusDays(1));
    }

    /**
     * 获取商户时区
     */
    private String getMerchantTimezone(Long tenantId) {
        // 先从缓存获取
        if (tenantTimezoneCache.containsKey(tenantId)) {
            return tenantTimezoneCache.get(tenantId);
        }

        String timezone = "UTC"; // 默认时区
        try {
            ApiResponse<Map<String, Object>> response = merchantServiceClient.getMerchantByTenantId(tenantId);
            if (response != null && response.getData() != null) {
                Object tz = response.getData().get("timezone");
                if (tz != null && !tz.toString().isEmpty()) {
                    timezone = tz.toString();
                }
            }
        } catch (Exception e) {
            log.warn("Failed to get timezone for tenant {}: {}", tenantId, e.getMessage());
        }

        tenantTimezoneCache.put(tenantId, timezone);
        return timezone;
    }
}
