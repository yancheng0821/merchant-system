package com.merchant.server.businessservice.config;

import feign.Logger;
import feign.Request;
import feign.Response;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;

/**
 * 自定义 Feign 日志记录器
 * 使用标准化的日志标签记录外部服务响应
 */
@Slf4j
public class CustomFeignLogger extends Logger {

    @Override
    protected void log(String configKey, String format, Object... args) {
        // 使用SLF4J的logger，而不是System.out
        log.debug(String.format(methodTag(configKey) + format, args));
    }

    @Override
    protected void logRequest(String configKey, Level logLevel, Request request) {
        // 请求日志已在 RequestInterceptor 中处理，这里不重复记录
    }

    @Override
    protected Response logAndRebufferResponse(String configKey, Level logLevel, Response response, long elapsedTime)
            throws IOException {

        // 提取服务名称
        String serviceName = extractServiceName(configKey);

        // [EXTERNAL-RES] 记录外部服务响应
        StringBuilder responseInfo = new StringBuilder();
        responseInfo.append("status: ").append(response.status());
        responseInfo.append(", duration: ").append(elapsedTime).append("ms");

        // 记录响应头中的关键信息
        if (response.headers().containsKey("Content-Type")) {
            responseInfo.append(", contentType: ").append(response.headers().get("Content-Type"));
        }

        log.info("[EXTERNAL-RES] {} - {}", serviceName, responseInfo.toString());

        return super.logAndRebufferResponse(configKey, logLevel, response, elapsedTime);
    }

    @Override
    protected IOException logIOException(String configKey, Level logLevel, IOException ioe, long elapsedTime) {
        String serviceName = extractServiceName(configKey);
        log.error("[EXTERNAL-RES] {} - error: {}, duration: {}ms",
                 serviceName, ioe.getMessage(), elapsedTime);
        return super.logIOException(configKey, logLevel, ioe, elapsedTime);
    }

    /**
     * 从 configKey 中提取服务名称
     * configKey 格式: com.merchant.server.businessservice.client.MerchantServiceClient#getMethod(Long)
     */
    private String extractServiceName(String configKey) {
        try {
            // 提取类名: MerchantServiceClient
            String className = configKey.substring(configKey.lastIndexOf('.') + 1, configKey.indexOf('#'));
            // 移除 Client 后缀
            if (className.endsWith("Client")) {
                return className.substring(0, className.length() - 6);
            }
            return className;
        } catch (Exception e) {
            return "ExternalService";
        }
    }
}
