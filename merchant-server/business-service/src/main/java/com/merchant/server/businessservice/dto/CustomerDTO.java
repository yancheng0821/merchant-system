package com.merchant.server.businessservice.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.merchant.server.businessservice.entity.Customer;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class CustomerDTO {
    
    private Long id;
    
    @NotNull(message = "Tenant ID is required")
    private Long tenantId;
    
    @NotBlank(message = "First name is required")
    private String firstName;
    
    @NotBlank(message = "Last name is required")
    private String lastName;
    
    @NotBlank(message = "Phone number is required")
    private String phone;
    
    @Email(message = "Invalid email format")
    private String email;
    
    private String address;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateOfBirth;
    
    private Customer.Gender gender;
    
    private Customer.MembershipLevel membershipLevel;
    
    private Integer points;
    
    private BigDecimal totalSpent;
    
    private Customer.CustomerStatus status;
    
    private String notes;
    
    private String allergies;
    
    private Customer.CommunicationPreference communicationPreference;
    

    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
    
    // 扩展字段
    private String fullName;
    private List<Long> preferredServiceIds;
    private Long totalAppointments;
    private Long completedAppointments;
    private Double averageRating;
    private java.time.LocalDateTime lastVisit;
    
    // 构造函数
    public CustomerDTO() {}
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getTenantId() {
        return tenantId;
    }
    
    public void setTenantId(Long tenantId) {
        this.tenantId = tenantId;
    }
    
    public String getFirstName() {
        return firstName;
    }
    
    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }
    
    public String getLastName() {
        return lastName;
    }
    
    public void setLastName(String lastName) {
        this.lastName = lastName;
    }
    
    public String getPhone() {
        return phone;
    }
    
    public void setPhone(String phone) {
        this.phone = phone;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getAddress() {
        return address;
    }
    
    public void setAddress(String address) {
        this.address = address;
    }
    
    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }
    
    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }
    
    public Customer.Gender getGender() {
        return gender;
    }
    
    public void setGender(Customer.Gender gender) {
        this.gender = gender;
    }
    
    public Customer.MembershipLevel getMembershipLevel() {
        return membershipLevel;
    }
    
    public void setMembershipLevel(Customer.MembershipLevel membershipLevel) {
        this.membershipLevel = membershipLevel;
    }
    
    public Integer getPoints() {
        return points;
    }
    
    public void setPoints(Integer points) {
        this.points = points;
    }
    
    public BigDecimal getTotalSpent() {
        return totalSpent;
    }
    
    public void setTotalSpent(BigDecimal totalSpent) {
        this.totalSpent = totalSpent;
    }
    
    public Customer.CustomerStatus getStatus() {
        return status;
    }
    
    public void setStatus(Customer.CustomerStatus status) {
        this.status = status;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
    }
    
    public String getAllergies() {
        return allergies;
    }
    
    public void setAllergies(String allergies) {
        this.allergies = allergies;
    }
    
    public Customer.CommunicationPreference getCommunicationPreference() {
        return communicationPreference;
    }
    
    public void setCommunicationPreference(Customer.CommunicationPreference communicationPreference) {
        this.communicationPreference = communicationPreference;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public String getFullName() {
        return fullName;
    }
    
    public void setFullName(String fullName) {
        this.fullName = fullName;
    }
    
    public List<Long> getPreferredServiceIds() {
        return preferredServiceIds;
    }
    
    public void setPreferredServiceIds(List<Long> preferredServiceIds) {
        this.preferredServiceIds = preferredServiceIds;
    }
    
    public Long getTotalAppointments() {
        return totalAppointments;
    }
    
    public void setTotalAppointments(Long totalAppointments) {
        this.totalAppointments = totalAppointments;
    }
    
    public Long getCompletedAppointments() {
        return completedAppointments;
    }
    
    public void setCompletedAppointments(Long completedAppointments) {
        this.completedAppointments = completedAppointments;
    }
    
    public Double getAverageRating() {
        return averageRating;
    }
    
    public void setAverageRating(Double averageRating) {
        this.averageRating = averageRating;
    }

    public LocalDateTime getLastVisit() { return lastVisit; }
    public void setLastVisit(LocalDateTime lastVisit) { this.lastVisit = lastVisit; }
}