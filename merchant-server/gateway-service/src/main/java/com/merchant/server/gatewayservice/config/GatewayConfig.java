package com.merchant.server.gatewayservice.config;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GatewayConfig {

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                // 文件访问路由 - 不需要认证
                .route("file-access", r -> r
                        .path("/api/files/**")
                        .uri("lb://auth-service")
                )
                .build();
    }
}