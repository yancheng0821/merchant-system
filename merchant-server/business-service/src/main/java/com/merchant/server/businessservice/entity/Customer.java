package com.merchant.server.businessservice.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class Customer {
    
    private Long id;
    
    @NotNull
    private Long tenantId;
    
    @NotBlank
    private String firstName;
    
    @NotBlank
    private String lastName;
    
    @NotBlank
    private String phone;
    
    @Email
    private String email;
    
    private String address;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateOfBirth;
    
    private Gender gender;
    
    private MembershipLevel membershipLevel = MembershipLevel.REGULAR;
    
    private Integer points = 0;
    
    private BigDecimal totalSpent = BigDecimal.ZERO;
    
    private CustomerStatus status = CustomerStatus.ACTIVE;
    
    private String notes;
    
    private String allergies;
    
    private CommunicationPreference communicationPreference = CommunicationPreference.SMS;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime lastVisitDate;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
    
    private Long createdBy;
    
    private Long updatedBy;
    
    // 关联偏好服务ID列表
    private List<Long> preferredServiceIds;
    
    // 预约记录（如果需要的话）
    private List<Appointment> appointments;
    
    // 枚举定义
    public enum Gender {
        MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY
    }
    
    public enum MembershipLevel {
        REGULAR, SILVER, GOLD, PLATINUM
    }
    
    public enum CustomerStatus {
        ACTIVE, INACTIVE
    }
    
    public enum CommunicationPreference {
        SMS, EMAIL, PHONE
    }
    

    
    // 辅助方法
    public String getFullName() {
        return firstName + " " + lastName;
    }

    public java.time.LocalDateTime getLastVisit() { 
        return lastVisitDate; 
    }
    
    public void setLastVisit(java.time.LocalDateTime lastVisit) { 
        this.lastVisitDate = lastVisit; 
    }
}