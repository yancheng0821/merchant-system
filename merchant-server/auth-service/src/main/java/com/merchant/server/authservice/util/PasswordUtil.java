package com.merchant.server.authservice.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import java.security.SecureRandom;
import java.util.Base64;

@Component
public class PasswordUtil {
    
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    
    public String encode(String rawPassword) {
        return passwordEncoder.encode(rawPassword);
    }
    
    public boolean matches(String rawPassword, String encodedPassword) {
        return passwordEncoder.matches(rawPassword, encodedPassword);
    }
    
    // 为了兼容现有代码，保留这些方法但使用BCrypt
    public String encode(String rawPassword, String salt) {
        // 忽略salt参数，直接使用BCrypt
        return passwordEncoder.encode(rawPassword);
    }
    
    public boolean matches(String rawPassword, String encodedPassword, String salt) {
        // 忽略salt参数，直接使用BCrypt
        return passwordEncoder.matches(rawPassword, encodedPassword);
    }
    
    public String hashPassword(String password, String salt) {
        // 忽略salt参数，直接使用BCrypt
        return passwordEncoder.encode(password);
    }
    
    public String generateSalt() {
        // BCrypt不需要单独的salt，但为了兼容性保留
        SecureRandom random = new SecureRandom();
        byte[] salt = new byte[16];
        random.nextBytes(salt);
        return Base64.getEncoder().encodeToString(salt);
    }
    
    public boolean verifyPassword(String password, String passwordHash, String salt) {
        // 统一使用BCrypt验证，忽略salt参数
        return passwordEncoder.matches(password, passwordHash);
    }
} 