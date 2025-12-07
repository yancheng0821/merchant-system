import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

// 订阅过期时允许访问的路径白名单
const ALLOWED_PATHS_WHEN_EXPIRED = [
  '/plans',
  '/checkout',
  '/settings',
  '/subscription-expired',
];

/**
 * 订阅过期路由守卫
 * 当订阅过期时，只允许访问订阅/支付相关页面
 */
const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({ children }) => {
  const { subscriptionExpired, user } = useAuth();
  const location = useLocation();

  // 如果没有用户信息，不做任何限制（由其他认证守卫处理）
  if (!user) {
    return <>{children}</>;
  }

  // 如果订阅过期
  if (subscriptionExpired) {
    const currentPath = location.pathname;

    // 检查当前路径是否在白名单中
    const isAllowedPath = ALLOWED_PATHS_WHEN_EXPIRED.some(
      path => currentPath === path || currentPath.startsWith(path + '/')
    );

    // 如果不在白名单中，重定向到过期提示页面
    if (!isAllowedPath) {
      return <Navigate to="/subscription-expired" replace />;
    }
  }

  return <>{children}</>;
};

export default SubscriptionGuard;
