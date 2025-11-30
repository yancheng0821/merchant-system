package com.merchant.server.businessservice.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 匹配客户DTO，包含发送状态信息
 */
@Data
public class MatchedCustomerDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;

    // 是否已发送过此规则的营销邮件
    private Boolean sent;

    // 最后发送时间
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime lastSentAt;
}
