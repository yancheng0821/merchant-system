package com.merchant.server.businessservice.config;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Configuration;

@Configuration
@MapperScan("com.merchant.server.businessservice.mapper")
public class MyBatisConfig {
}