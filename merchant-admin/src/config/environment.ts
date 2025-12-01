import { Capacitor } from '@capacitor/core';

/**
 * 环境配置文件
 * 统一管理API基础URL和其他环境相关配置
 */

/**
 * 检测是否在 Capacitor 原生应用中运行
 */
export const isNativeApp = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * 检测是否为开发环境（Live Reload 模式）
 * 通过检查 server.url 配置或端口来判断
 */
const isDevServer = (): boolean => {
  // 如果是通过 IP:3000 访问，说明是 Live Reload 开发模式
  const port = window.location.port;
  return port === '3000';
};

/**
 * 获取API基础URL
 * 根据当前访问的hostname自动判断环境
 */
export const getApiBaseUrl = (): string => {
  // Capacitor 原生应用
  if (isNativeApp()) {
    // 开发模式（Live Reload）：使用空字符串，让请求通过 dev server 代理
    if (isDevServer()) {
      return '';
    }

    // 生产环境发布时：使用生产 API 地址
    return 'https://vamerchant.app';
  }

  const hostname = window.location.hostname;

  // 本地开发环境（浏览器）：使用空字符串，让请求通过 dev server 代理
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return '';
  }

  // 生产环境使用相对路径（通过Nginx代理到gateway）
  // 这样可以避免跨域问题，并且便于部署
  return '';
};

// 导出API基础URL常量
export const API_BASE_URL = getApiBaseUrl();

// 环境判断辅助函数
export const isDevelopment = (): boolean => {
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1';
};

export const isProduction = (): boolean => {
  return !isDevelopment();
};

// 其他环境相关配置可以在这里添加
export const config = {
  API_BASE_URL,
  // 可以添加其他配置项，如：
  // WEBSOCKET_URL: getWebSocketUrl(),
  // FILE_UPLOAD_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  // REQUEST_TIMEOUT: 30000, // 30秒
};

export default config;