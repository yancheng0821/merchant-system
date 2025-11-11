import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Collapse,
  alpha,
} from '@mui/material';
import {
  Campaign as CampaignIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
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
  const [expanded, setExpanded] = useState(true);

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
    if (!expanded || notifications.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = (prev + 1) % notifications.length;
        return nextIndex;
      });
    }, 8000); // 每8秒切换一次

    return () => clearInterval(timer);
  }, [notifications.length, expanded]);

  // 当通知列表变化时，重置索引以防越界
  useEffect(() => {
    if (currentIndex >= notifications.length && notifications.length > 0) {
      setCurrentIndex(0);
    }
  }, [notifications.length, currentIndex]);

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  if (notifications.length === 0) {
    return null;
  }

  const currentNotification = notifications[currentIndex];

  // 安全检查：如果当前通知不存在，不渲染
  if (!currentNotification) {
    return null;
  }

  const localizedText = getLocalizedText(currentNotification);

  // 根据通知级别获取颜色配置
  const getLevelColors = (level: string) => {
    switch (level) {
      case 'WARNING':
        return {
          primary: '#F59E0B', // 黄色
          light: 'rgba(245, 158, 11, 0.08)',
          medium: 'rgba(245, 158, 11, 0.04)',
          hover: 'rgba(245, 158, 11, 0.12)',
          hoverMedium: 'rgba(245, 158, 11, 0.06)',
        };
      case 'ERROR':
        return {
          primary: '#EF4444', // 红色
          light: 'rgba(239, 68, 68, 0.08)',
          medium: 'rgba(239, 68, 68, 0.04)',
          hover: 'rgba(239, 68, 68, 0.12)',
          hoverMedium: 'rgba(239, 68, 68, 0.06)',
        };
      case 'SUCCESS':
        return {
          primary: '#10B981', // 绿色
          light: 'rgba(16, 185, 129, 0.08)',
          medium: 'rgba(16, 185, 129, 0.04)',
          hover: 'rgba(16, 185, 129, 0.12)',
          hoverMedium: 'rgba(16, 185, 129, 0.06)',
        };
      case 'INFO':
      default:
        return {
          primary: '#6366F1', // 蓝紫色
          light: 'rgba(99, 102, 241, 0.08)',
          medium: 'rgba(99, 102, 241, 0.04)',
          hover: 'rgba(99, 102, 241, 0.12)',
          hoverMedium: 'rgba(99, 102, 241, 0.06)',
        };
    }
  };

  const colors = getLevelColors(currentNotification.level);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: expanded ? 2.5 : 0,
        py: expanded ? 0.5 : 0,
        background: expanded
          ? `linear-gradient(90deg, ${colors.light} 0%, ${colors.medium} 50%, transparent 100%)`
          : 'transparent',
        borderRadius: 2,
        maxWidth: expanded ? 'none' : 'auto',
        minWidth: expanded ? 'auto' : 'auto',
        width: expanded ? 'auto' : 'auto',
        height: 40,
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: expanded ? 'visible' : 'hidden',
        position: 'relative',
        cursor: expanded ? 'default' : 'pointer',
        '&:hover': {
          background: expanded
            ? `linear-gradient(90deg, ${colors.hover} 0%, ${colors.hoverMedium} 50%, transparent 100%)`
            : 'transparent',
        },
      }}
      onClick={!expanded ? handleToggle : undefined}
    >
      {/* 图标 - 始终显示 */}
      <IconButton
        size="small"
        onClick={expanded ? handleToggle : undefined}
        sx={{
          width: 32,
          height: 32,
          color: colors.primary,
          flexShrink: 0,
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: colors.light,
            transform: 'scale(1.1)',
          },
        }}
      >
        <CampaignIcon sx={{ fontSize: 20 }} />
      </IconButton>

      {/* 通知内容 - 展开时显示 */}
      {expanded && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            pr: 1,
            height: 32,
            ml: 1,
            overflow: 'hidden',
            animation: expanded ? 'slideIn 0.3s ease-out' : 'none',
            '@keyframes slideIn': {
              '0%': {
                opacity: 0,
                transform: 'translateX(-20px)',
              },
              '100%': {
                opacity: 1,
                transform: 'translateX(0)',
              },
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography
              variant="body2"
              component="span"
              sx={{
                fontWeight: 600,
                color: '#475569',
                fontSize: '0.8125rem',
                lineHeight: 1.6,
                whiteSpace: 'nowrap',
              }}
            >
              {localizedText.title}:
            </Typography>
            <Typography
              variant="body2"
              component="span"
              sx={{
                color: '#64748B',
                fontSize: '0.8125rem',
                lineHeight: 1.6,
              }}
            >
              {localizedText.content}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default NotificationBar;
