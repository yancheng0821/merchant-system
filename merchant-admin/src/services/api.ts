// API基础配置
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8081';

// 请求拦截器
const createRequest = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  
  // 对于文件上传，不设置Content-Type，让浏览器自动设置
  const isFileUpload = options.body instanceof FormData;
  
  const defaultHeaders = {
    ...(isFileUpload ? {} : { 'Content-Type': 'application/json' }),
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, config);
    
    // 尝试解析响应数据
    let responseData;
    try {
      responseData = await response.json();
    } catch (parseError) {
      // 如果无法解析JSON，创建一个默认的错误响应
      responseData = {
        success: false,
        message: `HTTP ${response.status}: ${response.statusText}`,
        data: null
      };
    }
    
    // 如果响应不成功，抛出错误
    if (!response.ok) {
      const error = new Error(responseData.message || `HTTP error! status: ${response.status}`);
      (error as any).response = response;
      (error as any).responseData = responseData;
      throw error;
    }
    
    return responseData;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// API响应类型定义
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  confirmPassword: string;
  realName: string;
  email: string;
  phone?: string;
  tenantCode?: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  userId: number;
  username: string;
  realName: string;
  email: string;
  avatar?: string;
  tenantId: number;
  tenantName?: string;
  roles?: string[];
  permissions?: string[];
  tokenExpireTime?: string;
  lastLoginTime?: string;
}

export interface User {
  id: number;
  username: string;
  realName: string;
  email: string;
  avatar?: string;
  tenantId: number;
  tenantName?: string;
  roles?: string[];
  permissions?: string[];
  lastLoginTime?: string;
}



// 认证相关API
export const authApi = {
  // 登录
  login: async (data: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    return createRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 注册
  register: async (data: RegisterRequest): Promise<ApiResponse<LoginResponse>> => {
    return createRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 登出
  logout: async (): Promise<ApiResponse<void>> => {
    return createRequest('/api/auth/logout', {
      method: 'POST',
    });
  },

  // 刷新令牌
  refreshToken: async (refreshToken: string): Promise<ApiResponse<LoginResponse>> => {
    return createRequest('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },

  // 验证令牌
  validateToken: async (token: string): Promise<ApiResponse<boolean>> => {
    return createRequest(`/api/auth/validate?token=${token}`, {
      method: 'GET',
    });
  },

  // 健康检查
  health: async (): Promise<ApiResponse<string>> => {
    return createRequest('/api/auth/health', {
      method: 'GET',
    });
  },
};

// 用户相关API
export const userApi = {
  // 获取用户信息
  getProfile: async (): Promise<ApiResponse<User>> => {
    return createRequest('/api/users/profile', {
      method: 'GET',
    });
  },

  // 更新用户信息
  updateProfile: async (data: Partial<User>): Promise<ApiResponse<User>> => {
    return createRequest('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // 上传头像
  uploadAvatar: async (file: File): Promise<ApiResponse<{ avatarUrl: string }>> => {
    const formData = new FormData();
    formData.append('avatar', file);

    return createRequest('/api/users/avatar', {
      method: 'POST',
      headers: {}, // 让浏览器自动设置Content-Type
      body: formData,
    });
  },
};

// 错误处理工具
export const handleApiError = (error: any): string => {
  console.log('Handling API error:', error);
  
  // 检查是否有响应数据
  if (error.responseData?.message) {
    return error.responseData.message;
  }
  
  // 检查错误消息
  if (error.message) {
    return error.message;
  }
  
  // 检查响应对象
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  // 默认错误消息
  return 'An unexpected error occurred';
};

// 令牌管理工具
export const tokenManager = {
  setToken: (token: string) => {
    localStorage.setItem('token', token);
  },
  
  getToken: (): string | null => {
    return localStorage.getItem('token');
  },
  
  removeToken: () => {
    localStorage.removeItem('token');
  },
  
  setRefreshToken: (refreshToken: string) => {
    localStorage.setItem('refreshToken', refreshToken);
  },
  
  getRefreshToken: (): string | null => {
    return localStorage.getItem('refreshToken');
  },
  
  removeRefreshToken: () => {
    localStorage.removeItem('refreshToken');
  },
  
  clearAll: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },
}; 