package com.merchant.server.businessservice.controller;

import com.merchant.server.businessservice.dto.CustomerDTO;
import com.merchant.server.businessservice.entity.Customer;
import com.merchant.server.businessservice.service.CustomerService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/business/customers")
public class CustomerController {
    
    private static final Logger logger = LoggerFactory.getLogger(CustomerController.class);
    
    @Autowired
    private CustomerService customerService;
    
    private CustomerDTO convertToDTO(Customer customer) {
        CustomerDTO dto = new CustomerDTO();
        dto.setId(customer.getId());
        dto.setTenantId(customer.getTenantId());
        dto.setFirstName(customer.getFirstName());
        dto.setLastName(customer.getLastName());
        dto.setPhone(customer.getPhone());
        dto.setEmail(customer.getEmail());
        dto.setAddress(customer.getAddress());
        dto.setDateOfBirth(customer.getDateOfBirth());
        dto.setGender(customer.getGender());
        dto.setMembershipLevel(customer.getMembershipLevel());
        dto.setPoints(customer.getPoints());
        dto.setTotalSpent(customer.getTotalSpent());
        dto.setStatus(customer.getStatus());
        dto.setNotes(customer.getNotes());
        dto.setAllergies(customer.getAllergies());
        dto.setCommunicationPreference(customer.getCommunicationPreference());
        dto.setLastVisit(customer.getLastVisit());
        dto.setCreatedAt(customer.getCreatedAt());
        dto.setUpdatedAt(customer.getUpdatedAt());
        dto.setFullName(customer.getFullName());
        dto.setPreferredServiceIds(customer.getPreferredServiceIds());
        return dto;
    }
    
    /**
     * 分页查询客户
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getCustomers(
            @RequestParam Long tenantId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Customer.CustomerStatus status,
            @RequestParam(required = false) Customer.MembershipLevel membershipLevel,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "updatedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        logger.info("=== getCustomers API called ===");
        logger.info("Request parameters - tenantId: {}, keyword: {}, status: {}, membershipLevel: {}, page: {}, size: {}, sortBy: {}, sortDir: {}", 
                   tenantId, keyword, status, membershipLevel, page, size, sortBy, sortDir);
        
        try {
            Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
            Pageable pageable = PageRequest.of(page, size, sort);
            
            logger.info("Calling customerService.getCustomers with pageable: {}", pageable);
            Page<Customer> customerPage = customerService.getCustomers(tenantId, keyword, status, membershipLevel, pageable);
            logger.info("CustomerService returned {} customers, total elements: {}", 
                       customerPage.getContent().size(), customerPage.getTotalElements());
            
            Page<CustomerDTO> dtoPage = customerPage.map(this::convertToDTO);
            Map<String, Object> response = new HashMap<>();
            response.put("customers", dtoPage.getContent());
            response.put("currentPage", dtoPage.getNumber());
            response.put("totalItems", dtoPage.getTotalElements());
            response.put("totalPages", dtoPage.getTotalPages());
            response.put("hasNext", dtoPage.hasNext());
            response.put("hasPrevious", dtoPage.hasPrevious());
            
            logger.info("=== getCustomers API completed successfully ===");
            logger.info("Response - currentPage: {}, totalItems: {}, totalPages: {}, hasNext: {}, hasPrevious: {}", 
                       dtoPage.getNumber(), dtoPage.getTotalElements(), dtoPage.getTotalPages(), 
                       dtoPage.hasNext(), dtoPage.hasPrevious());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("=== getCustomers API failed ===");
            logger.error("Error occurred while getting customers: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * 获取客户详情
     */
    @GetMapping("/{id}")
    public ResponseEntity<CustomerDTO> getCustomerById(@PathVariable Long id) {
        logger.info("=== getCustomerById API called ===");
        logger.info("Request parameter - customerId: {}", id);
        
        try {
            logger.info("Calling customerService.getCustomerById with id: {}", id);
            CustomerDTO customer = customerService.getCustomerById(id);
            logger.info("CustomerService returned customer: {}", customer != null ? "found" : "not found");
            
            logger.info("=== getCustomerById API completed successfully ===");
            return ResponseEntity.ok(customer);
        } catch (Exception e) {
            logger.error("=== getCustomerById API failed ===");
            logger.error("Error occurred while getting customer by id {}: {}", id, e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * 创建客户
     */
    @PostMapping
    public ResponseEntity<CustomerDTO> createCustomer(@Valid @RequestBody CustomerDTO customerDTO) {
        logger.info("=== createCustomer API called ===");
        logger.info("Request body - customerDTO: {}", customerDTO);
        
        try {
            logger.info("Calling customerService.createCustomer");
            CustomerDTO createdCustomer = customerService.createCustomer(customerDTO);
            logger.info("CustomerService created customer with id: {}", createdCustomer.getId());
            
            logger.info("=== createCustomer API completed successfully ===");
            return ResponseEntity.ok(createdCustomer);
        } catch (Exception e) {
            logger.error("=== createCustomer API failed ===");
            logger.error("Error occurred while creating customer: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * 更新客户
     */
    @PutMapping("/{id}")
    public ResponseEntity<CustomerDTO> updateCustomer(@PathVariable Long id, @RequestBody CustomerDTO customerDTO) {
        logger.info("=== updateCustomer API called ===");
        logger.info("Request parameters - customerId: {}, customerDTO: {}", id, customerDTO);
        logger.info("Customer email: '{}', email length: {}, communication preference: {}", 
                   customerDTO.getEmail(), 
                   customerDTO.getEmail() != null ? customerDTO.getEmail().length() : "null",
                   customerDTO.getCommunicationPreference());
        
        try {
            logger.info("Validating required fields");
            // 手动验证必填字段
            if (customerDTO.getFirstName() == null || customerDTO.getFirstName().trim().isEmpty()) {
                logger.error("Validation failed: First name is required");
                throw new RuntimeException("First name is required");
            }
            if (customerDTO.getLastName() == null || customerDTO.getLastName().trim().isEmpty()) {
                logger.error("Validation failed: Last name is required");
                throw new RuntimeException("Last name is required");
            }
            if (customerDTO.getPhone() == null || customerDTO.getPhone().trim().isEmpty()) {
                logger.error("Validation failed: Phone is required");
                throw new RuntimeException("Phone is required");
            }
            if (customerDTO.getEmail() != null && !customerDTO.getEmail().trim().isEmpty()) {
                // 验证邮箱格式
                if (!customerDTO.getEmail().matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
                    logger.error("Validation failed: Invalid email format: {}", customerDTO.getEmail());
                    throw new RuntimeException("Invalid email format");
                }
            }
            
            logger.info("Validation passed, calling customerService.updateCustomer");
            CustomerDTO updatedCustomer = customerService.updateCustomer(id, customerDTO);
            logger.info("CustomerService updated customer with id: {}", updatedCustomer.getId());
            
            logger.info("=== updateCustomer API completed successfully ===");
            return ResponseEntity.ok(updatedCustomer);
        } catch (Exception e) {
            logger.error("=== updateCustomer API failed ===");
            logger.error("Error occurred while updating customer {}: {}", id, e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * 删除客户
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteCustomer(@PathVariable Long id) {
        logger.info("=== deleteCustomer API called ===");
        logger.info("Request parameter - customerId: {}", id);
        
        try {
            logger.info("Calling customerService.deleteCustomer with id: {}", id);
            customerService.deleteCustomer(id);
            logger.info("CustomerService deleted customer with id: {}", id);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Customer deleted successfully");
            
            logger.info("=== deleteCustomer API completed successfully ===");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("=== deleteCustomer API failed ===");
            logger.error("Error occurred while deleting customer {}: {}", id, e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * 根据电话号码查询客户
     */
    @GetMapping("/phone/{phone}")
    public ResponseEntity<CustomerDTO> getCustomerByPhone(
            @RequestParam Long tenantId,
            @PathVariable String phone) {
        logger.info("=== getCustomerByPhone API called ===");
        logger.info("Request parameters - tenantId: {}, phone: {}", tenantId, phone);
        
        try {
            logger.info("Calling customerService.getCustomerByPhone");
            CustomerDTO customer = customerService.getCustomerByPhone(tenantId, phone);
            logger.info("CustomerService returned customer: {}", customer != null ? "found" : "not found");
            
            logger.info("=== getCustomerByPhone API completed successfully ===");
            return ResponseEntity.ok(customer);
        } catch (Exception e) {
            logger.error("=== getCustomerByPhone API failed ===");
            logger.error("Error occurred while getting customer by phone {} for tenant {}: {}", phone, tenantId, e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * 获取客户统计信息
     */
    @GetMapping("/stats")
    public ResponseEntity<CustomerService.CustomerStatsDTO> getCustomerStats(@RequestParam Long tenantId) {
        logger.info("=== getCustomerStats API called ===");
        logger.info("Request parameter - tenantId: {}", tenantId);
        
        try {
            logger.info("Calling customerService.getCustomerStats");
            CustomerService.CustomerStatsDTO stats = customerService.getCustomerStats(tenantId);
            logger.info("CustomerService returned stats: {}", stats);
            
            logger.info("=== getCustomerStats API completed successfully ===");
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            logger.error("=== getCustomerStats API failed ===");
            logger.error("Error occurred while getting customer stats for tenant {}: {}", tenantId, e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * 获取消费排行榜
     */
    @GetMapping("/top-spending")
    public ResponseEntity<List<CustomerDTO>> getTopSpendingCustomers(
            @RequestParam Long tenantId,
            @RequestParam(defaultValue = "10") int limit) {
        logger.info("=== getTopSpendingCustomers API called ===");
        logger.info("Request parameters - tenantId: {}, limit: {}", tenantId, limit);
        
        try {
            logger.info("Calling customerService.getTopSpendingCustomers");
            List<CustomerDTO> customers = customerService.getTopSpendingCustomers(tenantId, limit);
            logger.info("CustomerService returned {} top spending customers", customers.size());
            
            logger.info("=== getTopSpendingCustomers API completed successfully ===");
            return ResponseEntity.ok(customers);
        } catch (Exception e) {
            logger.error("=== getTopSpendingCustomers API failed ===");
            logger.error("Error occurred while getting top spending customers for tenant {} with limit {}: {}", tenantId, limit, e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * 异常处理
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException e) {
        logger.error("=== RuntimeException handled ===");
        logger.error("RuntimeException occurred: {}", e.getMessage(), e);
        
        Map<String, String> error = new HashMap<>();
        error.put("error", e.getMessage());
        error.put("type", e.getClass().getSimpleName());
        
        logger.info("Returning error response: {}", error);
        return ResponseEntity.badRequest().body(error);
    }
    
    /**
     * 验证异常处理
     */
    @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(
            org.springframework.web.bind.MethodArgumentNotValidException e) {
        logger.error("=== MethodArgumentNotValidException handled ===");
        logger.error("Validation exception occurred: {}", e.getMessage(), e);
        
        Map<String, Object> error = new HashMap<>();
        error.put("error", "Validation failed");
        error.put("details", e.getBindingResult().getFieldErrors().stream()
            .collect(java.util.stream.Collectors.toMap(
                fieldError -> fieldError.getField(),
                fieldError -> fieldError.getDefaultMessage()
            )));
        
        logger.info("Returning validation error response: {}", error);
        return ResponseEntity.badRequest().body(error);
    }
    
    /**
     * JSON解析异常处理
     */
    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleJsonParseException(
            org.springframework.http.converter.HttpMessageNotReadableException e) {
        logger.error("=== HttpMessageNotReadableException handled ===");
        logger.error("JSON parsing error: {}", e.getMessage(), e);
        
        Map<String, Object> error = new HashMap<>();
        error.put("error", "JSON parse error: " + e.getMessage());
        error.put("type", "HttpMessageNotReadableException");
        
        // 如果是枚举值错误，提供更友好的错误信息
        if (e.getMessage().contains("Gender")) {
            error.put("message", "Invalid gender value. Valid values are: MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY");
        } else if (e.getMessage().contains("MembershipLevel")) {
            error.put("message", "Invalid membership level. Valid values are: REGULAR, SILVER, GOLD, PLATINUM");
        } else if (e.getMessage().contains("CustomerStatus")) {
            error.put("message", "Invalid status. Valid values are: ACTIVE, INACTIVE");
        } else if (e.getMessage().contains("CommunicationPreference")) {
            error.put("message", "Invalid communication preference. Valid values are: SMS, EMAIL, PHONE");
        } else {
            error.put("message", "Invalid data format in request");
        }
        
        logger.info("Returning JSON parse error response: {}", error);
        return ResponseEntity.badRequest().body(error);
    }
}