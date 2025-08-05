import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { merchantConfigApi } from '../services/api';
import CustomDialog from '../components/common/CustomDialog';

interface SessionContextType {
  sessionTimeout: number;
  lastActivity: number | null;
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
  const [lastActivity, setLastActivity] = useState<number | null>(null);
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

  // 当用户登录时初始化lastActivity
  useEffect(() => {
    if (user && lastActivity === null) {
      setLastActivity(Date.now());
    }
  }, [user, lastActivity]);

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
    if (!user || isSessionExpired || lastActivity === null) {
      return;
    }

    let activityTimeout: NodeJS.Timeout;

    const handleActivity = () => {
      // 如果会话已经过期，立即返回，不进行任何更新
      if (isSessionExpired) {
        return;
      }
      
      // 防抖处理，避免过于频繁的更新
      clearTimeout(activityTimeout);
      activityTimeout = setTimeout(() => {
        // 再次检查会话状态，确保在防抖期间没有过期
        if (isSessionExpired) {
          return;
        }
        
        // 使用函数式更新来获取最新的状态
        setLastActivity(prevLastActivity => {
          // 只有在lastActivity不为null且会话未过期时才更新
          if (prevLastActivity !== null && !isSessionExpired) {
            setWarningShown(false);
            return Date.now();
          }
          return prevLastActivity;
        });
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
  }, [user, isSessionExpired, lastActivity]); // 添加lastActivity依赖，确保在lastActivity变为null时移除监听器

  // 检查会话是否过期
  useEffect(() => {
    // 只有在用户登录且lastActivity已初始化后才开始检查会话
    if (!user || lastActivity === null) {
      return;
    }

    let interval: NodeJS.Timeout;

    const checkSession = () => {
      // 获取当前的lastActivity值
      const currentLastActivity = lastActivity;
      if (currentLastActivity === null) {
        return;
      }

      const now = Date.now();
      const timeSinceLastActivity = now - currentLastActivity;
      const timeoutMs = sessionTimeout * 60 * 1000; // 转换为毫秒

      // 检查是否超时
      if (timeSinceLastActivity > timeoutMs) {
        console.log('Session expired:', {
          timeSinceLastActivity: timeSinceLastActivity / 1000 / 60,
          sessionTimeout,
          lastActivity: new Date(currentLastActivity).toLocaleString()
        });
        setIsSessionExpired(true);
        setShowSessionDialog(true);
        // 立即将lastActivity设置为null，确保事件监听器被移除
        setLastActivity(null);
        // 清除定时器，避免重复检查
        if (interval) {
          clearInterval(interval);
        }
      }
    };

    // 延迟2秒后开始检查，给用户登录过程一些时间
    const initialDelay = setTimeout(() => {
      // 每30秒检查一次会话状态
      interval = setInterval(checkSession, 30000);
    }, 2000);

    return () => {
      clearTimeout(initialDelay);
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [user, sessionTimeout]); // 移除lastActivity和isSessionExpired依赖，避免重复创建定时器

  const handleSessionExpiredConfirm = () => {
    setShowSessionDialog(false);
    // 立即清理所有状态，确保不会意外续上会话
    setLastActivity(null);
    setIsSessionExpired(true);
    setWarningShown(false);
    // 直接退出，不重置过期状态
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