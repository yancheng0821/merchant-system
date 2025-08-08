import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from 'axios';
import {Alert} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';

// API 响应基础接口
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  code: number;
}

// 请求配置接口
interface RequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean; // 跳过认证
  skipErrorHandler?: boolean; // 跳过错误处理
}

// API 基础 URL - 根据环境配置
const BASE_URL = __DEV__ 
  ? 'http://localhost:8080/api' // 开发环境
  : 'https://your-production-api.com/api'; // 生产环境

// 创建 axios 实例
const request: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // 15秒超时
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// 从存储中获取 token
const getStoredToken = async (): Promise<string | null> => {
  try {
    const authData = await AsyncStorage.getItem('auth-storage');
    if (authData) {
      const parsed = JSON.parse(authData);
      return parsed?.state?.token || null;
    }
    return null;
  } catch (error) {
    console.error('Error getting stored token:', error);
    return null;
  }
};

// 请求拦截器
request.interceptors.request.use(
  async (config: any) => {
    // 如果不需要认证，直接返回
    if (config.skipAuth) {
      return config;
    }

    // 获取并添加 token
    const token = await getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 添加设备信息和语言
    config.headers['Accept-Language'] = i18n.language;
    config.headers['X-Client-Type'] = 'mobile';
    config.headers['X-Client-Version'] = '1.0.0';

    // 请求日志（仅开发环境）
    if (__DEV__) {
      console.log('🔄 API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        data: config.data,
        params: config.params,
        headers: config.headers,
      });
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('🔴 Request interceptor error:', error);
    return Promise.reject(error);
  },
);

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    // 响应日志（仅开发环境）
    if (__DEV__) {
      console.log('✅ API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
    }

    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as RequestConfig;
    
    // 错误日志
    console.error('🔴 API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data,
    });

    // 处理不同类型的错误
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // 未授权 - 清除本地认证信息并跳转到登录页
          await handleUnauthorized();
          break;
        case 403:
          // 权限不足
          if (!config?.skipErrorHandler) {
            showErrorAlert(i18n.t('errors.permissionDenied'));
          }
          break;
        case 404:
          // 资源未找到
          if (!config?.skipErrorHandler) {
            showErrorAlert(i18n.t('errors.notFound'));
          }
          break;
        case 422:
          // 验证错误
          if (!config?.skipErrorHandler) {
            const message = (data as any)?.message || i18n.t('errors.validationError');
            showErrorAlert(message);
          }
          break;
        case 500:
          // 服务器错误
          if (!config?.skipErrorHandler) {
            showErrorAlert(i18n.t('errors.serverError'));
          }
          break;
        default:
          // 其他错误
          if (!config?.skipErrorHandler) {
            const message = (data as any)?.message || i18n.t('errors.unknownError');
            showErrorAlert(message);
          }
      }
    } else if (error.request) {
      // 网络错误
      if (!config?.skipErrorHandler) {
        if (error.code === 'ECONNABORTED') {
          showErrorAlert(i18n.t('errors.timeout'));
        } else {
          showErrorAlert(i18n.t('errors.networkError'));
        }
      }
    }

    return Promise.reject(error);
  },
);

// 处理未授权错误
const handleUnauthorized = async () => {
  try {
    // 清除认证信息
    await AsyncStorage.multiRemove(['auth-storage', 'cart-storage']);
    
    // 显示错误提示
    showErrorAlert(i18n.t('errors.authenticationError'));
    
    // TODO: 这里应该导航到登录页面
    // 由于这是工具函数，不能直接使用导航，需要通过事件或回调处理
    console.log('需要重新登录');
  } catch (error) {
    console.error('Error handling unauthorized:', error);
  }
};

// 显示错误提示
const showErrorAlert = (message: string) => {
  Alert.alert(
    i18n.t('common.error'),
    message,
    [{ text: i18n.t('common.confirm'), style: 'default' }]
  );
};

// 通用请求方法
export const httpRequest = {
  // GET 请求
  get: <T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> => {
    return request.get(url, config).then(response => response.data);
  },

  // POST 请求
  post: <T = any>(
    url: string,
    data?: any,
    config?: RequestConfig,
  ): Promise<ApiResponse<T>> => {
    return request.post(url, data, config).then(response => response.data);
  },

  // PUT 请求
  put: <T = any>(
    url: string,
    data?: any,
    config?: RequestConfig,
  ): Promise<ApiResponse<T>> => {
    return request.put(url, data, config).then(response => response.data);
  },

  // PATCH 请求
  patch: <T = any>(
    url: string,
    data?: any,
    config?: RequestConfig,
  ): Promise<ApiResponse<T>> => {
    return request.patch(url, data, config).then(response => response.data);
  },

  // DELETE 请求
  delete: <T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> => {
    return request.delete(url, config).then(response => response.data);
  },

  // 文件上传
  upload: <T = any>(
    url: string,
    formData: FormData,
    config?: RequestConfig,
  ): Promise<ApiResponse<T>> => {
    return request.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    }).then(response => response.data);
  },
};

// 导出默认实例
export default request;