package com.merchant.server.businessservice.controller;

import com.merchant.server.businessservice.dto.CustomerDTO;
import com.merchant.server.businessservice.entity.Customer;
import com.merchant.server.businessservice.service.CustomerService;
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
@RequestMapping("/api/customers")
public class CustomerController {
    
    @Autowired
    private CustomerService customerService;
    
    private CustomerDTO convertToDTO(Customer customer) {
        CustomerDTO dto = new CustomerDTO();
        dto.setId(customer.getId());
        dto.setTenantId(customer.getTenantId());
        dto.setPhone(customer.getPhone());
        dto.setEmail(customer.getEmail());
        dto.setStatus(customer.getStatus());
        dto.setMembershipLevel(customer.getMembershipLevel());
        dto.setTotalSpent(customer.getTotalSpent());
        dto.setLastVisit(customer.getLastVisit());
        dto.setFirstName(customer.getFirstName());
        dto.setLastName(customer.getLastName());
        // 如有更多字段请补充
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
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
            Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<Customer> customerPage = customerService.getCustomers(tenantId, keyword, status, membershipLevel, pageable);
        Page<CustomerDTO> dtoPage = customerPage.map(this::convertToDTO);
        Map<String, Object> response = new HashMap<>();
        response.put("customers", dtoPage.getContent());
        response.put("currentPage", dtoPage.getNumber());
        response.put("totalItems", dtoPage.getTotalElements());
        response.put("totalPages", dtoPage.getTotalPages());
        response.put("hasNext", dtoPage.hasNext());
        response.put("hasPrevious", dtoPage.hasPrevious());
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 获取客户详情
     */
    @GetMapping("/{id}")
    public ResponseEntity<CustomerDTO> getCustomerById(@PathVariable Long id) {
        CustomerDTO customer = customerService.getCustomerById(id);
        return ResponseEntity.ok(customer);
    }
    
    /**
     * 创建客户
     */
    @PostMapping
    public ResponseEntity<CustomerDTO> createCustomer(@Valid @RequestBody CustomerDTO customerDTO) {
        CustomerDTO createdCustomer = customerService.createCustomer(customerDTO);
        return ResponseEntity.ok(createdCustomer);
    }
    
    /**
     * 更新客户
     */
    @PutMapping("/{id}")
    public ResponseEntity<CustomerDTO> updateCustomer(@PathVariable Long id, @Valid @RequestBody CustomerDTO customerDTO) {
        CustomerDTO updatedCustomer = customerService.updateCustomer(id, customerDTO);
        return ResponseEntity.ok(updatedCustomer);
    }
    
    /**
     * 删除客户
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteCustomer(@PathVariable Long id) {
        customerService.deleteCustomer(id);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Customer deleted successfully");
        return ResponseEntity.ok(response);
    }
    
    /**
     * 根据电话号码查询客户
     */
    @GetMapping("/phone/{phone}")
    public ResponseEntity<CustomerDTO> getCustomerByPhone(
            @RequestParam Long tenantId,
            @PathVariable String phone) {
        CustomerDTO customer = customerService.getCustomerByPhone(tenantId, phone);
        return ResponseEntity.ok(customer);
    }
    
    /**
     * 获取客户统计信息
     */
    @GetMapping("/stats")
    public ResponseEntity<CustomerService.CustomerStatsDTO> getCustomerStats(@RequestParam Long tenantId) {
        CustomerService.CustomerStatsDTO stats = customerService.getCustomerStats(tenantId);
        return ResponseEntity.ok(stats);
    }
    
    /**
     * 获取消费排行榜
     */
    @GetMapping("/top-spending")
    public ResponseEntity<List<CustomerDTO>> getTopSpendingCustomers(
            @RequestParam Long tenantId,
            @RequestParam(defaultValue = "10") int limit) {
        List<CustomerDTO> customers = customerService.getTopSpendingCustomers(tenantId, limit);
        return ResponseEntity.ok(customers);
    }
    
    /**
     * 异常处理
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException e) {
        Map<String, String> error = new HashMap<>();
        error.put("error", e.getMessage());
        return ResponseEntity.badRequest().body(error);
    }
}