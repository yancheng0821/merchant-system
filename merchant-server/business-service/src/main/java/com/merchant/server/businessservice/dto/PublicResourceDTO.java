package com.merchant.server.businessservice.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

/**
 * 公开资源(员工)信息DTO - 用于客户预约页面展示
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicResourceDTO {

    private Long id;
    private String name;
    private String avatar;
    private String position;
    private String description;
    private List<String> specialties;
    private List<Long> serviceIds;  // 该员工可提供的服务ID列表
}
