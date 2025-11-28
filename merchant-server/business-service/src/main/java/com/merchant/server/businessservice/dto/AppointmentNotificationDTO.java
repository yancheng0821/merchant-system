package com.merchant.server.businessservice.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class AppointmentNotificationDTO {
    
    private Long appointmentId;
    private Long tenantId;
    private Long customerId;
    private String customerName;
    private String customerPhone;
    private String customerCountryCode; // 客户国家码
    private String customerEmail;
    private String communicationPreference; // SMS, EMAIL, PHONE
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate appointmentDate;
    
    @JsonFormat(pattern = "HH:mm")
    private LocalTime appointmentTime;
    
    private Integer duration;
    private BigDecimal subtotal;      // 服务小计
    private BigDecimal taxAmount;     // 税额
    private BigDecimal tipAmount;     // 小费
    private BigDecimal totalAmount;   // 总金额
    private String status;
    private String notes;
    
    private Long resourceId;
    private String resourceType; // STAFF, ROOM
    private String resourceName; // 资源名称（员工姓名或房间名称）
    private String serviceName;
    private String businessName;
    private String businessAddress;
    private String businessPhone;

    // 预约确认相关
    private String confirmationCode;   // 预约确认码
    private String cancelUrl;          // 取消预约链接
    private String googleCalendarUrl;  // Google Calendar 添加链接
    private String outlookUrl;         // Outlook 添加链接
    private String timezone;           // 商户时区
}