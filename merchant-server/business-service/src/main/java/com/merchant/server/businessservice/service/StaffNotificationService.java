package com.merchant.server.businessservice.service;

import com.merchant.server.businessservice.client.MerchantServiceClient;
import com.merchant.server.businessservice.client.NotificationClient;
import com.merchant.server.businessservice.entity.*;
import com.merchant.server.businessservice.mapper.*;
import com.merchant.server.common.dto.ApiResponse;
import com.merchant.server.common.dto.NotificationMessage;
import com.merchant.server.common.dto.NotificationRequest;
import com.merchant.server.common.mq.NotificationMessageProducer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * 员工通知服务
 * 负责发送员工相关的邮件通知
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class StaffNotificationService {

    private final NotificationClient notificationClient;
    private final NotificationMessageProducer messageProducer;
    private final AppointmentMapper appointmentMapper;
    private final ResourceMapper resourceMapper;
    private final CustomerMapper customerMapper;
    private final OrderMapper orderMapper;
    private final MerchantServiceClient merchantServiceClient;
    private final StaffAttendanceMapper staffAttendanceMapper;

    @Value("${notification.use-mq:true}")
    private boolean useMQ;

    // 缓存商户时区信息，key: tenantId, value: timezone
    private final Map<Long, String> merchantTimezoneCache = new ConcurrentHashMap<>();
    // 记录已处理的日期，避免重复发送，key: "tenantId:date", value: 处理时间戳
    private final Map<String, Long> processedDates = new ConcurrentHashMap<>();

    /**
     * 获取商户时区（带缓存）
     */
    private String getMerchantTimezone(Long tenantId) {
        return merchantTimezoneCache.computeIfAbsent(tenantId, id -> {
            try {
                ApiResponse<Map<String, Object>> response = merchantServiceClient.getMerchantByTenantId(id);
                if (response != null && response.isSuccess() && response.getData() != null) {
                    String timezone = (String) response.getData().get("timezone");
                    if (timezone != null && !timezone.isEmpty()) {
                        log.debug("Retrieved timezone for tenant {}: {}", id, timezone);
                        return timezone;
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to get timezone for tenant {}: {}", id, e.getMessage());
            }
            // 默认使用温哥华时区
            log.debug("Using default timezone for tenant {}: America/Vancouver", id);
            return "America/Vancouver";
        });
    }

    /**
     * 发送员工预约完成通知（异步）
     * 在预约支付完成后调用
     * @param appointment 预约信息
     * @param order 订单信息（直接传入，避免事务未提交时查询不到）
     */
    @Async
    public void sendAppointmentCompletionNotification(Appointment appointment, Order order) {
        log.info("Sending staff completion notification for appointment: {}, order: {}",
            appointment.getId(), order != null ? order.getId() : "null");

        try {
            // 1. 获取员工信息（从 appointment_resources）
            if (appointment.getAppointmentResources() == null ||
                appointment.getAppointmentResources().isEmpty()) {
                log.warn("No resources found for appointment: {}", appointment.getId());
                return;
            }

            // 2. 获取客户信息
            Customer customer = customerMapper.selectById(appointment.getCustomerId());
            if (customer == null) {
                log.warn("Customer not found for appointment: {}", appointment.getId());
                return;
            }

            // 3. 订单信息已通过参数传入，不再从数据库查询

            // 4. 获取服务信息
            List<com.merchant.server.businessservice.entity.AppointmentService> services =
                appointment.getAppointmentServices();

            // 5. 为每个员工发送通知
            for (AppointmentResource appointmentResource : appointment.getAppointmentResources()) {
                Long resourceId = appointmentResource.getResourceId();
                Resource staff = resourceMapper.findById(resourceId);

                if (staff != null && staff.getEmail() != null && !staff.getEmail().isEmpty()) {
                    sendEmailToStaff(appointment, staff, customer, services, order);
                } else {
                    log.warn("Staff {} has no email, skipping notification", resourceId);
                }
            }

            log.info("Staff notifications sent successfully for appointment: {}", appointment.getId());
        } catch (Exception e) {
            log.error("Failed to send staff notifications for appointment {}: {}",
                appointment.getId(), e.getMessage(), e);
        }
    }

    /**
     * 发送邮件给单个员工
     */
    private void sendEmailToStaff(
        Appointment appointment,
        Resource staff,
        Customer customer,
        List<com.merchant.server.businessservice.entity.AppointmentService> services,
        Order order
    ) {
        try {
            // 获取商户名称
            String businessName = "Unknown Merchant";
            try {
                ApiResponse<Map<String, Object>> merchantResponse = merchantServiceClient.getMerchantByTenantId(staff.getTenantId());
                if (merchantResponse != null && merchantResponse.isSuccess() && merchantResponse.getData() != null) {
                    Object nameObj = merchantResponse.getData().get("merchantName");
                    if (nameObj != null) {
                        businessName = nameObj.toString();
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to get merchant name for tenant {}: {}", staff.getTenantId(), e.getMessage());
            }

            // 构建邮件数据
            Map<String, Object> variables = new HashMap<>();
            variables.put("staffName", staff.getName());
            variables.put("businessName", businessName);
            variables.put("customerName", customer.getLastName() + customer.getFirstName());
            variables.put("appointmentDate", appointment.getAppointmentDate().toString());
            variables.put("appointmentTime", appointment.getAppointmentTime().toString());

            // 服务名称
            String serviceName = services != null && !services.isEmpty() ?
                services.stream()
                    .map(com.merchant.server.businessservice.entity.AppointmentService::getServiceName)
                    .filter(name -> name != null)
                    .collect(Collectors.joining(", ")) : "N/A";
            variables.put("serviceName", serviceName);

            // Payment Summary - 只显示小费、小费支付方式和订单号
            if (order != null) {
                variables.put("tipAmount", String.format("%.2f", order.getTipAmount()));

                // 获取小费支付方式，并转换为大写以便更好地显示
                String tipPayMethod = order.getTipPaymentMethod();
                if (tipPayMethod != null && !tipPayMethod.isEmpty()) {
                    // 转换为大写并替换下划线为空格，例如：debit_card -> DEBIT CARD
                    tipPayMethod = tipPayMethod.toUpperCase().replace("_", " ");
                } else {
                    tipPayMethod = "N/A";
                }
                variables.put("tipPaymentMethod", tipPayMethod);

                variables.put("orderNumber", order.getOrderNumber() != null ?
                    order.getOrderNumber() : "N/A");

                log.info("Staff notification payment info - Order: {}, Tip: {}, TipMethod: {}",
                    order.getOrderNumber(), order.getTipAmount(), tipPayMethod);
            } else {
                variables.put("tipAmount", "0.00");
                variables.put("tipPaymentMethod", "N/A");
                variables.put("orderNumber", "N/A");
            }

            variables.put("duration", appointment.getDuration() != null ?
                appointment.getDuration().toString() : "N/A");
            variables.put("notes", appointment.getNotes() != null ?
                appointment.getNotes() : "无");

            if (useMQ) {
                // 使用MQ发送
                sendEmailViaMQ(staff, appointment.getTenantId(), appointment.getId(), variables);
            } else {
                // 降级到HTTP调用
                sendEmailViaHTTP(staff, appointment.getTenantId(), variables);
            }

            log.info("Email sent to staff {} ({}) for appointment {}",
                staff.getId(), staff.getEmail(), appointment.getId());
        } catch (Exception e) {
            log.error("Failed to send email to staff {}: {}",
                staff.getId(), e.getMessage());
        }
    }

    /**
     * 通过MQ发送邮件
     */
    private void sendEmailViaMQ(Resource staff, Long tenantId, Long appointmentId, Map<String, Object> variables) {
        // 构建接收者信息
        NotificationRequest.RecipientInfo recipient = NotificationRequest.RecipientInfo.builder()
            .email(staff.getEmail())
            .name(staff.getName())
            .build();

        // 构建NotificationRequest
        // 员工结账邮件使用商户名称作为发件人显示名称
        String fromName = variables.get("businessName") != null ? variables.get("businessName").toString() : null;
        NotificationRequest request = NotificationRequest.builder()
            .scene("appointment.checkout.staff")
            .tenantId(tenantId)
            .recipient(recipient)
            .channel("EMAIL")
            .variables(variables)
            .businessId(String.valueOf(appointmentId))
            .fromName(fromName)
            .build();

        // 转换为payload
        Map<String, Object> payload = new HashMap<>();
        payload.put("scene", request.getScene());
        payload.put("tenantId", request.getTenantId());
        payload.put("recipient", Map.of(
            "email", recipient.getEmail(),
            "name", recipient.getName()
        ));
        payload.put("channel", request.getChannel());
        payload.put("variables", variables);
        payload.put("businessId", String.valueOf(appointmentId));
        payload.put("fromName", fromName);

        // 构建NotificationMessage
        NotificationMessage message = NotificationMessage.builder()
            .messageType(NotificationMessage.MessageType.EMAIL)
            .tenantId(tenantId)
            .priority(NotificationMessage.Priority.NORMAL)
            .payload(payload)
            .build();

        // 发送到MQ
        messageProducer.sendAppointmentCheckoutStaff(message);
        log.info("Staff notification sent to MQ for email: {}", staff.getEmail());
    }

    /**
     * 通过HTTP发送邮件（降级方案）
     */
    private void sendEmailViaHTTP(Resource staff, Long tenantId, Map<String, Object> variables) {
        Map<String, Object> emailRequest = new HashMap<>();
        emailRequest.put("to", staff.getEmail());
        emailRequest.put("templateCode", "STAFF_APPOINTMENT_COMPLETED");
        emailRequest.put("variables", variables);
        emailRequest.put("tenantId", tenantId);
        notificationClient.sendTemplatedEmail(emailRequest);
        log.info("Staff notification sent via HTTP for email: {}", staff.getEmail());
    }

    /**
     * 每日汇总通知（定时任务）
     * 每小时执行一次，检查哪些商户处于其本地时区的4:00-5:00之间
     * 为这些商户发送前一天的工作汇总
     */
    @Scheduled(cron = "0 0 * * * ?")  // 每小时整点执行
    public void sendDailySummaryEmails() {
        log.info("Starting hourly check for daily staff summary emails");

        try {
            // 获取当前UTC时间
            ZonedDateTime nowUtc = ZonedDateTime.now(ZoneOffset.UTC);

            // 查询所有有预约的租户
            List<Long> tenantIds = appointmentMapper.findAllTenantIdsWithAppointments();
            log.debug("Found {} tenants with appointments", tenantIds.size());

            int processedTenants = 0;

            for (Long tenantId : tenantIds) {
                try {
                    // 获取商户时区
                    String merchantTimezone = getMerchantTimezone(tenantId);
                    ZoneId zoneId = ZoneId.of(merchantTimezone);

                    // 计算商户本地时间
                    ZonedDateTime merchantNow = nowUtc.withZoneSameInstant(zoneId);
                    int hour = merchantNow.getHour();

                    log.debug("Tenant {}: timezone={}, local time={}, hour={}",
                        tenantId, merchantTimezone, merchantNow, hour);

                    // 如果商户本地时间在4:00-5:00之间，发送前一天的汇总
                    if (hour == 4) {
                        LocalDate yesterday = merchantNow.toLocalDate().minusDays(1);
                        String cacheKey = tenantId + ":" + yesterday.toString();

                        // 检查是否已经处理过（24小时内）
                        Long lastProcessed = processedDates.get(cacheKey);
                        long now = System.currentTimeMillis();
                        if (lastProcessed != null && (now - lastProcessed) < 24 * 60 * 60 * 1000) {
                            log.debug("Already processed daily summary for tenant {} on {}, skipping",
                                tenantId, yesterday);
                            continue;
                        }

                        log.info("Sending daily summary for tenant {} (timezone: {}, local date: {})",
                            tenantId, merchantTimezone, yesterday);

                        sendDailySummaryForTenantAndDate(tenantId, yesterday);

                        // 标记为已处理
                        processedDates.put(cacheKey, now);
                        processedTenants++;

                        // 清理超过7天的缓存记录
                        cleanupOldProcessedDates();
                    }
                } catch (Exception e) {
                    log.error("Error processing daily summary for tenant {}: {}",
                        tenantId, e.getMessage(), e);
                }
            }

            if (processedTenants > 0) {
                log.info("Sent daily summaries for {} tenants", processedTenants);
            }

        } catch (Exception e) {
            log.error("Error in daily summary email task", e);
        }
    }

    /**
     * 清理超过7天的已处理记录缓存
     */
    private void cleanupOldProcessedDates() {
        long sevenDaysAgo = System.currentTimeMillis() - (7 * 24 * 60 * 60 * 1000L);
        processedDates.entrySet().removeIf(entry -> entry.getValue() < sevenDaysAgo);
    }

    /**
     * 为指定租户和日期发送每日汇总（公共方法，供测试使用）
     */
    public void sendDailySummaryForTenantAndDate(Long tenantId, LocalDate date) {
        log.info("Sending daily staff summary for tenant {} on date: {}", tenantId, date);

        try {
            // 1. 查询指定租户和日期的所有已完成预约
            List<Appointment> completedAppointments =
                appointmentMapper.findCompletedAppointmentsByTenantAndDate(tenantId, date);

            if (completedAppointments == null || completedAppointments.isEmpty()) {
                log.info("No completed appointments found for tenant {} on {}", tenantId, date);
                return;
            }

            log.info("Found {} completed appointments for tenant {} on {}",
                completedAppointments.size(), tenantId, date);

            // 2. 按员工分组
            Map<Long, List<Appointment>> appointmentsByStaff =
                groupAppointmentsByStaff(completedAppointments);

            // 3. 为每个员工生成汇总并发送邮件
            int sentCount = 0;
            int skippedCount = 0;
            for (Map.Entry<Long, List<Appointment>> entry : appointmentsByStaff.entrySet()) {
                Long staffId = entry.getKey();
                List<Appointment> staffAppointments = entry.getValue();

                // 3.1 检查是否已经发送过汇总
                StaffAttendance attendance = staffAttendanceMapper.findByResourceIdAndDate(staffId, date);
                if (attendance != null && attendance.getSummarySent() != null && attendance.getSummarySent() == 1) {
                    log.info("Summary already sent for staff {} on {}, skipping (sent by: {})",
                        staffId, date, attendance.getSummarySentBy());
                    skippedCount++;
                    continue;
                }

                Resource staff = resourceMapper.findById(staffId);
                if (staff != null && staff.getEmail() != null && !staff.getEmail().isEmpty()) {
                    // 3.2 发送汇总邮件
                    sendDailySummaryToStaff(staff, staffAppointments, date);

                    // 3.3 更新汇总发送状态（标记为定时任务发送）
                    try {
                        staffAttendanceMapper.updateSummarySentStatus(staffId, date, "scheduled");
                        log.info("Updated summary_sent status for staff {} on {} (scheduled)",
                            staffId, date);
                        sentCount++;
                    } catch (Exception updateEx) {
                        log.warn("Failed to update summary_sent status for staff {} on {}: {}",
                            staffId, date, updateEx.getMessage());
                    }
                } else {
                    log.warn("Staff {} has no email, skipping daily summary", staffId);
                }
            }

            log.info("Daily summary emails sent for tenant {}: {} sent, {} skipped (already sent)",
                tenantId, sentCount, skippedCount);
        } catch (Exception e) {
            log.error("Failed to send daily summary emails for tenant {} on {}: {}",
                tenantId, date, e.getMessage(), e);
        }
    }

    /**
     * 为单个员工发送每日汇总
     */
    public void sendDailySummaryForSingleStaff(Long staffId, LocalDate date) {
        log.info("Sending daily summary for staff {} on date: {}", staffId, date);

        try {
            // 1. 获取员工信息
            Resource staff = resourceMapper.findById(staffId);
            if (staff == null) {
                log.warn("Staff not found: {}", staffId);
                return;
            }

            if (staff.getEmail() == null || staff.getEmail().isEmpty()) {
                log.warn("Staff {} has no email, skipping daily summary", staffId);
                return;
            }

            // 2. 查询该员工在指定日期的所有已完成预约
            List<Appointment> completedAppointments =
                appointmentMapper.findCompletedAppointmentsByTenantAndDate(staff.getTenantId(), date);

            if (completedAppointments == null || completedAppointments.isEmpty()) {
                log.info("No completed appointments found for staff {} on {}", staffId, date);
                return;
            }

            // 3. 过滤出该员工的预约
            List<Appointment> staffAppointments = completedAppointments.stream()
                .filter(apt -> apt.getAppointmentResources() != null &&
                              apt.getAppointmentResources().stream()
                                  .anyMatch(res -> res.getResourceId().equals(staffId)))
                .collect(Collectors.toList());

            if (staffAppointments.isEmpty()) {
                log.info("No completed appointments found for staff {} on {}", staffId, date);
                return;
            }

            log.info("Found {} completed appointments for staff {} on {}",
                staffAppointments.size(), staffId, date);

            // 4. 发送汇总邮件
            sendDailySummaryToStaff(staff, staffAppointments, date);

            // 5. 更新汇总发送状态（标记为手动发送）
            try {
                staffAttendanceMapper.updateSummarySentStatus(staffId, date, "manual");
                log.info("Updated summary_sent status for staff {} on {}", staffId, date);
            } catch (Exception updateEx) {
                log.warn("Failed to update summary_sent status for staff {} on {}: {}",
                    staffId, date, updateEx.getMessage());
            }

            log.info("Daily summary email sent successfully to staff {} ({}) for date {}",
                staffId, staff.getEmail(), date);
        } catch (Exception e) {
            log.error("Failed to send daily summary for staff {} on {}: {}",
                staffId, date, e.getMessage(), e);
            throw e;  // 抛出异常，让前端知道发送失败
        }
    }

    /**
     * 为指定日期发送每日汇总（向后兼容，用于手动触发）
     * 可以被定时任务或手动触发调用
     */
    public void sendDailySummaryForDate(LocalDate date) {
        log.info("Starting daily staff summary email task for date: {}", date);

        try {
            // 1. 查询指定日期所有已完成的预约
            List<Appointment> completedAppointments =
                appointmentMapper.findCompletedAppointmentsByDate(date);

            if (completedAppointments == null || completedAppointments.isEmpty()) {
                log.info("No completed appointments found for {}", date);
                return;
            }

            log.info("Found {} completed appointments for {}",
                completedAppointments.size(), date);

            // 2. 按员工分组
            Map<Long, List<Appointment>> appointmentsByStaff =
                groupAppointmentsByStaff(completedAppointments);

            // 3. 为每个员工生成汇总并发送邮件
            int sentCount = 0;
            int skippedCount = 0;
            for (Map.Entry<Long, List<Appointment>> entry : appointmentsByStaff.entrySet()) {
                Long staffId = entry.getKey();
                List<Appointment> staffAppointments = entry.getValue();

                // 3.1 检查是否已经发送过汇总
                StaffAttendance attendance = staffAttendanceMapper.findByResourceIdAndDate(staffId, date);
                if (attendance != null && attendance.getSummarySent() != null && attendance.getSummarySent() == 1) {
                    log.info("Summary already sent for staff {} on {}, skipping (sent by: {})",
                        staffId, date, attendance.getSummarySentBy());
                    skippedCount++;
                    continue;
                }

                Resource staff = resourceMapper.findById(staffId);
                if (staff != null && staff.getEmail() != null && !staff.getEmail().isEmpty()) {
                    // 3.2 发送汇总邮件
                    sendDailySummaryToStaff(staff, staffAppointments, date);

                    // 3.3 更新汇总发送状态（标记为定时任务发送）
                    try {
                        staffAttendanceMapper.updateSummarySentStatus(staffId, date, "scheduled");
                        log.info("Updated summary_sent status for staff {} on {} (scheduled)",
                            staffId, date);
                        sentCount++;
                    } catch (Exception updateEx) {
                        log.warn("Failed to update summary_sent status for staff {} on {}: {}",
                            staffId, date, updateEx.getMessage());
                    }
                } else {
                    log.warn("Staff {} has no email, skipping daily summary", staffId);
                }
            }

            log.info("Daily summary emails sent: {} sent, {} skipped (already sent)",
                sentCount, skippedCount);
        } catch (Exception e) {
            log.error("Failed to send daily summary emails for {}: {}", date, e.getMessage(), e);
        }
    }

    /**
     * 按员工分组预约
     */
    private Map<Long, List<Appointment>> groupAppointmentsByStaff(
        List<Appointment> appointments
    ) {
        Map<Long, List<Appointment>> result = new HashMap<>();

        for (Appointment appointment : appointments) {
            if (appointment.getAppointmentResources() != null) {
                for (AppointmentResource resource : appointment.getAppointmentResources()) {
                    Long staffId = resource.getResourceId();
                    result.computeIfAbsent(staffId, k -> new ArrayList<>())
                        .add(appointment);
                }
            }
        }

        return result;
    }

    /**
     * 发送每日汇总给员工
     */
    private void sendDailySummaryToStaff(
        Resource staff,
        List<Appointment> appointments,
        LocalDate date
    ) {
        try {
            // 统计数据 - 只统计总数和小费
            int totalCount = appointments.size();
            double totalTips = 0.0;

            for (Appointment apt : appointments) {
                Order order = orderMapper.selectByAppointmentId(apt.getId());
                if (order != null) {
                    totalTips += order.getTipAmount().doubleValue();
                }
            }

            // 生成预约列表 HTML
            StringBuilder appointmentListHtml = new StringBuilder();
            for (Appointment apt : appointments) {
                Customer customer = customerMapper.selectById(apt.getCustomerId());
                Order order = orderMapper.selectByAppointmentId(apt.getId());

                String serviceName = apt.getAppointmentServices() != null ?
                    apt.getAppointmentServices().stream()
                        .map(com.merchant.server.businessservice.entity.AppointmentService::getServiceName)
                        .filter(name -> name != null)
                        .collect(Collectors.joining(", ")) : "N/A";

                String customerName = customer != null ?
                    customer.getLastName() + customer.getFirstName() : "N/A";

                // 只获取小费金额和小费支付方式
                double tipAmount = order != null ? order.getTipAmount().doubleValue() : 0.0;
                String tipPaymentMethod = order != null && order.getTipPaymentMethod() != null ?
                    order.getTipPaymentMethod() : "N/A";

                appointmentListHtml.append("<tr>")
                    .append("<td>").append(apt.getAppointmentTime()).append("</td>")
                    .append("<td>").append(customerName).append("</td>")
                    .append("<td>").append(serviceName).append("</td>")
                    .append("<td>$").append(String.format("%.2f", tipAmount)).append("</td>")
                    .append("<td>").append(tipPaymentMethod).append("</td>")
                    .append("</tr>");
            }

            // 获取商户名称
            String merchantName = "Unknown Merchant";
            try {
                ApiResponse<Map<String, Object>> merchantResponse = merchantServiceClient.getMerchantByTenantId(staff.getTenantId());
                if (merchantResponse != null && merchantResponse.isSuccess() && merchantResponse.getData() != null) {
                    Object nameObj = merchantResponse.getData().get("merchantName");
                    if (nameObj != null) {
                        merchantName = nameObj.toString();
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to get merchant name for tenant {}: {}", staff.getTenantId(), e.getMessage());
            }

            // 构建变量 - 只包含必要的统计数据
            Map<String, String> variables = new HashMap<>();
            variables.put("staffName", staff.getName());
            variables.put("merchantName", merchantName);
            variables.put("date", date.toString());
            variables.put("totalCount", String.valueOf(totalCount));
            variables.put("totalTips", String.format("%.2f", totalTips));
            variables.put("appointmentList", appointmentListHtml.toString());
            variables.put("serviceStats", generateServiceStats(appointments));

            // 计算总工作时长
            int totalMinutes = appointments.stream()
                .mapToInt(apt -> apt.getDuration() != null ? apt.getDuration() : 0)
                .sum();
            double totalHours = totalMinutes / 60.0;
            variables.put("totalHours", String.format("%.1f", totalHours));

            // 构建通知请求
            Map<String, Object> notificationVariables = new HashMap<>();
            notificationVariables.put("staffName", staff.getName());
            notificationVariables.put("merchantName", merchantName);
            notificationVariables.put("date", date.toString());
            notificationVariables.put("totalCount", totalCount);
            notificationVariables.put("totalTips", String.format("%.2f", totalTips));
            notificationVariables.put("appointmentList", appointmentListHtml.toString());
            notificationVariables.put("serviceStats", generateServiceStats(appointments));
            notificationVariables.put("totalHours", String.format("%.1f", totalHours));

            // 构建 NotificationRequest
            // 员工每日汇总邮件使用商户名称作为发件人显示名称
            NotificationRequest request = NotificationRequest.builder()
                    .scene("staff.daily.summary")
                    .tenantId(staff.getTenantId())
                    .recipient(NotificationRequest.RecipientInfo.builder()
                            .email(staff.getEmail())
                            .name(staff.getName())
                            .build())
                    .channel("EMAIL")
                    .variables(notificationVariables)
                    .businessId(String.valueOf(staff.getId()))
                    .fromName(merchantName)
                    .build();

            // 构建 NotificationMessage payload
            Map<String, Object> payload = new HashMap<>();
            payload.put("scene", request.getScene());
            payload.put("tenantId", request.getTenantId());
            payload.put("recipient", request.getRecipient());
            payload.put("channel", request.getChannel());
            payload.put("variables", request.getVariables());
            payload.put("businessId", request.getBusinessId());
            payload.put("fromName", request.getFromName());

            // 创建通知消息
            NotificationMessage message = NotificationMessage.builder()
                    .messageType(NotificationMessage.MessageType.EMAIL)
                    .priority(NotificationMessage.Priority.NORMAL)
                    .tenantId(staff.getTenantId())
                    .payload(payload)
                    .build();

            // 发送到员工每日汇总队列
            messageProducer.sendStaffDailySummary(message);

            log.info("Daily summary notification sent via MQ to staff {} ({}) for date {}",
                staff.getId(), staff.getEmail(), date);
        } catch (Exception e) {
            log.error("Failed to send daily summary to staff {}: {}",
                staff.getId(), e.getMessage(), e);
        }
    }

    /**
     * 生成服务统计 HTML
     */
    private String generateServiceStats(List<Appointment> appointments) {
        Map<String, Integer> serviceCount = new HashMap<>();

        for (Appointment apt : appointments) {
            if (apt.getAppointmentServices() != null) {
                for (com.merchant.server.businessservice.entity.AppointmentService service :
                    apt.getAppointmentServices()) {
                    String serviceName = service.getServiceName();
                    if (serviceName != null) {
                        serviceCount.put(serviceName, serviceCount.getOrDefault(serviceName, 0) + 1);
                    }
                }
            }
        }

        StringBuilder html = new StringBuilder("<ul>");
        serviceCount.forEach((service, count) -> {
            html.append("<li>").append(service).append(": ").append(count).append(" 次</li>");
        });
        html.append("</ul>");

        return html.toString();
    }
}
