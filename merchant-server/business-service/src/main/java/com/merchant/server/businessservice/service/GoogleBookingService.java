package com.merchant.server.businessservice.service;

import com.merchant.server.businessservice.dto.google.*;

import java.time.LocalDate;

/**
 * Google Reserve with Google 服务接口
 * 实现 Google Maps Booking API v3 规范
 */
public interface GoogleBookingService {

    // ==================== Booking Server API ====================

    /**
     * 健康检查
     * GET /v3/HealthCheck
     */
    GoogleHealthCheckResponse healthCheck();

    /**
     * 批量检查可用性
     * POST /v3/CheckAvailability
     *
     * @param request 可用性检查请求
     * @return 可用性响应
     */
    GoogleAvailabilityResponseDTO checkAvailability(GoogleAvailabilityRequestDTO request);

    /**
     * 创建预约
     * POST /v3/CreateBooking
     *
     * @param request 预约创建请求
     * @return 预约响应
     */
    GoogleBookingResponseDTO createBooking(GoogleBookingRequestDTO request);

    /**
     * 更新预约
     * POST /v3/UpdateBooking
     *
     * @param bookingId Google 预约ID
     * @param request 更新请求
     * @return 更新后的预约响应
     */
    GoogleBookingResponseDTO updateBooking(String bookingId, GoogleBookingRequestDTO request);

    /**
     * 获取预约状态
     * POST /v3/GetBookingStatus
     *
     * @param bookingId 预约ID
     * @return 预约响应
     */
    GoogleBookingResponseDTO getBookingStatus(String bookingId);

    /**
     * 列出所有预约（用于同步）
     * POST /v3/ListBookings
     */
    GoogleListBookingsResponse listBookings(String merchantId, String userId);

    // ==================== Feeds API ====================

    /**
     * 获取商户 Feed
     * 用于 Google 抓取商户数据
     */
    GoogleMerchantFeedDTO getMerchantFeed();

    /**
     * 获取服务 Feed
     * 用于 Google 抓取服务数据
     */
    GoogleServiceFeedDTO getServiceFeed();

    /**
     * 获取可用性 Feed
     * 用于 Google 抓取可用性数据
     *
     * @param startDate 开始日期
     * @param endDate 结束日期
     */
    GoogleAvailabilityFeedDTO getAvailabilityFeed(LocalDate startDate, LocalDate endDate);

    /**
     * 获取指定商户的可用性 Feed
     */
    GoogleAvailabilityFeedDTO getAvailabilityFeedByMerchant(String merchantId, LocalDate startDate, LocalDate endDate);

    // ==================== 实时更新 API ====================

    /**
     * 发送实时可用性更新到 Google
     * 当可用性发生变化时调用（如预约被取消）
     */
    void sendRealTimeAvailabilityUpdate(String merchantId, String serviceId);

    /**
     * 发送预约状态更新到 Google
     * 当预约状态变化时调用
     */
    void sendBookingStatusUpdate(String googleBookingId, String status);
}
