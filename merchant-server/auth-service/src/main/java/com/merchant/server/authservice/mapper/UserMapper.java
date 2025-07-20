package com.merchant.server.authservice.mapper;

import com.merchant.server.authservice.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Optional;

@Mapper
public interface UserMapper {
    
    User selectById(Long id);
    
    User selectByUsername(String username);
    
    User selectByUsernameAndTenantId(@Param("username") String username, @Param("tenantId") Long tenantId);
    
    User selectByEmail(String email);
    
    User selectByEmailAndTenantId(@Param("email") String email, @Param("tenantId") Long tenantId);
    
    List<User> selectByTenantId(Long tenantId);
    
    int insert(User user);
    
    int update(User user);
    
    int deleteById(Long id);
    
    boolean existsByUsername(String username);
    
    boolean existsByUsernameAndTenantId(@Param("username") String username, @Param("tenantId") Long tenantId);
    
    boolean existsByEmail(String email);
    
    boolean existsByEmailAndTenantId(@Param("email") String email, @Param("tenantId") Long tenantId);
} 