import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, userApi, tokenManager, handleApiError, LoginResponse } from '../services/api';
import { useSnackbar } from 'notistack';

export interface UserPermissions {
  permissionCodes: string[];
  permissionMap: Record<string, string[]>;
  roles: Array<{
    roleCode: string;
    displayName: string;
    level: number;
  }>;
  isSuperAdmin: boolean;
}

export interface User {
  id: number;
  username: string;
  realName: string;
  email: string;
  phone?: string;
  avatar?: string;
  tenantId: number;
  tenantCode?: string;
  tenantName?: string;
  timezone?: string;
  roles?: string[];
  // 权限可以是简单的字符串数组（后端直接返回）或完整的权限对象（从权限API获取）
  permissions?: string[] | UserPermissions;
  lastLoginTime?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string, tenantCode?: string) => Promise<boolean | { need2FA: boolean; userId: number; phone: string; tenantId: number }>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  updateUserInfo: (userInfo: Partial<User>) => Promise<boolean>;
  uploadAvatar: (file: File) => Promise<boolean>;
  error: string | null;
  clearError: () => void;
  setError: (error: string) => void;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  realName: string;
  phone?: string;
  invitationCode: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// 将API用户数据转换为前端用户数据
// Note: This should only be called after confirming the response is NOT a 2FA response
const mapApiUserToUser = (apiUser: LoginResponse): User => {
  return {
    id: apiUser.userId,
    username: apiUser.username!,  // Non-null assertion - safe because this is only called for complete login responses
    realName: apiUser.realName!,
    email: apiUser.email!,
    avatar: apiUser.avatar,
    tenantId: apiUser.tenantId,
    tenantCode: apiUser.tenantCode,
    tenantName: apiUser.tenantName,
    timezone: apiUser.timezone,
    roles: apiUser.roles,
    permissions: apiUser.permissions,
    lastLoginTime: apiUser.lastLoginTime,
    createdAt: apiUser.createdAt,
  };
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      // 检查本地存储中是否有用户信息和令牌
      const savedUser = localStorage.getItem('user');
      const token = tokenManager.getToken();


      if (savedUser && token) {
        try {
          const userData = JSON.parse(savedUser);
          setUser(userData);

          // 验证令牌是否有效
          await validateStoredToken(token);
        } catch (error) {
          console.error('Failed to parse saved user data:', error);
          tokenManager.clearAll();
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // 监听session过期事件
  useEffect(() => {
    const handleSessionExpired = (event: Event) => {
      const customEvent = event as CustomEvent;

      console.log('Session expired event received, cleaning up...');

      // 立即停止loading状态
      setLoading(false);

      // 清除用户状态
      setUser(null);
      setError('Session expired. Please login again.');

      // 清除本地存储
      tokenManager.clearAll();
      localStorage.removeItem('user');

      // 清除任何导航意图
      localStorage.removeItem('navigateTo');
    };

    window.addEventListener('sessionExpired', handleSessionExpired);

    return () => {
      window.removeEventListener('sessionExpired', handleSessionExpired);
    };
  }, []);

  // 注意：JWT过期时间设置为30天，无操作超时由SessionContext管理
  // Token刷新在API请求401时自动处理（见api.ts）

  const validateStoredToken = async (token: string) => {
    try {
      // 修复：去掉Bearer前缀
      const pureToken = token?.startsWith('Bearer ') ? token.slice(7) : token;
      
      // 检查token是否为空
      if (!pureToken || pureToken.trim() === '') {
        tokenManager.clearAll();
        localStorage.removeItem('user');
        setUser(null);
        return;
      }
      
      const response = await authApi.validateToken(pureToken);
      
      if (!response.success) {
        // 令牌无效，清除本地数据
        tokenManager.clearAll();
        localStorage.removeItem('user');
        setUser(null);
      }
      // Token有效，保持现有用户数据（已从localStorage加载）
    } catch (error) {
      console.error('Token validation failed:', error);
    }
  };

  // 获取用户权限信息
  const fetchUserPermissions = async (userId: number, tenantId: number) => {
    try {
      const result = await authApi.getUserPermissions(userId);

      if (result.success && result.data) {
        return result.data as UserPermissions;
      }
    } catch (error) {
      console.error('Failed to fetch user permissions:', error);
    }
    return null;
  };

  const login = async (username: string, password: string, tenantCode?: string): Promise<boolean | { need2FA: boolean; userId: number; phone: string; tenantId: number }> => {
    setError(null);

    try {
      const response = await authApi.login({ username, password, tenantCode });

      if (response.success && response.data) {
        // 检查是否需要2FA验证
        if (response.data.need2FA) {
          // 2FA 场景：不设置任何 loading 状态，让 LoginPage 组件保持挂载
          return {
            need2FA: true,
            userId: response.data.userId,
            phone: response.data.phone!,  // Non-null assertion - phone is always present when need2FA is true
            tenantId: response.data.tenantId,
          };
        }

        // 正常登录场景
        const userData = mapApiUserToUser(response.data);

        // 保存令牌和用户信息
        // Safe to use non-null assertion because we've already checked for 2FA above
        tokenManager.setToken(response.data.token!);
        tokenManager.setRefreshToken(response.data.refreshToken!);

        // 使用登录响应的数据作为基础，登录响应已经包含所有必要字段（包括createdAt）
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));

        return true;
      } else {
        console.error('Login failed:', response.message);
        setError(response.message || 'Login failed');
        setLoading(false);
        return false;
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      console.error('Login error:', errorMessage);
      setError(errorMessage);
      setLoading(false);
      return false;
    }
    // 注意：不使用 finally 块，因为在 2FA 场景下我们不想触发 setLoading
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    // 不设置全局loading状态，避免页面重新渲染导致的刷新效果
    // setLoading(true);
    setError(null);

    try {
      const response = await authApi.register({
        username: userData.username,
        password: userData.password,
        confirmPassword: userData.password, // 前端已经验证过密码确认
        realName: userData.realName,
        email: userData.email,
        phone: userData.phone,
        invitationCode: userData.invitationCode,
      });

      if (response.success && response.data) {
        const userData = mapApiUserToUser(response.data);

        // 保存令牌和用户信息
        // Registration always returns complete data with tokens
        tokenManager.setToken(response.data.token!);
        tokenManager.setRefreshToken(response.data.refreshToken!);

        // 使用注册响应的数据
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));

        // 设置标记，在登录后显示注册成功消息
        localStorage.setItem('showRegistrationSuccess', 'true');

        return true;
      } else {
        setError(response.message || 'Registration failed');
        return false;
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      return false;
    }
    // 移除finally块，因为不再设置loading状态
    // finally {
    //   setLoading(false);
    // }
  };

  const logout = async () => {
    try {
      // 调用后端登出接口
      await authApi.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // 清除本地数据
      tokenManager.clearAll();
      localStorage.removeItem('user');
      // 清除登录页面状态，避免退出后回到2FA验证页面
      sessionStorage.removeItem('authPageMode');
      // 清除未支付账单提醒的关闭状态，确保下次登录时重新显示
      if (user?.id) {
        sessionStorage.removeItem(`unpaid-invoice-alert-closed-${user.id}`);
      }
      setUser(null);
      setError(null);
    }
  };

  const updateUserInfo = async (userInfo: Partial<User>): Promise<boolean> => {
    if (!user) return false;
    // 不设置全局loading状态，避免全屏loading界面
    // setLoading(true);
    setError(null);

    try {
      // 确保userId是数字类型，并移除permissions字段（不应该通过updateProfile更新）
      const { permissions, ...userInfoWithoutPermissions } = userInfo;
      const updateData = {
        ...userInfoWithoutPermissions,
        userId: userInfo.id || (user.id ? Number(user.id) : undefined)
      };

      // 验证userId是否存在且为数字
      if (!updateData.userId || typeof updateData.userId !== 'number') {
        console.error('Invalid userId in update request:', updateData.userId);
        setError('Invalid user ID');
        return false;
      }

      const response = await userApi.updateProfile(updateData);

      if (response.success && response.data) {
        // 直接使用updateProfile返回的数据，它已经包含了最新的完整信息
        const responseData = response.data as any;
        const updatedUser: User = {
          id: Number(responseData.userId),
          username: responseData.username,
          realName: responseData.realName,
          email: responseData.email,
          phone: responseData.phone,
          avatar: responseData.avatar,
          tenantId: responseData.tenantId,
          tenantName: responseData.tenantName,
          timezone: responseData.timezone,
          roles: responseData.roles,
          permissions: responseData.permissions,
          lastLoginTime: responseData.lastLoginTime,
          createdAt: user.createdAt, // 保留原有的createdAt
        };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return true;
      } else {
        console.error('Update failed:', response.message);
        setError(response.message || 'Update failed');
        return false;
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      console.error('Update error:', errorMessage);
      setError(errorMessage);
      return false;
    }
    // 移除finally块，因为不再设置loading状态
  };

  const uploadAvatar = async (file: File): Promise<boolean> => {
    if (!user) return false;

    // 不设置全局loading状态，避免全屏loading界面
    // setLoading(true);
    setError(null);

    try {
      const response = await userApi.uploadAvatar(file);

      if (response.success && response.data) {
        const updatedUser = { ...user, avatar: response.data.avatarUrl };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return true;
      } else {
        setError(response.message || 'Avatar upload failed');
        return false;
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      return false;
    }
    // 移除finally块，因为不再设置loading状态
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateUserInfo,
    uploadAvatar,
    error,
    clearError,
    setError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 