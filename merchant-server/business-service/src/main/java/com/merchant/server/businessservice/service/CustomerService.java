package com.merchant.server.businessservice.service;

import com.merchant.server.businessservice.dto.CustomerDTO;
import com.merchant.server.businessservice.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface CustomerService {
    
    /**
     * 分页查询客户
     */
    Page<Customer> getCustomers(Long tenantId, String keyword, Customer.CustomerStatus status, Customer.MembershipLevel level, Pageable pageable);
    
    /**
     * 根据ID获取客户详情
     */
    CustomerDTO getCustomerById(Long id);
    
    /**
     * 创建客户
     */
    CustomerDTO createCustomer(CustomerDTO customerDTO);
    
    /**
     * 更新客户
     */
    CustomerDTO updateCustomer(Long id, CustomerDTO customerDTO);
    
    /**
     * 删除客户
     */
    void deleteCustomer(Long id);
    
    /**
     * 根据电话号码查询客户
     */
    CustomerDTO getCustomerByPhone(Long tenantId, String phone);
    
    /**
     * 获取客户统计信息
     */
    CustomerStatsDTO getCustomerStats(Long tenantId);
    
    /**
     * 获取客户消费排行
     */
    List<CustomerDTO> getTopSpendingCustomers(Long tenantId, int limit);
    
    /**
     * 客户列表结果
     */
    class CustomerListResult {
        private List<CustomerDTO> customers;
        private long totalItems;
        private int currentPage;
        private int totalPages;
        private boolean hasNext;
        private boolean hasPrevious;
        
        public CustomerListResult() {}
        
        public CustomerListResult(List<CustomerDTO> customers, long totalItems, int currentPage, int pageSize) {
            this.customers = customers;
            this.totalItems = totalItems;
            this.currentPage = currentPage;
            this.totalPages = (int) Math.ceil((double) totalItems / pageSize);
            this.hasNext = currentPage < totalPages - 1;
            this.hasPrevious = currentPage > 0;
        }
        
        // Getters and Setters
        public List<CustomerDTO> getCustomers() { return customers; }
        public void setCustomers(List<CustomerDTO> customers) { this.customers = customers; }
        public long getTotalItems() { return totalItems; }
        public void setTotalItems(long totalItems) { this.totalItems = totalItems; }
        public int getCurrentPage() { return currentPage; }
        public void setCurrentPage(int currentPage) { this.currentPage = currentPage; }
        public int getTotalPages() { return totalPages; }
        public void setTotalPages(int totalPages) { this.totalPages = totalPages; }
        public boolean isHasNext() { return hasNext; }
        public void setHasNext(boolean hasNext) { this.hasNext = hasNext; }
        public boolean isHasPrevious() { return hasPrevious; }
        public void setHasPrevious(boolean hasPrevious) { this.hasPrevious = hasPrevious; }
    }

    /**
     * 客户统计DTO
     */
    class CustomerStatsDTO {
        private Long totalCustomers;
        private Long activeCustomers;
        private Long vipCustomers;
        private Double averageSpending;
        
        public CustomerStatsDTO() {}
        
        public CustomerStatsDTO(Long totalCustomers, Long activeCustomers, Long vipCustomers, Double averageSpending) {
            this.totalCustomers = totalCustomers;
            this.activeCustomers = activeCustomers;
            this.vipCustomers = vipCustomers;
            this.averageSpending = averageSpending;
        }
        
        // Getters and Setters
        public Long getTotalCustomers() { return totalCustomers; }
        public void setTotalCustomers(Long totalCustomers) { this.totalCustomers = totalCustomers; }
        public Long getActiveCustomers() { return activeCustomers; }
        public void setActiveCustomers(Long activeCustomers) { this.activeCustomers = activeCustomers; }
        public Long getVipCustomers() { return vipCustomers; }
        public void setVipCustomers(Long vipCustomers) { this.vipCustomers = vipCustomers; }
        public Double getAverageSpending() { return averageSpending; }
        public void setAverageSpending(Double averageSpending) { this.averageSpending = averageSpending; }
    }
}