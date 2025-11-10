package com.merchant.server.authservice.config;

import feign.Logger;
import feign.RequestInterceptor;
import feign.RequestTemplate;
import feign.codec.Decoder;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.beans.factory.ObjectFactory;
import org.springframework.boot.autoconfigure.http.HttpMessageConverters;
import org.springframework.cloud.openfeign.support.ResponseEntityDecoder;
import org.springframework.cloud.openfeign.support.SpringDecoder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.StringHttpMessageConverter;

import java.nio.charset.StandardCharsets;

/**
 * Feign配置
 * 功能：
 * 1. 设置Feign日志级别
 * 2. 添加traceId到Feign请求头
 * 3. 配置UTF-8编码解决中文乱码
 */
@Slf4j
@Configuration
public class FeignConfig {

    private static final String TRACE_ID = "X-Trace-Id";
    private static final String TRACE_ID_MDC = "traceId";

    /**
     * Feign日志级别配置
     * FULL: 记录请求和响应的所有信息（头、体、元数据）
     */
    @Bean
    Logger.Level feignLoggerLevel() {
        return Logger.Level.FULL;
    }

    /**
     * 自定义 Feign 日志记录器
     * 使用标准化的日志标签
     */
    @Bean
    public Logger feignLogger() {
        return new CustomFeignLogger();
    }

    /**
     * Feign请求拦截器
     * 将traceId从MDC传递到Feign请求头
     */
    @Bean
    public RequestInterceptor requestInterceptor() {
        return new RequestInterceptor() {
            @Override
            public void apply(RequestTemplate template) {
                // 从MDC中获取traceId并添加到请求头
                String traceId = MDC.get(TRACE_ID_MDC);
                if (traceId != null) {
                    template.header(TRACE_ID, traceId);
                }

                // 提取目标服务名称
                String url = template.url();
                String serviceName = extractServiceName(url);

                // [EXTERNAL-REQ] 记录外部服务请求
                StringBuilder requestInfo = new StringBuilder();
                requestInfo.append(template.method()).append(" ").append(url);

                if (!template.queries().isEmpty()) {
                    requestInfo.append(", params: ").append(template.queries());
                }

                if (template.body() != null && template.body().length > 0) {
                    String body = new String(template.body());
                    // 如果body太长，只记录前200个字符
                    if (body.length() > 200) {
                        body = body.substring(0, 200) + "...";
                    }
                    requestInfo.append(", body: ").append(body);
                }

                log.info("[EXTERNAL-REQ] {} - {}", serviceName, requestInfo.toString());
            }

            private String extractServiceName(String url) {
                // 从URL中提取服务名称
                try {
                    if (url.contains("://")) {
                        String host = url.split("://")[1].split("/")[0];
                        // 转换为驼峰命名: merchant-service -> MerchantService
                        String[] parts = host.split("-");
                        StringBuilder serviceName = new StringBuilder();
                        for (String part : parts) {
                            serviceName.append(Character.toUpperCase(part.charAt(0)))
                                      .append(part.substring(1));
                        }
                        return serviceName.toString();
                    }
                } catch (Exception e) {
                    // ignore
                }
                return "ExternalService";
            }
        };
    }

    /**
     * 配置Feign的Decoder以支持UTF-8编码
     * 解决中文响应乱码问题
     */
    @Bean
    public Decoder feignDecoder() {
        HttpMessageConverter<?> jacksonConverter = new StringHttpMessageConverter(StandardCharsets.UTF_8);
        ObjectFactory<HttpMessageConverters> objectFactory = () -> new HttpMessageConverters(jacksonConverter);
        return new ResponseEntityDecoder(new SpringDecoder(objectFactory));
    }
}
