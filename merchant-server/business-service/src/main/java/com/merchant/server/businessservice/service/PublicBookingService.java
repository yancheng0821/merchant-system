package com.merchant.server.businessservice.service;

import com.merchant.server.businessservice.dto.*;

import java.time.LocalDate;
import java.util.List;

/**
 * 公开预约服务接口 - 无需认证即可访问
 */
public interface PublicBookingService {

    /**
     * 根据商户代码获取公开商户信息
     */
    PublicMerchantDTO getMerchantByCode(String merchantCode);

    /**
     * 获取商户的公开服务列表
     */
    List<PublicServiceDTO> getServicesByMerchantCode(String merchantCode);

    /**
     * 获取商户的公开员工列表
     */
    List<PublicResourceDTO> getStaffByMerchantCode(String merchantCode);

    /**
     * 获取可用时间槽
     * @param merchantCode 商户代码
     * @param date 日期
     * @param serviceIds 服务ID列表
     * @param resourceId 可选：指定员工ID
     * @return 可用时间槽列表
     */
    PublicTimeSlotDTO getAvailableSlots(String merchantCode, LocalDate date,
                                         List<Long> serviceIds, Long resourceId);

    /**
     * 创建公开预约
     */
    PublicBookingResponseDTO createBooking(PublicBookingRequestDTO request);

    /**
     * 根据确认码查询预约
     */
    PublicBookingResponseDTO getBookingByConfirmationCode(String confirmationCode);

    /**
     * 取消预约（通过确认码）
     */
    void cancelBooking(String confirmationCode, String reason);

    /**
     * 根据预约ID获取预约详情
     */
    PublicBookingResponseDTO getBookingById(Long appointmentId);

    /**
     * 检查预约是否可以取消
     * @param appointmentId 预约ID
     * @return 是否可以取消
     */
    boolean canCancelBooking(Long appointmentId);

    /**
     * 通过预约ID取消预约（用于邮件取消链接）
     * @param appointmentId 预约ID
     * @param customerId 客户ID（用于验证）
     * @param reason 取消原因
     */
    void cancelBookingById(Long appointmentId, Long customerId, String reason);

    /**
     * 检查商户是否启用了在线预约
     */
    boolean isOnlineBookingEnabled(String merchantCode);

    /**
     * 根据手机号或邮箱查找客户信息
     * @param merchantCode 商户代码
     * @param phone 手机号（可选）
     * @param email 邮箱（可选）
     * @return 客户信息，不存在则返回null
     */
    PublicCustomerDTO lookupCustomer(String merchantCode, String phone, String email);

    /**
     * 检查商户是否可以接受在线预约（基于月预约数量限制）
     * @param merchantCode 商户代码
     * @return true 如果商户可以接受预约（未达到月预约上限或无限制），false 如果已达上限
     */
    boolean isBookingAvailable(String merchantCode);
}
