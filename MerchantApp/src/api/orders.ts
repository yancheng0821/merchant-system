import {httpRequest, ApiResponse} from '../utils/request';
import {Order, OrderStatus, CartItem} from '../store/types';

// 创建订单请求接口
export interface CreateOrderRequest {
  items: CartItem[];
  appointmentTime?: string;
  deliveryAddress?: {
    address: string;
    latitude?: number;
    longitude?: number;
    contactName: string;
    contactPhone: string;
  };
  paymentMethod: 'STRIPE' | 'ALIPAY' | 'WECHAT' | 'CASH';
  notes?: string;
  couponCode?: string;
}

// 创建订单响应接口
export interface CreateOrderResponse {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentIntentId?: string; // Stripe支付意图ID
  clientSecret?: string; // Stripe客户端密钥
  status: OrderStatus;
  estimatedDeliveryTime?: string;
}

// 订单查询参数接口
export interface OrderQueryParams {
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  keyword?: string; // 搜索订单号或商户名称
}

// 分页订单响应接口
export interface PaginatedOrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 订单统计接口
export interface OrderStatistics {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalAmount: number;
  averageOrderAmount: number;
}

// 支付确认请求接口
export interface ConfirmPaymentRequest {
  orderId: string;
  paymentIntentId: string;
  paymentMethodId?: string;
}

// 取消订单请求接口
export interface CancelOrderRequest {
  orderId: string;
  reason: string;
  refundAmount?: number;
}

/**
 * 订单API服务
 */
export const ordersApi = {
  /**
   * 创建订单
   * @param data 订单信息
   * @returns 创建结果
   */
  createOrder: (data: CreateOrderRequest): Promise<ApiResponse<CreateOrderResponse>> => {
    return httpRequest.post('/orders', data);
  },

  /**
   * 获取用户订单列表
   * @param params 查询参数
   * @returns 订单列表
   */
  getUserOrders: (params?: OrderQueryParams): Promise<ApiResponse<PaginatedOrdersResponse>> => {
    return httpRequest.get('/orders/my-orders', { params });
  },

  /**
   * 获取订单详情
   * @param orderId 订单ID
   * @returns 订单详情
   */
  getOrderById: (orderId: string): Promise<ApiResponse<Order>> => {
    return httpRequest.get(`/orders/${orderId}`);
  },

  /**
   * 更新订单状态
   * @param orderId 订单ID
   * @param status 新状态
   * @param notes 备注（可选）
   * @returns 更新结果
   */
  updateOrderStatus: (orderId: string, status: OrderStatus, notes?: string): Promise<ApiResponse<Order>> => {
    return httpRequest.patch(`/orders/${orderId}/status`, {
      status,
      notes,
    });
  },

  /**
   * 取消订单
   * @param data 取消订单信息
   * @returns 取消结果
   */
  cancelOrder: (data: CancelOrderRequest): Promise<ApiResponse<{
    success: boolean;
    refundAmount?: number;
    refundStatus?: string;
  }>> => {
    return httpRequest.post(`/orders/${data.orderId}/cancel`, data);
  },

  /**
   * 确认支付
   * @param data 支付确认信息
   * @returns 支付结果
   */
  confirmPayment: (data: ConfirmPaymentRequest): Promise<ApiResponse<{
    success: boolean;
    paymentStatus: string;
    order: Order;
  }>> => {
    return httpRequest.post('/orders/confirm-payment', data);
  },

  /**
   * 申请退款
   * @param orderId 订单ID
   * @param reason 退款原因
   * @param amount 退款金额（可选，不传则全额退款）
   * @returns 退款申请结果
   */
  requestRefund: (orderId: string, reason: string, amount?: number): Promise<ApiResponse<{
    refundRequestId: string;
    status: string;
    estimatedRefundTime?: string;
  }>> => {
    return httpRequest.post(`/orders/${orderId}/refund`, {
      reason,
      amount,
    });
  },

  /**
   * 获取订单统计信息
   * @param startDate 开始日期（可选）
   * @param endDate 结束日期（可选）
   * @returns 统计信息
   */
  getOrderStatistics: (startDate?: string, endDate?: string): Promise<ApiResponse<OrderStatistics>> => {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    return httpRequest.get('/orders/statistics', { params });
  },

  /**
   * 重新下单
   * @param orderId 原订单ID
   * @returns 新订单信息
   */
  reorder: (orderId: string): Promise<ApiResponse<CreateOrderResponse>> => {
    return httpRequest.post(`/orders/${orderId}/reorder`);
  },

  /**
   * 评价订单
   * @param orderId 订单ID
   * @param rating 评分（1-5）
   * @param comment 评价内容
   * @param images 评价图片（可选）
   * @returns 评价结果
   */
  reviewOrder: (orderId: string, rating: number, comment: string, images?: string[]): Promise<ApiResponse<{
    reviewId: string;
  }>> => {
    return httpRequest.post(`/orders/${orderId}/review`, {
      rating,
      comment,
      images,
    });
  },

  /**
   * 获取订单的配送状态
   * @param orderId 订单ID
   * @returns 配送状态信息
   */
  getDeliveryStatus: (orderId: string): Promise<ApiResponse<{
    status: string;
    currentLocation?: {
      latitude: number;
      longitude: number;
      address: string;
    };
    estimatedArrivalTime?: string;
    deliveryPerson?: {
      name: string;
      phone: string;
      avatar?: string;
    };
    timeline: Array<{
      status: string;
      description: string;
      timestamp: string;
      location?: string;
    }>;
  }>> => {
    return httpRequest.get(`/orders/${orderId}/delivery-status`);
  },

  /**
   * 确认收货/完成服务
   * @param orderId 订单ID
   * @param notes 备注（可选）
   * @returns 确认结果
   */
  confirmCompletion: (orderId: string, notes?: string): Promise<ApiResponse<Order>> => {
    return httpRequest.post(`/orders/${orderId}/complete`, {
      notes,
    });
  },
};