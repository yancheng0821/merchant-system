package com.merchant.server.authservice.service;

import com.merchant.server.authservice.entity.User;
import java.util.List;
import java.util.Optional;

public interface UserService {
    
    Optional<User> findById(Long id);
    
    Optional<User> findByUsername(String username);
    
    Optional<User> findByUsernameAndTenantId(String username, Long tenantId);
    
    Optional<User> findByEmail(String email);
    
    Optional<User> findByEmailAndTenantId(String email, Long tenantId);
    
    List<User> findByTenantId(Long tenantId);
    
    User save(User user);
    
    void deleteById(Long id);
    
    boolean existsByUsername(String username);
    
    boolean existsByUsernameAndTenantId(String username, Long tenantId);
    
    boolean existsByEmail(String email);
    
    boolean existsByEmailAndTenantId(String email, Long tenantId);
} 