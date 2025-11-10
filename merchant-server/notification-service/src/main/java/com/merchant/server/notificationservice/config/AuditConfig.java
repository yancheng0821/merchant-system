package com.merchant.server.notificationservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * 审计配置类
 * 提供审计所需的Bean配置
 */
@Configuration
public class AuditConfig {

    /**
     * 创建一个只读事务模板，用于审计时读取旧值
     * 使用REQUIRES_NEW传播级别，确保在独立事务中读取，不受当前事务影响
     */
    @Bean
    public TransactionTemplate readOnlyTransactionTemplate(PlatformTransactionManager transactionManager) {
        TransactionTemplate template = new TransactionTemplate(transactionManager);
        template.setReadOnly(true);
        template.setPropagationBehavior(org.springframework.transaction.TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        return template;
    }
}
