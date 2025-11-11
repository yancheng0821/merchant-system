/**
 * 环境配置文件
 * 统一管理API基础URL和其他环境相关配置
 */

/**
 * 获取API基础URL
 * 根据当前访问的hostname自动判断环境
 */
export const getApiBaseUrl = (): string => {
  const hostname = window.location.hostname;

  // 本地开发环境
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8080';
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