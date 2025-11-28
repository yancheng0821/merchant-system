package com.merchant.server.businessservice.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 公开预约响应DTO - 预约创建成功后返回
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicBookingResponseDTO {

    private Long bookingId;
    private String confirmationCode;
    private String status;

    // 预约详情
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    private Integer duration;  // 总时长(分钟)
    private BigDecimal totalAmount;

    // 服务信息
    private List<BookedService> services;

    // 资源信息
    private String resourceName;
    private Long resourceId;

    // 商户信息
    private String merchantName;
    private String merchantAddress;
    private String merchantPhone;

    // 客户信息
    private Long customerId;
    private String customerName;
    private String customerPhone;
    private String customerEmail;

    // 时间戳
    private LocalDateTime createdAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BookedService {
        private Long serviceId;
        private String serviceName;
        private Integer duration;
        private BigDecimal price;
    }
}
