package com.merchant.server.businessservice.service.impl;

import com.merchant.server.businessservice.client.MerchantServiceClient;
import com.merchant.server.businessservice.service.NotificationMQService;
import com.merchant.server.businessservice.dto.AppointmentNotificationDTO;
import com.merchant.server.businessservice.entity.Appointment;
import com.merchant.server.businessservice.entity.AppointmentResource;
import com.merchant.server.businessservice.entity.Customer;
import com.merchant.server.businessservice.entity.Order;
import com.merchant.server.businessservice.entity.Resource;
import com.merchant.server.businessservice.mapper.CustomerMapper;
import com.merchant.server.businessservice.mapper.OrderMapper;
import com.merchant.server.businessservice.mapper.ResourceMapper;
import com.merchant.server.businessservice.mapper.AppointmentMapper;
import com.merchant.server.businessservice.service.AppointmentNotificationService;
import com.merchant.server.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.ZoneOffset;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentNotificationServiceImpl implements AppointmentNotificationService {

    private final NotificationMQService notificationService;
    private final CustomerMapper customerMapper;
    private final ResourceMapper resourceMapper;
    private final AppointmentMapper appointmentMapper;
    private final OrderMapper orderMapper;
    private final MerchantServiceClient merchantServiceClient;

    // 缓存商户信息，key: tenantId, value: MerchantInfo
    private final Map<Long, MerchantInfo> merchantInfoCache = new ConcurrentHashMap<>();

    @Value("${business.name:美容院}")
    private String defaultBusinessName;

    @Value("${business.address:}")
    private String defaultBusinessAddress;

    @Value("${business.phone:}")
    private String defaultBusinessPhone;

    // 内部类用于缓存商户信息
    private static class MerchantInfo {
        String name;
        String address;
        String phone;

        MerchantInfo(String name, String address, String phone) {
            this.name = name;
            this.address = address;
            this.phone = phone;
        }
    }
    
    @Value("${notification.enabled:true}")
    private boolean notificationEnabled;

    @Override
    public void sendConfirmationNotification(Appointment appointment) {
        log.info("Preparing confirmation notification for appointment: {}", appointment.getId());
        
        AppointmentNotificationDTO notification = buildNotificationDTO(appointment);
        if (notification != null) {
            notificationService.sendAppointmentConfirmation(notification);
        }
    }

    @Override
    public void sendCancellationNotification(Appointment appointment) {
        log.info("Preparing cancellation notification for appointment: {}", appointment.getId());
        
        AppointmentNotificationDTO notification = buildNotificationDTO(appointment);
        if (notification != null) {
            notificationService.sendAppointmentCancellation(notification);
        }
    }

    @Override
    public void sendCompletionNotification(Appointment appointment) {
        log.info("Preparing completion notification for appointment: {}", appointment.getId());
        
        AppointmentNotificationDTO notification = buildNotificationDTO(appointment);
        if (notification != null) {
            notificationService.sendAppointmentCompletion(notification);
        }
    }

    @Override
    public void sendReminderNotification(Appointment appointment) {
        log.info("Preparing reminder notification for appointment: {}", appointment.getId());
        
        AppointmentNotificationDTO notification = buildNotificationDTO(appointment);
        if (notification != null) {
            notificationService.sendAppointmentReminder(notification);
        }
    }

    private AppointmentNotificationDTO buildNotificationDTO(Appointment appointment) {
        try {
            // 获取客户信息
            Customer customer = customerMapper.selectById(appointment.getCustomerId());
            if (customer == null) {
                log.warn("Customer not found for appointment: {}", appointment.getId());
                return null;
            }

            // 获取资源信息（从appointmentResources中获取主要资源）
            Resource resource = null;
            if (appointment.getAppointmentResources() != null && !appointment.getAppointmentResources().isEmpty()) {
                // 获取主要资源（优先选择员工）
                AppointmentResource primaryResource = appointment.getAppointmentResources().stream()
                    .filter(ar -> ar.getIsPrimary() != null && ar.getIsPrimary())
                    .findFirst()
                    .orElse(appointment.getAppointmentResources().get(0));
                
                if (primaryResource != null) {
                    resource = resourceMapper.findById(primaryResource.getResourceId());
                }
            }

            // 构建通知DTO
            AppointmentNotificationDTO notification = new AppointmentNotificationDTO();
            notification.setAppointmentId(appointment.getId());
            notification.setTenantId(appointment.getTenantId());
            notification.setCustomerId(customer.getId());
            notification.setCustomerName(customer.getFullName());

            // 拼接国家码和手机号用于短信发送
            String fullPhoneNumber = buildFullPhoneNumber(customer.getCountryCode(), customer.getPhone());
            notification.setCustomerPhone(fullPhoneNumber);
            notification.setCustomerCountryCode(customer.getCountryCode());

            notification.setCustomerEmail(customer.getEmail());
            // 处理联系偏好：对于新客户或没有明确偏好的，同时发送邮件和短信
            String communicationPreference = determineCommunicationPreference(customer);
            notification.setCommunicationPreference(communicationPreference);
            
            notification.setAppointmentDate(appointment.getAppointmentDate());
            notification.setAppointmentTime(appointment.getAppointmentTime());
            notification.setDuration(appointment.getDuration());

            // 获取订单信息以获取税费和小费详情
            Order order = orderMapper.selectByAppointmentId(appointment.getId());
            if (order != null) {
                notification.setSubtotal(order.getSubtotal() != null ?
                    java.math.BigDecimal.valueOf(order.getSubtotal()) : java.math.BigDecimal.ZERO);
                notification.setTaxAmount(order.getTaxAmount() != null ?
                    java.math.BigDecimal.valueOf(order.getTaxAmount()) : java.math.BigDecimal.ZERO);
                notification.setTipAmount(order.getTipAmount() != null ?
                    java.math.BigDecimal.valueOf(order.getTipAmount()) : java.math.BigDecimal.ZERO);
                notification.setTotalAmount(order.getTotalAmount() != null ?
                    java.math.BigDecimal.valueOf(order.getTotalAmount()) : java.math.BigDecimal.ZERO);
            } else {
                // 如果没有订单，使用预约的总金额
                notification.setTotalAmount(appointment.getTotalAmount());
            }

            notification.setStatus(appointment.getStatus().name());
            notification.setNotes(appointment.getNotes());
            
            if (resource != null) {
                notification.setResourceId(resource.getId());
                notification.setResourceType(resource.getType().name());
                notification.setResourceName(resource.getName());
            }
            
            // 获取服务名称
            String serviceName = "美容服务"; // 默认值
            try {
                if (appointment.getAppointmentServices() != null && !appointment.getAppointmentServices().isEmpty()) {
                    // 如果预约对象中已经包含服务信息，直接使用
                    serviceName = appointment.getAppointmentServices().stream()
                        .map(com.merchant.server.businessservice.entity.AppointmentService::getServiceName)
                        .reduce((s1, s2) -> s1 + ", " + s2)
                        .orElse("美容服务");
                } else {
                    // 否则从数据库查询
                    var appointmentServices = appointmentMapper.findAppointmentServicesByAppointmentId(appointment.getId());
                    if (appointmentServices != null && !appointmentServices.isEmpty()) {
                        serviceName = appointmentServices.stream()
                            .map(com.merchant.server.businessservice.entity.AppointmentService::getServiceName)
                            .reduce((s1, s2) -> s1 + ", " + s2)
                            .orElse("美容服务");
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to get service names for appointment: {}, using default", appointment.getId(), e);
            }
            notification.setServiceName(serviceName);

            // 动态获取商户信息
            MerchantInfo merchantInfo = getMerchantInfo(appointment.getTenantId());
            notification.setBusinessName(merchantInfo.name);
            notification.setBusinessAddress(merchantInfo.address);
            notification.setBusinessPhone(merchantInfo.phone);

            return notification;
            
        } catch (Exception e) {
            log.error("Error building notification DTO for appointment: {}", appointment.getId(), e);
            return null;
        }
    }

    /**
     * 根据 tenantId 获取商户信息（带缓存）
     */
    private MerchantInfo getMerchantInfo(Long tenantId) {
        // 先从缓存获取
        MerchantInfo merchantInfo = merchantInfoCache.get(tenantId);
        if (merchantInfo != null) {
            return merchantInfo;
        }

        // 缓存中没有，调用 merchant-service 获取
        try {
            ApiResponse<Map<String, Object>> response = merchantServiceClient.getMerchantByTenantId(tenantId);
            if (response != null && response.isSuccess() && response.getData() != null) {
                Map<String, Object> data = response.getData();

                String name = data.get("merchantName") != null ? data.get("merchantName").toString() : defaultBusinessName;
                String address = data.get("address") != null ? data.get("address").toString() : defaultBusinessAddress;
                String phone = data.get("contactPhone") != null ? data.get("contactPhone").toString() : defaultBusinessPhone;

                merchantInfo = new MerchantInfo(name, address, phone);
                // 存入缓存
                merchantInfoCache.put(tenantId, merchantInfo);
                log.info("Retrieved and cached merchant info for tenantId {}: name={}, address={}, phone={}",
                    tenantId, name, address, phone);
                return merchantInfo;
            }
        } catch (Exception e) {
            log.warn("Failed to get merchant info for tenantId {}: {}", tenantId, e.getMessage());
        }

        // 如果获取失败，使用默认值
        log.info("Using default business info for tenantId {}", tenantId);
        return new MerchantInfo(defaultBusinessName, defaultBusinessAddress, defaultBusinessPhone);
    }

    /**
     * 构建完整的电话号码（国家码 + 手机号）
     * @param countryCode 国家码，格式如 "+1-CA" 或 "+86-CN"
     * @param phone 手机号
     * @return 完整电话号码，格式如 "+1234567890"
     */
    private String buildFullPhoneNumber(String countryCode, String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            return null;
        }

        if (countryCode == null || countryCode.trim().isEmpty()) {
            // 如果没有国家码，默认使用 +1（北美）
            log.warn("No country code provided, using default +1");
            return "+1" + phone.trim();
        }

        // 提取国家码中的数字部分（去掉国家后缀，如 +1-CA 变成 +1）
        String dialCode = countryCode.replaceAll("-[A-Z]{2}$", "").trim();

        // 拼接国家码和手机号
        String fullNumber = dialCode + phone.trim();

        log.debug("Built full phone number: {} from countryCode: {} and phone: {}", fullNumber, countryCode, phone);
        return fullNumber;
    }

    /**
     * 确定客户的通信偏好
     * 优先使用客户明确设置的偏好，否则使用默认规则
     */
    private String determineCommunicationPreference(Customer customer) {
        // 检查客户是否有有效的邮箱和手机号
        boolean hasEmail = customer.getEmail() != null && !customer.getEmail().trim().isEmpty();
        boolean hasPhone = customer.getPhone() != null && !customer.getPhone().trim().isEmpty();

        // 优先使用客户明确设置的通信偏好
        if (customer.getCommunicationPreference() != null) {
            String preference = customer.getCommunicationPreference().name();
            log.info("Using customer's communication preference for {}: {}", customer.getFullName(), preference);
            return preference;
        }

        // 如果客户没有设置通信偏好，但有邮箱和手机号，同时发送
        if (hasEmail && hasPhone) {
            log.info("Customer has no communication preference, will send both email and SMS: {}", customer.getFullName());
            return "BOTH";
        }

        // 默认情况：如果有邮箱优先邮箱，否则短信
        if (hasEmail) {
            log.info("Customer has no preference and only email, will send EMAIL: {}", customer.getFullName());
            return "EMAIL";
        } else if (hasPhone) {
            log.info("Customer has no preference and only phone, will send SMS: {}", customer.getFullName());
            return "SMS";
        } else {
            log.warn("Customer has no valid contact information: {}", customer.getFullName());
            return "SMS"; // 默认返回SMS
        }
    }

    @Override
    public void clearMerchantNameCache(Long tenantId) {
        if (tenantId != null) {
            merchantInfoCache.remove(tenantId);
            log.info("Cleared merchant info cache for tenantId: {}", tenantId);
        }
    }
}