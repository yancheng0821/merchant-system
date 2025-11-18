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
import org.springframework.transaction.annotation.Propagation;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

@Service
@Transactional
public class CustomerServiceImpl implements CustomerService {

    @Autowired
    private CustomerMapper customerMapper;

    @Autowired
    private AppointmentMapper appointmentMapper;

    @Autowired
    private com.merchant.server.businessservice.util.MessageUtil messageUtil;

    @Autowired
    private com.merchant.server.businessservice.mapper.MembershipTierMapper membershipTierMapper;
    
    @Override
    public Page<Customer> getCustomers(Long tenantId, String keyword, Customer.CustomerStatus status, String level, Pageable pageable) {
        try {
            System.out.println("=== CustomerService.getCustomers called ===");
            System.out.println("tenantId: " + tenantId);
            System.out.println("keyword: " + keyword);
            System.out.println("status: " + status);
            System.out.println("level: " + level);
            System.out.println("pageable: " + pageable);
            
            // 从Pageable中提取排序信息
            String sortBy = "updatedAt"; // 默认排序字段
            String sortDir = "DESC"; // 默认排序方向
            
            if (pageable.getSort().isSorted()) {
                Sort.Order order = pageable.getSort().iterator().next();
                sortBy = order.getProperty();
                sortDir = order.getDirection().name();
            }
            
            System.out.println("sortBy: " + sortBy + ", sortDir: " + sortDir);
            
            // 获取所有符合条件的客户（已排序）
            System.out.println("Calling customerMapper.findByCondition...");
            List<Customer> all = customerMapper.findByCondition(tenantId, keyword, status, level, sortBy, sortDir);
            System.out.println("Found " + (all != null ? all.size() : "null") + " customers");
            
            if (all == null) {
                all = new ArrayList<>();
            }
            
            // 手动分页
            int start = (int) pageable.getOffset();
            int end = Math.min((start + pageable.getPageSize()), all.size());
            List<Customer> pageContent = start < all.size() ? all.subList(start, end) : new ArrayList<>();
            
            System.out.println("Returning page with " + pageContent.size() + " items, total: " + all.size());
            return new PageImpl<>(pageContent, pageable, all.size());
        } catch (Exception e) {
            System.err.println("Error in getCustomers: " + e.getClass().getSimpleName() + ": " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException(messageUtil.getMessage("error.customer.get.failed", new Object[]{e.getMessage()}), e);
        }
    }
    
    @Override
    public CustomerDTO getCustomerById(Long id) {
        Customer customer = customerMapper.selectById(id);
        if (customer == null) {
            throw new RuntimeException(messageUtil.getMessage("error.customer.not.found.with.id", new Object[]{id}));
        }
        
        CustomerDTO dto = convertToDTO(customer);
        
        // 添加统计信息
        dto.setTotalAppointments(appointmentMapper.countByCustomerId(id));
        dto.setCompletedAppointments(appointmentMapper.countByCustomerIdAndStatus(id, "COMPLETED"));
        dto.setAverageRating(appointmentMapper.getCustomerAverageRating(id));
        
        return dto;
    }
    
    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public CustomerDTO createCustomer(CustomerDTO customerDTO) {
        // 检查电话号码是否已存在
        if (customerMapper.existsByTenantIdAndPhone(customerDTO.getTenantId(), customerDTO.getPhone())) {
            throw new RuntimeException(messageUtil.getMessage("customer.phone.exists"));
        }

        // 检查邮箱是否已存在（如果提供了邮箱）
        if (customerDTO.getEmail() != null && !customerDTO.getEmail().trim().isEmpty()) {
            if (customerMapper.existsByTenantIdAndEmail(customerDTO.getTenantId(), customerDTO.getEmail())) {
                throw new RuntimeException(messageUtil.getMessage("customer.email.exists"));
            }
        }

        Customer customer = convertToEntity(customerDTO);
        customer.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
        customer.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
        
        // 如果没有设置 lastVisitDate，设置为当前时间（表示客户第一次来访）
        if (customer.getLastVisitDate() == null) {
            customer.setLastVisitDate(LocalDateTime.now(ZoneOffset.UTC));
        }
        
        customerMapper.insert(customer);
        
        // 保存偏好服务
        if (customer.getPreferredServiceIds() != null && !customer.getPreferredServiceIds().isEmpty()) {
            customerMapper.insertPreferredServices(customer.getId(), customer.getPreferredServiceIds());
        }
        
        return convertToDTO(customer);
    }
    
    @Override
    public CustomerDTO updateCustomer(Long id, CustomerDTO customerDTO) {
        Customer existingCustomer = customerMapper.selectById(id);
        if (existingCustomer == null) {
            throw new RuntimeException(messageUtil.getMessage("customer.not.found"));
        }

        // 检查电话号码是否被其他客户使用
        Customer customerWithPhone = customerMapper.selectByTenantIdAndPhone(customerDTO.getTenantId(), customerDTO.getPhone());
        if (customerWithPhone != null && !customerWithPhone.getId().equals(id)) {
            throw new RuntimeException(messageUtil.getMessage("customer.phone.exists"));
        }

        // 检查邮箱是否被其他客户使用（如果提供了邮箱）
        if (customerDTO.getEmail() != null && !customerDTO.getEmail().trim().isEmpty()) {
            Customer customerWithEmail = customerMapper.selectByTenantIdAndEmail(customerDTO.getTenantId(), customerDTO.getEmail());
            if (customerWithEmail != null && !customerWithEmail.getId().equals(id)) {
                throw new RuntimeException(messageUtil.getMessage("customer.email.exists"));
            }
        }

        // 更新字段
        BeanUtils.copyProperties(customerDTO, existingCustomer, "id", "createdAt", "updatedAt");
        existingCustomer.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
        
        customerMapper.update(existingCustomer);
        
        // 更新偏好服务
        customerMapper.deletePreferredServices(id);
        if (existingCustomer.getPreferredServiceIds() != null && !existingCustomer.getPreferredServiceIds().isEmpty()) {
            customerMapper.insertPreferredServices(id, existingCustomer.getPreferredServiceIds());
        }
        
        return convertToDTO(existingCustomer);
    }
    
    @Override
    public void deleteCustomer(Long id) {
        Customer customer = customerMapper.selectById(id);
        if (customer == null) {
            throw new RuntimeException(messageUtil.getMessage("error.customer.not.found.with.id", new Object[]{id}));
        }
        // 软删除：只修改状态为DELETED，不真正删除数据
        customer.setStatus(Customer.CustomerStatus.DELETED);
        customer.setUpdatedAt(LocalDateTime.now());
        customerMapper.update(customer);
    }
    
    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public CustomerDTO getCustomerByPhone(Long tenantId, String phone) {
        Customer customer = customerMapper.selectByTenantIdAndPhone(tenantId, phone);
        if (customer == null) {
            throw new RuntimeException(messageUtil.getMessage("error.customer.not.found.with.phone", new Object[]{phone}));
        }
        return convertToDTO(customer);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public CustomerDTO getCustomerByEmail(Long tenantId, String email) {
        Customer customer = customerMapper.selectByTenantIdAndEmail(tenantId, email);
        if (customer == null) {
            throw new RuntimeException(messageUtil.getMessage("error.customer.not.found.with.email", new Object[]{email}));
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

        // 设置 lastVisit 字段（前端使用的字段名）
        dto.setLastVisit(customer.getLastVisitDate());

        // 显式设置 countryCode（确保BeanUtils复制成功）
        dto.setCountryCode(customer.getCountryCode());

        return dto;
    }
    
    private Customer convertToEntity(CustomerDTO dto) {
        Customer customer = new Customer();
        
        try {
            // 手动复制属性以确保类型正确
            customer.setId(dto.getId());
            customer.setTenantId(dto.getTenantId());
            customer.setFirstName(dto.getFirstName());
            customer.setLastName(dto.getLastName());
            customer.setPhone(dto.getPhone());
            customer.setCountryCode(dto.getCountryCode());
            customer.setEmail(dto.getEmail());
            customer.setAddress(dto.getAddress());
            customer.setDateOfBirth(dto.getDateOfBirth());
            customer.setGender(dto.getGender());
            customer.setNotes(dto.getNotes());
            customer.setAllergies(dto.getAllergies());
            // 使用 lastVisit 字段（前端使用的字段名）
            customer.setLastVisitDate(dto.getLastVisit());
            customer.setCommunicationPreference(dto.getCommunicationPreference());
            
            // 设置偏好服务ID列表
            customer.setPreferredServiceIds(dto.getPreferredServiceIds());
            
            // 设置默认值
            customer.setPoints(dto.getPoints() != null ? dto.getPoints() : 0);
            customer.setTotalSpent(dto.getTotalSpent() != null ? dto.getTotalSpent() : BigDecimal.ZERO);
            customer.setStatus(dto.getStatus() != null ? dto.getStatus() : Customer.CustomerStatus.ACTIVE);
            customer.setMembershipTierId(dto.getMembershipTierId());
            
            // 设置通信偏好默认值（如果为空）
            if (customer.getCommunicationPreference() == null) {
                customer.setCommunicationPreference(Customer.CommunicationPreference.SMS);
            }
        } catch (Exception e) {
            System.err.println("Error converting DTO to entity: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException(messageUtil.getMessage("error.customer.data.conversion.failed", new Object[]{e.getMessage()}), e);
        }

        return customer;
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public CustomerDTO createWalkInCustomer(Long tenantId) {
        System.out.println("=== Creating Walk-in Customer for tenant: " + tenantId + " ===");

        // 检查是否已存在 Walk-in 客户
        List<Customer> existingWalkIns = customerMapper.findByCondition(
            tenantId, "Walk-in", null, null, "createdAt", "ASC"
        );

        if (existingWalkIns != null && !existingWalkIns.isEmpty()) {
            for (Customer existing : existingWalkIns) {
                if ("Walk-in".equals(existing.getFirstName()) &&
                    ("Customer".equals(existing.getLastName()) || existing.getLastName() == null)) {
                    System.out.println("Walk-in customer already exists with id: " + existing.getId());
                    return convertToDTO(existing);
                }
            }
        }

        // 创建 Walk-in 客户
        CustomerDTO walkInDTO = new CustomerDTO();
        walkInDTO.setTenantId(tenantId);
        walkInDTO.setFirstName("Walk-in");
        walkInDTO.setLastName("Customer");
        walkInDTO.setPhone("0000000000"); // 默认电话号码
        walkInDTO.setEmail("walkin" + tenantId + "@vamerchant.app"); // Walk-in 客户占位邮箱
        walkInDTO.setGender(Customer.Gender.PREFER_NOT_TO_SAY);

        // 设置为REGULAR会员等级
        try {
            com.merchant.server.businessservice.entity.MembershipTier regularTier =
                membershipTierMapper.selectByTenantIdAndCode(tenantId, "REGULAR");
            if (regularTier != null) {
                walkInDTO.setMembershipTierId(regularTier.getId());
                System.out.println("Walk-in customer set to REGULAR membership tier - ID: " + regularTier.getId());
            } else {
                System.out.println("REGULAR membership tier not found for tenant: " + tenantId);
                walkInDTO.setMembershipTierId(null);
            }
        } catch (Exception e) {
            System.err.println("Error finding REGULAR membership tier: " + e.getMessage());
            walkInDTO.setMembershipTierId(null);
        }

        walkInDTO.setStatus(Customer.CustomerStatus.ACTIVE);
        walkInDTO.setCommunicationPreference(Customer.CommunicationPreference.SMS); // 默认使用SMS
        walkInDTO.setPoints(0);
        walkInDTO.setTotalSpent(BigDecimal.ZERO);
        walkInDTO.setNotes("Default walk-in customer created during merchant registration");

        System.out.println("Creating new Walk-in customer");
        return createCustomer(walkInDTO);
    }
}