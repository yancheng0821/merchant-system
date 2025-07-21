import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, userApi, tokenManager, handleApiError, LoginResponse } from '../services/api';

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

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  loginWithGoogle: (idToken: string) => Promise<boolean>;
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
  tenantCode?: string;
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
const mapApiUserToUser = (apiUser: LoginResponse): User => {
  return {
    id: apiUser.userId,
    username: apiUser.username,
    realName: apiUser.realName,
    email: apiUser.email,
    avatar: apiUser.avatar,
    tenantId: apiUser.tenantId,
    tenantName: apiUser.tenantName,
    roles: apiUser.roles,
    permissions: apiUser.permissions,
    lastLoginTime: apiUser.lastLoginTime,
  };
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 检查本地存储中是否有用户信息和令牌
    const savedUser = localStorage.getItem('user');
    const token = tokenManager.getToken();

    if (savedUser && token) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);

        // 验证令牌是否有效
        validateStoredToken(token);
      } catch (error) {
        console.error('Failed to parse saved user data:', error);
        tokenManager.clearAll();
      }
    }
    setLoading(false);
  }, []);

  const validateStoredToken = async (token: string) => {
    try {
      // 修复：去掉Bearer前缀
      const pureToken = token?.startsWith('Bearer ') ? token.slice(7) : token;
      const response = await authApi.validateToken(pureToken);
      if (!response.success) {
        // 令牌无效，清除本地数据
        tokenManager.clearAll();
        setUser(null);
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      tokenManager.clearAll();
      setUser(null);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await authApi.login({ username, password });

      if (response.success && response.data) {
        const userData = mapApiUserToUser(response.data);

        // 保存令牌和用户信息
        tokenManager.setToken(response.data.token);
        tokenManager.setRefreshToken(response.data.refreshToken);

        // 登录成功后，立即获取完整用户资料
        try {
          const profileResp = await userApi.getProfile();
          if (profileResp.success && profileResp.data) {
            const completeUser = { ...profileResp.data, id: Number((profileResp.data as any).userId) };
            setUser(completeUser);
            localStorage.setItem('user', JSON.stringify(completeUser));
          } else {
            // 如果获取完整资料失败，使用登录返回的基本信息
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          }
        } catch (e) {
          console.error('Failed to fetch complete profile:', e);
          // 出错时使用登录返回的基本信息
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        }

        return true;
      } else {
        console.error('Login failed:', response.message);
        setError(response.message || 'Login failed');
        return false;
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      console.error('Login error:', errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await authApi.register({
        username: userData.username,
        password: userData.password,
        confirmPassword: userData.password, // 前端已经验证过密码确认
        realName: userData.realName,
        email: userData.email,
        phone: userData.phone,
        tenantCode: userData.tenantCode,
      });

      if (response.success && response.data) {
        const user = mapApiUserToUser(response.data);

        // 保存令牌和用户信息
        tokenManager.setToken(response.data.token);
        tokenManager.setRefreshToken(response.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(user));

        setUser(user);
        return true;
      } else {
        setError(response.message || 'Registration failed');
        return false;
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (idToken: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Google login with token:', idToken.substring(0, 20) + '...');
      const response = await authApi.googleLogin(idToken);
      
      if (response.success && response.data) {
        const userData = mapApiUserToUser(response.data);
        
        // 保存令牌和用户信息
        tokenManager.setToken(response.data.token);
        tokenManager.setRefreshToken(response.data.refreshToken);
        
        // 获取完整用户资料
        try {
          console.log('Google login success, fetching complete profile...');
          const profileResp = await userApi.getProfile();
          if (profileResp.success && profileResp.data) {
            const completeUser = { ...profileResp.data, id: Number(profileResp.data.id) };
            console.log('Complete user profile:', completeUser);
            setUser(completeUser);
            localStorage.setItem('user', JSON.stringify(completeUser));
          } else {
            console.warn('Failed to fetch complete profile, using basic info');
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          }
        } catch (e) {
          console.error('Failed to fetch complete profile:', e);
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        }
        
        return true;
      } else {
        console.error('Google login failed:', response.message);
        setError(response.message || 'Google login failed');
        return false;
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      console.error('Google login error:', errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
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
      setUser(null);
      setError(null);
    }
  };

  const updateUserInfo = async (userInfo: Partial<User>): Promise<boolean> => {
    if (!user) return false;
    setLoading(true);
    setError(null);

    try {
      // 确保userId是数字类型
      const updateData = {
        ...userInfo,
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
        // 更新成功后，重新获取完整的用户资料
        try {
          const profileResp = await userApi.getProfile();
          if (profileResp.success && profileResp.data) {
            const fixedUser = { ...profileResp.data, id: Number((profileResp.data as any).userId) };
            setUser(fixedUser);
            localStorage.setItem('user', JSON.stringify(fixedUser));
          }
        } catch (e) {
          console.error('Failed to fetch latest profile:', e);
        }
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
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (file: File): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    loginWithGoogle,
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