package com.merchant.server.businessservice.service.impl;

import com.merchant.server.businessservice.client.MerchantServiceClient;
import com.merchant.server.businessservice.dto.google.*;
import com.merchant.server.businessservice.dto.CustomerDTO;
import com.merchant.server.businessservice.entity.*;
import com.merchant.server.businessservice.mapper.*;
import com.merchant.server.businessservice.service.CustomerService;
import com.merchant.server.businessservice.service.GoogleBookingService;
import com.merchant.server.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Google Reserve with Google 服务实现
 * 实现 Google Maps Booking API v3 规范
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleBookingServiceImpl implements GoogleBookingService {

    private final MerchantServiceClient merchantServiceClient;
    private final OnlineBookingConfigMapper onlineBookingConfigMapper;
    private final ServiceMapper serviceMapper;
    private final ResourceMapper resourceMapper;
    private final AppointmentMapper appointmentMapper;
    private final CustomerService customerService;
    private final GoogleBookingSyncMapper googleBookingSyncMapper;

    private static final DateTimeFormatter RFC3339_FORMATTER =
        DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ssXXX");

    // ==================== Booking Server API ====================

    @Override
    public GoogleHealthCheckResponse healthCheck() {
        return GoogleHealthCheckResponse.builder()
            .status("SERVING")
            .build();
    }

    @Override
    public GoogleAvailabilityResponseDTO checkAvailability(GoogleAvailabilityRequestDTO request) {
        log.info("Google API: Checking availability for slot: {}", request.getSlot());

        GoogleSlotDTO slot = request.getSlot();

        // 解析商户ID获取租户ID
        Long tenantId = parseMerchantIdToTenantId(slot.getMerchantId());
        if (tenantId == null) {
            return buildAvailabilityErrorResponse(slot, 0);
        }

        // 检查在线预约是否启用
        OnlineBookingConfig config = onlineBookingConfigMapper.findByTenantId(tenantId);
        if (config == null || !Boolean.TRUE.equals(config.getEnabled())
            || !Boolean.TRUE.equals(config.getGoogleBusinessEnabled())) {
            return buildAvailabilityErrorResponse(slot, 0);
        }

        // 解析时间
        ZonedDateTime startDateTime = ZonedDateTime.parse(slot.getStartTime());
        ZonedDateTime endDateTime = ZonedDateTime.parse(slot.getEndTime());
        LocalDate date = startDateTime.toLocalDate();
        LocalTime startTime = startDateTime.toLocalTime();
        LocalTime endTime = endDateTime.toLocalTime();

        // 获取服务
        Long serviceId = parseServiceId(slot.getServiceId());
        if (serviceId == null) {
            return buildAvailabilityErrorResponse(slot, 0);
        }

        // 检查资源可用性
        Long resourceId = null;
        if (slot.getResourceIds() != null && slot.getResourceIds().getStaffId() != null) {
            resourceId = parseResourceId(slot.getResourceIds().getStaffId());
        }

        int availableCount = checkSlotAvailability(tenantId, serviceId, resourceId, date, startTime, endTime);

        return GoogleAvailabilityResponseDTO.builder()
            .slot(slot)
            .countAvailable(availableCount)
            .durationRequirement("DURATION_REQUIREMENT_UNSPECIFIED")
            .build();
    }

    @Override
    @Transactional
    public GoogleBookingResponseDTO createBooking(GoogleBookingRequestDTO request) {
        log.info("Google API: Creating booking for slot: {}", request.getSlot());

        try {
            // 检查幂等性
            if (request.getIdempotencyToken() != null) {
                GoogleBookingSyncEntity existing = googleBookingSyncMapper.findByIdempotencyToken(
                    request.getIdempotencyToken());
                if (existing != null) {
                    return getBookingStatus(existing.getGoogleBookingId());
                }
            }

            GoogleSlotDTO slot = request.getSlot();

            // 解析商户ID
            Long tenantId = parseMerchantIdToTenantId(slot.getMerchantId());
            if (tenantId == null) {
                return buildBookingFailureResponse("SLOT_UNAVAILABLE", "Invalid merchant ID");
            }

            // 检查可用性
            Long serviceId = parseServiceId(slot.getServiceId());
            ZonedDateTime startDateTime = ZonedDateTime.parse(slot.getStartTime());
            ZonedDateTime endDateTime = ZonedDateTime.parse(slot.getEndTime());
            LocalDate date = startDateTime.toLocalDate();
            LocalTime startTime = startDateTime.toLocalTime();

            // 获取服务信息
            com.merchant.server.businessservice.entity.Service service = serviceMapper.findById(serviceId);
            if (service == null) {
                return buildBookingFailureResponse("SLOT_UNAVAILABLE", "Service not found");
            }

            // 处理用户信息
            GoogleBookingRequestDTO.UserInformation userInfo = request.getUserInformation();
            Long customerId = findOrCreateGoogleCustomer(tenantId, userInfo);

            // 选择资源
            Long resourceId = null;
            if (slot.getResourceIds() != null && slot.getResourceIds().getStaffId() != null) {
                resourceId = parseResourceId(slot.getResourceIds().getStaffId());
            } else {
                resourceId = findAvailableResource(tenantId, serviceId, date, startTime);
            }

            // 创建预约
            Appointment appointment = new Appointment();
            appointment.setTenantId(tenantId);
            appointment.setCustomerId(customerId);
            appointment.setAppointmentDate(date);
            appointment.setAppointmentTime(startTime);
            appointment.setDuration(service.getDuration());
            appointment.setTotalAmount(service.getPrice());
            appointment.setStatus(Appointment.AppointmentStatus.CONFIRMED);
            appointment.setPaid(false);
            appointment.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
            appointment.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));

            appointmentMapper.insert(appointment);

            // 创建预约服务关联
            AppointmentService appointmentService = new AppointmentService();
            appointmentService.setAppointmentId(appointment.getId());
            appointmentService.setServiceId(serviceId);
            appointmentService.setServiceName(service.getName());
            appointmentService.setPrice(service.getPrice());
            appointmentService.setDuration(service.getDuration());
            appointmentMapper.insertAppointmentServices(Collections.singletonList(appointmentService));

            // 生成 Google Booking ID
            String googleBookingId = "GB_" + tenantId + "_" + appointment.getId() + "_" + System.currentTimeMillis();

            // 保存同步记录
            GoogleBookingSyncEntity syncEntity = new GoogleBookingSyncEntity();
            syncEntity.setTenantId(tenantId);
            syncEntity.setAppointmentId(appointment.getId());
            syncEntity.setGoogleBookingId(googleBookingId);
            syncEntity.setIdempotencyToken(request.getIdempotencyToken());
            syncEntity.setSyncStatus("SYNCED");
            syncEntity.setLastSyncAt(LocalDateTime.now(ZoneOffset.UTC));
            syncEntity.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
            syncEntity.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
            googleBookingSyncMapper.insert(syncEntity);

            // 构建响应
            return GoogleBookingResponseDTO.builder()
                .booking(GoogleBookingResponseDTO.GoogleBooking.builder()
                    .bookingId(googleBookingId)
                    .slot(slot)
                    .userInformation(userInfo)
                    .status("CONFIRMED")
                    .build())
                .build();

        } catch (Exception e) {
            log.error("Failed to create Google booking", e);
            return buildBookingFailureResponse("CAUSE_UNSPECIFIED", e.getMessage());
        }
    }

    @Override
    @Transactional
    public GoogleBookingResponseDTO updateBooking(String bookingId, GoogleBookingRequestDTO request) {
        log.info("Google API: Updating booking: {}", bookingId);

        // 查找同步记录
        GoogleBookingSyncEntity syncEntity = googleBookingSyncMapper.findByGoogleBookingId(bookingId);
        if (syncEntity == null) {
            return buildBookingFailureResponse("BOOKING_NOT_FOUND", "Booking not found");
        }

        // 获取预约
        Appointment appointment = appointmentMapper.findById(syncEntity.getAppointmentId());
        if (appointment == null) {
            return buildBookingFailureResponse("BOOKING_NOT_FOUND", "Appointment not found");
        }

        // 检查是否可以更新（取消）
        GoogleSlotDTO slot = request.getSlot();
        if (slot != null) {
            // 更新时间段
            ZonedDateTime startDateTime = ZonedDateTime.parse(slot.getStartTime());
            ZonedDateTime endDateTime = ZonedDateTime.parse(slot.getEndTime());

            appointment.setAppointmentDate(startDateTime.toLocalDate());
            appointment.setAppointmentTime(startDateTime.toLocalTime());
            appointment.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));

            appointmentMapper.update(appointment);
        }

        // 更新同步状态
        syncEntity.setLastSyncAt(LocalDateTime.now(ZoneOffset.UTC));
        syncEntity.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
        googleBookingSyncMapper.update(syncEntity);

        return GoogleBookingResponseDTO.builder()
            .booking(GoogleBookingResponseDTO.GoogleBooking.builder()
                .bookingId(bookingId)
                .slot(slot)
                .status(appointment.getStatus().name())
                .build())
            .build();
    }

    @Override
    public GoogleBookingResponseDTO getBookingStatus(String bookingId) {
        log.info("Google API: Getting booking status: {}", bookingId);

        GoogleBookingSyncEntity syncEntity = googleBookingSyncMapper.findByGoogleBookingId(bookingId);
        if (syncEntity == null) {
            return buildBookingFailureResponse("BOOKING_NOT_FOUND", "Booking not found");
        }

        Appointment appointment = appointmentMapper.findById(syncEntity.getAppointmentId());
        if (appointment == null) {
            return buildBookingFailureResponse("BOOKING_NOT_FOUND", "Appointment not found");
        }

        String googleStatus = mapAppointmentStatusToGoogleStatus(appointment.getStatus());

        return GoogleBookingResponseDTO.builder()
            .booking(GoogleBookingResponseDTO.GoogleBooking.builder()
                .bookingId(bookingId)
                .status(googleStatus)
                .build())
            .build();
    }

    @Override
    public GoogleListBookingsResponse listBookings(String merchantId, String userId) {
        log.info("Google API: Listing bookings for merchant: {}, user: {}", merchantId, userId);

        Long tenantId = parseMerchantIdToTenantId(merchantId);
        if (tenantId == null) {
            return GoogleListBookingsResponse.builder()
                .bookings(Collections.emptyList())
                .build();
        }

        List<GoogleBookingSyncEntity> syncEntities = googleBookingSyncMapper.findByTenantId(tenantId);

        List<GoogleBookingResponseDTO.GoogleBooking> bookings = syncEntities.stream()
            .map(sync -> {
                Appointment appointment = appointmentMapper.findById(sync.getAppointmentId());
                if (appointment == null) return null;

                return GoogleBookingResponseDTO.GoogleBooking.builder()
                    .bookingId(sync.getGoogleBookingId())
                    .status(mapAppointmentStatusToGoogleStatus(appointment.getStatus()))
                    .build();
            })
            .filter(Objects::nonNull)
            .collect(Collectors.toList());

        return GoogleListBookingsResponse.builder()
            .bookings(bookings)
            .build();
    }

    // ==================== Feeds API ====================

    @Override
    public GoogleMerchantFeedDTO getMerchantFeed() {
        log.info("Google API: Generating merchant feed");

        List<OnlineBookingConfig> configs = onlineBookingConfigMapper.findAllGoogleEnabled();

        List<GoogleMerchantFeedDTO.Merchant> merchants = configs.stream()
            .map(config -> {
                Map<String, Object> merchantInfo = getMerchantInfo(config.getTenantId());
                if (merchantInfo == null) return null;

                String timezone = getStringValue(merchantInfo, "timezone");
                if (timezone == null) timezone = "America/Vancouver";

                // 获取营业时间并转换为 Google 格式
                Map<String, Map<String, Object>> businessHours = getBusinessHours(config.getTenantId());
                GoogleMerchantFeedDTO.RegularHours regularHours = buildRegularHours(businessHours);

                return GoogleMerchantFeedDTO.Merchant.builder()
                    .merchantId("M_" + config.getTenantId())
                    .name(getStringValue(merchantInfo, "merchantName"))
                    .telephone(getStringValue(merchantInfo, "contactPhone"))
                    .category("beauty_salon")  // 可以从配置中读取
                    .geo(GoogleMerchantFeedDTO.Geo.builder()
                        .latitude(getDoubleValue(merchantInfo, "latitude"))
                        .longitude(getDoubleValue(merchantInfo, "longitude"))
                        .build())
                    .timeZone(GoogleMerchantFeedDTO.TimeZone.builder()
                        .timeZoneId(timezone)
                        .build())
                    .location(GoogleMerchantFeedDTO.Location.builder()
                        .placeId(config.getGooglePlaceId())
                        .address(GoogleMerchantFeedDTO.Address.builder()
                            .country(getStringValue(merchantInfo, "country"))
                            .administrativeArea(getStringValue(merchantInfo, "province"))
                            .locality(getStringValue(merchantInfo, "city"))
                            .postalCode(getStringValue(merchantInfo, "postCode"))
                            .streetAddress(getStringValue(merchantInfo, "address"))
                            .build())
                        .build())
                    .regularHours(regularHours)
                    .build();
            })
            .filter(Objects::nonNull)
            .collect(Collectors.toList());

        return GoogleMerchantFeedDTO.builder()
            .merchants(merchants)
            .build();
    }

    /**
     * 构建 Google 格式的常规营业时间
     * @param businessHours 营业时间配置
     * @return Google RegularHours 对象
     */
    private GoogleMerchantFeedDTO.RegularHours buildRegularHours(Map<String, Map<String, Object>> businessHours) {
        List<GoogleMerchantFeedDTO.TimePeriod> timePeriods = new ArrayList<>();

        // 默认营业时间：周一到周六 9:00-18:00
        String[] days = {"MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"};
        String[] dayKeys = {"monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"};

        for (int i = 0; i < days.length; i++) {
            String day = days[i];
            String dayKey = dayKeys[i];

            String openTime = "09:00";
            String closeTime = "18:00";
            boolean closed = (i == 6); // 默认周日休息

            if (businessHours != null && businessHours.get(dayKey) != null) {
                Map<String, Object> daySchedule = businessHours.get(dayKey);
                try {
                    if (daySchedule.get("closed") != null) {
                        closed = (Boolean) daySchedule.get("closed");
                    }
                    if (daySchedule.get("start") != null) {
                        openTime = (String) daySchedule.get("start");
                    }
                    if (daySchedule.get("end") != null) {
                        closeTime = (String) daySchedule.get("end");
                    }
                } catch (Exception e) {
                    log.warn("Failed to parse business hours for {}: {}", dayKey, e.getMessage());
                }
            }

            // 如果当天不休息，添加营业时间
            if (!closed) {
                timePeriods.add(GoogleMerchantFeedDTO.TimePeriod.builder()
                    .openDay(day)
                    .openTime(openTime)
                    .closeDay(day)
                    .closeTime(closeTime)
                    .build());
            }
        }

        return GoogleMerchantFeedDTO.RegularHours.builder()
            .timePeriods(timePeriods)
            .build();
    }

    @Override
    public GoogleServiceFeedDTO getServiceFeed() {
        log.info("Google API: Generating service feed");

        List<OnlineBookingConfig> configs = onlineBookingConfigMapper.findAllGoogleEnabled();

        List<GoogleServiceFeedDTO.Service> services = new ArrayList<>();

        for (OnlineBookingConfig config : configs) {
            List<com.merchant.server.businessservice.entity.Service> tenantServices =
                serviceMapper.findByTenantIdAndStatus(config.getTenantId(), "ACTIVE");

            for (com.merchant.server.businessservice.entity.Service service : tenantServices) {
                // 转换价格为 Google 格式
                BigDecimal price = service.getPrice() != null ? service.getPrice() : BigDecimal.ZERO;
                long units = price.longValue();
                int nanos = price.remainder(BigDecimal.ONE).multiply(BigDecimal.valueOf(1_000_000_000)).intValue();

                services.add(GoogleServiceFeedDTO.Service.builder()
                    .merchantId("M_" + config.getTenantId())
                    .serviceId("S_" + service.getId())
                    .name(service.getName())
                    .description(service.getDescription())
                    .durationSec((long) service.getDuration() * 60)  // 分钟转秒
                    .type("SERVICE_TYPE_APPOINTMENT")
                    .price(GoogleServiceFeedDTO.Price.builder()
                        .priceType("FIXED_RATE_DEFAULT")
                        .currencyCode("CAD")  // 可以从商户配置读取
                        .units(units)
                        .nanos(nanos)
                        .build())
                    .rules(GoogleServiceFeedDTO.SchedulingRules.builder()
                        .minAdvanceBooking((long) config.getMinAdvanceHours() * 3600)
                        .maxAdvanceBooking((long) config.getAdvanceBookingDays() * 86400)
                        .minAdvanceCancellation((long) config.getCancelDeadlineHours() * 3600)
                        .build())
                    .build());
            }
        }

        return GoogleServiceFeedDTO.builder()
            .services(services)
            .build();
    }

    @Override
    public GoogleAvailabilityFeedDTO getAvailabilityFeed(LocalDate startDate, LocalDate endDate) {
        log.info("Google API: Generating availability feed from {} to {}", startDate, endDate);

        List<OnlineBookingConfig> configs = onlineBookingConfigMapper.findAllGoogleEnabled();

        List<GoogleAvailabilityFeedDTO.ServiceAvailability> allAvailability = new ArrayList<>();

        for (OnlineBookingConfig config : configs) {
            allAvailability.addAll(
                generateAvailabilityForMerchant(config, startDate, endDate));
        }

        return GoogleAvailabilityFeedDTO.builder()
            .metadata(GoogleAvailabilityFeedDTO.FeedMetadata.builder()
                .processingInstruction("PROCESS_FULL")
                .shardNumber(0)
                .totalShards(1)
                .generationTimestamp(ZonedDateTime.now(ZoneOffset.UTC).format(RFC3339_FORMATTER))
                .build())
            .serviceAvailability(allAvailability)
            .build();
    }

    @Override
    public GoogleAvailabilityFeedDTO getAvailabilityFeedByMerchant(
            String merchantId, LocalDate startDate, LocalDate endDate) {

        Long tenantId = parseMerchantIdToTenantId(merchantId);
        if (tenantId == null) {
            return GoogleAvailabilityFeedDTO.builder()
                .serviceAvailability(Collections.emptyList())
                .build();
        }

        OnlineBookingConfig config = onlineBookingConfigMapper.findByTenantId(tenantId);
        if (config == null) {
            return GoogleAvailabilityFeedDTO.builder()
                .serviceAvailability(Collections.emptyList())
                .build();
        }

        List<GoogleAvailabilityFeedDTO.ServiceAvailability> availability =
            generateAvailabilityForMerchant(config, startDate, endDate);

        return GoogleAvailabilityFeedDTO.builder()
            .metadata(GoogleAvailabilityFeedDTO.FeedMetadata.builder()
                .processingInstruction("PROCESS_INCREMENTAL")
                .generationTimestamp(ZonedDateTime.now(ZoneOffset.UTC).format(RFC3339_FORMATTER))
                .build())
            .serviceAvailability(availability)
            .build();
    }

    // ==================== 实时更新 API ====================

    @Override
    public void sendRealTimeAvailabilityUpdate(String merchantId, String serviceId) {
        // TODO: 实现向 Google 发送实时可用性更新
        // 需要调用 Google 的 RTU (Real-Time Updates) API
        log.info("Sending real-time availability update for merchant: {}, service: {}", merchantId, serviceId);
    }

    @Override
    public void sendBookingStatusUpdate(String googleBookingId, String status) {
        // TODO: 实现向 Google 发送预约状态更新
        log.info("Sending booking status update for booking: {}, status: {}", googleBookingId, status);
    }

    // ==================== 辅助方法 ====================

    private Long parseMerchantIdToTenantId(String merchantId) {
        if (merchantId == null) return null;
        try {
            // 格式: M_<tenantId>
            if (merchantId.startsWith("M_")) {
                return Long.parseLong(merchantId.substring(2));
            }
            return Long.parseLong(merchantId);
        } catch (NumberFormatException e) {
            log.warn("Invalid merchant ID format: {}", merchantId);
            return null;
        }
    }

    private Long parseServiceId(String serviceId) {
        if (serviceId == null) return null;
        try {
            // 格式: S_<serviceId>
            if (serviceId.startsWith("S_")) {
                return Long.parseLong(serviceId.substring(2));
            }
            return Long.parseLong(serviceId);
        } catch (NumberFormatException e) {
            log.warn("Invalid service ID format: {}", serviceId);
            return null;
        }
    }

    private Long parseResourceId(String staffId) {
        if (staffId == null) return null;
        try {
            // 格式: R_<resourceId>
            if (staffId.startsWith("R_")) {
                return Long.parseLong(staffId.substring(2));
            }
            return Long.parseLong(staffId);
        } catch (NumberFormatException e) {
            log.warn("Invalid resource ID format: {}", staffId);
            return null;
        }
    }

    private int checkSlotAvailability(Long tenantId, Long serviceId, Long resourceId,
                                       LocalDate date, LocalTime startTime, LocalTime endTime) {
        // TODO: 实现完整的可用性检查逻辑
        // 1. 检查是否有排班
        // 2. 检查是否与现有预约冲突
        // 3. 返回可用数量

        // 临时实现：简单检查是否有可用资源
        List<Resource> resources;
        if (resourceId != null) {
            Resource resource = resourceMapper.findById(resourceId);
            resources = resource != null ? Collections.singletonList(resource) : Collections.emptyList();
        } else {
            resources = resourceMapper.findByTenantIdAndTypeAndStatus(tenantId, "STAFF", "ACTIVE");
        }

        return resources.isEmpty() ? 0 : 1;
    }

    private Long findOrCreateGoogleCustomer(Long tenantId, GoogleBookingRequestDTO.UserInformation userInfo) {
        // 尝试根据 Google User ID 或电话号码查找
        if (userInfo.getTelephone() != null) {
            try {
                var existing = customerService.getCustomerByPhone(tenantId, userInfo.getTelephone());
                if (existing != null) {
                    return existing.getId();
                }
            } catch (Exception e) {
                log.debug("Customer not found by phone");
            }
        }

        // 创建新客户
        CustomerDTO newCustomer = new CustomerDTO();
        newCustomer.setTenantId(tenantId);
        newCustomer.setFirstName(userInfo.getGivenName());
        newCustomer.setLastName(userInfo.getFamilyName());
        newCustomer.setPhone(userInfo.getTelephone());
        newCustomer.setEmail(userInfo.getEmail());
        newCustomer.setStatus(Customer.CustomerStatus.ACTIVE);
        newCustomer.setNotes("Source: GOOGLE_BOOKING");

        var created = customerService.createCustomer(newCustomer);
        return created.getId();
    }

    private Long findAvailableResource(Long tenantId, Long serviceId, LocalDate date, LocalTime time) {
        List<Resource> resources = resourceMapper.findByTenantIdAndTypeAndStatus(tenantId, "STAFF", "ACTIVE");
        // TODO: 实现更智能的资源分配逻辑
        return resources.isEmpty() ? null : resources.get(0).getId();
    }

    private String mapAppointmentStatusToGoogleStatus(Appointment.AppointmentStatus status) {
        if (status == null) return "PENDING";
        switch (status) {
            case CONFIRMED:
                return "CONFIRMED";
            case CHECKED_IN:
                return "CONFIRMED";
            case CANCELLED:
                return "CANCELLED";
            case COMPLETED:
                return "CONFIRMED";
            case NO_SHOW:
                return "NO_SHOW";
            default:
                return "PENDING";
        }
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
        if (map == null) return null;
        Object value = map.get(key);
        return value != null ? value.toString() : null;
    }

    private Double getDoubleValue(Map<String, Object> map, String key) {
        if (map == null) return null;
        Object value = map.get(key);
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        return null;
    }

    /**
     * 获取商户营业时间配置
     * @param tenantId 租户ID
     * @return 营业时间Map，key为星期名称(monday, tuesday等)，value为时间配置
     */
    @SuppressWarnings("unchecked")
    private Map<String, Map<String, Object>> getBusinessHours(Long tenantId) {
        try {
            Map<String, Object> config = merchantServiceClient.getMerchantConfig(tenantId);
            if (config != null && config.get("businessHours") != null) {
                return (Map<String, Map<String, Object>>) config.get("businessHours");
            }
        } catch (Exception e) {
            log.warn("Failed to get business hours for tenant {}: {}", tenantId, e.getMessage());
        }
        return null;
    }

    /**
     * 获取指定日期的营业时间
     * @param businessHours 营业时间配置
     * @param dayOfWeek 星期几
     * @return [开始时间, 结束时间, 是否休息] 或 null 表示使用默认
     */
    private Object[] getDaySchedule(Map<String, Map<String, Object>> businessHours, DayOfWeek dayOfWeek) {
        if (businessHours == null) return null;

        String dayKey = dayOfWeek.toString().toLowerCase();
        Map<String, Object> daySchedule = businessHours.get(dayKey);

        if (daySchedule == null) return null;

        try {
            Boolean closed = (Boolean) daySchedule.get("closed");
            String start = (String) daySchedule.get("start");
            String end = (String) daySchedule.get("end");

            if (closed == null) closed = false;
            if (start == null) start = "09:00";
            if (end == null) end = "18:00";

            return new Object[] { start, end, closed };
        } catch (Exception e) {
            log.warn("Failed to parse day schedule for {}: {}", dayKey, e.getMessage());
            return null;
        }
    }

    private List<GoogleAvailabilityFeedDTO.ServiceAvailability> generateAvailabilityForMerchant(
            OnlineBookingConfig config, LocalDate startDate, LocalDate endDate) {

        List<GoogleAvailabilityFeedDTO.ServiceAvailability> result = new ArrayList<>();
        String merchantId = "M_" + config.getTenantId();

        // 获取商户信息以获取时区
        Map<String, Object> merchantInfo = getMerchantInfo(config.getTenantId());
        String timezone = merchantInfo != null ? getStringValue(merchantInfo, "timezone") : null;
        if (timezone == null) timezone = "America/Vancouver";
        ZoneId zoneId = ZoneId.of(timezone);

        // 获取营业时间配置
        Map<String, Map<String, Object>> businessHours = getBusinessHours(config.getTenantId());

        // 获取所有服务
        List<com.merchant.server.businessservice.entity.Service> services =
            serviceMapper.findByTenantIdAndStatus(config.getTenantId(), "ACTIVE");

        // 获取所有员工
        List<Resource> staff = resourceMapper.findByTenantIdAndTypeAndStatus(
            config.getTenantId(), "STAFF", "ACTIVE");

        for (com.merchant.server.businessservice.entity.Service service : services) {
            List<GoogleAvailabilityFeedDTO.Availability> availabilitySlots = new ArrayList<>();

            // 为每天生成可用时间段
            LocalDate currentDate = startDate;
            while (!currentDate.isAfter(endDate)) {
                // 获取当天的营业时间
                DayOfWeek dayOfWeek = currentDate.getDayOfWeek();
                Object[] daySchedule = getDaySchedule(businessHours, dayOfWeek);

                // 默认营业时间
                LocalTime openTime = LocalTime.of(9, 0);
                LocalTime closeTime = LocalTime.of(18, 0);
                boolean isClosed = false;

                if (daySchedule != null) {
                    try {
                        openTime = LocalTime.parse((String) daySchedule[0]);
                        closeTime = LocalTime.parse((String) daySchedule[1]);
                        isClosed = (Boolean) daySchedule[2];
                    } catch (Exception e) {
                        log.warn("Failed to parse business hours for {}: {}", currentDate, e.getMessage());
                    }
                }

                // 如果当天休息，跳过
                if (isClosed) {
                    currentDate = currentDate.plusDays(1);
                    continue;
                }

                // 生成当天的时间段（每30分钟一个）
                LocalTime slotTime = openTime;
                while (slotTime.plusMinutes(service.getDuration()).isBefore(closeTime) ||
                       slotTime.plusMinutes(service.getDuration()).equals(closeTime)) {
                    // 为每个员工生成可用性
                    for (Resource staffMember : staff) {
                        ZonedDateTime startDateTime = ZonedDateTime.of(
                            currentDate, slotTime, zoneId);

                        availabilitySlots.add(GoogleAvailabilityFeedDTO.Availability.builder()
                            .startTime(startDateTime.format(RFC3339_FORMATTER))
                            .duration((long) service.getDuration() * 60)
                            .spotsOpen(1)
                            .spotsTotal(1)
                            .resources(GoogleAvailabilityFeedDTO.SlotResources.builder()
                                .staffId("R_" + staffMember.getId())
                                .staffName(staffMember.getName())
                                .build())
                            .build());
                    }
                    slotTime = slotTime.plusMinutes(30);
                }
                currentDate = currentDate.plusDays(1);
            }

            result.add(GoogleAvailabilityFeedDTO.ServiceAvailability.builder()
                .merchantId(merchantId)
                .serviceId("S_" + service.getId())
                .availability(availabilitySlots)
                .resources(GoogleAvailabilityFeedDTO.Resources.builder()
                    .staff(staff.stream()
                        .map(s -> GoogleAvailabilityFeedDTO.Staff.builder()
                            .staffId("R_" + s.getId())
                            .name(s.getName())
                            .build())
                        .collect(Collectors.toList()))
                    .build())
                .build());
        }

        return result;
    }

    private GoogleAvailabilityResponseDTO buildAvailabilityErrorResponse(GoogleSlotDTO slot, int count) {
        return GoogleAvailabilityResponseDTO.builder()
            .slot(slot)
            .countAvailable(count)
            .durationRequirement("DURATION_REQUIREMENT_UNSPECIFIED")
            .build();
    }

    private GoogleBookingResponseDTO buildBookingFailureResponse(String cause, String description) {
        return GoogleBookingResponseDTO.builder()
            .bookingFailure(GoogleBookingResponseDTO.BookingFailure.builder()
                .cause(cause)
                .description(description)
                .build())
            .build();
    }
}
