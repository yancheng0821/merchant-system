package com.merchant.server.authservice.service;

import com.merchant.server.authservice.dto.GoogleLoginRequest;
import com.merchant.server.authservice.dto.LoginRequest;
import com.merchant.server.authservice.dto.LoginResponse;
import com.merchant.server.authservice.dto.RegisterRequest;

public interface AuthService {
    
    LoginResponse login(LoginRequest request);
    
    LoginResponse register(RegisterRequest request);
    
    LoginResponse googleLogin(GoogleLoginRequest request);
    
    void logout(String token);
    
    LoginResponse refreshToken(String refreshToken);
    
    boolean validateToken(String token);
} 