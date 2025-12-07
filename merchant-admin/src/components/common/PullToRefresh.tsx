import React, { useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
}

/**
 * 下拉刷新组件
 * 使用原生 iOS UIRefreshControl 和 Android SwipeRefreshLayout
 * 通过监听原生层发送的 nativePullToRefresh 事件来触发刷新
 */
const PullToRefresh: React.FC<PullToRefreshProps> = ({ children, onRefresh, disabled }) => {
  const handleNativePullToRefresh = useCallback(async () => {
    if (disabled) return;

    console.log('[PullToRefresh] Native pull to refresh triggered');
    try {
      await onRefresh();
      console.log('[PullToRefresh] Refresh completed');
    } catch (error) {
      console.error('[PullToRefresh] Refresh failed:', error);
    }
  }, [onRefresh, disabled]);

  useEffect(() => {
    // 只在原生平台监听
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    window.addEventListener('nativePullToRefresh', handleNativePullToRefresh);

    return () => {
      window.removeEventListener('nativePullToRefresh', handleNativePullToRefresh);
    };
  }, [handleNativePullToRefresh]);

  return <>{children}</>;
};

export default PullToRefresh;
