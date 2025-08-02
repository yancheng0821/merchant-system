package com.merchant.server.authservice.filter;

import com.merchant.server.authservice.entity.User;
import com.merchant.server.authservice.service.UserService;
import com.merchant.server.authservice.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.Optional;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @Autowired
    private UserService userService;
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        try {
            String token = getTokenFromRequest(request);
            
            if (StringUtils.hasText(token) && jwtUtil.validateToken(token)) {
                // 使用用户ID而不是用户名，避免多租户中相同用户名的问题
                Long userId = jwtUtil.getUserIdFromToken(token);
                
                if (userId != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    Optional<User> userOpt = userService.findById(userId);
                    
                    if (userOpt.isPresent()) {
                        User user = userOpt.get();
                        
                        // 创建UserDetails对象
                        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                            .username(user.getUsername())
                            .password("") // 这里不需要密码，因为使用JWT认证
                            .authorities(Collections.singletonList(new SimpleGrantedAuthority("ROLE_MERCHANT_ADMIN")))
                            .accountExpired(false)
                            .accountLocked(false)
                            .credentialsExpired(false)
                            .disabled(!"ACTIVE".equals(user.getStatus()))
                            .build();
                        
                        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                        
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                        logger.debug("JWT认证成功 - 用户ID: {}, 用户名: {}", userId, user.getUsername());
                    }
                }
            }
        } catch (Exception e) {
            logger.error("JWT认证失败: {}", e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName(), e);
        }
        
        filterChain.doFilter(request, response);
    }
    
    private String getTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
} 