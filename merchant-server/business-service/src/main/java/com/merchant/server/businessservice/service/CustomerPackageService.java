package com.merchant.server.businessservice.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.merchant.server.businessservice.dto.CustomerPackageDTO;
import com.merchant.server.businessservice.dto.ServicePackageDTO;
import com.merchant.server.businessservice.entity.CustomerPackage;
import com.merchant.server.businessservice.entity.CustomerPackageUsageLog;
import com.merchant.server.businessservice.entity.ServicePackage;
import com.merchant.server.businessservice.entity.Order;
import com.merchant.server.businessservice.mapper.CustomerPackageMapper;
import com.merchant.server.businessservice.mapper.ServicePackageMapper;
import com.merchant.server.businessservice.util.MessageUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 客户套餐Service
 *
 * @author System
 * @since 2025-01-21
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerPackageService {

    private final CustomerPackageMapper customerPackageMapper;
    private final ServicePackageMapper servicePackageMapper;
    private final com.merchant.server.businessservice.mapper.ServiceMapper serviceMapper;
    private final ObjectMapper objectMapper;
    private final CustomerPackageUsageLogService usageLogService;
    private final com.merchant.server.businessservice.mapper.OrderMapper orderMapper;
    private final com.merchant.server.businessservice.mapper.CustomerMapper customerMapper;
    private final com.merchant.server.common.mq.NotificationMessageProducer notificationMessageProducer;
    private final MessageUtil messageUtil;

    /**
     * 根据客户ID获取所有套餐
     */
    public List<CustomerPackageDTO> getPackagesByCustomerId(Long customerId) {
        List<CustomerPackage> packages = customerPackageMapper.selectByCustomerId(customerId);
        return packages.stream().map(this::entityToDto).collect(Collectors.toList());
    }

    /**
     * 根据客户ID和状态获取套餐
     */
    public List<CustomerPackageDTO> getPackagesByCustomerIdAndStatus(Long customerId, String status) {
        List<CustomerPackage> packages = customerPackageMapper.selectByCustomerIdAndStatus(customerId, status);
        return packages.stream().map(this::entityToDto).collect(Collectors.toList());
    }

    /**
     * 获取客户的有效套餐
     */
    public List<CustomerPackageDTO> getActivePackagesByCustomerId(Long tenantId, Long customerId) {
        List<CustomerPackage> packages = customerPackageMapper.selectActiveByCustomerId(tenantId, customerId);
        return packages.stream().map(this::entityToDto).collect(Collectors.toList());
    }

    /**
     * 购买套餐
     */
    @Transactional(rollbackFor = Exception.class)
    public CustomerPackageDTO purchasePackage(CustomerPackageDTO dto) {
        // 获取套餐模板信息
        ServicePackage packageTemplate = servicePackageMapper.selectById(dto.getPackageId());
        if (packageTemplate == null) {
            throw new RuntimeException(messageUtil.getMessage("error.package.template.not.found", new Object[]{dto.getPackageId()}));
        }

        CustomerPackage entity = dtoToEntity(dto);
        entity.setTenantId(packageTemplate.getTenantId());
        entity.setPurchaseDate(LocalDate.now());
        entity.setExpirationDate(LocalDate.now().plusDays(packageTemplate.getValidityDays()));
        entity.setPurchasePrice(packageTemplate.getPackagePrice()); // Set purchase price from package template
        entity.setStatus("ACTIVE");
        entity.setPaymentStatus(dto.getPaymentStatus() != null ? dto.getPaymentStatus() : "PAID");
        entity.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
        entity.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));

        // 初始化使用详情
        try {
            List<ServicePackageDTO.ServiceItem> services = objectMapper.readValue(
                packageTemplate.getIncludedServices(),
                new TypeReference<List<ServicePackageDTO.ServiceItem>>() {}
            );

            List<CustomerPackageDTO.UsageDetail> usageDetails = new ArrayList<>();
            for (ServicePackageDTO.ServiceItem service : services) {
                CustomerPackageDTO.UsageDetail detail = new CustomerPackageDTO.UsageDetail();
                detail.setServiceId(service.getServiceId());
                detail.setAllowed(service.getCount());
                detail.setUsed(0);
                detail.setRemaining(service.getCount());
                detail.setLastUsed(null);
                usageDetails.add(detail);
            }

            String usageDetailsJson = objectMapper.writeValueAsString(usageDetails);
            entity.setUsageDetails(usageDetailsJson);
        } catch (JsonProcessingException e) {
            log.error("Error initializing usage details: {}", e.getMessage());
            throw new RuntimeException(messageUtil.getMessage("error.package.usage.init.failed"), e);
        }

        // 初始化共享用户（默认只有购买者）
        try {
            List<CustomerPackageDTO.SharedUser> sharedUsers = new ArrayList<>();
            CustomerPackageDTO.SharedUser primaryUser = new CustomerPackageDTO.SharedUser();
            primaryUser.setCustomerId(dto.getCustomerId());
            primaryUser.setIsPrimary(true);
            sharedUsers.add(primaryUser);

            String sharedUsersJson = objectMapper.writeValueAsString(sharedUsers);
            entity.setSharedUsers(sharedUsersJson);
        } catch (JsonProcessingException e) {
            log.error("Error initializing shared users: {}", e.getMessage());
        }

        customerPackageMapper.insert(entity);

        // Create order for package purchase - must be in same transaction
        // If order creation fails, the entire transaction will rollback
        createOrderForPackagePurchase(entity, packageTemplate, dto);

        // Update customer statistics: total spent, points, last visit
        updateCustomerStatsForPackagePurchase(entity.getCustomerId(), dto.getTotalAmount());

        CustomerPackageDTO result = entityToDto(entity);

        // 事务完成后发送通知（异步，不在事务内）
        try {
            String merchantName = dto.getMerchantName() != null ? dto.getMerchantName() : "Your Service Team";
            sendPackagePurchaseNotification(entity, packageTemplate, merchantName);
        } catch (Exception e) {
            log.error("Failed to send package purchase notification for customer: {}, package: {}",
                    entity.getCustomerId(), entity.getId(), e);
            // 通知发送失败不影响业务流程
        }

        return result;
    }

    /**
     * Create order for package purchase
     * Amounts are calculated by frontend and passed in DTO
     * This method is part of the transaction - if it fails, the entire purchase will rollback
     */
    private void createOrderForPackagePurchase(CustomerPackage customerPackage, ServicePackage packageTemplate, CustomerPackageDTO dto) {
        // Use amounts from DTO (calculated by frontend)
        Double subtotal = dto.getSubtotal() != null ? dto.getSubtotal() :
            (packageTemplate.getPackagePrice() != null ? packageTemplate.getPackagePrice().doubleValue() : 0.0);

        // Frontend sends tax rate as percentage (e.g., 12), convert to decimal (e.g., 0.12)
        Double taxRate = dto.getTaxRate() != null ? dto.getTaxRate() / 100.0 : 0.0;
        Double taxAmount = dto.getTaxAmount() != null ? dto.getTaxAmount() : 0.0;
        Double totalAmount = dto.getTotalAmount() != null ? dto.getTotalAmount() : subtotal;

        // Create order
        Order order = new Order();
        order.setTenantId(customerPackage.getTenantId());
        order.setOrderNumber(generateOrderNumber());
        order.setCustomerId(customerPackage.getCustomerId());
        order.setAppointmentId(null); // Package purchase doesn't have appointment
        order.setResourceId(null);
        order.setResourceType(null); // Package purchase doesn't have resource_type

        // Amount information from frontend
        order.setSubtotal(subtotal);
        order.setTaxRate(taxRate);
        order.setTaxAmount(taxAmount);
        order.setTipAmount(0.0);
        order.setTipPercentage(0.0);
        order.setTotalAmount(totalAmount);

        // Payment information
        order.setPaymentMethod(dto.getPaymentMethod() != null ? dto.getPaymentMethod() : "CREDIT_CARD");
        order.setPaymentStatus("PAID");
        order.setOrderStatus("COMPLETED");
        order.setNotes(dto.getNotes() != null ? "Package Purchase: " + packageTemplate.getName() + ". " + dto.getNotes() : "Package Purchase: " + packageTemplate.getName());

        // Timestamps
        order.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
        order.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
        order.setCompletedAt(LocalDateTime.now(ZoneOffset.UTC));

        orderMapper.insert(order);
        log.info("Order created for package purchase: orderId={}, customerPackageId={}, subtotal={}, tax={}, total={}",
                order.getId(), customerPackage.getId(), subtotal, taxAmount, totalAmount);
    }

    /**
     * Generate unique order number
     */
    private String generateOrderNumber() {
        return "ORD-" + System.currentTimeMillis();
    }

    /**
     * Update customer statistics after package purchase
     * Updates: total spent, points, last visit date
     * This method is part of the transaction - if it fails, the entire purchase will rollback
     */
    private void updateCustomerStatsForPackagePurchase(Long customerId, Double totalAmount) {
        com.merchant.server.businessservice.entity.Customer customer = customerMapper.selectById(customerId);
        if (customer == null) {
            log.error("Customer not found when updating stats: {}", customerId);
            throw new RuntimeException(messageUtil.getMessage("error.customer.not.found.stats.update", new Object[]{customerId}));
        }

        // Update total spent
        java.math.BigDecimal amountToAdd = totalAmount != null ?
            java.math.BigDecimal.valueOf(totalAmount) : java.math.BigDecimal.ZERO;
        customer.setTotalSpent(
            (customer.getTotalSpent() != null ? customer.getTotalSpent() : java.math.BigDecimal.ZERO)
                .add(amountToAdd)
        );

        // Update points (1 point per $10 spent, rounded down)
        int pointsToAdd = amountToAdd.divide(java.math.BigDecimal.TEN, 0, java.math.RoundingMode.DOWN).intValue();
        customer.setPoints(
            (customer.getPoints() != null ? customer.getPoints() : 0) + pointsToAdd
        );

        // Update last visit date
        customer.setLastVisitDate(LocalDateTime.now(ZoneOffset.UTC));

        int updatedRows = customerMapper.update(customer);
        if (updatedRows == 0) {
            log.error("Failed to update customer stats for package purchase: customerId={}", customerId);
            throw new RuntimeException(messageUtil.getMessage("error.customer.stats.update.failed", new Object[]{customerId}));
        }

        log.info("Updated customer stats for package purchase: customerId={}, amountAdded={}, pointsAdded={}",
            customerId, amountToAdd, pointsToAdd);
    }

    /**
     * 更新套餐使用详情
     */
    @Transactional
    public void updateUsageDetails(Long packageId, List<CustomerPackageDTO.UsageDetail> usageDetails) {
        CustomerPackage customerPackage = customerPackageMapper.selectById(packageId);
        if (customerPackage == null) {
            throw new RuntimeException(messageUtil.getMessage("error.customer.package.not.found", new Object[]{packageId}));
        }

        try {
            String usageDetailsJson = objectMapper.writeValueAsString(usageDetails);
            customerPackage.setUsageDetails(usageDetailsJson);
            customerPackage.setLastUsedAt(LocalDateTime.now(ZoneOffset.UTC));

            if (customerPackage.getFirstUsedAt() == null) {
                customerPackage.setFirstUsedAt(LocalDateTime.now(ZoneOffset.UTC));
            }

            // 检查是否所有服务都用完了
            boolean allUsed = usageDetails.stream().allMatch(d -> d.getRemaining() == 0);
            if (allUsed) {
                customerPackage.setStatus("COMPLETED");
                customerPackage.setCompletedAt(LocalDateTime.now(ZoneOffset.UTC));
            }

            customerPackageMapper.updateById(customerPackage);
        } catch (JsonProcessingException e) {
            log.error("Error updating usage details: {}", e.getMessage());
            throw new RuntimeException(messageUtil.getMessage("error.package.usage.update.failed"), e);
        }
    }

    /**
     * 扣除套餐服务使用次数
     *
     * @param customerPackageId 客户套餐ID
     * @param serviceId 服务ID
     * @param appointmentId 预约ID（可选，用于记录）
     * @param verificationCodeId 验证码ID（可选）
     * @throws RuntimeException 当套餐不存在、不可用或服务次数不足时
     */
    @Transactional
    public void deductServiceUsage(Integer customerPackageId, Long serviceId, Long appointmentId, Long verificationCodeId, Long staffId, String staffName) {
        log.info("Deducting service usage - packageId: {}, serviceId: {}, appointmentId: {}, staffId: {}",
                customerPackageId, serviceId, appointmentId, staffId);

        // 获取客户套餐
        CustomerPackage customerPackage = customerPackageMapper.selectById(customerPackageId.longValue());
        if (customerPackage == null) {
            throw new RuntimeException(messageUtil.getMessage("error.customer.package.not.found", new Object[]{customerPackageId}));
        }

        // 验证套餐状态
        if (!"ACTIVE".equals(customerPackage.getStatus())) {
            throw new RuntimeException(messageUtil.getMessage("error.package.not.active", new Object[]{customerPackage.getStatus()}));
        }

        // 验证套餐是否过期
        if (customerPackage.getExpirationDate() != null &&
            customerPackage.getExpirationDate().isBefore(LocalDate.now())) {
            throw new RuntimeException(messageUtil.getMessage("error.package.expired", new Object[]{customerPackage.getExpirationDate()}));
        }

        try {
            // 解析使用详情
            List<CustomerPackageDTO.UsageDetail> usageDetails = objectMapper.readValue(
                customerPackage.getUsageDetails(),
                new TypeReference<List<CustomerPackageDTO.UsageDetail>>() {}
            );

            // 查找对应服务
            CustomerPackageDTO.UsageDetail serviceDetail = usageDetails.stream()
                .filter(detail -> detail.getServiceId().equals(serviceId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException(
                    messageUtil.getMessage("error.package.service.not.included", new Object[]{serviceId})));

            // 验证剩余次数
            if (serviceDetail.getRemaining() <= 0) {
                throw new RuntimeException(
                    messageUtil.getMessage("error.package.service.no.remaining", new Object[]{serviceId}));
            }

            // 扣除一次使用
            serviceDetail.setUsed(serviceDetail.getUsed() + 1);
            serviceDetail.setRemaining(serviceDetail.getRemaining() - 1);
            serviceDetail.setLastUsed(LocalDate.now());

            // 更新到数据库
            String usageDetailsJson = objectMapper.writeValueAsString(usageDetails);
            customerPackage.setUsageDetails(usageDetailsJson);
            customerPackage.setLastUsedAt(LocalDateTime.now(ZoneOffset.UTC));

            if (customerPackage.getFirstUsedAt() == null) {
                customerPackage.setFirstUsedAt(LocalDateTime.now(ZoneOffset.UTC));
            }

            // 检查是否所有服务都用完了
            boolean allUsed = usageDetails.stream().allMatch(d -> d.getRemaining() == 0);
            if (allUsed) {
                customerPackage.setStatus("COMPLETED");
                customerPackage.setCompletedAt(LocalDateTime.now(ZoneOffset.UTC));
                log.info("Package {} has been fully used and marked as COMPLETED", customerPackageId);
            }

            customerPackageMapper.updateById(customerPackage);
            log.info("Successfully deducted usage for service {} from package {}. Remaining: {}",
                    serviceId, customerPackageId, serviceDetail.getRemaining());

            // 记录使用日志
            try {
                ServicePackage packageTemplate = servicePackageMapper.selectById(customerPackage.getPackageId());
                com.merchant.server.businessservice.entity.Service service =
                    serviceMapper.selectById(serviceId);

                CustomerPackageUsageLog usageLog = new CustomerPackageUsageLog();
                usageLog.setTenantId(customerPackage.getTenantId());
                usageLog.setCustomerId(customerPackage.getCustomerId());
                usageLog.setCustomerPackageId(customerPackageId.longValue());
                usageLog.setPackageId(customerPackage.getPackageId());
                usageLog.setPackageName(packageTemplate != null ? packageTemplate.getName() : "Unknown");
                usageLog.setServiceId(serviceId);
                usageLog.setServiceName(service != null ? service.getName() : "Unknown Service");
                usageLog.setAppointmentId(appointmentId);
                usageLog.setUsageType(CustomerPackageUsageLog.UsageType.DEDUCT);
                usageLog.setQuantity(1);
                usageLog.setRemainingBefore(serviceDetail.getRemaining() + 1); // 加回扣除的1次
                usageLog.setRemainingAfter(serviceDetail.getRemaining());
                usageLog.setStaffId(staffId);
                usageLog.setStaffName(staffName);
                usageLog.setVerificationCodeId(verificationCodeId);
                usageLog.setNotes("Package payment for appointment");

                usageLogService.logPackageUsage(usageLog);
            } catch (Exception e) {
                log.error("Failed to log package usage, but deduction was successful", e);
                // 不影响主流程，只记录错误
            }

        } catch (JsonProcessingException e) {
            log.error("Error processing usage details: {}", e.getMessage());
            throw new RuntimeException(messageUtil.getMessage("error.package.usage.deduct.failed", new Object[]{e.getMessage()}), e);
        }
    }

    /**
     * 取消套餐
     */
    @Transactional
    public void cancelPackage(Long packageId) {
        CustomerPackage customerPackage = customerPackageMapper.selectById(packageId);
        if (customerPackage == null) {
            throw new RuntimeException(messageUtil.getMessage("error.customer.package.not.found", new Object[]{packageId}));
        }

        customerPackage.setStatus("CANCELLED");
        customerPackage.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
        customerPackageMapper.updateById(customerPackage);
    }

    /**
     * 实体转DTO
     */
    private CustomerPackageDTO entityToDto(CustomerPackage entity) {
        CustomerPackageDTO dto = new CustomerPackageDTO();
        dto.setId(entity.getId());
        dto.setTenantId(entity.getTenantId());
        dto.setCustomerId(entity.getCustomerId());
        dto.setPackageId(entity.getPackageId());
        dto.setPurchaseDate(entity.getPurchaseDate());
        dto.setExpirationDate(entity.getExpirationDate());
        dto.setPurchasePrice(entity.getPurchasePrice());
        dto.setPaymentStatus(entity.getPaymentStatus());
        dto.setStatus(entity.getStatus());
        dto.setFirstUsedAt(entity.getFirstUsedAt());
        dto.setLastUsedAt(entity.getLastUsedAt());
        dto.setCompletedAt(entity.getCompletedAt());
        dto.setIsGift(entity.getIsGift());
        dto.setGiftedByCustomerId(entity.getGiftedByCustomerId());
        dto.setNotes(entity.getNotes());
        dto.setRefundAmount(entity.getRefundAmount());
        dto.setRefundDate(entity.getRefundDate());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());

        // 计算剩余天数
        if (entity.getExpirationDate() != null) {
            long daysRemaining = ChronoUnit.DAYS.between(LocalDate.now(), entity.getExpirationDate());
            dto.setDaysRemaining((int) daysRemaining);
        }

        // 解析使用详情JSON
        if (entity.getUsageDetails() != null && !entity.getUsageDetails().isEmpty()) {
            try {
                List<CustomerPackageDTO.UsageDetail> usageDetails = objectMapper.readValue(
                    entity.getUsageDetails(),
                    new TypeReference<List<CustomerPackageDTO.UsageDetail>>() {}
                );
                dto.setUsageDetails(usageDetails);
            } catch (JsonProcessingException e) {
                log.error("Error parsing usage details JSON: {}", e.getMessage());
            }
        }

        // 解析共享用户JSON
        if (entity.getSharedUsers() != null && !entity.getSharedUsers().isEmpty()) {
            try {
                List<CustomerPackageDTO.SharedUser> sharedUsers = objectMapper.readValue(
                    entity.getSharedUsers(),
                    new TypeReference<List<CustomerPackageDTO.SharedUser>>() {}
                );
                dto.setSharedUsers(sharedUsers);
            } catch (JsonProcessingException e) {
                log.error("Error parsing shared users JSON: {}", e.getMessage());
            }
        }

        // 获取套餐模板信息（如果需要）
        ServicePackage packageTemplate = servicePackageMapper.selectById(entity.getPackageId());
        if (packageTemplate != null) {
            dto.setPackageName(packageTemplate.getName());
            dto.setPackageDescription(packageTemplate.getDescription());
        }

        return dto;
    }

    /**
     * DTO转实体
     */
    private CustomerPackage dtoToEntity(CustomerPackageDTO dto) {
        CustomerPackage entity = new CustomerPackage();
        entity.setId(dto.getId());
        entity.setTenantId(dto.getTenantId());
        entity.setCustomerId(dto.getCustomerId());
        entity.setPackageId(dto.getPackageId());
        entity.setPurchaseDate(dto.getPurchaseDate());
        entity.setExpirationDate(dto.getExpirationDate());
        entity.setPurchasePrice(dto.getPurchasePrice());
        entity.setPaymentStatus(dto.getPaymentStatus());
        entity.setStatus(dto.getStatus());
        entity.setFirstUsedAt(dto.getFirstUsedAt());
        entity.setLastUsedAt(dto.getLastUsedAt());
        entity.setCompletedAt(dto.getCompletedAt());
        entity.setIsGift(dto.getIsGift());
        entity.setGiftedByCustomerId(dto.getGiftedByCustomerId());
        entity.setNotes(dto.getNotes());
        entity.setRefundAmount(dto.getRefundAmount());
        entity.setRefundDate(dto.getRefundDate());
        entity.setCreatedAt(dto.getCreatedAt());
        entity.setUpdatedAt(dto.getUpdatedAt());

        // 将使用详情转为JSON
        if (dto.getUsageDetails() != null && !dto.getUsageDetails().isEmpty()) {
            try {
                String usageDetailsJson = objectMapper.writeValueAsString(dto.getUsageDetails());
                entity.setUsageDetails(usageDetailsJson);
            } catch (JsonProcessingException e) {
                log.error("Error converting usage details to JSON: {}", e.getMessage());
            }
        }

        // 将共享用户转为JSON
        if (dto.getSharedUsers() != null && !dto.getSharedUsers().isEmpty()) {
            try {
                String sharedUsersJson = objectMapper.writeValueAsString(dto.getSharedUsers());
                entity.setSharedUsers(sharedUsersJson);
            } catch (JsonProcessingException e) {
                log.error("Error converting shared users to JSON: {}", e.getMessage());
            }
        }

        return entity;
    }

    /**
     * 发送套餐购买成功通知
     */
    private void sendPackagePurchaseNotification(CustomerPackage customerPackage, ServicePackage packageTemplate, String merchantName) {
        try {
            // 获取客户信息
            com.merchant.server.businessservice.entity.Customer customer =
                    customerMapper.selectById(customerPackage.getCustomerId());
            if (customer == null) {
                log.warn("Customer not found for package purchase notification: {}", customerPackage.getCustomerId());
                return;
            }

            // 构建客户全名
            String customerName = (customer.getFirstName() != null ? customer.getFirstName() : "") +
                    " " + (customer.getLastName() != null ? customer.getLastName() : "");
            customerName = customerName.trim();

            // 格式化日期
            java.time.format.DateTimeFormatter dateFormatter =
                    java.time.format.DateTimeFormatter.ofPattern("MMM dd, yyyy");
            String purchaseDate = customerPackage.getPurchaseDate() != null ?
                    customerPackage.getPurchaseDate().format(dateFormatter) : "N/A";
            String expirationDate = customerPackage.getExpirationDate() != null ?
                    customerPackage.getExpirationDate().format(dateFormatter) : "N/A";

            // 构建通知变量
            java.util.Map<String, Object> variables = new java.util.HashMap<>();
            variables.put("customerName", customerName);
            variables.put("packageName", packageTemplate.getName());
            variables.put("packageDescription", packageTemplate.getDescription());
            variables.put("purchasePrice", customerPackage.getPurchasePrice());
            variables.put("purchaseDate", purchaseDate);
            variables.put("expirationDate", expirationDate);
            variables.put("validityDays", packageTemplate.getValidityDays());
            variables.put("merchantName", merchantName);

            // 拼接国家码和手机号
            String fullPhoneNumber = buildFullPhoneNumber(customer.getCountryCode(), customer.getPhone());

            // 构建 NotificationRequest
            // 套餐购买成功邮件使用商户名称作为发件人显示名称
            com.merchant.server.common.dto.NotificationRequest request =
                    com.merchant.server.common.dto.NotificationRequest.builder()
                            .scene("package.purchase.success")
                            .tenantId(customerPackage.getTenantId())
                            .recipient(com.merchant.server.common.dto.NotificationRequest.RecipientInfo.builder()
                                    .email(customer.getEmail())
                                    .phone(fullPhoneNumber)
                                    .name(customerName)
                                    .build())
                            .channel("EMAIL")
                            .variables(variables)
                            .businessId(customerPackage.getId().toString())
                            .fromName(merchantName)
                            .build();

            // 构建 NotificationMessage payload
            java.util.Map<String, Object> payload = new java.util.HashMap<>();
            payload.put("scene", request.getScene());
            payload.put("tenantId", request.getTenantId());
            payload.put("recipient", request.getRecipient());
            payload.put("channel", request.getChannel());
            payload.put("variables", request.getVariables());
            payload.put("businessId", request.getBusinessId());
            payload.put("fromName", request.getFromName());

            // 创建通知消息
            com.merchant.server.common.dto.NotificationMessage message =
                    com.merchant.server.common.dto.NotificationMessage.builder()
                            .messageType(com.merchant.server.common.dto.NotificationMessage.MessageType.EMAIL)
                            .priority(com.merchant.server.common.dto.NotificationMessage.Priority.NORMAL)
                            .tenantId(customerPackage.getTenantId())
                            .payload(payload)
                            .build();

            // 发送到套餐购买队列
            notificationMessageProducer.sendPackagePurchaseSuccess(message);

            log.info("Package purchase notification sent successfully - packageId: {}, customerId: {}",
                    customerPackage.getId(), customerPackage.getCustomerId());

        } catch (Exception e) {
            log.error("Error sending package purchase notification", e);
            throw e;
        }
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
}