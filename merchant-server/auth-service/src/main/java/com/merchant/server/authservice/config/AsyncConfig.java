package com.merchant.server.authservice.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

/**
 * 异步任务配置
 * 用于审计日志等异步操作
 */
@Slf4j
@Configuration
@EnableAsync
public class AsyncConfig {

    /**
     * 审计日志专用线程池
     * 配置独立的线程池，避免影响其他异步任务
     */
    @Bean(name = "auditExecutor")
    public Executor auditExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();

        // 核心线程数：根据审计日志的写入频率调整，建议2-5个
        executor.setCorePoolSize(3);

        // 最大线程数：高峰期的最大并发数
        executor.setMaxPoolSize(10);

        // 队列容量：积压的审计日志任务数
        // 如果队列满了，新任务会被拒绝策略处理
        executor.setQueueCapacity(1000);

        // 线程名称前缀，便于日志追踪
        executor.setThreadNamePrefix("audit-executor-");

        // 线程空闲时间（秒）
        executor.setKeepAliveSeconds(60);

        // 拒绝策略：队列满时的处理方式
        // CallerRunsPolicy: 由调用线程执行，保证不丢失审计日志
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());

        // 等待所有任务完成后再关闭线程池
        executor.setWaitForTasksToCompleteOnShutdown(true);

        // 等待时间（秒）
        executor.setAwaitTerminationSeconds(60);

        // 初始化线程池
        executor.initialize();

        log.info("Audit executor initialized: corePoolSize={}, maxPoolSize={}, queueCapacity={}",
                executor.getCorePoolSize(), executor.getMaxPoolSize(), executor.getQueueCapacity());

        return executor;
    }

    /**
     * 通用异步任务线程池
     * 用于其他异步操作
     */
    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(20);
        executor.setQueueCapacity(500);
        executor.setThreadNamePrefix("task-executor-");
        executor.setKeepAliveSeconds(60);
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(60);
        executor.initialize();

        log.info("Task executor initialized: corePoolSize={}, maxPoolSize={}, queueCapacity={}",
                executor.getCorePoolSize(), executor.getMaxPoolSize(), executor.getQueueCapacity());

        return executor;
    }
}
