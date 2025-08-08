import {httpRequest, ApiResponse} from '../utils/request';
import {Service, ServiceCategory, Merchant} from '../store/types';

// 服务查询参数接口
export interface ServiceQueryParams {
  categoryId?: string;
  merchantId?: string;
  keyword?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price' | 'rating' | 'duration' | 'created';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  latitude?: number;
  longitude?: number;
  radius?: number; // 搜索半径（公里）
}

// 分页响应接口
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 预约请求接口
export interface BookingRequest {
  serviceId: string;
  merchantId: string;
  appointmentTime: string;
  duration: number;
  notes?: string;
  customerInfo: {
    name: string;
    phone: string;
    email?: string;
  };
}

// 预约响应接口
export interface BookingResponse {
  bookingId: string;
  orderNumber: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  appointmentTime: string;
  estimatedEndTime: string;
}

/**
 * 服务API
 */
export const servicesApi = {
  /**
   * 获取服务分类列表
   * @param parentId 父分类ID，不传则获取顶级分类
   * @returns 分类列表
   */
  getCategories: (parentId?: string): Promise<ApiResponse<ServiceCategory[]>> => {
    const params = parentId ? { parentId } : {};
    return httpRequest.get('/services/categories', { params });
  },

  /**
   * 获取分类详情
   * @param categoryId 分类ID
   * @returns 分类信息
   */
  getCategoryById: (categoryId: string): Promise<ApiResponse<ServiceCategory>> => {
    return httpRequest.get(`/services/categories/${categoryId}`);
  },

  /**
   * 搜索服务
   * @param params 查询参数
   * @returns 服务列表
   */
  searchServices: (params: ServiceQueryParams): Promise<ApiResponse<PaginatedResponse<Service>>> => {
    return httpRequest.get('/services/search', { params });
  },

  /**
   * 获取服务详情
   * @param serviceId 服务ID
   * @returns 服务详情
   */
  getServiceById: (serviceId: string): Promise<ApiResponse<Service>> => {
    return httpRequest.get(`/services/${serviceId}`);
  },

  /**
   * 获取热门服务
   * @param limit 返回数量限制
   * @returns 热门服务列表
   */
  getPopularServices: (limit: number = 10): Promise<ApiResponse<Service[]>> => {
    return httpRequest.get('/services/popular', { params: { limit } });
  },

  /**
   * 获取推荐服务
   * @param userId 用户ID（可选，用于个性化推荐）
   * @param limit 返回数量限制
   * @returns 推荐服务列表
   */
  getRecommendedServices: (userId?: string, limit: number = 10): Promise<ApiResponse<Service[]>> => {
    const params: any = { limit };
    if (userId) params.userId = userId;
    return httpRequest.get('/services/recommended', { params });
  },

  /**
   * 预约服务
   * @param data 预约信息
   * @returns 预约结果
   */
  bookService: (data: BookingRequest): Promise<ApiResponse<BookingResponse>> => {
    return httpRequest.post('/services/book', data);
  },

  /**
   * 获取服务的可用时间段
   * @param serviceId 服务ID
   * @param date 查询日期 (YYYY-MM-DD)
   * @returns 可用时间段列表
   */
  getAvailableTimeSlots: (serviceId: string, date: string): Promise<ApiResponse<{
    date: string;
    timeSlots: Array<{
      startTime: string;
      endTime: string;
      available: boolean;
      price?: number; // 时段差价
    }>;
  }>> => {
    return httpRequest.get(`/services/${serviceId}/available-times`, {
      params: { date },
    });
  },

  /**
   * 获取服务评价
   * @param serviceId 服务ID
   * @param page 页码
   * @param limit 每页数量
   * @returns 评价列表
   */
  getServiceReviews: (serviceId: string, page: number = 1, limit: number = 10): Promise<ApiResponse<PaginatedResponse<{
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    rating: number;
    comment: string;
    images?: string[];
    createdAt: string;
  }>>> => {
    return httpRequest.get(`/services/${serviceId}/reviews`, {
      params: { page, limit },
    });
  },
};

/**
 * 商户API
 */
export const merchantsApi = {
  /**
   * 搜索商户
   * @param params 搜索参数
   * @returns 商户列表
   */
  searchMerchants: (params: {
    keyword?: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
    categoryId?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<Merchant>>> => {
    return httpRequest.get('/merchants/search', { params });
  },

  /**
   * 获取商户详情
   * @param merchantId 商户ID
   * @returns 商户详情
   */
  getMerchantById: (merchantId: string): Promise<ApiResponse<Merchant>> => {
    return httpRequest.get(`/merchants/${merchantId}`);
  },

  /**
   * 获取商户的服务列表
   * @param merchantId 商户ID
   * @param categoryId 分类ID（可选）
   * @returns 服务列表
   */
  getMerchantServices: (merchantId: string, categoryId?: string): Promise<ApiResponse<Service[]>> => {
    const params = categoryId ? { categoryId } : {};
    return httpRequest.get(`/merchants/${merchantId}/services`, { params });
  },

  /**
   * 获取附近商户
   * @param latitude 纬度
   * @param longitude 经度
   * @param radius 搜索半径（公里）
   * @param limit 返回数量限制
   * @returns 附近商户列表
   */
  getNearbyMerchants: (
    latitude: number,
    longitude: number,
    radius: number = 5,
    limit: number = 20
  ): Promise<ApiResponse<Merchant[]>> => {
    return httpRequest.get('/merchants/nearby', {
      params: { latitude, longitude, radius, limit },
    });
  },

  /**
   * 获取商户评价
   * @param merchantId 商户ID
   * @param page 页码
   * @param limit 每页数量
   * @returns 评价列表
   */
  getMerchantReviews: (merchantId: string, page: number = 1, limit: number = 10): Promise<ApiResponse<PaginatedResponse<{
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    rating: number;
    comment: string;
    images?: string[];
    serviceId?: string;
    serviceName?: string;
    createdAt: string;
  }>>> => {
    return httpRequest.get(`/merchants/${merchantId}/reviews`, {
      params: { page, limit },
    });
  },
};