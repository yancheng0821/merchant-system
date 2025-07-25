import i18n from '../i18n/config';

// API基础配置
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

// 工具函数：获取完整的文件URL
export const getFullImageUrl = (imageUrl?: string): string | undefined => {
  if (!imageUrl) return undefined;
  if (imageUrl.startsWith('http') || imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
    return imageUrl;
  }
  // 通过gateway访问文件
  return `${API_BASE_URL}${imageUrl}`;
};

// 文件上传API
export const fileUploadApi = {
    // 上传头像
    uploadAvatar: async (file: File, tenantId: number): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('tenantId', tenantId.toString());
        
        const response = await fetch(`${API_BASE_URL}/api/files/upload/avatar`, {
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
        
        const response = await fetch(`${API_BASE_URL}/api/files/upload/room-icon`, {
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
        const response = await fetch(`${API_BASE_URL}/api/files/delete`, {
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
    const response = await fetch(`${API_BASE_URL}/api/merchant-config/${tenantId}`, {
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
    const response = await fetch(`${API_BASE_URL}/api/merchant-config/${tenantId}/resource-types`, {
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
    const response = await fetch(`${API_BASE_URL}/api/merchant-config/${tenantId}`, {
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
      // 如果无法解析JSON，创建一个默认的错误响应
      responseData = {
        success: false,
        message: `HTTP ${response.status}: ${response.statusText}`,
        data: null
      };
    }

    // 如果响应不成功，抛出错误
    if (!response.ok) {
      console.error('API Error Response:', responseData);
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

  // 修改密码
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
  nameEn?: string;
  description?: string;
  descriptionEn?: string;
  price: number;
  duration: number;
  skillLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  status?: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
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
    const response = await createRequest('/api/customers', {
      method: 'POST',
      body: JSON.stringify(customerToSend),
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

// 服务管理API
export const serviceApi = {
  // 获取所有服务
  getServices: async (tenantId: string): Promise<Service[]> => {
    const response = await createRequest(`/api/services?tenantId=${tenantId}`, {
      method: 'GET',
    });
    return response;
  },

  // 获取活跃服务
  getActiveServices: async (tenantId: string): Promise<Service[]> => {
    const response = await createRequest(`/api/services?tenantId=${tenantId}&status=ACTIVE`, {
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
    const response = await createRequest(`/api/appointments?tenantId=${tenantId}`, {
      method: 'GET',
    });
    return response;
  },

  // 根据客户ID获取预约记录
  getAppointmentsByCustomerId: async (customerId: number, tenantId: number): Promise<Appointment[]> => {
    const response = await createRequest(`/api/appointments/customer/${customerId}?tenantId=${tenantId}`, {
      method: 'GET',
    });
    return response;
  },

  // 获取预约统计信息
  getAppointmentStats: async (customerId: number, tenantId: number): Promise<AppointmentStats> => {
    const response = await createRequest(`/api/appointments/customer/${customerId}/stats?tenantId=${tenantId}`, {
      method: 'GET',
    });
    return response;
  },

  // 创建预约
  createAppointment: async (appointment: Partial<Appointment>): Promise<Appointment> => {
    const response = await createRequest('/api/appointments', {
      method: 'POST',
      body: JSON.stringify(appointment),
    });
    return response;
  },

  // 更新预约状态
  updateAppointmentStatus: async (id: number, status: string): Promise<Appointment> => {
    const response = await createRequest(`/api/appointments/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    return response;
  },

  // 更新预约
  updateAppointment: async (id: number, appointment: Partial<Appointment>): Promise<Appointment> => {
    const response = await createRequest(`/api/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(appointment),
    });
    return response;
  },

  // 删除预约
  deleteAppointment: async (id: number): Promise<void> => {
    await createRequest(`/api/appointments/${id}`, {
      method: 'DELETE',
    });
  },
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

// 资源管理API
export const resourceApi = {
  // 获取租户下所有资源
  getAllResources: async (tenantId: number): Promise<Resource[]> => {
    const response = await createRequest(`/api/resources/tenant/${tenantId}`, {
      method: 'GET',
    });
    return response.data || response;
  },

  // 根据类型获取资源
  getResourcesByType: async (tenantId: number, type: string): Promise<Resource[]> => {
    const response = await createRequest(`/api/resources/tenant/${tenantId}/type/${type}`, {
      method: 'GET',
    });
    return response.data || response;
  },

  // 根据服务获取可用资源
  getAvailableResourcesByService: async (serviceId: number, tenantId: number): Promise<Resource[]> => {
    const response = await createRequest(`/api/resources/service/${serviceId}/tenant/${tenantId}`, {
      method: 'GET',
    });
    return response;
  },

  // 检查资源可用性
  checkResourceAvailability: async (resourceId: number, date: string, startTime: string, endTime: string): Promise<boolean> => {
    const response = await createRequest(`/api/resources/${resourceId}/availability/check`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const queryParams = new URLSearchParams({ date, startTime, endTime });
    const fullResponse = await createRequest(`/api/resources/${resourceId}/availability/check?${queryParams.toString()}`, {
      method: 'GET',
    });
    return fullResponse;
  },

  // 创建资源
  createResource: async (resource: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>): Promise<Resource> => {
    const response = await createRequest('/api/resources', {
      method: 'POST',
      body: JSON.stringify(resource),
    });
    return response.data || response;
  },

  // 更新资源
  updateResource: async (id: number, resource: Partial<Resource>): Promise<Resource> => {
    const response = await createRequest(`/api/resources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(resource),
    });
    return response.data || response;
  },

  // 删除资源
  deleteResource: async (id: number): Promise<void> => {
    await createRequest(`/api/resources/${id}`, {
      method: 'DELETE',
    });
  },

  // 获取资源详情
  getResourceById: async (id: number): Promise<Resource> => {
    const response = await createRequest(`/api/resources/${id}`, {
      method: 'GET',
    });
    return response;
  },

  // 设置资源可用性
  setResourceAvailability: async (resourceId: number, availabilities: ResourceAvailability[]): Promise<void> => {
    await createRequest(`/api/resources/${resourceId}/availability`, {
      method: 'POST',
      body: JSON.stringify(availabilities),
    });
  },

  // 获取资源可用性
  getResourceAvailability: async (resourceId: number): Promise<ResourceAvailability[]> => {
    const response = await createRequest(`/api/resources/${resourceId}/availability`, {
      method: 'GET',
    });
    return response;
  },
};

// 员工管理API (保持向后兼容)
export const staffApi = {
  // 获取所有员工
  getAllStaff: async (tenantId: number): Promise<Staff[]> => {
    const response = await createRequest(`/api/staff?tenantId=${tenantId}`, {
      method: 'GET',
    });
    return response;
  },

  // 获取活跃员工
  getActiveStaff: async (tenantId: number): Promise<Staff[]> => {
    const response = await createRequest(`/api/staff/active?tenantId=${tenantId}`, {
      method: 'GET',
    });
    return response;
  },

  // 根据ID获取员工
  getStaffById: async (id: number): Promise<Staff> => {
    const response = await createRequest(`/api/staff/${id}`, {
      method: 'GET',
    });
    return response;
  },

  // 创建员工
  createStaff: async (staff: Partial<Staff>): Promise<Staff> => {
    const response = await createRequest('/api/staff', {
      method: 'POST',
      body: JSON.stringify(staff),
    });
    return response;
  },

  // 更新员工
  updateStaff: async (id: number, staff: Partial<Staff>): Promise<Staff> => {
    const response = await createRequest(`/api/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(staff),
    });
    return response;
  },

  // 删除员工
  deleteStaff: async (id: number): Promise<void> => {
    await createRequest(`/api/staff/${id}`, {
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
}; 