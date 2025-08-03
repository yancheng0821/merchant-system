package com.merchant.server.authservice.config;

import com.merchant.server.authservice.filter.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;
    
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/api/auth/files/**").permitAll() // 文件访问 - 放在最前面
                .requestMatchers("/api/auth/login", "/api/auth/register", "/api/auth/merchant-register", "/api/auth/google", "/api/auth/health", "/api/auth/validate-invitation").permitAll()
                .requestMatchers("/api/auth/invitations/validate").permitAll() // 邀请码验证接口
                .requestMatchers("/api/auth/users/avatar/**").permitAll() // 头像访问路径
                .requestMatchers("/api/test/**").permitAll()
                .requestMatchers("/actuator/**").permitAll() // 允许访问actuator端点
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            .httpBasic(httpBasic -> httpBasic.disable())
            .formLogin(formLogin -> formLogin.disable());
        
        return http.build();
    }
} 