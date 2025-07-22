package com.merchant.server.businessservice.service.impl;

import com.merchant.server.businessservice.dto.CustomerDTO;
import com.merchant.server.businessservice.entity.Customer;
import com.merchant.server.businessservice.mapper.AppointmentMapper;
import com.merchant.server.businessservice.mapper.CustomerMapper;
import com.merchant.server.businessservice.service.CustomerService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

@Service
@Transactional
public class CustomerServiceImpl implements CustomerService {
    
    @Autowired
    private CustomerMapper customerMapper;
    
    @Autowired
    private AppointmentMapper appointmentMapper;
    
    @Override
    public Page<Customer> getCustomers(Long tenantId, String keyword, Customer.CustomerStatus status, Customer.MembershipLevel level, Pageable pageable) {
        try {
            // 获取所有符合条件的客户
            List<Customer> all = customerMapper.findByCondition(tenantId, keyword, status, level);
            
            // 手动分页
            int start = (int) pageable.getOffset();
            int end = Math.min((start + pageable.getPageSize()), all.size());
            List<Customer> pageContent = start < all.size() ? all.subList(start, end) : new ArrayList<>();
            
            return new PageImpl<>(pageContent, pageable, all.size());
        } catch (Exception e) {
            throw new RuntimeException("Failed to get customers: " + e.getMessage(), e);
        }
    }
    
    @Override
    public CustomerDTO getCustomerById(Long id) {
        Customer customer = customerMapper.selectById(id);
        if (customer == null) {
            throw new RuntimeException("Customer not found with id: " + id);
        }
        
        CustomerDTO dto = convertToDTO(customer);
        
        // 添加统计信息
        dto.setTotalAppointments(appointmentMapper.countByCustomerId(id));
        dto.setCompletedAppointments(appointmentMapper.countByCustomerIdAndStatus(id, "COMPLETED"));
        dto.setAverageRating(appointmentMapper.getCustomerAverageRating(id));
        
        return dto;
    }
    
    @Override
    public CustomerDTO createCustomer(CustomerDTO customerDTO) {
        // 检查电话号码是否已存在
        if (customerMapper.existsByTenantIdAndPhone(customerDTO.getTenantId(), customerDTO.getPhone())) {
            throw new RuntimeException("Customer with phone number already exists: " + customerDTO.getPhone());
        }
        
        Customer customer = convertToEntity(customerDTO);
        customer.setCreatedAt(LocalDateTime.now());
        customer.setUpdatedAt(LocalDateTime.now());
        
        customerMapper.insert(customer);
        return convertToDTO(customer);
    }
    
    @Override
    public CustomerDTO updateCustomer(Long id, CustomerDTO customerDTO) {
        Customer existingCustomer = customerMapper.selectById(id);
        if (existingCustomer == null) {
            throw new RuntimeException("Customer not found with id: " + id);
        }
        
        // 检查电话号码是否被其他客户使用
        Customer customerWithPhone = customerMapper.selectByTenantIdAndPhone(customerDTO.getTenantId(), customerDTO.getPhone());
        if (customerWithPhone != null && !customerWithPhone.getId().equals(id)) {
            throw new RuntimeException("Customer with phone number already exists: " + customerDTO.getPhone());
        }
        
        // 更新字段
        BeanUtils.copyProperties(customerDTO, existingCustomer, "id", "createdAt", "updatedAt");
        existingCustomer.setUpdatedAt(LocalDateTime.now());
        
        customerMapper.update(existingCustomer);
        return convertToDTO(existingCustomer);
    }
    
    @Override
    public void deleteCustomer(Long id) {
        Customer customer = customerMapper.selectById(id);
        if (customer == null) {
            throw new RuntimeException("Customer not found with id: " + id);
        }
        customerMapper.deleteById(id);
    }
    
    @Override
    public CustomerDTO getCustomerByPhone(Long tenantId, String phone) {
        Customer customer = customerMapper.selectByTenantIdAndPhone(tenantId, phone);
        if (customer == null) {
            throw new RuntimeException("Customer not found with phone: " + phone);
        }
        return convertToDTO(customer);
    }
    
    @Override
    public CustomerStatsDTO getCustomerStats(Long tenantId) {
        long totalCustomers = customerMapper.countByTenantId(tenantId);
        long activeCustomers = customerMapper.countByTenantIdAndStatus(tenantId, "ACTIVE");
        long vipCustomers = customerMapper.countVipCustomers(tenantId);
        
        // 计算平均消费
        List<Customer> customers = customerMapper.selectByTenantId(tenantId, 0, Integer.MAX_VALUE, "id", "ASC");
        double averageSpending = customers.stream()
            .mapToDouble(c -> c.getTotalSpent() != null ? c.getTotalSpent().doubleValue() : 0.0)
            .average()
            .orElse(0.0);
        
        return new CustomerStatsDTO(totalCustomers, activeCustomers, vipCustomers, averageSpending);
    }
    
    @Override
    public List<CustomerDTO> getTopSpendingCustomers(Long tenantId, int limit) {
        List<Customer> customers = customerMapper.selectTopSpendingCustomers(tenantId, limit);
        return customers.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    private CustomerDTO convertToDTO(Customer customer) {
        CustomerDTO dto = new CustomerDTO();
        BeanUtils.copyProperties(customer, dto);
        
        // 设置全名
        dto.setFullName(customer.getFullName());
        
        // 设置偏好服务ID列表
        dto.setPreferredServiceIds(customer.getPreferredServiceIds());
        
        return dto;
    }
    
    private Customer convertToEntity(CustomerDTO dto) {
        Customer customer = new Customer();
        BeanUtils.copyProperties(dto, customer, "id", "fullName", "preferredServiceIds", 
                                "totalAppointments", "completedAppointments", "averageRating");
        
        // 设置默认值
        if (customer.getPoints() == null) {
            customer.setPoints(0);
        }
        if (customer.getTotalSpent() == null) {
            customer.setTotalSpent(BigDecimal.ZERO);
        }
        if (customer.getStatus() == null) {
            customer.setStatus(Customer.CustomerStatus.ACTIVE);
        }
        if (customer.getMembershipLevel() == null) {
            customer.setMembershipLevel(Customer.MembershipLevel.REGULAR);
        }
        if (customer.getCommunicationPreference() == null) {
            customer.setCommunicationPreference(Customer.CommunicationPreference.SMS);
        }
        
        return customer;
    }
}