package com.merchant.server.businessservice.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.merchant.server.businessservice.client.GatewayWebSocketClient;
import com.merchant.server.businessservice.client.MerchantServiceClient;
import com.merchant.server.businessservice.dto.*;
import com.merchant.server.businessservice.entity.*;
import com.merchant.server.businessservice.mapper.*;
import com.merchant.server.businessservice.service.CustomerService;
import com.merchant.server.businessservice.service.PublicBookingService;
import com.merchant.server.businessservice.service.ResourceService;
import com.merchant.server.businessservice.service.AppointmentNotificationService;
import com.merchant.server.businessservice.service.BusinessNotificationService;
import com.merchant.server.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PublicBookingServiceImpl implements PublicBookingService {

    private final MerchantServiceClient merchantServiceClient;
    private final GatewayWebSocketClient gatewayWebSocketClient;
    private final OnlineBookingConfigMapper onlineBookingConfigMapper;
    private final ServiceMapper serviceMapper;
    private final ServiceCategoryMapper serviceCategoryMapper;
    private final ResourceMapper resourceMapper;
    private final ResourceServiceExpertiseMapper resourceServiceExpertiseMapper;
    private final AppointmentMapper appointmentMapper;
    private final com.merchant.server.businessservice.service.AppointmentService appointmentService;
    private final CustomerService customerService;
    private final CustomerMapper customerMapper;
    private final ResourceService resourceService;
    private final AppointmentNotificationService notificationService;
    private final BusinessNotificationService businessNotificationService;

    @Override
    public PublicMerchantDTO getMerchantByCode(String merchantCode) {
        log.info("Getting public merchant info by code: {}", merchantCode);

        Long tenantId = getTenantIdByMerchantCode(merchantCode);
        if (tenantId == null) {
            log.warn("Merchant not found with code: {}", merchantCode);
            return null;
        }

        // 获取商户基础信息
        Map<String, Object> merchantInfo = getMerchantInfo(tenantId);
        if (merchantInfo == null) {
            return null;
        }

        // 获取在线预约配置
        OnlineBookingConfig bookingConfig = onlineBookingConfigMapper.findByTenantId(tenantId);

        // 构建公开商户信息
        PublicMerchantDTO dto = PublicMerchantDTO.builder()
            .tenantId(tenantId)
            .merchantCode(merchantCode)
            .merchantName(getStringValue(merchantInfo, "merchantName"))
            .address(getStringValue(merchantInfo, "address"))
            .city(getStringValue(merchantInfo, "city"))
            .province(getStringValue(merchantInfo, "province"))
            .country(getStringValue(merchantInfo, "country"))
            .postCode(getStringValue(merchantInfo, "postCode"))
            .contactPhone(getStringValue(merchantInfo, "contactPhone"))
            .contactEmail(getStringValue(merchantInfo, "contactEmail"))
            .timezone(getStringValue(merchantInfo, "timezone"))
            .build();

        // 设置经纬度
        if (merchantInfo.get("longitude") != null) {
            dto.setLongitude(new BigDecimal(merchantInfo.get("longitude").toString()));
        }
        if (merchantInfo.get("latitude") != null) {
            dto.setLatitude(new BigDecimal(merchantInfo.get("latitude").toString()));
        }

        // 设置在线预约配置
        if (bookingConfig != null) {
            dto.setOnlineBookingEnabled(bookingConfig.getEnabled());
            dto.setBrandColor(bookingConfig.getBookingWidgetColor());
            dto.setShowTechnicianPhotos(bookingConfig.getShowTechnicianPhotos());
            dto.setShowPopularServices(bookingConfig.getShowPopularServices());
            dto.setWelcomeMessage(bookingConfig.getWelcomeMessage());
            dto.setMinAdvanceHours(bookingConfig.getMinAdvanceHours());
            dto.setMaxAdvanceDays(bookingConfig.getAdvanceBookingDays());
            dto.setRequireDeposit(bookingConfig.getRequireDeposit());
            dto.setDepositAmount(bookingConfig.getDepositAmount());
            dto.setCancellationPolicy(bookingConfig.getCancellationPolicy());
            dto.setAllowCustomerCancel(bookingConfig.getAllowCustomerCancel());
            dto.setCancelDeadlineHours(bookingConfig.getCancelDeadlineHours());
            dto.setAllowCustomerReschedule(bookingConfig.getAllowCustomerReschedule());
            dto.setRescheduleDeadlineHours(bookingConfig.getRescheduleDeadlineHours());
            dto.setGooglePlaceId(bookingConfig.getGooglePlaceId());
            dto.setGoogleBusinessConnected(bookingConfig.getGoogleBusinessEnabled());
            dto.setLogoUrl(bookingConfig.getLogoUrl());

            // 构建预约页面URL
            if (bookingConfig.getBookingPageSlug() != null) {
                dto.setBookingPageUrl("/booking/" + bookingConfig.getBookingPageSlug());
            }
        }

        return dto;
    }

    @Override
    public List<PublicServiceDTO> getServicesByMerchantCode(String merchantCode) {
        log.info("Getting public services for merchant: {}", merchantCode);

        Long tenantId = getTenantIdByMerchantCode(merchantCode);
        if (tenantId == null) {
            return Collections.emptyList();
        }

        // 检查在线预约是否启用
        if (!isOnlineBookingEnabled(merchantCode)) {
            log.warn("Online booking not enabled for merchant: {}", merchantCode);
            return Collections.emptyList();
        }

        // 获取服务列表
        List<com.merchant.server.businessservice.entity.Service> services =
            serviceMapper.findByTenantIdAndStatus(tenantId, "ACTIVE");

        // 获取所有分类，用于填充categoryName
        List<ServiceCategory> categories = serviceCategoryMapper.selectByTenantId(tenantId);
        Map<Long, String> categoryNameMap = categories.stream()
            .collect(Collectors.toMap(ServiceCategory::getId, ServiceCategory::getName));

        // 获取各服务的预约次数
        List<Map<String, Object>> bookingCounts = appointmentMapper.countBookingsByServiceForTenant(tenantId);
        Map<Long, Integer> serviceBookingCountMap = new HashMap<>();
        for (Map<String, Object> row : bookingCounts) {
            Long serviceId = ((Number) row.get("serviceId")).longValue();
            Integer count = ((Number) row.get("bookingCount")).intValue();
            serviceBookingCountMap.put(serviceId, count);
        }

        // 根据服务总数按比例计算热门服务数量（约15%，最少1个，最多5个）
        int totalServices = services.size();
        int popularCount = Math.max(1, Math.min(5, (int) Math.ceil(totalServices * 0.15)));

        // 找出预约次数最多的服务作为热门服务
        Set<Long> popularServiceIds = bookingCounts.stream()
            .limit(popularCount)
            .map(row -> ((Number) row.get("serviceId")).longValue())
            .collect(Collectors.toSet());

        return services.stream()
            .map(service -> PublicServiceDTO.builder()
                .id(service.getId())
                .name(service.getName())
                .description(service.getDescription())
                .duration(service.getDuration())
                .price(service.getPrice())
                .categoryId(service.getCategoryId())
                .categoryName(service.getCategoryId() != null ? categoryNameMap.get(service.getCategoryId()) : null)
                .availableOnline(true)  // TODO: 从服务配置中读取
                .bookingCount(serviceBookingCountMap.getOrDefault(service.getId(), 0))
                .isPopular(popularServiceIds.contains(service.getId()))
                .build())
            .collect(Collectors.toList());
    }

    @Override
    public List<PublicResourceDTO> getStaffByMerchantCode(String merchantCode) {
        log.info("Getting public staff for merchant: {}", merchantCode);

        Long tenantId = getTenantIdByMerchantCode(merchantCode);
        if (tenantId == null) {
            return Collections.emptyList();
        }

        // 检查在线预约是否启用
        if (!isOnlineBookingEnabled(merchantCode)) {
            return Collections.emptyList();
        }

        // 获取员工列表（只获取STAFF类型且状态为ACTIVE的资源）
        List<Resource> resources = resourceMapper.findByTenantIdAndTypeAndStatus(
            tenantId, "STAFF", "ACTIVE");

        // 获取所有服务用于查找服务名称
        List<com.merchant.server.businessservice.entity.Service> allServices =
            serviceMapper.findByTenantIdAndStatus(tenantId, "ACTIVE");
        Map<Long, String> serviceNameMap = allServices.stream()
            .collect(Collectors.toMap(
                com.merchant.server.businessservice.entity.Service::getId,
                com.merchant.server.businessservice.entity.Service::getName
            ));

        return resources.stream()
            .map(resource -> {
                // 获取员工的服务专长
                List<ResourceServiceExpertise> expertise =
                    resourceServiceExpertiseMapper.findByResourceId(resource.getId());
                List<Long> serviceIds = expertise.stream()
                    .map(ResourceServiceExpertise::getServiceId)
                    .collect(Collectors.toList());

                // 统计高级专长（EXPERT或MASTER级别）数量
                List<ResourceServiceExpertise> seniorExpertise = expertise.stream()
                    .filter(e -> e.getSkillLevel() == ResourceServiceExpertise.SkillLevel.EXPERT
                              || e.getSkillLevel() == ResourceServiceExpertise.SkillLevel.MASTER)
                    .collect(Collectors.toList());

                int expertCount = seniorExpertise.size();
                boolean isSenior = expertCount > 0;

                // 保留specialties列表供其他用途，但前端主要使用isSenior标识
                List<String> specialties = seniorExpertise.stream()
                    .sorted((a, b) -> b.getSkillScore().compareTo(a.getSkillScore()))
                    .limit(2)
                    .map(e -> serviceNameMap.getOrDefault(e.getServiceId(), ""))
                    .filter(name -> !name.isEmpty())
                    .collect(Collectors.toList());

                return PublicResourceDTO.builder()
                    .id(resource.getId())
                    .name(resource.getName())
                    .avatar(resource.getAvatar())
                    .position(resource.getPosition())
                    .description(resource.getDescription())
                    .specialties(specialties)
                    .serviceIds(serviceIds)
                    .isSenior(isSenior)
                    .expertServiceCount(expertCount)
                    .build();
            })
            .collect(Collectors.toList());
    }

    @Override
    public PublicTimeSlotDTO getAvailableSlots(String merchantCode, LocalDate date,
                                                List<Long> serviceIds, Long resourceId) {
        log.info("Getting available slots for merchant: {}, date: {}, services: {}, resource: {}",
            merchantCode, date, serviceIds, resourceId);

        Long tenantId = getTenantIdByMerchantCode(merchantCode);
        if (tenantId == null) {
            return PublicTimeSlotDTO.builder().date(date).slots(Collections.emptyList()).build();
        }

        // 获取商户时区
        Map<String, Object> merchantInfo = getMerchantInfo(tenantId);
        String timezone = merchantInfo != null ? getStringValue(merchantInfo, "timezone") : null;
        ZoneId zoneId = (timezone != null && !timezone.isEmpty())
            ? ZoneId.of(timezone)
            : ZoneId.of("America/Vancouver"); // 默认温哥华时区

        log.debug("Using timezone: {} for merchant: {}", zoneId, merchantCode);

        // 获取在线预约配置
        OnlineBookingConfig config = onlineBookingConfigMapper.findByTenantId(tenantId);
        if (config == null || !Boolean.TRUE.equals(config.getEnabled())) {
            return PublicTimeSlotDTO.builder().date(date).slots(Collections.emptyList()).build();
        }

        // 计算总服务时长
        int totalDuration = 0;
        for (Long serviceId : serviceIds) {
            com.merchant.server.businessservice.entity.Service service = serviceMapper.findById(serviceId);
            if (service != null) {
                totalDuration += service.getDuration();
            }
        }

        // 使用商户时区计算当前时间
        ZonedDateTime nowInMerchantTz = ZonedDateTime.now(zoneId);
        LocalDate today = nowInMerchantTz.toLocalDate();
        LocalTime currentTime = nowInMerchantTz.toLocalTime();

        log.debug("Merchant timezone now: {}, today: {}, currentTime: {}", nowInMerchantTz, today, currentTime);

        // 验证日期范围
        LocalDate maxDate = today.plusDays(config.getAdvanceBookingDays());
        LocalDate minDate = today;

        // 考虑最少提前小时数
        if (config.getMinAdvanceHours() != null && config.getMinAdvanceHours() > 0) {
            ZonedDateTime minDateTime = nowInMerchantTz.plusHours(config.getMinAdvanceHours());
            if (minDateTime.toLocalDate().isAfter(today)) {
                minDate = minDateTime.toLocalDate();
            }
        }

        if (date.isBefore(minDate) || date.isAfter(maxDate)) {
            log.warn("Date {} is out of allowed range [{}, {}]", date, minDate, maxDate);
            return PublicTimeSlotDTO.builder().date(date).slots(Collections.emptyList()).build();
        }

        // 获取可用员工
        List<Resource> availableResources;
        if (resourceId != null) {
            Resource resource = resourceMapper.findById(resourceId);
            if (resource != null && resource.getStatus() == Resource.ResourceStatus.ACTIVE) {
                availableResources = Collections.singletonList(resource);
            } else {
                availableResources = Collections.emptyList();
            }
        } else {
            // 获取能提供所有选中服务的员工
            availableResources = getResourcesForServices(tenantId, serviceIds);
        }

        if (availableResources.isEmpty()) {
            return PublicTimeSlotDTO.builder().date(date).slots(Collections.emptyList()).build();
        }

        // 计算可用时间槽（传入商户时区的当前时间）
        List<PublicTimeSlotDTO.TimeSlot> slots = calculateAvailableSlots(
            availableResources, date, totalDuration, config.getMinAdvanceHours(), today, currentTime);

        return PublicTimeSlotDTO.builder()
            .date(date)
            .slots(slots)
            .build();
    }

    @Override
    @Transactional
    public PublicBookingResponseDTO createBooking(PublicBookingRequestDTO request) {
        log.info("Creating public booking for merchant: {}", request.getMerchantCode());

        Long tenantId = getTenantIdByMerchantCode(request.getMerchantCode());
        if (tenantId == null) {
            throw new IllegalArgumentException("商户不存在");
        }

        // 验证在线预约是否启用
        if (!isOnlineBookingEnabled(request.getMerchantCode())) {
            throw new IllegalStateException("该商户未启用在线预约");
        }

        // 获取或创建客户
        Long customerId = findOrCreateCustomer(tenantId, request);

        // 计算总时长和金额，构建服务列表
        int totalDuration = 0;
        BigDecimal totalAmount = BigDecimal.ZERO;
        List<PublicBookingResponseDTO.BookedService> bookedServices = new ArrayList<>();
        List<AppointmentCreateDTO.AppointmentServiceDTO> serviceDTOs = new ArrayList<>();

        for (Long serviceId : request.getServiceIds()) {
            com.merchant.server.businessservice.entity.Service service = serviceMapper.findById(serviceId);
            if (service == null) {
                throw new IllegalArgumentException("服务不存在: " + serviceId);
            }
            totalDuration += service.getDuration();
            totalAmount = totalAmount.add(service.getPrice());

            bookedServices.add(PublicBookingResponseDTO.BookedService.builder()
                .serviceId(service.getId())
                .serviceName(service.getName())
                .duration(service.getDuration())
                .price(service.getPrice())
                .build());

            // 构建服务DTO
            AppointmentCreateDTO.AppointmentServiceDTO serviceDTO = new AppointmentCreateDTO.AppointmentServiceDTO();
            serviceDTO.setServiceId(service.getId());
            serviceDTO.setServiceName(service.getName());
            serviceDTO.setPrice(service.getPrice());
            serviceDTO.setDuration(service.getDuration());
            serviceDTOs.add(serviceDTO);
        }

        // 计算预约结束时间
        LocalTime endTime = request.getStartTime().plusMinutes(totalDuration);

        // 选择资源（员工）
        Long selectedResourceId = request.getResourceId();
        String resourceName = null;
        if (selectedResourceId == null) {
            // 自动分配可用员工 - 需要检查员工在该时间段是否真正可用
            List<Resource> availableResources = getResourcesForServices(tenantId, request.getServiceIds());
            log.info("Auto-assign staff: found {} resources that can provide services {}",
                availableResources.size(), request.getServiceIds());

            Resource selectedResource = null;
            for (Resource resource : availableResources) {
                // 检查员工在该时间段是否可用（包括检查结束时间不超过下班时间）
                boolean available = isResourceAvailable(resource.getId(), request.getDate(), request.getStartTime(), endTime);
                log.info("Checking resource {} ({}): available={} for date={}, time={}-{}",
                    resource.getId(), resource.getName(), available, request.getDate(), request.getStartTime(), endTime);
                if (available) {
                    selectedResource = resource;
                    break;
                }
            }
            if (selectedResource != null) {
                selectedResourceId = selectedResource.getId();
                resourceName = selectedResource.getName();
                log.info("Auto-assigned staff: {} ({})", selectedResourceId, resourceName);
            } else if (!availableResources.isEmpty()) {
                // 如果没有找到在该时间段可用的员工，抛出异常
                log.warn("No available staff found for time slot {}-{} on {}", request.getStartTime(), endTime, request.getDate());
                throw new IllegalStateException("所选时间段没有可用的员工，请选择其他时间");
            }
        } else {
            // 指定了员工，也需要验证该员工在该时间段是否可用
            Resource resource = resourceMapper.findById(selectedResourceId);
            if (resource != null) {
                if (!isResourceAvailable(selectedResourceId, request.getDate(), request.getStartTime(), endTime)) {
                    throw new IllegalStateException("所选员工在该时间段不可用，请选择其他时间或员工");
                }
                resourceName = resource.getName();
            }
        }

        // 获取在线预约配置，判断是否自动确认
        OnlineBookingConfig bookingConfig = onlineBookingConfigMapper.findByTenantId(tenantId);
        boolean autoConfirm = bookingConfig == null || Boolean.TRUE.equals(bookingConfig.getAutoConfirmBooking());

        // 根据配置决定预约状态
        Appointment.AppointmentStatus initialStatus = autoConfirm
            ? Appointment.AppointmentStatus.CONFIRMED
            : Appointment.AppointmentStatus.PENDING_CONFIRMATION;

        log.info("Creating booking with autoConfirm={}, initialStatus={}", autoConfirm, initialStatus);

        // 构建预约创建DTO，使用 appointmentService.createAppointmentWithServices
        // 这样会正确创建：预约记录、预约服务、资源关联、时间占用（booking slot）
        AppointmentCreateDTO appointmentDTO = new AppointmentCreateDTO();
        appointmentDTO.setTenantId(tenantId);
        appointmentDTO.setCustomerId(customerId);
        appointmentDTO.setAppointmentDate(request.getDate());
        appointmentDTO.setAppointmentTime(request.getStartTime());
        appointmentDTO.setDuration(totalDuration);
        appointmentDTO.setTotalAmount(totalAmount);
        appointmentDTO.setStatus(initialStatus);
        appointmentDTO.setNotes(request.getNotes());
        appointmentDTO.setBookingSource("ONLINE");  // 标记为在线预约
        appointmentDTO.setServices(serviceDTOs);

        // 设置资源（员工）
        if (selectedResourceId != null) {
            List<AppointmentCreateDTO.SelectedResourceDTO> selectedResources = new ArrayList<>();
            AppointmentCreateDTO.SelectedResourceDTO resourceDTO = new AppointmentCreateDTO.SelectedResourceDTO();
            resourceDTO.setId(selectedResourceId);
            resourceDTO.setType("STAFF");
            selectedResources.add(resourceDTO);
            appointmentDTO.setSelectedResources(selectedResources);
        }

        // 使用 appointmentService 创建预约（会创建 booking slot 和 appointment_resources）
        // 跳过内部通知发送，因为新客户可能在事务中还未提交
        Appointment appointment = appointmentService.createAppointmentWithServices(appointmentDTO, true);

        log.info("Public booking created - appointmentId: {}, customerId: {}, date: {}, resourceId: {}",
            appointment.getId(), customerId, request.getDate(), selectedResourceId);

        // 手动设置客户信息并发送通知（避免事务可见性问题）
        if (appointment.getCustomer() == null) {
            // 从请求数据构建 Customer 对象用于通知
            Customer customer = new Customer();
            customer.setId(customerId);
            customer.setTenantId(tenantId);
            String name = request.getCustomerName();
            if (name != null && name.contains(" ")) {
                String[] parts = name.split(" ", 2);
                customer.setFirstName(parts[0]);
                customer.setLastName(parts[1]);
            } else {
                customer.setFirstName(name);
                customer.setLastName("");
            }
            customer.setPhone(request.getCustomerPhone());
            customer.setCountryCode(request.getCustomerCountryCode() != null ? request.getCustomerCountryCode() : "+1-CA");
            customer.setEmail(request.getCustomerEmail());
            customer.setCommunicationPreference(Customer.CommunicationPreference.BOTH); // 默认同时发送邮件和短信
            appointment.setCustomer(customer);
        }

        // 发送预约确认通知（只有已确认状态才发送）
        if (appointment.getStatus() == Appointment.AppointmentStatus.CONFIRMED) {
            try {
                notificationService.sendConfirmationNotification(appointment);
                log.info("Sent confirmation notification for appointment: {}", appointment.getId());
            } catch (Exception e) {
                log.error("Failed to send confirmation notification for appointment: {}", appointment.getId(), e);
            }
        }

        // 发送 WebSocket 实时通知给商户（异步，不影响预约创建）
        sendWebSocketNotification(tenantId, appointment, request.getCustomerName(), resourceName);

        // 获取商户信息
        Map<String, Object> merchantInfo = getMerchantInfo(tenantId);
        String merchantName = merchantInfo != null ? getStringValue(merchantInfo, "merchantName") : "";
        String merchantAddress = merchantInfo != null ? getStringValue(merchantInfo, "address") : "";
        String merchantPhone = merchantInfo != null ? getStringValue(merchantInfo, "contactPhone") : "";

        // 构建响应（不再生成单独的确认码，预约成功后系统会自动发送通知）
        return PublicBookingResponseDTO.builder()
            .bookingId(appointment.getId())
            .confirmationCode(String.valueOf(appointment.getId()))  // 使用预约ID作为确认码
            .status(appointment.getStatus().name())
            .date(request.getDate())
            .startTime(request.getStartTime())
            .endTime(request.getStartTime().plusMinutes(totalDuration))
            .duration(totalDuration)
            .totalAmount(totalAmount)
            .services(bookedServices)
            .resourceId(selectedResourceId)
            .resourceName(resourceName)
            .merchantName(merchantName)
            .merchantAddress(merchantAddress)
            .merchantPhone(merchantPhone)
            .customerName(request.getCustomerName())
            .customerPhone(request.getCustomerPhone())
            .customerEmail(request.getCustomerEmail())
            .createdAt(appointment.getCreatedAt())
            .build();
    }

    @Override
    public PublicBookingResponseDTO getBookingByConfirmationCode(String confirmationCode) {
        // TODO: 实现根据确认码查询预约
        log.info("Getting booking by confirmation code: {}", confirmationCode);
        return null;
    }

    @Override
    @Transactional
    public void cancelBooking(String confirmationCode, String reason) {
        // TODO: 实现取消预约
        log.info("Cancelling booking with confirmation code: {}, reason: {}", confirmationCode, reason);
    }

    @Override
    public boolean isOnlineBookingEnabled(String merchantCode) {
        Long tenantId = getTenantIdByMerchantCode(merchantCode);
        if (tenantId == null) {
            return false;
        }

        OnlineBookingConfig config = onlineBookingConfigMapper.findByTenantId(tenantId);
        return config != null && Boolean.TRUE.equals(config.getEnabled());
    }

    @Override
    public PublicBookingResponseDTO getBookingById(Long appointmentId) {
        log.info("Getting booking by ID: {}", appointmentId);

        Appointment appointment = appointmentMapper.findById(appointmentId);
        if (appointment == null) {
            log.warn("Appointment not found with ID: {}", appointmentId);
            return null;
        }

        return buildBookingResponse(appointment);
    }

    @Override
    public boolean canCancelBooking(Long appointmentId) {
        Appointment appointment = appointmentMapper.findById(appointmentId);
        if (appointment == null) {
            return false;
        }

        // 检查预约状态是否可以取消
        Appointment.AppointmentStatus status = appointment.getStatus();
        if (status == Appointment.AppointmentStatus.CANCELLED ||
            status == Appointment.AppointmentStatus.COMPLETED ||
            status == Appointment.AppointmentStatus.NO_SHOW) {
            return false;
        }

        // 检查是否在取消截止时间内
        OnlineBookingConfig config = onlineBookingConfigMapper.findByTenantId(appointment.getTenantId());
        if (config != null && config.getAllowCustomerCancel() != null && !config.getAllowCustomerCancel()) {
            return false;
        }

        if (config != null && config.getCancelDeadlineHours() != null) {
            LocalDateTime appointmentDateTime = LocalDateTime.of(
                appointment.getAppointmentDate(), appointment.getAppointmentTime());

            // 获取商户时区
            String timezone = "America/Vancouver"; // 默认时区
            try {
                Map<String, Object> merchantInfo = getMerchantInfo(appointment.getTenantId());
                if (merchantInfo != null && merchantInfo.get("timezone") != null) {
                    timezone = merchantInfo.get("timezone").toString();
                }
            } catch (Exception e) {
                log.warn("Failed to get merchant timezone, using default", e);
            }

            ZoneId zoneId = ZoneId.of(timezone);
            ZonedDateTime appointmentZoned = appointmentDateTime.atZone(zoneId);
            ZonedDateTime nowZoned = ZonedDateTime.now(zoneId);

            long hoursUntilAppointment = Duration.between(nowZoned, appointmentZoned).toHours();
            if (hoursUntilAppointment < config.getCancelDeadlineHours()) {
                return false;
            }
        }

        return true;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void cancelBookingById(Long appointmentId, Long customerId, String reason) {
        log.info("Cancelling booking ID: {} by customer: {}", appointmentId, customerId);

        Appointment appointment = appointmentMapper.findById(appointmentId);
        if (appointment == null) {
            throw new IllegalArgumentException("预约不存在");
        }

        // 验证客户ID
        if (!customerId.equals(appointment.getCustomerId())) {
            log.warn("Customer ID mismatch: expected {}, got {}", appointment.getCustomerId(), customerId);
            throw new IllegalArgumentException("无权取消此预约");
        }

        // 检查是否可以取消
        if (!canCancelBooking(appointmentId)) {
            throw new IllegalStateException("该预约已无法取消，可能已超过取消截止时间");
        }

        // 执行取消 - 以下操作在同一事务中
        appointment.setStatus(Appointment.AppointmentStatus.CANCELLED);
        String notes = appointment.getNotes() != null ? appointment.getNotes() : "";
        if (reason != null && !reason.isEmpty()) {
            notes += (notes.isEmpty() ? "" : "\n") + "[客户取消] " + reason;
        } else {
            notes += (notes.isEmpty() ? "" : "\n") + "[客户通过邮件链接取消]";
        }
        appointment.setNotes(notes);
        appointment.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));

        // 1. 更新预约状态
        appointmentMapper.update(appointment);
        log.info("Appointment {} status updated to CANCELLED", appointmentId);

        // 2. 释放员工可用性占用（同一事务，失败则回滚）
        resourceService.cancelBookingSlot(appointmentId);
        log.info("Released booking slot for appointment {}", appointmentId);

        // 3. 发送取消通知邮件（通过MQ异步发送，不影响事务）
        Customer customer = null;
        try {
            // 设置客户信息用于通知（使用客户的实际偏好设置）
            customer = customerMapper.selectById(appointment.getCustomerId());
            if (customer != null) {
                appointment.setCustomer(customer);
            }
            notificationService.sendCancellationNotification(appointment);
            log.info("Sent cancellation notification for appointment {}", appointmentId);
        } catch (Exception e) {
            // MQ发送失败不回滚事务，只记录日志
            log.error("Failed to send cancellation notification for appointment {}", appointmentId, e);
        }

        // 4. 创建业务通知（应用内通知，显示在商户后台）
        try {
            if (customer != null) {
                // 获取服务名称
                Long serviceId = appointment.getAppointmentServices() != null && !appointment.getAppointmentServices().isEmpty()
                    ? appointment.getAppointmentServices().get(0).getServiceId() : null;
                String serviceName = serviceId != null ? appointmentService.getServiceName(serviceId) : "Unknown Service";

                businessNotificationService.createAppointmentCancelledNotification(appointment, customer, serviceName, "en-US");
                log.info("Created business notification for cancelled appointment {}", appointmentId);
            }
        } catch (Exception e) {
            log.error("Failed to create business notification for cancelled appointment {}", appointmentId, e);
        }

        // 5. 发送 WebSocket 实时通知给商户（更新日历视图）
        String customerName = customer != null ? customer.getFullName() : "Unknown";
        sendCancellationWebSocketNotification(appointment.getTenantId(), appointment, customerName);
    }

    /**
     * 构建预约响应DTO
     */
    private PublicBookingResponseDTO buildBookingResponse(Appointment appointment) {
        // 获取客户信息
        Customer customer = customerMapper.selectById(appointment.getCustomerId());

        // 获取商户信息
        Map<String, Object> merchantInfo = getMerchantInfo(appointment.getTenantId());
        String merchantName = merchantInfo != null ? getStringValue(merchantInfo, "merchantName") : "";
        String merchantAddress = merchantInfo != null ? getStringValue(merchantInfo, "address") : "";
        String merchantPhone = merchantInfo != null ? getStringValue(merchantInfo, "contactPhone") : "";

        // 获取资源（员工）信息
        String resourceName = null;
        Long resourceId = null;
        if (appointment.getAppointmentResources() != null && !appointment.getAppointmentResources().isEmpty()) {
            AppointmentResource primaryResource = appointment.getAppointmentResources().stream()
                .filter(ar -> ar.getIsPrimary() != null && ar.getIsPrimary())
                .findFirst()
                .orElse(appointment.getAppointmentResources().get(0));

            if (primaryResource != null) {
                Resource resource = resourceMapper.findById(primaryResource.getResourceId());
                if (resource != null) {
                    resourceName = resource.getName();
                    resourceId = resource.getId();
                }
            }
        }

        // 获取服务信息
        List<PublicBookingResponseDTO.BookedService> services = new ArrayList<>();
        if (appointment.getAppointmentServices() != null) {
            for (AppointmentService as : appointment.getAppointmentServices()) {
                services.add(PublicBookingResponseDTO.BookedService.builder()
                    .serviceId(as.getServiceId())
                    .serviceName(as.getServiceName())
                    .duration(as.getDuration())
                    .price(as.getPrice())
                    .build());
            }
        }

        return PublicBookingResponseDTO.builder()
            .bookingId(appointment.getId())
            .confirmationCode(null) // 确认码字段暂未使用
            .status(appointment.getStatus().name())
            .date(appointment.getAppointmentDate())
            .startTime(appointment.getAppointmentTime())
            .endTime(appointment.getAppointmentTime().plusMinutes(appointment.getDuration()))
            .duration(appointment.getDuration())
            .totalAmount(appointment.getTotalAmount())
            .services(services)
            .resourceName(resourceName)
            .resourceId(resourceId)
            .merchantName(merchantName)
            .merchantAddress(merchantAddress)
            .merchantPhone(merchantPhone)
            .customerId(appointment.getCustomerId())
            .customerName(customer != null ? customer.getFullName() : null)
            .customerPhone(customer != null ? customer.getPhone() : null)
            .customerEmail(customer != null ? customer.getEmail() : null)
            .createdAt(appointment.getCreatedAt())
            .build();
    }

    // ==================== 辅助方法 ====================

    private Long getTenantIdByMerchantCode(String merchantCode) {
        // 直接通过 bookingPageSlug 查找配置（不使用缓存，确保 slug 变更后旧 slug 立即失效）
        try {
            OnlineBookingConfig config = onlineBookingConfigMapper.findByBookingPageSlug(merchantCode);
            if (config != null) {
                Long tenantId = config.getTenantId();
                log.info("Found tenant ID {} by booking page slug: {}", tenantId, merchantCode);
                return tenantId;
            }
        } catch (Exception e) {
            log.error("Failed to find tenant by booking page slug: {}", merchantCode, e);
        }

        log.warn("No online booking config found for slug: {}", merchantCode);
        return null;
    }

    private Map<String, Object> getMerchantInfo(Long tenantId) {
        try {
            ApiResponse<Map<String, Object>> response = merchantServiceClient.getMerchantByTenantId(tenantId);
            if (response != null && response.getData() != null) {
                return response.getData();
            }
        } catch (Exception e) {
            log.error("Failed to get merchant info for tenantId: {}", tenantId, e);
        }
        return null;
    }

    private String getStringValue(Map<String, Object> map, String key) {
        Object value = map.get(key);
        return value != null ? value.toString() : null;
    }

    private List<Resource> getResourcesForServices(Long tenantId, List<Long> serviceIds) {
        // 获取所有能提供这些服务的员工
        List<Resource> allResources = resourceMapper.findByTenantIdAndTypeAndStatus(
            tenantId, "STAFF", "ACTIVE");

        return allResources.stream()
            .filter(resource -> {
                List<ResourceServiceExpertise> expertise =
                    resourceServiceExpertiseMapper.findByResourceId(resource.getId());
                Set<Long> resourceServiceIds = expertise.stream()
                    .map(ResourceServiceExpertise::getServiceId)
                    .collect(Collectors.toSet());
                return resourceServiceIds.containsAll(serviceIds);
            })
            .collect(Collectors.toList());
    }

    private List<PublicTimeSlotDTO.TimeSlot> calculateAvailableSlots(
        List<Resource> resources, LocalDate date, int duration, Integer minAdvanceHours,
        LocalDate merchantToday, LocalTime merchantCurrentTime) {

        // 用于存储所有可能的时间槽及其可用资源
        Map<LocalTime, List<PublicTimeSlotDTO.AvailableResource>> slotResourceMap = new TreeMap<>();

        int slotInterval = 30; // 时间槽间隔（分钟）

        // Java的DayOfWeek: MONDAY=1, SUNDAY=7（与数据库一致）
        int dayOfWeek = date.getDayOfWeek().getValue();

        // 对每个员工，获取其当天的可用性
        for (Resource resource : resources) {
            // 获取该员工在这一天的可用时间段
            List<ResourceAvailability> availabilities = resourceMapper.findAvailabilitiesByResourceIdAndDay(
                resource.getId(), dayOfWeek);

            if (availabilities == null || availabilities.isEmpty()) {
                log.debug("Resource {} has no availability on day {}", resource.getId(), dayOfWeek);
                continue;
            }

            // 获取该员工当天已预约的时间段
            List<ResourceBookingSlot> bookedSlots = resourceMapper.findBookingSlotsByResourceIdAndDate(
                resource.getId(), date);

            // 对每个可用时间段生成时间槽
            for (ResourceAvailability availability : availabilities) {
                if (!Boolean.TRUE.equals(availability.getIsAvailable())) {
                    continue;
                }

                LocalTime workStart = availability.getStartTime();
                LocalTime workEnd = availability.getEndTime();

                // 从工作开始时间生成时间槽
                LocalTime slotStart = workStart;
                while (true) {
                    LocalTime slotEnd = slotStart.plusMinutes(duration);

                    // 确保服务结束时间不超过员工下班时间
                    if (slotEnd.isAfter(workEnd)) {
                        break;
                    }

                    // 检查是否满足最少提前小时数要求（使用商户时区的当前时间）
                    if (date.equals(merchantToday)) {
                        LocalTime minTime = merchantCurrentTime;
                        if (minAdvanceHours != null && minAdvanceHours > 0) {
                            minTime = merchantCurrentTime.plusHours(minAdvanceHours);
                        }
                        if (slotStart.isBefore(minTime)) {
                            slotStart = slotStart.plusMinutes(slotInterval);
                            continue;
                        }
                    }

                    // 检查是否与已有预约冲突
                    final LocalTime finalSlotStart = slotStart;
                    final LocalTime finalSlotEnd = slotEnd;
                    boolean hasConflict = bookedSlots.stream()
                        .filter(bs -> bs.getStatus() == ResourceBookingSlot.BookingStatus.BOOKED)
                        .anyMatch(bs -> isTimeOverlap(finalSlotStart, finalSlotEnd, bs.getStartTime(), bs.getEndTime()));

                    if (!hasConflict) {
                        // 将此资源添加到该时间槽
                        slotResourceMap.computeIfAbsent(slotStart, k -> new ArrayList<>())
                            .add(PublicTimeSlotDTO.AvailableResource.builder()
                                .resourceId(resource.getId())
                                .resourceName(resource.getName())
                                .avatar(resource.getAvatar())
                                .build());
                    }

                    slotStart = slotStart.plusMinutes(slotInterval);
                }
            }
        }

        // 转换为结果列表
        List<PublicTimeSlotDTO.TimeSlot> slots = new ArrayList<>();
        for (Map.Entry<LocalTime, List<PublicTimeSlotDTO.AvailableResource>> entry : slotResourceMap.entrySet()) {
            LocalTime startTime = entry.getKey();
            List<PublicTimeSlotDTO.AvailableResource> availableResources = entry.getValue();

            if (!availableResources.isEmpty()) {
                slots.add(PublicTimeSlotDTO.TimeSlot.builder()
                    .startTime(startTime)
                    .endTime(startTime.plusMinutes(duration))
                    .availableResources(availableResources)
                    .build());
            }
        }

        return slots;
    }

    /**
     * 检查两个时间段是否重叠
     */
    private boolean isTimeOverlap(LocalTime start1, LocalTime end1, LocalTime start2, LocalTime end2) {
        // 如果一个时间段的结束时间早于或等于另一个的开始时间，则不重叠
        return !(end1.compareTo(start2) <= 0 || end2.compareTo(start1) <= 0);
    }

    /**
     * 检查资源在指定时间段是否可用
     * （供创建预约时使用）
     */
    private boolean isResourceAvailable(Long resourceId, LocalDate date, LocalTime startTime, LocalTime endTime) {
        // Java的DayOfWeek: MONDAY=1, SUNDAY=7
        int dayOfWeek = date.getDayOfWeek().getValue();

        // 1. 检查是否在员工的工作时间内
        List<ResourceAvailability> availabilities = resourceMapper.findAvailabilitiesByResourceIdAndDay(
            resourceId, dayOfWeek);

        if (availabilities == null || availabilities.isEmpty()) {
            log.debug("Resource {} has no availability config for dayOfWeek {}", resourceId, dayOfWeek);
            return false;
        }

        boolean withinWorkHours = availabilities.stream()
            .filter(a -> Boolean.TRUE.equals(a.getIsAvailable()))
            .anyMatch(a -> !startTime.isBefore(a.getStartTime()) && !endTime.isAfter(a.getEndTime()));

        if (!withinWorkHours) {
            log.debug("Resource {} not within work hours: requested {}-{}, availabilities: {}",
                resourceId, startTime, endTime,
                availabilities.stream()
                    .filter(a -> Boolean.TRUE.equals(a.getIsAvailable()))
                    .map(a -> a.getStartTime() + "-" + a.getEndTime())
                    .collect(java.util.stream.Collectors.toList()));
            return false;
        }

        // 2. 检查是否与已有预约冲突
        boolean isBooked = resourceMapper.isResourceBookedInTimeSlot(resourceId, date, startTime, endTime);
        if (isBooked) {
            log.debug("Resource {} is already booked in time slot {}-{} on {}", resourceId, startTime, endTime, date);
        }
        return !isBooked;
    }

    private Long findOrCreateCustomer(Long tenantId, PublicBookingRequestDTO request) {
        // 电话号码应该是纯号码（不含国家代码前缀）
        String phone = request.getCustomerPhone();
        // 如果前端还是发送了带国家代码的格式，提取纯号码
        String purePhone = extractPurePhone(phone);

        log.debug("Looking up customer - phone: {}, purePhone: {}", phone, purePhone);

        // 1. 尝试根据纯手机号查找客户
        try {
            CustomerDTO existingCustomer = customerService.getCustomerByPhone(tenantId, purePhone);
            if (existingCustomer != null) {
                log.info("Found existing customer by phone: {}", existingCustomer.getId());
                return existingCustomer.getId();
            }
        } catch (Exception e) {
            log.debug("Customer not found by phone: {}", purePhone);
        }

        // 2. 尝试根据邮箱查找客户
        if (request.getCustomerEmail() != null && !request.getCustomerEmail().isEmpty()) {
            try {
                CustomerDTO existingCustomer = customerService.getCustomerByEmail(tenantId, request.getCustomerEmail());
                if (existingCustomer != null) {
                    log.info("Found existing customer by email: {}", existingCustomer.getId());
                    return existingCustomer.getId();
                }
            } catch (Exception e) {
                log.debug("Customer not found by email: {}", request.getCustomerEmail());
            }
        }

        // 3. 创建新客户
        log.info("Creating new customer for phone: {}", purePhone);
        CustomerDTO newCustomer = new CustomerDTO();
        newCustomer.setTenantId(tenantId);
        newCustomer.setPhone(purePhone);  // 存储纯电话号码（不含国家代码前缀）

        // 设置国家码（从单独的字段获取）
        String countryCode = request.getCustomerCountryCode();
        if (countryCode != null && !countryCode.isEmpty()) {
            newCustomer.setCountryCode(countryCode);  // 格式如 "+1-CA"
        } else {
            newCustomer.setCountryCode("+1-CA");  // 默认加拿大
        }

        newCustomer.setEmail(request.getCustomerEmail());

        // 解析姓名
        String name = request.getCustomerName();
        if (name != null && name.contains(" ")) {
            String[] parts = name.split(" ", 2);
            newCustomer.setFirstName(parts[0]);
            newCustomer.setLastName(parts[1]);
        } else {
            newCustomer.setFirstName(name);
            newCustomer.setLastName("");
        }

        newCustomer.setStatus(Customer.CustomerStatus.ACTIVE);
        newCustomer.setCommunicationPreference(Customer.CommunicationPreference.BOTH); // 默认同时发送邮件和短信
        newCustomer.setNotes("Source: ONLINE_BOOKING");

        CustomerDTO created = customerService.createCustomer(newCustomer);
        return created.getId();
    }

    /**
     * 提取纯电话号码（去掉国家代码）
     * 例如: "+1 2506869867" -> "2506869867"
     *       "+86 13812345678" -> "13812345678"
     *       "2506869867" -> "2506869867"
     */
    private String extractPurePhone(String phone) {
        if (phone == null || phone.isEmpty()) {
            return phone;
        }
        // 去掉所有空格
        String cleaned = phone.replaceAll("\\s+", "");
        // 如果以+开头，去掉国家代码部分
        if (cleaned.startsWith("+")) {
            // 常见格式: +1xxx (北美), +86xxx (中国), +44xxx (英国) 等
            // 去掉+和国家代码（1-3位数字）
            cleaned = cleaned.replaceFirst("^\\+\\d{1,3}", "");
        }
        return cleaned;
    }


    @Override
    public PublicCustomerDTO lookupCustomer(String merchantCode, String phone, String email) {
        Long tenantId = getTenantIdByMerchantCode(merchantCode);
        if (tenantId == null) {
            return null;
        }

        Customer customer = null;

        // 优先通过手机号查找
        if (phone != null && !phone.isEmpty()) {
            customer = customerMapper.selectByTenantIdAndPhone(tenantId, phone);
        }

        // 如果手机号未找到，尝试邮箱
        if (customer == null && email != null && !email.isEmpty()) {
            customer = customerMapper.selectByTenantIdAndEmail(tenantId, email);
        }

        if (customer == null) {
            return null;
        }

        // 转换为公开DTO（只返回基本信息）
        PublicCustomerDTO dto = new PublicCustomerDTO();
        dto.setId(customer.getId());
        dto.setFirstName(customer.getFirstName());
        dto.setLastName(customer.getLastName());
        dto.setPhone(customer.getPhone());
        dto.setEmail(customer.getEmail());

        return dto;
    }

    /**
     * 发送 WebSocket 实时通知给商户
     * 异步执行，不影响预约创建流程
     */
    private void sendWebSocketNotification(Long tenantId, Appointment appointment, String customerName, String resourceName) {
        try {
            // 构建通知数据
            Map<String, Object> notificationData = new HashMap<>();
            notificationData.put("appointmentId", appointment.getId());
            notificationData.put("date", appointment.getAppointmentDate().toString());
            notificationData.put("time", appointment.getAppointmentTime().toString());
            notificationData.put("duration", appointment.getDuration());
            notificationData.put("customerName", customerName);
            notificationData.put("resourceName", resourceName);
            notificationData.put("status", appointment.getStatus().name());
            notificationData.put("bookingSource", "ONLINE");

            ObjectMapper objectMapper = new ObjectMapper();
            String dataJson = objectMapper.writeValueAsString(notificationData);

            // 发送通知
            GatewayWebSocketClient.WebSocketNotificationRequest request =
                new GatewayWebSocketClient.WebSocketNotificationRequest(tenantId, "NEW_APPOINTMENT", dataJson);

            gatewayWebSocketClient.sendNotification(request);
            log.info("[WebSocket] Notification sent for new online appointment - tenantId: {}, appointmentId: {}",
                tenantId, appointment.getId());

        } catch (Exception e) {
            // 通知失败不影响预约创建
            log.warn("[WebSocket] Failed to send notification for appointment {}: {}", appointment.getId(), e.getMessage());
        }
    }

    /**
     * 发送预约取消的 WebSocket 实时通知给商户
     * 前端收到后可以实时更新日历视图，释放时间槽
     */
    private void sendCancellationWebSocketNotification(Long tenantId, Appointment appointment, String customerName) {
        try {
            // 构建通知数据
            Map<String, Object> notificationData = new HashMap<>();
            notificationData.put("appointmentId", appointment.getId());
            notificationData.put("date", appointment.getAppointmentDate().toString());
            notificationData.put("time", appointment.getAppointmentTime().toString());
            notificationData.put("duration", appointment.getDuration());
            notificationData.put("customerName", customerName);
            notificationData.put("status", "CANCELLED");

            ObjectMapper objectMapper = new ObjectMapper();
            String dataJson = objectMapper.writeValueAsString(notificationData);

            // 发送通知
            GatewayWebSocketClient.WebSocketNotificationRequest request =
                new GatewayWebSocketClient.WebSocketNotificationRequest(tenantId, "APPOINTMENT_CANCELLED", dataJson);

            gatewayWebSocketClient.sendNotification(request);
            log.info("[WebSocket] Cancellation notification sent - tenantId: {}, appointmentId: {}",
                tenantId, appointment.getId());

        } catch (Exception e) {
            // 通知失败不影响取消流程
            log.warn("[WebSocket] Failed to send cancellation notification for appointment {}: {}", appointment.getId(), e.getMessage());
        }
    }
}
