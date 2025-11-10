package com.merchant.server.businessservice.filter;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;

/**
 * TraceId过滤器 - 用于分布式链路追踪
 * 功能：
 * 1. 从请求头中提取或生成traceId
 * 2. 将traceId设置到MDC，使得所有日志都包含traceId
 * 3. 将traceId添加到响应头，便于下游服务追踪
 *
 * 注意：请求/响应日志由 BusinessLogAspect 统一处理，此Filter不再记录
 */
@Slf4j
@Component
@Order(1)
public class TraceIdFilter implements Filter {

    private static final String TRACE_ID = "X-Trace-Id";
    private static final String TRACE_ID_MDC = "traceId";

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        // 设置请求和响应的字符编码为UTF-8
        request.setCharacterEncoding("UTF-8");
        response.setCharacterEncoding("UTF-8");

        // 包装request和response以便读取内容
        ContentCachingRequestWrapper wrappedRequest = new ContentCachingRequestWrapper(httpRequest);
        ContentCachingResponseWrapper wrappedResponse = new ContentCachingResponseWrapper(httpResponse);

        // 获取或生成traceId
        String traceId = httpRequest.getHeader(TRACE_ID);
        if (traceId == null || traceId.isEmpty()) {
            traceId = UUID.randomUUID().toString().replace("-", "");
        }

        // 设置MDC
        MDC.put(TRACE_ID_MDC, traceId);

        // 将traceId添加到响应头
        httpResponse.setHeader(TRACE_ID, traceId);

        try {
            // 继续过滤器链
            // 注意：不再在这里记录请求/响应日志，由 BusinessLogAspect 统一处理
            chain.doFilter(wrappedRequest, wrappedResponse);

        } finally {
            // 将缓存的响应内容写回客户端
            wrappedResponse.copyBodyToResponse();

            // 清除MDC
            MDC.remove(TRACE_ID_MDC);
        }
    }

}
