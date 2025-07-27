package com.merchant.server.businessservice.task;

import com.merchant.server.businessservice.entity.PaymentCallback;
import com.merchant.server.businessservice.entity.POSTransaction;
import com.merchant.server.businessservice.mapper.PaymentCallbackMapper;
import com.merchant.server.businessservice.mapper.POSTransactionMapper;
import com.merchant.server.businessservice.service.POSPaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 支付重试定时任务
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentRetryTask {
    
    private final POSTransactionMapper posTransactionMapper;
    private final PaymentCallbackMapper paymentCallbackMapper;
    private final POSPaymentService posPaymentService;
    
    /**
     * 定时检查并重试失败的交易
     * 每分钟执行一次
     */
    @Scheduled(fixedDelay = 60000)
    public void retryFailedTransactions() {
        log.debug("Starting payment retry task");
        
        try {
            // 查询需要重试的交易
            List<POSTransaction> pendingTransactions = posTransactionMapper.selectPendingRetry();
            
            for (POSTransaction transaction : pendingTransactions) {
                try {
                    log.info("Retrying transaction: {}", transaction.getTransactionId());
                    
                    // 查询最新状态
                    posPaymentService.pollPaymentStatus(transaction.getTransactionId());
                    
                    // 更新重试次数和下次重试时间
                    transaction.setRetryCount(transaction.getRetryCount() + 1);
                    transaction.setNextRetryTime(calculateNextRetryTime(transaction.getRetryCount()));
                    transaction.setUpdatedAt(LocalDateTime.now());
                    posTransactionMapper.updateById(transaction);
                    
                } catch (Exception e) {
                    log.error("Failed to retry transaction: {}", transaction.getTransactionId(), e);
                }
            }
        } catch (Exception e) {
            log.error("Payment retry task failed", e);
        }
    }
    
    /**
     * 定时处理失败的回调
     * 每5分钟执行一次
     */
    @Scheduled(fixedDelay = 300000)
    public void retryFailedCallbacks() {
        log.debug("Starting callback retry task");
        
        try {
            // 查询待处理的回调
            List<PaymentCallback> pendingCallbacks = paymentCallbackMapper.selectPendingCallbacks();
            
            for (PaymentCallback callback : pendingCallbacks) {
                try {
                    log.info("Retrying callback for transaction: {}", callback.getTransactionId());
                    
                    // 重新处理回调
                    // 这里可以根据回调类型调用不同的处理逻辑
                    
                    // 更新重试次数
                    callback.setRetryCount(callback.getRetryCount() + 1);
                    callback.setNextRetryTime(calculateNextRetryTime(callback.getRetryCount()));
                    callback.setUpdatedAt(LocalDateTime.now());
                    paymentCallbackMapper.updateById(callback);
                    
                } catch (Exception e) {
                    log.error("Failed to retry callback: {}", callback.getId(), e);
                }
            }
        } catch (Exception e) {
            log.error("Callback retry task failed", e);
        }
    }
    
    /**
     * 计算下次重试时间
     * 使用指数退避算法
     */
    private LocalDateTime calculateNextRetryTime(int retryCount) {
        // 重试间隔：1分钟、5分钟、15分钟、30分钟
        int[] intervals = {1, 5, 15, 30};
        int intervalMinutes = retryCount < intervals.length ? intervals[retryCount] : 60;
        return LocalDateTime.now().plusMinutes(intervalMinutes);
    }
}