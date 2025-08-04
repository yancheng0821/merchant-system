import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { merchantConfigApi } from '../services/api';
import CustomDialog from '../components/common/CustomDialog';

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
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [sessionTimeout, setSessionTimeout] = useState(30); // 默认30分钟
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [warningShown, setWarningShown] = useState(false);

  // 获取会话超时设置
  useEffect(() => {
    const fetchSessionTimeout = async () => {
      if (!user?.tenantId) return;
      
      try {
        const configResponse = await merchantConfigApi.getAllConfigs(user.tenantId);
        if (configResponse) {
          const sessionConfig = configResponse.find((config: any) => config.configKey === 'session_timeout');
          if (sessionConfig) {
            const newTimeout = parseInt(sessionConfig.configValue);
            setSessionTimeout(newTimeout);
            // 重置最后活动时间，避免立即过期
            setLastActivity(Date.now());
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
    // 如果session已经过期，不允许刷新
    if (isSessionExpired) {
      return;
    }
    setLastActivity(Date.now());
    setWarningShown(false);
  }, [isSessionExpired]);

  // 更新会话超时时间
  const updateSessionTimeout = useCallback((timeout: number) => {
    setSessionTimeout(timeout);
    // 重置最后活动时间，避免立即过期
    setLastActivity(Date.now());
    // 重置过期状态
    setIsSessionExpired(false);
    setShowSessionDialog(false);
    setWarningShown(false);
  }, []);

  // 监听用户活动
  useEffect(() => {
    // 只有在用户登录且session未过期时才监听活动
    if (!user || isSessionExpired) {
      return;
    }

    let activityTimeout: NodeJS.Timeout;

    const handleActivity = () => {
      // 防抖处理，避免过于频繁的更新
      clearTimeout(activityTimeout);
      activityTimeout = setTimeout(() => {
        if (!isSessionExpired) {
          setLastActivity(Date.now());
          setWarningShown(false);
        }
      }, 1000); // 1秒防抖
    };

    // 监听各种用户活动事件
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      clearTimeout(activityTimeout);
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [user, isSessionExpired]);

  // 检查会话是否过期
  useEffect(() => {
    // 只有在用户登录后才开始检查会话
    if (!user) {
      return;
    }

    const checkSession = () => {
      // 如果已经过期，不需要再检查
      if (isSessionExpired) {
        return;
      }

      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;
      const timeoutMs = sessionTimeout * 60 * 1000; // 转换为毫秒

      // 检查是否超时
      if (timeSinceLastActivity > timeoutMs) {
        console.log('Session expired:', {
          timeSinceLastActivity: timeSinceLastActivity / 1000 / 60,
          sessionTimeout,
          lastActivity: new Date(lastActivity).toLocaleString()
        });
        setIsSessionExpired(true);
        setShowSessionDialog(true);
      }
    };

    // 延迟2秒后开始检查，给用户登录过程一些时间
    const initialDelay = setTimeout(() => {
      // 每30秒检查一次会话状态
      const interval = setInterval(checkSession, 30000);
      
      return () => clearInterval(interval);
    }, 2000);

    return () => clearTimeout(initialDelay);
  }, [lastActivity, sessionTimeout, isSessionExpired, user]);

  const handleSessionExpiredConfirm = () => {
    setShowSessionDialog(false);
    // 确保清理所有session相关状态
    setIsSessionExpired(false);
    setWarningShown(false);
    logout();
  };

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
      <CustomDialog
        open={showSessionDialog}
        onClose={handleSessionExpiredConfirm}
        title={t('session.expired')}
        message={t('session.expiredMessage')}
        type="info"
        confirmText={t('session.relogin')}
        onConfirm={handleSessionExpiredConfirm}
        moduleColor="#6366F1"
      />
    </SessionContext.Provider>
  );
};