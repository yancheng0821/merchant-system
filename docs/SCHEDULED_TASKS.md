# 后端系统定时任务汇总

## 1. 业务服务 (business-service)

### 1.1 预约提醒通知
- **类**: `BusinessNotificationService`
- **方法**: `checkUpcomingAppointments()`
- **执行频率**: 每5分钟 (`@Scheduled(fixedDelay = 300000)`)
- **功能**: 检查30分钟后即将开始的预约并生成提醒通知
- **业务逻辑**:
  - 查询所有30分钟后开始的预约
  - 检查是否已发送过提醒（1小时内不重复发送）
  - 创建预约提醒通知

### 1.2 预约状态管理
- **类**: `AppointmentScheduleServiceImpl`

#### 1.2.1 标记过期预约
- **方法**: `markOverdueAppointmentsAsNoShow()`
- **执行频率**: 每1小时 (`@Scheduled(fixedRate = 3600000)`)
- **功能**: 检查过期的预约并标记为"未到店"(NO_SHOW)
- **业务逻辑**:
  - 查询所有已确认但过期的预约
  - 将状态更新为NO_SHOW

#### 1.2.2 发送预约提醒
- **方法**: `sendAppointmentReminders()`
- **执行频率**: 每1小时 (`@Scheduled(fixedRate = 3600000)`)
- **功能**: 发送预约提醒（提前2小时提醒）
- **业务逻辑**:
  - 查询2小时后的预约
  - 发送提醒通知

### 1.3 支付重试任务
- **类**: `PaymentRetryTask`

#### 1.3.1 重试失败交易
- **方法**: `retryFailedTransactions()`
- **执行频率**: 每1分钟 (`@Scheduled(fixedDelay = 60000)`)
- **功能**: 检查并重试失败的支付交易
- **业务逻辑**:
  - 查询状态为PENDING且创建时间超过2分钟的交易
  - 重新查询交易状态
  - 更新订单状态

#### 1.3.2 重试失败回调
- **方法**: `retryFailedCallbacks()`
- **执行频率**: 每5分钟 (`@Scheduled(fixedDelay = 300000)`)
- **功能**: 处理失败的支付回调
- **业务逻辑**:
  - 查询需要重试的回调记录
  - 重新发送回调请求

### 1.4 POS支付服务
- **类**: `POSPaymentServiceImpl`
- **线程池**: `ScheduledExecutorService` (5个线程)
- **用途**: 异步处理支付任务，支付状态轮询
- **生命周期**: 
  - `@PostConstruct`: 初始化
  - `@PreDestroy`: 关闭线程池

### 1.5 抽象POS客户端
- **类**: `AbstractPOSClient`
- **线程池**: `ScheduledExecutorService` (5个线程)
- **用途**: POS设备通信的异步任务处理

## 2. 分析服务 (analytics-service)

### 2.1 数据同步调度器
- **类**: `DataSyncScheduler`

#### 2.1.1 每日数据同步
- **方法**: `syncAllTenantsData()`
- **执行频率**: 每天凌晨2点 (`@Scheduled(cron = "0 0 2 * * ?")`)
- **功能**: 同步所有租户的业务数据到分析数据库
- **业务逻辑**:
  - 获取所有活跃租户
  - 逐个同步租户的订单、预约、客户等数据

#### 2.1.2 每小时数据同步（测试用）
- **方法**: `syncDataHourly()`
- **执行频率**: 每1小时 (`@Scheduled(fixedRate = 3600000)`)
- **功能**: 用于测试环境的频繁数据同步
- **业务逻辑**: 同上

## 3. 配置类

### 3.1 调度配置
- **business-service**: `ScheduleConfig` - 启用Spring定时任务 (`@EnableScheduling`)
- **analytics-service**: `AnalyticsServiceApplication` - 启用Spring定时任务 (`@EnableScheduling`)

## 4. 定时任务执行时间表

| 时间间隔 | 任务 | 服务 | 说明 |
|---------|------|------|------|
| 每1分钟 | 支付重试 | business-service | 重试失败的支付交易 |
| 每5分钟 | 预约提醒 | business-service | 30分钟前提醒 |
| 每5分钟 | 回调重试 | business-service | 重试失败的支付回调 |
| 每1小时 | 过期预约处理 | business-service | 标记未到店预约 |
| 每1小时 | 预约提醒发送 | business-service | 2小时前提醒 |
| 每1小时 | 数据同步(测试) | analytics-service | 同步业务数据 |
| 每天2:00 | 数据同步(生产) | analytics-service | 同步业务数据 |

## 5. 注意事项

1. **性能影响**:
   - 高频任务（1分钟）应避免执行重量级操作
   - 数据同步任务在凌晨执行，避免影响业务高峰期

2. **并发控制**:
   - 使用 `@Scheduled(fixedDelay)` 确保前一次执行完成后才开始下一次
   - 线程池大小设置为5个线程

3. **错误处理**:
   - 所有定时任务都有try-catch包裹
   - 错误日志记录但不影响下次执行

4. **多语言支持**:
   - 预约提醒通知已支持根据商户语言设置生成对应语言的通知

## 6. 优化建议

1. **统一管理**: 考虑使用分布式任务调度框架（如XXL-JOB、Elastic-Job）
2. **监控告警**: 添加任务执行监控和失败告警
3. **配置化**: 将执行频率等参数配置化，便于动态调整
4. **分布式锁**: 在集群环境下需要添加分布式锁避免重复执行
5. **任务日志**: 记录任务执行历史，便于问题排查