import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi, userApi, subscriptionApi, tokenManager, handleApiError, LoginResponse } from '../services/api';
import { useSnackbar } from 'notistack';
import { pushNotificationService } from '../services/pushNotification';
import { Capacitor } from '@capacitor/core';

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
  smsVerificationEnabled?: boolean;
  isTenantOwner?: boolean;
  // 订阅过期标识 - 用于限制用户只能访问订阅/支付页面
  subscriptionExpired?: boolean;
  // 订阅状态 - 用于区分不同的过期类型 (PAST_DUE, EXPIRED, CANCELLED 等)
  subscriptionStatus?: string;
  tenantStatus?: string;
  // 当前订阅计划代码
  planCode?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  subscriptionExpired: boolean;  // 订阅过期状态
  login: (username: string, password: string, tenantCode?: string) => Promise<boolean | { need2FA: boolean; userId: number; phone: string; tenantId: number }>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  updateUserInfo: (userInfo: Partial<User>) => Promise<boolean>;
  uploadAvatar: (file: File) => Promise<boolean>;
  error: string | null;
  clearError: () => void;
  setError: (error: string) => void;
  refreshSubscriptionStatus: () => Promise<void>;  // 主动刷新订阅状态
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
    phone: apiUser.phone,
    avatar: apiUser.avatar,
    tenantId: apiUser.tenantId,
    tenantCode: apiUser.tenantCode,
    tenantName: apiUser.tenantName,
    timezone: apiUser.timezone,
    roles: apiUser.roles,
    permissions: apiUser.permissions,
    lastLoginTime: apiUser.lastLoginTime,
    createdAt: apiUser.createdAt,
    isTenantOwner: apiUser.isTenantOwner,
    subscriptionExpired: apiUser.subscriptionExpired,
    subscriptionStatus: apiUser.subscriptionStatus,
    tenantStatus: apiUser.tenantStatus,
    planCode: apiUser.planCode,
    smsVerificationEnabled: apiUser.smsVerificationEnabled,
  };
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 计算订阅过期状态
  const subscriptionExpired = user?.subscriptionExpired === true;

  // 标记是否是初次加载（用于避免首次加载时的不必要刷新）
  const isInitialLoad = React.useRef(true);

  useEffect(() => {
    const initializeAuth = async () => {
      // 检查本地存储中是否有用户信息和令牌
      const savedUser = localStorage.getItem('user');
      const token = tokenManager.getToken();


      if (savedUser && token) {
        try {
          const userData = JSON.parse(savedUser);
          setUser(userData);

          // 移动端（iOS/Android）跳过服务器端 token 验证
          // 原因：1. 用户可能离线  2. 延迟启动  3. JWT 本身有过期时间
          // API 请求时如果 token 过期，会自动处理 401 错误并登出
          if (!Capacitor.isNativePlatform()) {
            // Web 端：验证令牌是否有效
            await validateStoredToken(token);
          } else {
            console.log('[AuthContext] Native platform detected, skipping server-side token validation');
          }

          // 初始化推送通知服务（已登录用户）
          pushNotificationService.initialize().catch(error => {
            console.error('Failed to initialize push notifications:', error);
          });
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

  // 监听订阅变更事件，更新用户的订阅过期状态
  const refreshSubscriptionStatus = useCallback(async () => {
    console.log('[AuthContext] refreshSubscriptionStatus called, tenantId:', user?.tenantId);
    if (!user?.tenantId) {
      console.log('[AuthContext] No tenantId, skipping refresh');
      return;
    }

    try {
      console.log('[AuthContext] Fetching subscription for tenant:', user.tenantId);
      const response = await subscriptionApi.getSubscriptions(user.tenantId);
      console.log('[AuthContext] Subscription API response:', response);

      if (response.success && response.data && response.data.length > 0) {
        // 获取最新的订阅
        const latestSub = response.data.sort((a: any, b: any) => b.id - a.id)[0];
        console.log('[AuthContext] Latest subscription:', latestSub);
        console.log('[AuthContext] Subscription status:', latestSub.status);

        const status = latestSub.status?.toUpperCase();
        let isExpired = false;

        // 检查订阅状态是否为过期/取消/欠费
        if (status === 'EXPIRED' || status === 'CANCELLED' || status === 'PAST_DUE') {
          isExpired = true;
        }
        // 检查试用期是否已到期
        else if (status === 'TRIAL' && latestSub.trialEndDate) {
          const trialEndDate = new Date(latestSub.trialEndDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (trialEndDate < today) {
            console.log('[AuthContext] Trial period has expired:', latestSub.trialEndDate);
            isExpired = true;
          }
        }

        console.log('[AuthContext] Is expired?:', isExpired, 'Current:', user.subscriptionExpired);

        // 获取订阅的 planCode（从订阅的 plan 关联中提取）
        const newPlanCode = latestSub.plan?.planCode;
        const planChanged = newPlanCode && user.planCode !== newPlanCode;
        const statusChanged = user.subscriptionStatus !== status;
        console.log('[AuthContext] Plan code check - current:', user.planCode, 'new:', newPlanCode, 'changed:', planChanged);
        console.log('[AuthContext] Status check - current:', user.subscriptionStatus, 'new:', status, 'changed:', statusChanged);

        // 如果订阅状态或计划已改变，更新用户信息
        if (user.subscriptionExpired !== isExpired || planChanged || statusChanged) {
          console.log('[AuthContext] Status or plan changed, updating user...');
          const updatedUser = {
            ...user,
            subscriptionExpired: isExpired,
            subscriptionStatus: status,
            ...(newPlanCode && { planCode: newPlanCode })
          };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          console.log('[AuthContext] User updated, new subscriptionExpired:', isExpired, 'subscriptionStatus:', status, 'planCode:', newPlanCode);

          // 如果是初次加载，不触发刷新（只更新本地状态）
          if (isInitialLoad.current) {
            console.log('[AuthContext] Initial load, skipping reload (state updated locally)');
            return;
          }

          // 如果订阅状态变化或计划变更，触发页面刷新以应用限制/恢复
          if (isExpired && !user.subscriptionExpired) {
            console.log('[AuthContext] Subscription expired, reloading page...');
            window.location.reload();
          } else if (!isExpired && user.subscriptionExpired) {
            // 从过期恢复到激活状态，也需要刷新页面以恢复功能访问
            console.log('[AuthContext] Subscription restored, reloading page...');
            window.location.reload();
          } else if (planChanged) {
            // 计划变更也需要刷新页面以更新UI
            console.log('[AuthContext] Plan changed, reloading page...');
            window.location.reload();
          }
        } else {
          console.log('[AuthContext] Status and plan unchanged, no update needed');
        }
      } else {
        console.log('[AuthContext] No subscription data found');
        // 没有订阅数据，视为过期
        if (!user.subscriptionExpired) {
          const updatedUser = { ...user, subscriptionExpired: true };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          // 如果是初次加载，不触发刷新
          if (!isInitialLoad.current) {
            window.location.reload();
          }
        }
      }
    } catch (error) {
      console.error('[AuthContext] Failed to refresh subscription status:', error);
    }
  }, [user]);

  useEffect(() => {
    const handleSubscriptionChanged = () => {
      console.log('Subscription changed event received, refreshing status...');
      refreshSubscriptionStatus();
    };

    window.addEventListener('subscription-changed', handleSubscriptionChanged);
    return () => {
      window.removeEventListener('subscription-changed', handleSubscriptionChanged);
    };
  }, [refreshSubscriptionStatus]);

  // 订阅检查（页面加载时执行一次 + 定期检查）
  useEffect(() => {
    if (!user?.tenantId) {
      return;
    }

    // 立即检查一次（初次加载时不会触发刷新，因为 isInitialLoad.current = true）
    refreshSubscriptionStatus().then(() => {
      // 首次检查完成后，标记初次加载结束
      setTimeout(() => {
        isInitialLoad.current = false;
        console.log('[AuthContext] Initial load completed, future changes will trigger reload');
      }, 2000);
    });

    // 定期检查（1小时）
    const intervalId = setInterval(() => {
      console.log('[AuthContext] Periodic subscription status check...');
      refreshSubscriptionStatus();
    }, 60 * 60 * 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [user?.tenantId]); // 只依赖 tenantId，避免 refreshSubscriptionStatus 变化导致重复执行

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

        // 保存令牌和用户信息到 localStorage
        // 注意：不调用 setUser()，避免触发 React 状态更新导致的各种 useEffect 执行
        // 页面跳转后会从 localStorage 恢复用户状态
        tokenManager.setToken(response.data.token!);
        tokenManager.setRefreshToken(response.data.refreshToken!);
        localStorage.setItem('user', JSON.stringify(userData));

        // 初始化推送通知服务（异步，不阻塞登录流程）
        pushNotificationService.initialize().catch(error => {
          console.error('Failed to initialize push notifications:', error);
        });

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
      // 注销推送通知
      await pushNotificationService.unregister();
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
          tenantCode: user.tenantCode, // 保留原有的tenantCode
          tenantName: responseData.tenantName,
          timezone: responseData.timezone,
          roles: responseData.roles,
          permissions: responseData.permissions,
          lastLoginTime: responseData.lastLoginTime,
          createdAt: user.createdAt, // 保留原有的createdAt
          smsVerificationEnabled: responseData.smsVerificationEnabled,
          // 保留订阅相关字段，避免触发不必要的页面刷新
          isTenantOwner: user.isTenantOwner,
          subscriptionExpired: user.subscriptionExpired,
          subscriptionStatus: user.subscriptionStatus,
          tenantStatus: user.tenantStatus,
          planCode: user.planCode,
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
    subscriptionExpired,
    login,
    register,
    logout,
    updateUserInfo,
    uploadAvatar,
    error,
    clearError,
    setError,
    refreshSubscriptionStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 