package com.merchant.server.notificationservice.filter;

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
 * TraceId过滤器 - 用于记录请求和响应详情
 * 功能：
 * 1. 从请求头中提取或生成traceId
 * 2. 将traceId设置到MDC，使得所有日志都包含traceId
 * 3. 记录简化的请求和响应信息
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

        long startTime = System.currentTimeMillis();

        try {
            // 记录请求信息
            logRequest(wrappedRequest, traceId);

            // 继续过滤器链
            chain.doFilter(wrappedRequest, wrappedResponse);

            // 记录响应信息
            long duration = System.currentTimeMillis() - startTime;
            logResponse(wrappedRequest, wrappedResponse, traceId, duration);

        } finally {
            // 将缓存的响应内容写回客户端
            wrappedResponse.copyBodyToResponse();

            // 清除MDC
            MDC.remove(TRACE_ID_MDC);
        }
    }

    /**
     * 记录请求信息（简化版 - 业务日志专用）
     */
    private void logRequest(ContentCachingRequestWrapper request, String traceId) {
        // 简化的业务日志：只记录请求概要，详细的HTTP信息由Gateway记录
        log.info("Request: {} {} [TraceId: {}]",
                request.getMethod(),
                request.getRequestURI() + (request.getQueryString() != null ? "?" + request.getQueryString() : ""),
                traceId);
    }

    /**
     * 记录响应信息（简化版 - 业务日志专用）
     */
    private void logResponse(ContentCachingRequestWrapper request,
                            ContentCachingResponseWrapper response,
                            String traceId,
                            long duration) {
        // 简化的业务日志：只记录响应概要，详细的HTTP信息由Gateway记录
        int status = response.getStatus();

        if (status >= 400) {
            log.error("Response: {} {} - Status: {} - Duration: {}ms [TraceId: {}]",
                    request.getMethod(),
                    request.getRequestURI(),
                    status,
                    duration,
                    traceId);
        } else {
            log.info("Response: {} {} - Status: {} - Duration: {}ms [TraceId: {}]",
                    request.getMethod(),
                    request.getRequestURI(),
                    status,
                    duration,
                    traceId);
        }
    }

}
