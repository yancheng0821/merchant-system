import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
} from '@mui/material';
import { businessNotificationApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

interface SystemNotification {
  id: number;
  notificationType: string;
  title: string;
  content: string;
  titleEn?: string;
  titleZh?: string;
  contentEn?: string;
  contentZh?: string;
  level: string;
  isRead: boolean;
  createdAt: string;
}

const NotificationBar: React.FC = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 根据当前语言获取通知标题和内容
  const getLocalizedText = (notification: SystemNotification) => {
    if (!notification) {
      return { title: '', content: '' };
    }

    const isZh = i18n.language === 'zh' || i18n.language === 'zh-CN';

    return {
      title: isZh
        ? (notification.titleZh || notification.title || '')
        : (notification.titleEn || notification.title || ''),
      content: isZh
        ? (notification.contentZh || notification.content || '')
        : (notification.contentEn || notification.content || ''),
    };
  };

  // 获取租户的系统通知副本
  // 系统通知在创建时会自动为每个租户创建副本
  const fetchNotifications = async () => {
    if (!user?.tenantId) return;

    try {
      const systemNotifications = await businessNotificationApi.getTenantSystemNotifications(user.tenantId);
      setNotifications(systemNotifications || []);
    } catch (error) {
      console.error('Failed to fetch system notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // 每60秒刷新一次通知
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [user?.tenantId]);

  // 监听语言变化，强制重新渲染
  useEffect(() => {
    // 当语言改变时，组件会重新渲染，localizedText 会自动更新
  }, [i18n.language]);

  // 自动轮播
  useEffect(() => {
    if (notifications.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % notifications.length);
    }, 8000); // 每8秒切换一次

    return () => clearInterval(timer);
  }, [notifications.length]);

  // 当通知列表变化时，重置索引以防越界
  useEffect(() => {
    if (currentIndex >= notifications.length && notifications.length > 0) {
      setCurrentIndex(0);
    }
  }, [notifications.length, currentIndex]);

  if (notifications.length === 0) {
    return null;
  }

  const currentNotification = notifications[currentIndex];

  // 安全检查：如果当前通知不存在，不渲染
  if (!currentNotification) {
    return null;
  }

  const localizedText = getLocalizedText(currentNotification);

  // 根据通知级别获取颜色
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'WARNING': return '#F59E0B';
      case 'ERROR': return '#EF4444';
      case 'SUCCESS': return '#10B981';
      case 'INFO':
      default: return '#6366F1';
    }
  };

  const color = getLevelColor(currentNotification.level);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        flex: 1,
        minWidth: 0,
      }}
    >
      {/* 通知指示点 */}
      <Box
        sx={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          bgcolor: color,
          flexShrink: 0,
        }}
      />

      {/* 通知内容 */}
      <Typography
        sx={{
          color: '#666',
          fontSize: '0.8125rem',
          lineHeight: 1.4,
          flex: 1,
          minWidth: 0,
        }}
      >
        <Box component="span" sx={{ fontWeight: 500, color: '#444' }}>
          {localizedText.title}
        </Box>
        {' · '}
        <Box component="span" sx={{ color: '#888' }}>
          {localizedText.content}
        </Box>
      </Typography>

      {/* 通知数量指示（多条时显示） */}
      {notifications.length > 1 && (
        <Box
          sx={{
            px: 1,
            py: 0.25,
            borderRadius: 1,
            bgcolor: 'rgba(0,0,0,0.04)',
            fontSize: '0.7rem',
            color: '#888',
            flexShrink: 0,
          }}
        >
          {currentIndex + 1}/{notifications.length}
        </Box>
      )}
    </Box>
  );
};

export default NotificationBar;
