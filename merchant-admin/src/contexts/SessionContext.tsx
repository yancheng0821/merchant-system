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

  // 监听API触发的session过期事件
  useEffect(() => {
    const handleApiSessionExpired = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('API session expired event received:', customEvent.detail);

      // 立即清理所有session状态
      setLastActivity(null);
      setIsSessionExpired(true);
      setWarningShown(false);

      // 显示提示对话框
      setShowSessionDialog(true);
    };

    window.addEventListener('sessionExpired', handleApiSessionExpired);

    return () => {
      window.removeEventListener('sessionExpired', handleApiSessionExpired);
    };
  }, []);

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

  // 当用户登录时初始化lastActivity并重置过期状态
  useEffect(() => {
    if (user) {
      // 如果是新登录（lastActivity为null）或者之前已过期，重置状态
      if (lastActivity === null || isSessionExpired) {
        console.log('User logged in, resetting session state');
        setLastActivity(Date.now());
        setIsSessionExpired(false);
        setShowSessionDialog(false);
        setWarningShown(false);
      }
    } else {
      // 用户登出时，清除状态
      setLastActivity(null);
      setIsSessionExpired(false);
      setShowSessionDialog(false);
      setWarningShown(false);
    }
  }, [user]); // 只依赖user，避免循环依赖

  // 刷新会话活动时间
  const refreshSession = useCallback(() => {
    // 使用函数式更新确保使用最新的过期状态
    setIsSessionExpired(currentExpired => {
      if (!currentExpired) {
        // 只有在未过期时才刷新活动时间
        setLastActivity(Date.now());
        setWarningShown(false);
      }
      return currentExpired;
    });
  }, []);

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
      // 防抖处理，避免过于频繁的更新
      clearTimeout(activityTimeout);
      activityTimeout = setTimeout(() => {
        // 使用函数式更新来获取最新的状态
        setIsSessionExpired(currentExpired => {
          // 如果已经过期，不更新活动时间
          if (currentExpired) {
            return currentExpired;
          }
          
          // 如果未过期，更新活动时间
          setLastActivity(prevLastActivity => {
            // 只有在lastActivity不为null时才更新
            if (prevLastActivity !== null) {
              setWarningShown(false);
              return Date.now();
            }
            return prevLastActivity;
          });
          
          return currentExpired;
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
    // 只有在用户登录且lastActivity已初始化且未过期后才开始检查会话
    if (!user || lastActivity === null || isSessionExpired) {
      return;
    }

    const checkSession = () => {
      // 使用setState的函数形式来获取最新的lastActivity值
      setLastActivity(currentLastActivity => {
        if (currentLastActivity === null) {
          return currentLastActivity;
        }

        const now = Date.now();
        const timeSinceLastActivity = now - currentLastActivity;
        const timeoutMs = sessionTimeout * 60 * 1000; // 转换为毫秒

        // 检查是否超时
        if (timeSinceLastActivity > timeoutMs) {
          console.log('Session expired due to inactivity:', {
            inactiveMinutes: Math.round(timeSinceLastActivity / 1000 / 60),
            sessionTimeoutMinutes: sessionTimeout,
            lastActivity: new Date(currentLastActivity).toLocaleString()
          });
          
          // 触发session过期
          setTimeout(() => {
            setIsSessionExpired(true);
            setShowSessionDialog(true);
          }, 0);
          
          // 返回null来清除lastActivity
          return null;
        }
        
        // 如果没有过期，返回原值
        return currentLastActivity;
      });
    };

    // 立即检查一次
    checkSession();
    
    // 每30秒检查一次会话状态
    const interval = setInterval(checkSession, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [user, sessionTimeout, isSessionExpired]);

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