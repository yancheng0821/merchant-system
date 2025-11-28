package com.merchant.server.businessservice.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Email;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * 公开预约请求DTO - 客户提交预约时使用
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicBookingRequestDTO {

    @NotBlank(message = "商户代码不能为空")
    private String merchantCode;

    @NotEmpty(message = "请选择至少一个服务")
    private List<Long> serviceIds;

    // 可选：指定员工，不指定则系统自动分配
    private Long resourceId;

    @NotNull(message = "预约日期不能为空")
    private LocalDate date;

    @NotNull(message = "预约时间不能为空")
    private LocalTime startTime;

    // 客户信息
    @NotBlank(message = "姓名不能为空")
    private String customerName;

    @NotBlank(message = "电话不能为空")
    private String customerPhone;

    // 国家代码，格式如 "+1-CA"
    private String customerCountryCode;

    @Email(message = "邮箱格式不正确")
    private String customerEmail;

    // 可选信息
    private String notes;
    private Boolean isNewCustomer;

    // 来源标识
    private String bookingSource;  // ONLINE, GOOGLE, WIDGET
}
