import i18n from '../i18n/config';

// API基础配置
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

// 工具函数：获取完整的文件URL
export const getFullImageUrl = (imageUrl?: string): string | undefined => {
  if (!imageUrl) return undefined;
  if (imageUrl.startsWith('http') || imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
    return imageUrl;
  }
  
  // 处理旧的头像路径格式，将 /api/users/avatar 改为 /api/auth/users/avatar
  let processedUrl = imageUrl;
  if (imageUrl.includes('/api/users/avatar/')) {
    processedUrl = imageUrl.replace('/api/users/avatar/', '/api/auth/users/avatar/');
  }
  
  // 通过gateway访问文件
  return `${API_BASE_URL}${processedUrl}`;
};

// 文件上传API
export const fileUploadApi = {
    // 上传头像
    uploadAvatar: async (file: File, tenantId: number): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('tenantId', tenantId.toString());
        
        const response = await fetch(`${API_BASE_URL}/api/auth/files/upload/avatar`, {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
        });
        
        if (!response.ok) {
            throw new Error('Upload failed');
        }
        
        const result = await response.json();
        return result.url; // 返回文件访问URL
    },
    
    // 上传房间图标
    uploadRoomIcon: async (file: File, tenantId: number): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('tenantId', tenantId.toString());
        
        const response = await fetch(`${API_BASE_URL}/api/auth/files/upload/room-icon`, {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
        });
        
        if (!response.ok) {
            throw new Error('Upload failed');
        }
        
        const result = await response.json();
        return result.url; // 返回文件访问URL
    },
    
    // 删除文件
    deleteFile: async (fileUrl: string): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/api/auth/files/delete`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ fileUrl }),
        });
        
        if (!response.ok) {
            throw new Error('Delete failed');
        }
    },
};

// 商户配置相关API
export const merchantConfigApi = {
  // 获取商户完整配置
  getMerchantConfig: async (tenantId: number) => {
    const response = await fetch(`${API_BASE_URL}/api/merchant/config/${tenantId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch merchant config');
    }
    
    return response.json();
  },

  // 获取商户资源类型配置
  getResourceTypes: async (tenantId: number) => {
    const response = await fetch(`${API_BASE_URL}/api/merchant/config/${tenantId}/resource-types`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch resource types');
    }
    
    return response.json();
  },

  // 更新商户配置
  updateMerchantConfig: async (tenantId: number, config: any) => {
    const response = await fetch(`${API_BASE_URL}/api/merchant/config/${tenantId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(config),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update merchant config');
    }
  },

  // 获取商户基础信息
  getMerchantBasicInfo: async (tenantId: number) => {
    const response = await fetch(`${API_BASE_URL}/api/merchant/config/${tenantId}/basic`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch merchant basic info');
    }
    
    return response.json();
  },

  // 更新商户基础信息
  updateMerchantBasicInfo: async (tenantId: number, merchantInfo: any) => {
    const response = await fetch(`${API_BASE_URL}/api/merchant/config/${tenantId}/basic`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(merchantInfo),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update merchant basic info');
    }
    
    // 检查响应是否有内容
    const text = await response.text();
    if (text) {
      try {
        return JSON.parse(text);
      } catch (e) {
        return { success: true };
      }
    }
    return { success: true };
  },

  // 获取所有配置项
  getAllConfigs: async (tenantId: number) => {
    const response = await fetch(`${API_BASE_URL}/api/merchant/config/${tenantId}/all`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch all configs');
    }
    
    return response.json();
  },

  // 更新单个配置项
  updateConfig: async (tenantId: number, configKey: string, configValue: string, description: string) => {
    const response = await fetch(`${API_BASE_URL}/api/merchant/config/${tenantId}/config/${configKey}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        configValue,
        description
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update config');
    }
    
    // 检查响应是否有内容
    const text = await response.text();
    if (text) {
      try {
        return JSON.parse(text);
      } catch (e) {
        return { success: true };
      }
    }
    return { success: true };
  },
};

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
      // 如果无法解析JSON，尝试获取文本内容
      let textContent = '';
      try {
        textContent = await response.text();
      } catch (textError) {
        textContent = 'Unable to read response';
      }
      
      responseData = {
        success: false,
        message: `HTTP ${response.status}: ${response.statusText}`,
        data: null,
        rawResponse: textContent
      };
    }

    // 如果响应不成功，抛出错误
    if (!response.ok) {
      console.error('API Error Response:', responseData);
      console.error('Request URL:', `${API_BASE_URL}${url}`);
      console.error('Request Config:', config);
      
      const error = new Error(responseData.message || `HTTP error! status: ${response.status}`);
      (error as any).response = response;
      (error as any).responseData = responseData;
      (error as any).status = response.status;
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
    return createRequest('/api/auth/users/profile', {
      method: 'GET',
    });
  },

  // 更新用户信息
  updateProfile: async (data: Partial<User>): Promise<ApiResponse<User>> => {
    return createRequest('/api/auth/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // 上传头像
  uploadAvatar: async (file: File): Promise<ApiResponse<{ avatarUrl: string }>> => {
    const formData = new FormData();
    formData.append('avatar', file);

    return createRequest('/api/auth/users/avatar', {
      method: 'POST',
      headers: {}, // 让浏览器自动设置Content-Type
      body: formData,
    });
  },

  // 修改密码
  changePassword: async (data: { oldPassword: string; newPassword: string; confirmPassword: string }): Promise<ApiResponse<void>> => {
    return createRequest('/api/auth/users/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// 错误处理工具
export const handleApiError = (error: any): string => {
  console.log('Handling API error:', error);

  // 检查是否有详细的验证错误
  if (error.responseData?.details) {
    console.log('Validation errors:', error.responseData.details);
    const details = Object.entries(error.responseData.details)
      .map(([field, message]) => `${field}: ${message}`)
      .join(', ');
    return `验证失败: ${details}`;
  }

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

// 服务相关类型定义
export interface Service {
  id: number;
  tenantId: number;
  categoryId: number;
  name: string;
  description?: string;
  price: number;
  duration: number;
  icon?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
  // 关联信息
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
}

// 客户管理相关类型定义
export interface Customer {
  id?: string | number;
  tenantId: string | number;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  membershipLevel?: 'REGULAR' | 'SILVER' | 'GOLD' | 'PLATINUM';
  points?: number;
  totalSpent?: number;
  status?: 'ACTIVE' | 'INACTIVE';
  notes?: string;
  allergies?: string;
  communicationPreference?: 'SMS' | 'EMAIL' | 'PHONE';
  lastVisit?: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
  fullName?: string;
  preferredServiceIds?: number[];
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
  tenantId: string | number;
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

    const response = await createRequest(`/api/business/customers?${queryParams.toString()}`, {
      method: 'GET',
    });
    return response;
  },

  // 获取客户详情
  getCustomerById: async (id: string): Promise<Customer> => {
    const response = await createRequest(`/api/business/customers/${id}`, {
      method: 'GET',
    });
    return response;
  },

  // 创建客户
  createCustomer: async (customer: Customer): Promise<Customer> => {
    // 创建客户对象，包含所有字段
    const customerToSend = {
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      email: customer.email,
      tenantId: customer.tenantId,
      // 可选字段 - 保持原值，包括空字符串
      address: customer.address,
      dateOfBirth: customer.dateOfBirth,
      notes: customer.notes,
      allergies: customer.allergies,
      gender: customer.gender,
      preferredServiceIds: customer.preferredServiceIds,
      // 默认值
      status: customer.status || 'ACTIVE',
      membershipLevel: customer.membershipLevel || 'REGULAR',
      communicationPreference: customer.communicationPreference || 'SMS',
      points: customer.points || 0,
      totalSpent: customer.totalSpent || 0,
      lastVisit: customer.lastVisit,
    };
    
    console.log('Creating customer with data:', customerToSend);
    const response = await createRequest('/api/business/customers', {
      method: 'POST',
      body: JSON.stringify(customerToSend),
    });
    return response;
  },

  // 更新客户
  updateCustomer: async (id: string, customer: Customer): Promise<Customer> => {
    const response = await createRequest(`/api/business/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customer),
    });
    return response;
  },

  // 删除客户
  deleteCustomer: async (id: string): Promise<void> => {
    await createRequest(`/api/business/customers/${id}`, {
      method: 'DELETE',
    });
  },

  // 根据电话号码查询客户
  getCustomerByPhone: async (tenantId: string, phone: string): Promise<Customer> => {
    const response = await createRequest(`/api/business/customers/phone/${phone}?tenantId=${tenantId}`, {
      method: 'GET',
    });
    return response;
  },

  // 获取客户统计信息
  getCustomerStats: async (tenantId: string): Promise<CustomerStats> => {
    const response = await createRequest(`/api/business/customers/stats?tenantId=${tenantId}`, {
      method: 'GET',
    });
    return response;
  },

  // 获取消费排行榜
  getTopSpendingCustomers: async (tenantId: string, limit: number = 10): Promise<Customer[]> => {
    const response = await createRequest(`/api/business/customers/top-spending?tenantId=${tenantId}&limit=${limit}`, {
      method: 'GET',
    });
    return response;
  },
};

// 服务分类相关接口定义
export interface ServiceCategory {
  id: number;
  tenantId: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  serviceCount?: number;
}

// 服务相关接口定义（更新）
export interface ServiceManagement {
  id: number;
  tenantId: number;
  categoryId: number;
  name: string;
  description?: string;
  price: number;
  duration: number;
  status: 'ACTIVE' | 'INACTIVE';
  resourceType: 'STAFF' | 'ROOM' | 'BOTH';
  createdAt: string;
  updatedAt: string;
  // 关联信息
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
}

export interface ServiceQueryParams {
  tenantId: number;
  categoryId?: number;
  status?: string;
  searchTerm?: string;
  page?: number;
  size?: number;
}

export interface ServiceListResponse {
  data: ServiceManagement[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

// 服务管理API
export const serviceApi = {
  // 获取所有服务
  getServices: async (tenantId: string): Promise<Service[]> => {
    const response = await createRequest(`/api/business/services/tenant/${tenantId}`, {
      method: 'GET',
    });
    // 后端直接返回Service[]数组
    return response || [];
  },

  // 获取活跃服务
  getActiveServices: async (tenantId: string): Promise<Service[]> => {
    const response = await createRequest(`/api/business/services?tenantId=${tenantId}&status=ACTIVE`, {
      method: 'GET',
    });
    // 分页接口返回的格式，取data字段
    return response?.data || [];
  },
};

// 服务管理API（新增）
export const serviceManagementApi = {
  // 分页查询服务
  getServices: async (params: ServiceQueryParams): Promise<ServiceListResponse> => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await createRequest(`/api/business/services?${queryParams.toString()}`, {
      method: 'GET',
    });
    return response;
  },

  // 根据ID获取服务详情
  getServiceById: async (id: number): Promise<ServiceManagement> => {
    const response = await createRequest(`/api/business/services/${id}`, {
      method: 'GET',
    });
    return response;
  },

  // 创建服务
  createService: async (service: Omit<ServiceManagement, 'id' | 'createdAt' | 'updatedAt' | 'categoryName' | 'categoryIcon' | 'categoryColor'>): Promise<ServiceManagement> => {
    const response = await createRequest('/api/business/services', {
      method: 'POST',
      body: JSON.stringify(service),
    });
    return response;
  },

  // 更新服务
  updateService: async (id: number, service: Partial<ServiceManagement>): Promise<ServiceManagement> => {
    const response = await createRequest(`/api/business/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(service),
    });
    return response;
  },

  // 删除服务
  deleteService: async (id: number): Promise<void> => {
    await createRequest(`/api/business/services/${id}`, {
      method: 'DELETE',
    });
  },

  // 根据租户ID获取所有服务
  getServicesByTenantId: async (tenantId: number): Promise<ServiceManagement[]> => {
    const response = await createRequest(`/api/business/services/tenant/${tenantId}`, {
      method: 'GET',
    });
    return response;
  },

  // 根据分类ID获取服务
  getServicesByCategoryId: async (tenantId: number, categoryId: number): Promise<ServiceManagement[]> => {
    const response = await createRequest(`/api/business/services/category/${categoryId}?tenantId=${tenantId}`, {
      method: 'GET',
    });
    return response;
  },
};

// 服务分类管理API
export const serviceCategoryApi = {
  // 根据租户ID获取所有分类
  getCategories: async (tenantId: number): Promise<ServiceCategory[]> => {
    const response = await createRequest(`/api/business/service-categories?tenantId=${tenantId}`, {
      method: 'GET',
    });
    return response;
  },

  // 根据租户ID和状态获取分类
  getCategoriesByStatus: async (tenantId: number, status: string): Promise<ServiceCategory[]> => {
    const response = await createRequest(`/api/business/service-categories/status/${status}?tenantId=${tenantId}`, {
      method: 'GET',
    });
    return response;
  },

  // 根据ID获取分类详情
  getCategoryById: async (id: number): Promise<ServiceCategory> => {
    const response = await createRequest(`/api/business/service-categories/${id}`, {
      method: 'GET',
    });
    return response;
  },

  // 创建分类
  createCategory: async (category: Omit<ServiceCategory, 'id' | 'createdAt' | 'updatedAt' | 'serviceCount'>): Promise<ServiceCategory> => {
    const response = await createRequest('/api/business/service-categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
    return response;
  },

  // 更新分类
  updateCategory: async (id: number, category: Partial<ServiceCategory>): Promise<ServiceCategory> => {
    const response = await createRequest(`/api/business/service-categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    });
    return response;
  },

  // 删除分类
  deleteCategory: async (id: number): Promise<void> => {
    await createRequest(`/api/business/service-categories/${id}`, {
      method: 'DELETE',
    });
  },

  // 检查分类名称是否存在
  checkNameExists: async (tenantId: number, name: string, excludeId?: number): Promise<boolean> => {
    const queryParams = new URLSearchParams();
    queryParams.append('tenantId', tenantId.toString());
    queryParams.append('name', name);
    if (excludeId) {
      queryParams.append('excludeId', excludeId.toString());
    }

    const response = await createRequest(`/api/business/service-categories/check-name?${queryParams.toString()}`, {
      method: 'GET',
    });
    return response;
  },
};

// 预约相关接口定义
export interface Appointment {
  id: number;
  tenantId: number;
  customerId: number;
  resourceId?: number;
  resourceType?: 'STAFF' | 'ROOM';
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  totalAmount: number;
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  notes?: string;
  rating?: number;
  review?: string;
  createdAt: string;
  updatedAt: string;
  // 关联对象
  customer?: Customer;
  resource?: {
    id: number;
    name: string;
    type: 'STAFF' | 'ROOM';
  };
  appointmentServices?: {
    id: number;
    serviceId: number; // 添加serviceId字段
    serviceName: string;
    price: number;
    duration: number;
  }[];
}

export interface AppointmentStats {
  totalAppointments: number;
  completedAppointments: number;
  totalSpent: number;
  avgRating: number;
}

// 预约管理API
export const appointmentApi = {
  // 获取所有预约记录
  getAllAppointments: async (tenantId: number): Promise<Appointment[]> => {
    const response = await createRequest(`/api/business/appointments?tenantId=${tenantId}`, {
      method: 'GET',
    });
    return response;
  },

  // 根据客户ID获取预约记录
  getAppointmentsByCustomerId: async (customerId: number, tenantId: number): Promise<Appointment[]> => {
    const response = await createRequest(`/api/business/appointments/customer/${customerId}?tenantId=${tenantId}`, {
      method: 'GET',
    });
    return response;
  },

  // 获取预约统计信息
  getAppointmentStats: async (customerId: number, tenantId: number): Promise<AppointmentStats> => {
    const response = await createRequest(`/api/business/appointments/customer/${customerId}/stats?tenantId=${tenantId}`, {
      method: 'GET',
    });
    return response;
  },

  // 创建预约
  createAppointment: async (appointment: Partial<Appointment>): Promise<Appointment> => {
    const response = await createRequest('/api/business/appointments', {
      method: 'POST',
      body: JSON.stringify(appointment),
    });
    return response;
  },

  // 更新预约状态
  updateAppointmentStatus: async (id: number, status: string): Promise<Appointment> => {
    const response = await createRequest(`/api/business/appointments/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    return response;
  },

  // 更新预约
  updateAppointment: async (id: number, appointment: Partial<Appointment>): Promise<Appointment> => {
    const response = await createRequest(`/api/business/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(appointment),
    });
    return response;
  },

  // 删除预约
  deleteAppointment: async (id: number): Promise<void> => {
    await createRequest(`/api/business/appointments/${id}`, {
      method: 'DELETE',
    });
  },

  // 订单相关API
  getOrders: async (params: {
    tenantId: number;
    page?: number;
    size?: number;
    searchTerm?: string;
    paymentStatus?: string;
    orderStatus?: string;
    customerId?: number;
    startDate?: string;
    endDate?: string;
  }) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    return createRequest(`/api/business/orders?${queryParams.toString()}`);
  },

  getOrderById: (id: number) => createRequest(`/api/business/orders/${id}`),

  createOrder: (data: any) => createRequest('/api/business/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  updateOrder: (id: number, data: any) => createRequest(`/api/business/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  cancelOrder: (id: number) => createRequest(`/api/business/orders/${id}/cancel`, {
    method: 'POST',
  }),

  getOrderStats: (tenantId: number) => createRequest(`/api/business/orders/stats?tenantId=${tenantId}`),

  // 支付相关API
  initiatePayment: (data: {
    orderId: number;
    paymentMethod: string;
    amount: number;
    tipAmount?: number;
  }) => createRequest(`/api/business/payments/orders/${data.orderId}/pay`, {
    method: 'POST',
    body: JSON.stringify({
      paymentMethod: data.paymentMethod,
      amount: data.amount,
      tipAmount: data.tipAmount || 0,
      terminalId: 'POS-001' // 添加默认的终端ID
    }),
  }),

  processCashPayment: (data: {
    orderId: number;
    paymentMethod: string;
    amount: number;
    tipAmount?: number;
  }) => createRequest(`/api/business/payments/orders/${data.orderId}/cash?amount=${data.amount}`, {
    method: 'POST',
  }),

  processCardPayment: (data: {
    orderId: number;
    paymentMethod: string;
    amount: number;
    tipAmount?: number;
    posTerminalId?: string;
  }) => createRequest(`/api/business/payments/orders/${data.orderId}/pay`, {
    method: 'POST',
    body: JSON.stringify({
      paymentMethod: data.paymentMethod,
      amount: data.amount,
      tipAmount: data.tipAmount || 0,
      terminalId: data.posTerminalId || 'POS-001'
    }),
  }),

  checkPaymentStatus: (transactionId: string) => createRequest(`/api/business/payments/transactions/${transactionId}/status`),

  processRefund: (data: {
    orderId: number;
    amount: number;
    reason: string;
  }) => createRequest(`/api/business/payments/orders/${data.orderId}/refund?amount=${data.amount}&reason=${encodeURIComponent(data.reason)}`, {
    method: 'POST',
  }),
};

// 员工相关接口定义
export interface Staff {
  id: number;
  tenantId: number;
  name: string;
  phone?: string;
  email?: string;
  position?: string;
  skills?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'VACATION';
  startDate?: string;
  createdAt: string;
  updatedAt: string;
}

// 资源相关接口定义
export interface Resource {
  id: number;
  tenantId: number;
  name: string;
  type: 'STAFF' | 'ROOM';
  description?: string;
  capacity?: number;
  location?: string;
  equipment?: string;
  specialties?: string;
  hourlyRate?: number;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'VACATION' | 'DELETED';
  // 员工特有字段
  phone?: string;
  email?: string;
  position?: string;
  startDate?: string;
  avatar?: string; // 员工头像
  icon?: string; // 房间图标
  createdAt: string;
  updatedAt: string;
  availabilities?: ResourceAvailability[];
}

export interface ResourceAvailability {
  id?: number;
  resourceId: number;
  dayOfWeek: number; // 1-7, 1为周一
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ResourceStatus {
  resourceId: number;
  resourceName: string;
  resourceType: string;
  status: string;
  currentlyAvailable: boolean;
  lastUpdated: string;
}

// 资源管理API
export const resourceApi = {
  // 获取租户下所有资源
  getAllResources: async (tenantId: number): Promise<Resource[]> => {
    const response = await createRequest(`/api/business/resources/tenant/${tenantId}`, {
      method: 'GET',
    });
    return response.data || response;
  },

  // 根据类型获取资源
  getResourcesByType: async (tenantId: number, type: string): Promise<Resource[]> => {
    const response = await createRequest(`/api/business/resources/tenant/${tenantId}/type/${type}`, {
      method: 'GET',
    });
    return response.data || response;
  },

  // 获取当前用户的资源信息
  getCurrentUserResource: async (tenantId: number) => {
    try {
      // 首先获取所有STAFF类型的资源
      const resources = await createRequest(`/api/business/resources/tenant/${tenantId}/type/STAFF`);
      // 返回第一个可用的资源作为当前用户的资源
      if (resources && resources.length > 0) {
        return resources[0];
      }
      throw new Error('No staff resources available');
    } catch (error) {
      console.error('Failed to get current user resource:', error);
      throw error;
    }
  },

  // 根据服务获取可用资源
  getAvailableResourcesByService: async (serviceId: number, tenantId: number): Promise<Resource[]> => {
    const response = await createRequest(`/api/business/resources/service/${serviceId}/tenant/${tenantId}`, {
      method: 'GET',
    });
    return response;
  },

  // 检查资源可用性
  checkResourceAvailability: async (resourceId: number, date: string, startTime: string, endTime: string): Promise<boolean> => {
    const queryParams = new URLSearchParams({ date, startTime, endTime });
    const response = await createRequest(`/api/business/resources/${resourceId}/availability/check?${queryParams.toString()}`, {
      method: 'GET',
    });
    return response;
  },

  // 创建资源
  createResource: async (resource: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>): Promise<Resource> => {
    const response = await createRequest('/api/business/resources', {
      method: 'POST',
      body: JSON.stringify(resource),
    });
    return response.data || response;
  },

  // 创建资源（包含可用性信息）
  createResourceWithAvailability: async (resourceData: any): Promise<Resource> => {
    const response = await createRequest('/api/business/resources/with-availability', {
      method: 'POST',
      body: JSON.stringify(resourceData),
    });
    return response.data || response;
  },

  // 更新资源
  updateResource: async (id: number, resource: Partial<Resource>): Promise<Resource> => {
    const response = await createRequest(`/api/business/resources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(resource),
    });
    return response.data || response;
  },

  // 删除资源
  deleteResource: async (id: number): Promise<void> => {
    await createRequest(`/api/business/resources/${id}`, {
      method: 'DELETE',
    });
  },

  // 获取资源详情
  getResourceById: async (id: number): Promise<Resource> => {
    const response = await createRequest(`/api/business/resources/${id}`, {
      method: 'GET',
    });
    return response;
  },

  // 设置资源可用性
  setResourceAvailability: async (resourceId: number, availabilities: ResourceAvailability[]): Promise<void> => {
    await createRequest(`/api/business/resources/${resourceId}/availability`, {
      method: 'POST',
      body: JSON.stringify(availabilities),
    });
  },

  // 获取资源可用性
  getResourceAvailability: async (resourceId: number): Promise<ResourceAvailability[]> => {
    const response = await createRequest(`/api/business/resources/${resourceId}/availability`, {
      method: 'GET',
    });
    return response;
  },

  // 检查资源在指定时间段是否已被预约
  checkResourceBookingSlot: async (resourceId: number, date: string, startTime: string, endTime: string): Promise<boolean> => {
    const queryParams = new URLSearchParams({ date, startTime, endTime });
    const response = await createRequest(`/api/business/resources/${resourceId}/booking-slot/check?${queryParams.toString()}`, {
      method: 'GET',
    });
    return response;
  },

  // 获取资源实时状态
  getResourceStatus: async (resourceId: number): Promise<ResourceStatus> => {
    const response = await createRequest(`/api/business/resources/${resourceId}/status`, {
      method: 'GET',
    });
    return response;
  },
};

// 员工管理API (保持向后兼容)
export const staffApi = {
  // 获取所有员工
  getAllStaff: async (tenantId: number): Promise<Staff[]> => {
    const response = await createRequest(`/api/business/staff?tenantId=${tenantId}`, {
      method: 'GET',
    });
    return response;
  },

  // 获取活跃员工
  getActiveStaff: async (tenantId: number): Promise<Staff[]> => {
    const response = await createRequest(`/api/business/staff/active?tenantId=${tenantId}`, {
      method: 'GET',
    });
    return response;
  },

  // 根据ID获取员工
  getStaffById: async (id: number): Promise<Staff> => {
    const response = await createRequest(`/api/business/staff/${id}`, {
      method: 'GET',
    });
    return response;
  },

  // 创建员工
  createStaff: async (staff: Partial<Staff>): Promise<Staff> => {
    const response = await createRequest('/api/business/staff', {
      method: 'POST',
      body: JSON.stringify(staff),
    });
    return response;
  },

  // 更新员工
  updateStaff: async (id: number, staff: Partial<Staff>): Promise<Staff> => {
    const response = await createRequest(`/api/business/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(staff),
    });
    return response;
  },

  // 删除员工
  deleteStaff: async (id: number): Promise<void> => {
    await createRequest(`/api/business/staff/${id}`, {
      method: 'DELETE',
    });
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

// 通知模板相关接口定义
export interface NotificationTemplate {
  id: number;
  tenantId: number;
  templateCode: string;
  templateName: string;
  type: 'SMS' | 'EMAIL';
  subject?: string;
  content: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface NotificationLog {
  id: number;
  tenantId: number;
  templateCode: string;
  type: 'SMS' | 'EMAIL';
  recipient: string;
  subject?: string;
  content: string;
  status: 'SENT' | 'FAILED' | 'PENDING';
  businessId: string;
  businessType: string;
  errorMessage?: string;
  retryCount: number;
  createdAt: string;
  sentAt?: string;
}

// 通知模板管理API
export const notificationApi = {
  // 获取通知模板列表
  getTemplates: async (tenantId?: number): Promise<NotificationTemplate[]> => {
    const queryParams = new URLSearchParams();
    if (tenantId) {
      queryParams.append('tenantId', tenantId.toString());
    }
    const response = await createRequest(`/api/notification/templates?${queryParams.toString()}`, {
      method: 'GET',
    });
    return response;
  },

  // 根据ID获取通知模板
  getTemplateById: async (id: number): Promise<NotificationTemplate> => {
    const response = await createRequest(`/api/notification/templates/${id}`, {
      method: 'GET',
    });
    return response;
  },

  // 创建通知模板
  createTemplate: async (template: Partial<NotificationTemplate>): Promise<NotificationTemplate> => {
    const response = await createRequest('/api/notification/templates', {
      method: 'POST',
      body: JSON.stringify(template),
    });
    return response;
  },

  // 更新通知模板
  updateTemplate: async (id: number, template: Partial<NotificationTemplate>): Promise<NotificationTemplate> => {
    const response = await createRequest(`/api/notification/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(template),
    });
    return response;
  },

  // 删除通知模板
  deleteTemplate: async (id: number): Promise<void> => {
    await createRequest(`/api/notification/templates/${id}`, {
      method: 'DELETE',
    });
  },

  // 获取通知日志列表
  getLogs: async (params?: any): Promise<NotificationLog[]> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await createRequest(`/api/notification/logs?${queryParams.toString()}`, {
      method: 'GET',
    });
    return response;
  },

  // 重试失败的通知
  retryFailedNotifications: async (): Promise<void> => {
    await createRequest('/api/notification/retry', {
      method: 'POST',
    });
  },

  // 初始化默认模板
  initDefaultTemplates: async (tenantId: number): Promise<void> => {
    await createRequest(`/api/notification/templates/init-default?tenantId=${tenantId}`, {
      method: 'POST',
    });
  },

  // 发送预约通知
  sendAppointmentNotification: async (appointmentId: number): Promise<void> => {
    await createRequest(`/api/notification/appointment/${appointmentId}/send`, {
      method: 'POST',
    });
  },
};

// Combined API export for convenience
export const api = {
  ...authApi,
  ...customerApi,
  ...serviceApi,
  ...serviceManagementApi,
  ...serviceCategoryApi,
  ...appointmentApi,
  ...merchantConfigApi,
  ...fileUploadApi,
  ...notificationApi,
  ...resourceApi,
  ...staffApi,
  ...userApi,
  // Add the order and payment methods directly
  getOrders: async (params: {
    tenantId: number;
    page?: number;
    size?: number;
    searchTerm?: string;
    paymentStatus?: string;
    orderStatus?: string;
    customerId?: number;
    startDate?: string;
    endDate?: string;
  }) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    return createRequest(`/api/business/orders?${queryParams.toString()}`);
  },

  getOrderById: (id: number) => createRequest(`/api/business/orders/${id}`),

  createOrder: (data: any) => createRequest('/api/business/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  updateOrder: (id: number, data: any) => createRequest(`/api/business/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  cancelOrder: (id: number) => createRequest(`/api/business/orders/${id}/cancel`, {
    method: 'POST',
  }),

  getOrderStats: (tenantId: number) => createRequest(`/api/business/orders/stats?tenantId=${tenantId}`),

  // 支付相关API
  initiatePayment: (data: {
    orderId: number;
    paymentMethod: string;
    amount: number;
    tipAmount?: number;
  }) => createRequest(`/api/business/payments/orders/${data.orderId}/pay`, {
    method: 'POST',
    body: JSON.stringify({
      paymentMethod: data.paymentMethod,
      amount: data.amount,
      tipAmount: data.tipAmount || 0,
      terminalId: 'POS-001' // 添加默认的终端ID
    }),
  }),

  processCashPayment: (data: {
    orderId: number;
    paymentMethod: string;
    amount: number;
    tipAmount?: number;
  }) => createRequest(`/api/business/payments/orders/${data.orderId}/cash?amount=${data.amount}`, {
    method: 'POST',
  }),

  processCardPayment: (data: {
    orderId: number;
    paymentMethod: string;
    amount: number;
    tipAmount?: number;
    posTerminalId?: string;
  }) => createRequest(`/api/business/payments/orders/${data.orderId}/pay`, {
    method: 'POST',
    body: JSON.stringify({
      paymentMethod: data.paymentMethod,
      amount: data.amount,
      tipAmount: data.tipAmount || 0,
      terminalId: data.posTerminalId || 'POS-001'
    }),
  }),

  checkPaymentStatus: (transactionId: string) => createRequest(`/api/business/payments/transactions/${transactionId}/status`),

  processRefund: (data: {
    orderId: number;
    amount: number;
    reason: string;
  }) => createRequest(`/api/business/payments/orders/${data.orderId}/refund?amount=${data.amount}&reason=${encodeURIComponent(data.reason)}`, {
    method: 'POST',
  }),
};

// Dashboard API
export const dashboardApi = {
  // 获取 Dashboard 统计数据
  getDashboardStats: async (tenantId: number, days: number = 30): Promise<any> => {
    const response = await createRequest(`/api/business/dashboard/stats?tenantId=${tenantId}&days=${days}`, {
      method: 'GET',
    });
    return response;
  },

  // 获取销售趋势数据
  getSalesTrend: async (tenantId: number, days: number = 30): Promise<any> => {
    const response = await createRequest(`/api/business/dashboard/sales-trend?tenantId=${tenantId}&days=${days}`, {
      method: 'GET',
    });
    return response;
  },

  // 获取服务分类统计
  getServiceCategoryStats: async (tenantId: number, days: number = 30): Promise<any> => {
    const response = await createRequest(`/api/business/dashboard/service-categories?tenantId=${tenantId}&days=${days}`, {
      method: 'GET',
    });
    return response;
  },

  // 获取热门服务排行
  getTopServices: async (tenantId: number, days: number = 30, limit: number = 5): Promise<any> => {
    const response = await createRequest(`/api/business/dashboard/top-services?tenantId=${tenantId}&days=${days}&limit=${limit}`, {
      method: 'GET',
    });
    return response;
  },
};

// Analytics API
export const analyticsApi = {
  // 获取分析概览数据
  getOverview: async (tenantId: number, timePeriod: string = '30days'): Promise<any> => {
    const response = await createRequest(`/api/analytics/overview?tenantId=${tenantId}&timePeriod=${timePeriod}`, {
      method: 'GET',
    });
    return response;
  },

  // 同步业务数据
  syncBusinessData: async (tenantId: number): Promise<void> => {
    await createRequest(`/api/analytics/sync/${tenantId}`, {
      method: 'POST',
    });
  },

  // 初始化分析数据
  initAnalyticsData: async (tenantId: number): Promise<string> => {
    const response = await createRequest(`/api/analytics/init/${tenantId}`, {
      method: 'POST',
    });
    return response;
  },

  // 清理过期缓存
  cleanExpiredCache: async (): Promise<void> => {
    await createRequest('/api/analytics/cache/clean', {
      method: 'POST',
    });
  },
};