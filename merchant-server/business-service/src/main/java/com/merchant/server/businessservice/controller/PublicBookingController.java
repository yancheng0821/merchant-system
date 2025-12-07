package com.merchant.server.businessservice.controller;

import com.merchant.server.businessservice.dto.*;
import com.merchant.server.businessservice.dto.google.*;
import com.merchant.server.businessservice.service.GoogleBookingService;
import com.merchant.server.businessservice.service.PublicBookingService;
import com.merchant.server.businessservice.util.CancelTokenUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * 公开预约API控制器 - 无需认证即可访问
 * 供客户在线预约使用，也供 Reserve with Google 集成使用
 */
@Slf4j
@RestController
@RequestMapping("/api/public/booking")
@RequiredArgsConstructor
// CORS 由 Gateway 统一处理，这里不再重复配置
public class PublicBookingController {

    private final PublicBookingService publicBookingService;
    private final GoogleBookingService googleBookingService;
    private final CancelTokenUtil cancelTokenUtil;

    /**
     * 获取商户公开信息
     * GET /api/public/booking/merchants/{merchantCode}
     */
    @GetMapping("/merchants/{merchantCode}")
    public ResponseEntity<PublicMerchantDTO> getMerchant(@PathVariable String merchantCode) {
        log.info("Public API: Getting merchant info for code: {}", merchantCode);

        PublicMerchantDTO merchant = publicBookingService.getMerchantByCode(merchantCode);
        if (merchant == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(merchant);
    }

    /**
     * 检查商户是否启用在线预约
     * GET /api/public/booking/merchants/{merchantCode}/status
     */
    @GetMapping("/merchants/{merchantCode}/status")
    public ResponseEntity<Map<String, Object>> getBookingStatus(@PathVariable String merchantCode) {
        log.info("Public API: Checking booking status for merchant: {}", merchantCode);

        boolean enabled = publicBookingService.isOnlineBookingEnabled(merchantCode);

        return ResponseEntity.ok(Map.of(
            "merchantCode", merchantCode,
            "onlineBookingEnabled", enabled
        ));
    }

    /**
     * 检查商户是否可接受预约（检查订阅计划和月预约数量限制）
     * GET /api/public/booking/merchants/{merchantCode}/booking-availability
     */
    @GetMapping("/merchants/{merchantCode}/booking-availability")
    public ResponseEntity<Map<String, Object>> getBookingAvailability(@PathVariable String merchantCode) {
        log.debug("Public API: Checking booking availability for merchant: {}", merchantCode);

        boolean available = publicBookingService.isBookingAvailable(merchantCode);

        return ResponseEntity.ok(Map.of(
            "merchantCode", merchantCode,
            "available", available
        ));
    }

    /**
     * 获取商户服务列表
     * GET /api/public/booking/merchants/{merchantCode}/services
     */
    @GetMapping("/merchants/{merchantCode}/services")
    public ResponseEntity<List<PublicServiceDTO>> getServices(@PathVariable String merchantCode) {
        log.info("Public API: Getting services for merchant: {}", merchantCode);

        List<PublicServiceDTO> services = publicBookingService.getServicesByMerchantCode(merchantCode);
        return ResponseEntity.ok(services);
    }

    /**
     * 获取商户员工列表
     * GET /api/public/booking/merchants/{merchantCode}/staff
     */
    @GetMapping("/merchants/{merchantCode}/staff")
    public ResponseEntity<List<PublicResourceDTO>> getStaff(@PathVariable String merchantCode) {
        log.info("Public API: Getting staff for merchant: {}", merchantCode);

        List<PublicResourceDTO> staff = publicBookingService.getStaffByMerchantCode(merchantCode);
        return ResponseEntity.ok(staff);
    }

    /**
     * 根据手机号或邮箱查找客户信息
     * GET /api/public/booking/merchants/{merchantCode}/customer-lookup
     *
     * @param merchantCode 商户代码
     * @param phone 手机号（可选）
     * @param email 邮箱（可选）
     */
    @GetMapping("/merchants/{merchantCode}/customer-lookup")
    public ResponseEntity<PublicCustomerDTO> customerLookup(
            @PathVariable String merchantCode,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String email) {

        log.info("Public API: Customer lookup for merchant: {}, phone: {}, email: {}",
            merchantCode, phone != null ? phone.substring(0, Math.min(4, phone.length())) + "***" : null, email);

        if (phone == null && email == null) {
            return ResponseEntity.badRequest().build();
        }

        PublicCustomerDTO customer = publicBookingService.lookupCustomer(merchantCode, phone, email);
        if (customer == null) {
            return ResponseEntity.ok(null);
        }

        return ResponseEntity.ok(customer);
    }

    /**
     * 获取可用时间槽
     * GET /api/public/booking/merchants/{merchantCode}/available-slots
     *
     * @param merchantCode 商户代码
     * @param date 日期 (yyyy-MM-dd)
     * @param serviceIds 服务ID列表（逗号分隔）
     * @param resourceId 可选：指定员工ID
     */
    @GetMapping("/merchants/{merchantCode}/available-slots")
    public ResponseEntity<PublicTimeSlotDTO> getAvailableSlots(
            @PathVariable String merchantCode,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam List<Long> serviceIds,
            @RequestParam(required = false) Long resourceId) {

        log.info("Public API: Getting available slots for merchant: {}, date: {}, services: {}, resource: {}",
            merchantCode, date, serviceIds, resourceId);

        PublicTimeSlotDTO slots = publicBookingService.getAvailableSlots(
            merchantCode, date, serviceIds, resourceId);

        return ResponseEntity.ok(slots);
    }

    /**
     * 创建预约
     * POST /api/public/booking/bookings
     */
    @PostMapping("/bookings")
    public ResponseEntity<?> createBooking(
            @Valid @RequestBody PublicBookingRequestDTO request) {

        log.info("Public API: Creating booking for merchant: {}", request.getMerchantCode());

        try {
            // 设置预约来源
            if (request.getBookingSource() == null) {
                request.setBookingSource("ONLINE");
            }

            PublicBookingResponseDTO response = publicBookingService.createBooking(request);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("Invalid booking request: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (IllegalStateException e) {
            log.warn("Booking not allowed: {}", e.getMessage());
            // 使用 409 Conflict 而不是 403，因为这是业务逻辑冲突而非权限问题
            return ResponseEntity.status(409).body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Failed to create booking", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "预约创建失败，请稍后重试"
            ));
        }
    }

    /**
     * 根据确认码查询预约
     * GET /api/public/booking/bookings/{confirmationCode}
     */
    @GetMapping("/bookings/{confirmationCode}")
    public ResponseEntity<PublicBookingResponseDTO> getBooking(@PathVariable String confirmationCode) {
        log.info("Public API: Getting booking by confirmation code: {}", confirmationCode);

        PublicBookingResponseDTO booking = publicBookingService.getBookingByConfirmationCode(confirmationCode);
        if (booking == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(booking);
    }

    /**
     * 取消预约（通过确认码）
     * POST /api/public/booking/bookings/{confirmationCode}/cancel
     */
    @PostMapping("/bookings/{confirmationCode}/cancel")
    public ResponseEntity<Map<String, Object>> cancelBooking(
            @PathVariable String confirmationCode,
            @RequestBody(required = false) Map<String, String> body) {

        log.info("Public API: Cancelling booking: {}", confirmationCode);

        String reason = body != null ? body.get("reason") : null;

        try {
            publicBookingService.cancelBooking(confirmationCode, reason);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "预约已取消"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(403).body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    /**
     * 验证取消 token 并获取预约信息
     * GET /api/public/booking/cancel/verify?token=xxx
     *
     * 用于邮件中的取消链接，验证 token 有效性并返回预约详情
     */
    @GetMapping("/cancel/verify")
    public ResponseEntity<Map<String, Object>> verifyCancelToken(@RequestParam String token) {
        log.info("Public API: Verifying cancel token");

        try {
            CancelTokenUtil.TokenData tokenData = cancelTokenUtil.verifyAndParse(token);

            if (tokenData == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "无效或已过期的取消链接"
                ));
            }

            // 获取预约详情
            PublicBookingResponseDTO booking = publicBookingService.getBookingById(tokenData.getAppointmentId());

            if (booking == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "预约不存在"
                ));
            }

            // 验证客户ID是否匹配
            if (!tokenData.getCustomerId().equals(booking.getCustomerId())) {
                log.warn("Customer ID mismatch in cancel token");
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "无效的取消链接"
                ));
            }

            return ResponseEntity.ok(Map.of(
                "success", true,
                "booking", booking,
                "canCancel", publicBookingService.canCancelBooking(tokenData.getAppointmentId())
            ));

        } catch (Exception e) {
            log.error("Error verifying cancel token", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "验证取消链接时发生错误"
            ));
        }
    }

    /**
     * 通过 token 取消预约
     * POST /api/public/booking/cancel/execute
     *
     * 用于邮件中的取消链接
     */
    @PostMapping("/cancel/execute")
    public ResponseEntity<Map<String, Object>> cancelByToken(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String reason = body.get("reason");

        log.info("Public API: Cancelling booking by token");

        try {
            if (token == null || token.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "缺少取消 token"
                ));
            }

            CancelTokenUtil.TokenData tokenData = cancelTokenUtil.verifyAndParse(token);

            if (tokenData == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "无效或已过期的取消链接"
                ));
            }

            // 执行取消
            publicBookingService.cancelBookingById(tokenData.getAppointmentId(), tokenData.getCustomerId(), reason);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "预约已成功取消"
            ));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(403).body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Error cancelling booking by token", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "取消预约时发生错误"
            ));
        }
    }

    // ==================== Reserve with Google Booking Server API ====================

    /**
     * Google Booking 健康检查
     * GET /api/public/booking/google/v3/HealthCheck
     */
    @GetMapping({"/google/health", "/google/v3/HealthCheck"})
    public ResponseEntity<GoogleHealthCheckResponse> googleHealthCheck() {
        return ResponseEntity.ok(googleBookingService.healthCheck());
    }

    /**
     * Google 批量检查可用性
     * POST /api/public/booking/google/v3/CheckAvailability
     *
     * 遵循 Reserve with Google 的标准 API 格式
     * https://developers.google.com/maps-booking/reference/rest-api-v3/availability
     */
    @PostMapping({"/google/availability", "/google/v3/CheckAvailability"})
    public ResponseEntity<GoogleAvailabilityResponseDTO> googleCheckAvailability(
            @RequestBody GoogleAvailabilityRequestDTO request) {

        log.info("Google API: Check availability request: {}", request);
        return ResponseEntity.ok(googleBookingService.checkAvailability(request));
    }

    /**
     * Google 创建预约
     * POST /api/public/booking/google/v3/CreateBooking
     *
     * https://developers.google.com/maps-booking/reference/rest-api-v3/booking
     */
    @PostMapping({"/google/bookings", "/google/v3/CreateBooking"})
    public ResponseEntity<GoogleBookingResponseDTO> googleCreateBooking(
            @RequestBody GoogleBookingRequestDTO request) {

        log.info("Google API: Create booking request: {}", request);
        return ResponseEntity.ok(googleBookingService.createBooking(request));
    }

    /**
     * Google 更新预约
     * POST /api/public/booking/google/v3/UpdateBooking
     */
    @PostMapping("/google/v3/UpdateBooking")
    public ResponseEntity<GoogleBookingResponseDTO> googleUpdateBooking(
            @RequestBody GoogleBookingRequestDTO request) {

        log.info("Google API: Update booking request: {}", request);
        String bookingId = request.getSlot() != null ?
            request.getSlot().getMerchantId() : null;
        return ResponseEntity.ok(googleBookingService.updateBooking(bookingId, request));
    }

    /**
     * Google 更新预约 (PATCH 方式)
     * PATCH /api/public/booking/google/bookings/{bookingId}
     */
    @PatchMapping("/google/bookings/{bookingId}")
    public ResponseEntity<GoogleBookingResponseDTO> googleUpdateBookingPatch(
            @PathVariable String bookingId,
            @RequestBody GoogleBookingRequestDTO request) {

        log.info("Google API: Update booking {} with: {}", bookingId, request);
        return ResponseEntity.ok(googleBookingService.updateBooking(bookingId, request));
    }

    /**
     * Google 获取预约状态
     * POST /api/public/booking/google/v3/GetBookingStatus
     */
    @PostMapping("/google/v3/GetBookingStatus")
    public ResponseEntity<GoogleBookingResponseDTO> googleGetBookingStatus(
            @RequestBody Map<String, String> request) {

        String bookingId = request.get("booking_id");
        log.info("Google API: Get booking status for: {}", bookingId);
        return ResponseEntity.ok(googleBookingService.getBookingStatus(bookingId));
    }

    /**
     * Google 列出预约
     * POST /api/public/booking/google/v3/ListBookings
     */
    @PostMapping("/google/v3/ListBookings")
    public ResponseEntity<GoogleListBookingsResponse> googleListBookings(
            @RequestBody Map<String, String> request) {

        String merchantId = request.get("merchant_id");
        String userId = request.get("user_id");
        log.info("Google API: List bookings for merchant: {}, user: {}", merchantId, userId);
        return ResponseEntity.ok(googleBookingService.listBookings(merchantId, userId));
    }

    // ==================== Reserve with Google Feeds API ====================

    /**
     * 获取商户 Feed
     * GET /api/public/booking/google/feeds/merchants
     *
     * 供 Google 抓取商户数据
     */
    @GetMapping("/google/feeds/merchants")
    public ResponseEntity<GoogleMerchantFeedDTO> getMerchantFeed() {
        log.info("Google Feed API: Getting merchant feed");
        return ResponseEntity.ok(googleBookingService.getMerchantFeed());
    }

    /**
     * 获取服务 Feed
     * GET /api/public/booking/google/feeds/services
     *
     * 供 Google 抓取服务数据
     */
    @GetMapping("/google/feeds/services")
    public ResponseEntity<GoogleServiceFeedDTO> getServiceFeed() {
        log.info("Google Feed API: Getting service feed");
        return ResponseEntity.ok(googleBookingService.getServiceFeed());
    }

    /**
     * 获取可用性 Feed
     * GET /api/public/booking/google/feeds/availability
     *
     * 供 Google 抓取可用性数据
     * @param startDate 开始日期 (默认今天)
     * @param endDate 结束日期 (默认30天后)
     */
    @GetMapping("/google/feeds/availability")
    public ResponseEntity<GoogleAvailabilityFeedDTO> getAvailabilityFeed(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        if (startDate == null) {
            startDate = LocalDate.now();
        }
        if (endDate == null) {
            endDate = startDate.plusDays(30);
        }

        log.info("Google Feed API: Getting availability feed from {} to {}", startDate, endDate);
        return ResponseEntity.ok(googleBookingService.getAvailabilityFeed(startDate, endDate));
    }

    /**
     * 获取指定商户的可用性 Feed
     * GET /api/public/booking/google/feeds/availability/{merchantId}
     */
    @GetMapping("/google/feeds/availability/{merchantId}")
    public ResponseEntity<GoogleAvailabilityFeedDTO> getAvailabilityFeedByMerchant(
            @PathVariable String merchantId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        if (startDate == null) {
            startDate = LocalDate.now();
        }
        if (endDate == null) {
            endDate = startDate.plusDays(30);
        }

        log.info("Google Feed API: Getting availability feed for merchant {} from {} to {}",
            merchantId, startDate, endDate);
        return ResponseEntity.ok(googleBookingService.getAvailabilityFeedByMerchant(
            merchantId, startDate, endDate));
    }
}
