import i18n from '../i18n/config';

// API基础配置
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

// 请求拦截器
const createRequest = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');

  // 对于文件上传，不设置Content-Type，让浏览器自动设置
  const isFileUpload = options.body instanceof FormData;

  const defaultHeaders = {
    ...(isFileUpload ? {} : { 'Content-Type': 'application/json' }),
    ...(token && { 'Authorization': `Bearer ${token}` }),
    'Accept-Language': i18n.language === 'zh-CN' ? 'zh' : 'en',
  };
  
  // 调试信息
  if (token) {
    console.log('Using token in request:', token.substring(0, 20) + '...');
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    // 使用简化的CORS设置
    mode: 'cors',
    credentials: 'include',
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

  // Google登录
  googleLogin: async (idToken: string): Promise<ApiResponse<LoginResponse>> => {
    return createRequest('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
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

  changePassword: async (data: { oldPassword: string; newPassword: string; confirmPassword: string }): Promise<ApiResponse<void>> => {
    return createRequest('/api/users/password', {
      method: 'PUT',
      body: JSON.stringify(data),
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

// 客户管理相关类型定义
export interface Customer {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  membershipLevel?: 'regular' | 'silver' | 'gold' | 'platinum';
  points?: number;
  totalSpent?: number;
  status?: 'active' | 'inactive';
  notes?: string;
  allergies?: string;
  communicationPreference?: 'sms' | 'email' | 'phone';
  lastVisit?: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
  fullName?: string;
  preferredServices?: string[];
  totalAppointments?: number;
  completedAppointments?: number;
  averageRating?: number;
}

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  vipCustomers: number;
  averageSpending: number;
}

export interface CustomerListResponse {
  customers: Customer[];
  currentPage: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface CustomerSearchParams {
  tenantId: string;
  keyword?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  membershipLevel?: 'REGULAR' | 'SILVER' | 'GOLD' | 'PLATINUM';
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

// 客户管理API
export const customerApi = {
  // 获取客户列表
  getCustomers: async (params: CustomerSearchParams): Promise<CustomerListResponse> => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await createRequest(`/api/customers?${queryParams.toString()}`, {
      method: 'GET',
    });
    return response;
  },

  // 获取客户详情
  getCustomerById: async (id: string): Promise<Customer> => {
    const response = await createRequest(`/api/customers/${id}`, {
      method: 'GET',
    });
    return response;
  },

  // 创建客户
  createCustomer: async (customer: Customer): Promise<Customer> => {
    const response = await createRequest('/api/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
    return response;
  },

  // 更新客户
  updateCustomer: async (id: string, customer: Customer): Promise<Customer> => {
    const response = await createRequest(`/api/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customer),
    });
    return response;
  },

  // 删除客户
  deleteCustomer: async (id: string): Promise<void> => {
    await createRequest(`/api/customers/${id}`, {
      method: 'DELETE',
    });
  },

  // 根据电话号码查询客户
  getCustomerByPhone: async (tenantId: string, phone: string): Promise<Customer> => {
    const response = await createRequest(`/api/customers/phone/${phone}?tenantId=${tenantId}`, {
      method: 'GET',
    });
    return response;
  },

  // 获取客户统计信息
  getCustomerStats: async (tenantId: string): Promise<CustomerStats> => {
    const response = await createRequest(`/api/customers/stats?tenantId=${tenantId}`, {
      method: 'GET',
    });
    return response;
  },

  // 获取消费排行榜
  getTopSpendingCustomers: async (tenantId: string, limit: number = 10): Promise<Customer[]> => {
    const response = await createRequest(`/api/customers/top-spending?tenantId=${tenantId}&limit=${limit}`, {
      method: 'GET',
    });
    return response;
  },
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