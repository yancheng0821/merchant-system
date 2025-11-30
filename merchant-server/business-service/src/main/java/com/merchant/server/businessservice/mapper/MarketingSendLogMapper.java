package com.merchant.server.businessservice.mapper;

import com.merchant.server.businessservice.entity.MarketingSendLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface MarketingSendLogMapper {

    /**
     * 插入发送记录
     */
    void insert(MarketingSendLog log);

    /**
     * 批量插入发送记录
     */
    void batchInsert(@Param("logs") List<MarketingSendLog> logs);

    /**
     * 根据ID查询
     */
    MarketingSendLog selectById(@Param("id") Long id);

    /**
     * 根据租户ID查询发送记录（分页）
     */
    List<MarketingSendLog> selectByTenantId(
        @Param("tenantId") Long tenantId,
        @Param("offset") int offset,
        @Param("limit") int limit
    );

    /**
     * 根据规则ID查询发送记录
     */
    List<MarketingSendLog> selectByRuleId(
        @Param("ruleId") Long ruleId,
        @Param("offset") int offset,
        @Param("limit") int limit
    );

    /**
     * 统计租户的发送记录数量
     */
    int countByTenantId(@Param("tenantId") Long tenantId);

    /**
     * 根据租户ID和状态查询发送记录（分页）
     */
    List<MarketingSendLog> selectByTenantIdAndStatus(
        @Param("tenantId") Long tenantId,
        @Param("status") String status,
        @Param("offset") int offset,
        @Param("limit") int limit
    );

    /**
     * 统计租户指定状态的发送记录数量
     */
    int countByTenantIdAndStatus(
        @Param("tenantId") Long tenantId,
        @Param("status") String status
    );

    /**
     * 根据租户ID、状态和关键词查询发送记录（分页）
     */
    List<MarketingSendLog> selectByTenantIdWithFilters(
        @Param("tenantId") Long tenantId,
        @Param("status") String status,
        @Param("keyword") String keyword,
        @Param("offset") int offset,
        @Param("limit") int limit
    );

    /**
     * 统计租户指定条件的发送记录数量
     */
    int countByTenantIdWithFilters(
        @Param("tenantId") Long tenantId,
        @Param("status") String status,
        @Param("keyword") String keyword
    );

    /**
     * 统计规则的发送记录数量
     */
    int countByRuleId(@Param("ruleId") Long ruleId);

    /**
     * 查询客户在指定规则下的最后发送时间
     * 用于判断冷却期
     */
    LocalDateTime selectLastSentTime(
        @Param("tenantId") Long tenantId,
        @Param("ruleId") Long ruleId,
        @Param("customerId") Long customerId
    );

    /**
     * 批量查询客户在指定规则下的最后发送时间
     * 用于批量判断冷却期，避免N+1查询
     */
    List<CustomerLastSentInfo> selectLastSentTimeByCustomerIds(
        @Param("tenantId") Long tenantId,
        @Param("ruleId") Long ruleId,
        @Param("customerIds") List<Long> customerIds
    );

    /**
     * 客户最后发送时间信息
     */
    class CustomerLastSentInfo {
        private Long customerId;
        private LocalDateTime lastSentAt;

        public Long getCustomerId() {
            return customerId;
        }

        public void setCustomerId(Long customerId) {
            this.customerId = customerId;
        }

        public LocalDateTime getLastSentAt() {
            return lastSentAt;
        }

        public void setLastSentAt(LocalDateTime lastSentAt) {
            this.lastSentAt = lastSentAt;
        }
    }

    /**
     * 更新发送状态
     */
    void updateStatus(
        @Param("id") Long id,
        @Param("status") String status,
        @Param("errorMessage") String errorMessage
    );
}
