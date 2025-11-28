package com.merchant.server.businessservice.dto;

import lombok.Data;

/**
 * 公开客户信息DTO - 用于客户在线预约时查询
 */
@Data
public class PublicCustomerDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String phone;
    private String email;
}
