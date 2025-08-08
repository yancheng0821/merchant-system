import {httpRequest, ApiResponse} from '../utils/request';
import {User} from '../store/types';

// 登录请求接口
export interface LoginRequest {
  username: string;
  password: string;
  tenantCode?: string;
}

// 登录响应接口
export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
  expiresIn: number;
}

// 注册请求接口
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  realName: string;
  phone?: string;
  invitationCode?: string;
}

// Google登录请求接口
export interface GoogleLoginRequest {
  idToken: string;
  tenantCode?: string;
}

// 修改密码请求接口
export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// 重置密码请求接口
export interface ResetPasswordRequest {
  email: string;
}

// 验证重置密码请求接口
export interface VerifyResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * 认证API服务
 */
export const authApi = {
  /**
   * 用户登录
   * @param data 登录信息
   * @returns 登录响应
   */
  login: (data: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    return httpRequest.post('/auth/login', data, {
      skipAuth: true, // 登录请求不需要token
    });
  },

  /**
   * 用户注册
   * @param data 注册信息
   * @returns 注册响应
   */
  register: (data: RegisterRequest): Promise<ApiResponse<LoginResponse>> => {
    return httpRequest.post('/auth/register', data, {
      skipAuth: true, // 注册请求不需要token
    });
  },

  /**
   * Google登录
   * @param data Google登录信息
   * @returns 登录响应
   */
  googleLogin: (data: GoogleLoginRequest): Promise<ApiResponse<LoginResponse>> => {
    return httpRequest.post('/auth/google-login', data, {
      skipAuth: true, // Google登录请求不需要token
    });
  },

  /**
   * 用户登出
   * @returns 登出响应
   */
  logout: (): Promise<ApiResponse> => {
    return httpRequest.post('/auth/logout');
  },

  /**
   * 刷新Token
   * @param refreshToken 刷新令牌
   * @returns 新的token信息
   */
  refreshToken: (refreshToken: string): Promise<ApiResponse<{
    token: string;
    refreshToken: string;
    expiresIn: number;
  }>> => {
    return httpRequest.post('/auth/refresh-token', { refreshToken }, {
      skipAuth: true, // 刷新token请求不需要当前token
    });
  },

  /**
   * 验证Token
   * @param token 待验证的token
   * @returns 验证结果
   */
  validateToken: (token: string): Promise<ApiResponse<{
    valid: boolean;
    user?: User;
  }>> => {
    return httpRequest.post('/auth/validate-token', { token }, {
      skipAuth: true, // 验证token请求不需要当前token
    });
  },

  /**
   * 修改密码
   * @param data 修改密码信息
   * @returns 修改结果
   */
  changePassword: (data: ChangePasswordRequest): Promise<ApiResponse> => {
    return httpRequest.post('/auth/change-password', data);
  },

  /**
   * 重置密码 - 发送重置邮件
   * @param data 重置密码信息
   * @returns 发送结果
   */
  resetPassword: (data: ResetPasswordRequest): Promise<ApiResponse> => {
    return httpRequest.post('/auth/reset-password', data, {
      skipAuth: true,
    });
  },

  /**
   * 验证重置密码
   * @param data 重置密码验证信息
   * @returns 重置结果
   */
  verifyResetPassword: (data: VerifyResetPasswordRequest): Promise<ApiResponse> => {
    return httpRequest.post('/auth/verify-reset-password', data, {
      skipAuth: true,
    });
  },

  /**
   * 获取用户资料
   * @returns 用户信息
   */
  getProfile: (): Promise<ApiResponse<User>> => {
    return httpRequest.get('/auth/profile');
  },

  /**
   * 更新用户资料
   * @param data 用户信息
   * @returns 更新结果
   */
  updateProfile: (data: Partial<User>): Promise<ApiResponse<User>> => {
    return httpRequest.put('/auth/profile', data);
  },

  /**
   * 上传用户头像
   * @param file 头像文件
   * @returns 上传结果
   */
  uploadAvatar: (file: File): Promise<ApiResponse<{ avatarUrl: string }>> => {
    const formData = new FormData();
    formData.append('avatar', file as any);
    
    return httpRequest.upload('/auth/upload-avatar', formData);
  },
};