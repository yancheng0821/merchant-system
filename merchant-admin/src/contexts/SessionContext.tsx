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

// localStorage key for last activity
const LAST_ACTIVITY_KEY = 'session_last_activity';

export const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [sessionTimeout, setSessionTimeout] = useState(30); // 默认30分钟
  const [lastActivity, setLastActivity] = useState<number | null>(() => {
    // 从 localStorage 恢复 lastActivity
    const saved = localStorage.getItem(LAST_ACTIVITY_KEY);
    return saved ? parseInt(saved, 10) : null;
  });
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [warningShown, setWarningShown] = useState(false);

  // 同步 lastActivity 到 localStorage
  useEffect(() => {
    if (lastActivity !== null) {
      localStorage.setItem(LAST_ACTIVITY_KEY, lastActivity.toString());
    } else {
      localStorage.removeItem(LAST_ACTIVITY_KEY);
    }
  }, [lastActivity]);

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

  // 当用户登录时检查会话状态
  useEffect(() => {
    if (user) {
      // 检查是否有从 localStorage 恢复的 lastActivity
      const savedLastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);

      if (savedLastActivity) {
        const savedTime = parseInt(savedLastActivity, 10);
        const now = Date.now();
        const timeSinceLastActivity = now - savedTime;
        const timeoutMs = sessionTimeout * 60 * 1000;

        // 检查保存的会话是否已过期
        if (timeSinceLastActivity > timeoutMs) {
          console.log('Session expired on page load:', {
            inactiveMinutes: Math.round(timeSinceLastActivity / 1000 / 60),
            sessionTimeoutMinutes: sessionTimeout,
            lastActivity: new Date(savedTime).toLocaleString()
          });
          // 会话已过期，显示过期对话框
          setLastActivity(null);
          setIsSessionExpired(true);
          setShowSessionDialog(true);
          setWarningShown(false);
          return;
        }

        // 会话未过期，使用恢复的时间（不重置为当前时间）
        if (lastActivity === null) {
          console.log('Restored session from localStorage, lastActivity:', new Date(savedTime).toLocaleString());
          setLastActivity(savedTime);
          setIsSessionExpired(false);
          setShowSessionDialog(false);
          setWarningShown(false);
        }
      } else if (lastActivity === null || isSessionExpired) {
        // 新登录（没有保存的 lastActivity），初始化为当前时间
        console.log('User logged in, initializing session state');
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
  }, [user, sessionTimeout]); // 添加 sessionTimeout 依赖

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
    // 注意：移除了 mousemove 和 scroll，因为它们太敏感，会被自动行为触发
    const events = ['mousedown', 'keypress', 'touchstart', 'click'];
    
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

    // 监听页面可见性变化（移动端从后台恢复时触发）
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Page became visible, checking session...');
        // 延迟一小段时间检查，确保状态已更新
        setTimeout(checkSession, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, sessionTimeout, isSessionExpired, lastActivity]);

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