// 用户信息接口
export interface User {
  id: string;
  username: string;
  email: string;
  realName: string;
  phone?: string;
  avatar?: string;
  tenantId: string;
  tenantName?: string;
}

// 认证状态接口
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// 购物车商品接口
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  serviceId?: string;
  merchantId: string;
}

// 购物车状态接口
export interface CartState {
  items: CartItem[];
  totalCount: number;
  totalAmount: number;
}

// 订单状态枚举
export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// 订单接口
export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  merchantId: string;
  merchantName: string;
  items: CartItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  appointmentTime?: string;
  address?: string;
  notes?: string;
}

// 服务分类接口
export interface ServiceCategory {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  icon: string;
  parentId?: string;
}

// 服务接口
export interface Service {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  price: number;
  duration: number; // 服务时长（分钟）
  categoryId: string;
  merchantId: string;
  images: string[];
  rating: number;
  reviewCount: number;
  isActive: boolean;
}

// 商户接口
export interface Merchant {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  address: string;
  phone: string;
  email: string;
  latitude: number;
  longitude: number;
  rating: number;
  reviewCount: number;
  workingHours: {
    open: string;
    close: string;
  };
  isActive: boolean;
}