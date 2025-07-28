import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { merchantConfigApi } from '../services/api';

interface SessionContextType {
  sessionTimeout: number;
  lastActivity: number;
  isSessionExpired: boolean;
  refreshSession: () => void;
  updateSessionTimeout: (timeout: number) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

interface SessionProviderProps {
  children: ReactNode;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const [sessionTimeout, setSessionTimeout] = useState(30); // 默认30分钟
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  // 获取会话超时设置
  useEffect(() => {
    const fetchSessionTimeout = async () => {
      if (!user?.tenantId) return;
      
      try {
        const configResponse = await merchantConfigApi.getAllConfigs(user.tenantId);
        if (configResponse) {
          const sessionConfig = configResponse.find((config: any) => config.configKey === 'session_timeout');
          if (sessionConfig) {
            setSessionTimeout(parseInt(sessionConfig.configValue));
          }
        }
      } catch (error) {
        console.error('获取会话超时设置失败:', error);
      }
    };

    fetchSessionTimeout();
  }, [user?.tenantId]);

  // 刷新会话活动时间
  const refreshSession = useCallback(() => {
    setLastActivity(Date.now());
    setIsSessionExpired(false);
  }, []);

  // 更新会话超时时间
  const updateSessionTimeout = useCallback((timeout: number) => {
    setSessionTimeout(timeout);
  }, []);

  // 监听用户活动
  useEffect(() => {
    const handleActivity = () => {
      refreshSession();
    };

    // 监听各种用户活动事件
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [refreshSession]);

  // 检查会话是否过期
  useEffect(() => {
    const checkSession = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;
      const timeoutMs = sessionTimeout * 60 * 1000; // 转换为毫秒

      if (timeSinceLastActivity > timeoutMs) {
        setIsSessionExpired(true);
        // 自动登出
        setTimeout(() => {
          logout();
          alert('会话已过期，请重新登录');
        }, 1000);
      }
    };

    // 每分钟检查一次会话状态
    const interval = setInterval(checkSession, 60000);

    return () => clearInterval(interval);
  }, [lastActivity, sessionTimeout, logout]);

  const value: SessionContextType = {
    sessionTimeout,
    lastActivity,
    isSessionExpired,
    refreshSession,
    updateSessionTimeout
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};