import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  IconButton,
  CircularProgress,
  alpha,
  useMediaQuery,
  useTheme as useMuiTheme,
  Tabs,
  Tab,
  Collapse,
} from '@mui/material';
import {
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  MarkEmailRead as MarkReadIcon,
  Refresh as RefreshIcon,
  DoneAll as DoneAllIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Campaign as SystemIcon,
  Storefront as BusinessIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { businessNotificationApi } from '../services/api';
import { formatUtcToMerchantTime } from '../utils/timezoneUtils';
import { Capacitor } from '@capacitor/core';
import { pushNotificationService } from '../services/pushNotification';

const isNativeApp = Capacitor.isNativePlatform();

interface BusinessNotification {
  id: number;
  tenantId: number;
  notificationType: string;
  title: string;
  titleEn?: string;
  titleZh?: string;
  content: string;
  contentEn?: string;
  contentZh?: string;
  level: string;
  isRead: boolean;
  createdAt: string;
}

type DateGroup = 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'earlier';

const NotificationCenter: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { themeMode } = useTheme();
  const { lastMessage, setUnreadNotificationCount } = useWebSocket();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  // 主题颜色
  const isMonochrome = themeMode === 'monochrome';
  const THEME_COLOR = isMonochrome ? '#1a1a1a' : '#6366F1';

  const [notifications, setNotifications] = useState<BusinessNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [activeTab, setActiveTab] = useState(0); // 0: 全部, 1: 系统, 2: 业务
  const [collapsedGroups, setCollapsedGroups] = useState<Set<DateGroup>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const pageSize = 50;

  // 系统通知类型
  const isSystemNotification = (n: BusinessNotification) => n.notificationType === 'SYSTEM_NOTIFICATION';

  const fetchNotifications = useCallback(async (reset = false) => {
    if (!user?.tenantId) return;

    try {
      if (reset) {
        setLoading(true);
        setPage(0);
      } else {
        setRefreshing(true);
      }

      const limit = (reset ? 1 : page + 1) * pageSize;
      const data = await businessNotificationApi.getRecentNotifications(user.tenantId, limit);

      setNotifications(data || []);
      setHasMore(data?.length >= limit);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.tenantId, page]);

  useEffect(() => {
    fetchNotifications(true);
  }, [user?.tenantId]);

  // 监听WebSocket消息，自动刷新通知列表
  useEffect(() => {
    if (lastMessage &&
        (lastMessage.type === 'NEW_APPOINTMENT' ||
         lastMessage.type === 'APPOINTMENT_CANCELLED' ||
         lastMessage.type === 'SYSTEM_NOTIFICATION' ||
         lastMessage.type === 'NOTIFICATION_UPDATE')) {
      console.log('[NotificationCenter] New notification received, refreshing...');
      fetchNotifications(true);
    }
  }, [lastMessage]);

  // 同步未读数到WebSocket context（当通知加载完成时）
  useEffect(() => {
    const totalUnread = notifications.filter(n => !n.isRead).length;
    setUnreadNotificationCount(totalUnread);
  }, [notifications, setUnreadNotificationCount]);

  const handleRefresh = () => {
    fetchNotifications(true);
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
    fetchNotifications();
  };

  const handleMarkAsRead = async (notificationId: number) => {
    if (!user?.tenantId) return;

    try {
      await businessNotificationApi.markAsRead(user.tenantId, [notificationId]);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );

      // 如果标记后没有未读消息了，清除 App Icon Badge
      const remainingUnread = notifications.filter(n => !n.isRead && n.id !== notificationId).length;
      if (remainingUnread === 0) {
        pushNotificationService.clearBadge();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.tenantId) return;

    const unreadIds = filteredNotifications.filter(n => !n.isRead).map(n => n.id);
    if (unreadIds.length === 0) return;

    try {
      await businessNotificationApi.markAsRead(user.tenantId, unreadIds);
      setNotifications(prev =>
        prev.map(n => unreadIds.includes(n.id) ? { ...n, isRead: true } : n)
      );

      // 如果标记全部已读后没有未读消息了，清除 App Icon Badge
      const remainingUnread = notifications.filter(n => !n.isRead && !unreadIds.includes(n.id)).length;
      if (remainingUnread === 0) {
        pushNotificationService.clearBadge();
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const toggleGroupCollapse = (group: DateGroup) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  };

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getLocalizedText = (notification: BusinessNotification) => {
    const isZh = i18n.language === 'zh' || i18n.language === 'zh-CN';
    return {
      title: isZh ? (notification.titleZh || notification.title) : (notification.titleEn || notification.title),
      content: isZh ? (notification.contentZh || notification.content) : (notification.contentEn || notification.content),
    };
  };

  const getLevelColor = (level: string) => {
    if (isMonochrome) {
      switch (level) {
        case 'WARNING': return '#666';
        case 'SUCCESS': return '#1a1a1a';
        case 'ERROR': return '#888';
        default: return '#1a1a1a';
      }
    }
    switch (level) {
      case 'WARNING': return '#F59E0B';
      case 'SUCCESS': return '#10B981';
      case 'ERROR': return '#EF4444';
      default: return '#6366F1';
    }
  };

  const getLevelIcon = (level: string) => {
    const color = getLevelColor(level);
    const iconSx = { fontSize: 14, color };
    switch (level) {
      case 'WARNING': return <WarningIcon sx={iconSx} />;
      case 'SUCCESS': return <CheckCircleIcon sx={iconSx} />;
      case 'ERROR': return <ErrorIcon sx={iconSx} />;
      default: return <InfoIcon sx={iconSx} />;
    }
  };

  // 日期分组
  const getDateGroup = (dateStr: string): DateGroup => {
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (date >= today) return 'today';
    if (date >= yesterday) return 'yesterday';
    if (date >= weekAgo) return 'thisWeek';
    if (date >= monthAgo) return 'thisMonth';
    return 'earlier';
  };

  const getGroupLabel = (group: DateGroup): string => {
    switch (group) {
      case 'today': return t('notifications.today', 'Today');
      case 'yesterday': return t('notifications.yesterday', 'Yesterday');
      case 'thisWeek': return t('notifications.thisWeek', 'This Week');
      case 'thisMonth': return t('notifications.thisMonth', 'This Month');
      case 'earlier': return t('notifications.earlier', 'Earlier');
    }
  };

  // 过滤通知
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (activeTab === 0) return true;
      if (activeTab === 1) return isSystemNotification(n);
      return !isSystemNotification(n);
    });
  }, [notifications, activeTab]);

  // 按日期分组
  const groupedNotifications = useMemo(() => {
    const groups: Record<DateGroup, BusinessNotification[]> = {
      today: [],
      yesterday: [],
      thisWeek: [],
      thisMonth: [],
      earlier: [],
    };

    filteredNotifications.forEach(n => {
      const group = getDateGroup(n.createdAt);
      groups[group].push(n);
    });

    return groups;
  }, [filteredNotifications]);

  const unreadCount = filteredNotifications.filter(n => !n.isRead).length;
  const systemUnread = notifications.filter(n => isSystemNotification(n) && !n.isRead).length;
  const businessUnread = notifications.filter(n => !isSystemNotification(n) && !n.isRead).length;

  const dateGroups: DateGroup[] = ['today', 'yesterday', 'thisWeek', 'thisMonth', 'earlier'];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress size={28} sx={{ color: THEME_COLOR }} />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: isNativeApp ? 10 : 2, px: isMobile ? 1 : 0 }}>
      {/* 分类标签和操作按钮在同一行 */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            minHeight: 36,
          '& .MuiTabs-indicator': { bgcolor: THEME_COLOR, height: 2 },
          '& .MuiTab-root': {
            minHeight: 36,
            py: 0.5,
            px: 1.5,
            fontSize: '0.8rem',
            fontWeight: 500,
            textTransform: 'none',
            color: '#666',
            '&.Mui-selected': { color: THEME_COLOR },
          },
        }}
      >
        <Tab
          label={
            <Box display="flex" alignItems="center" gap={0.5}>
              {t('common.all', 'All')}
              {notifications.filter(n => !n.isRead).length > 0 && (
                <Box sx={{
                  px: 0.5, py: 0.1, borderRadius: 0.5,
                  bgcolor: isMonochrome ? '#1a1a1a' : '#EF4444',
                  color: '#fff', fontSize: '0.65rem', fontWeight: 600,
                  minWidth: 16, textAlign: 'center',
                }}>
                  {notifications.filter(n => !n.isRead).length}
                </Box>
              )}
            </Box>
          }
        />
        <Tab
          icon={<SystemIcon sx={{ fontSize: 16, mr: 0.5 }} />}
          iconPosition="start"
          label={
            <Box display="flex" alignItems="center" gap={0.5}>
              {t('notifications.system', 'System')}
              {systemUnread > 0 && (
                <Box sx={{
                  px: 0.5, py: 0.1, borderRadius: 0.5,
                  bgcolor: isMonochrome ? '#1a1a1a' : '#6366F1',
                  color: '#fff', fontSize: '0.65rem', fontWeight: 600,
                  minWidth: 16, textAlign: 'center',
                }}>
                  {systemUnread}
                </Box>
              )}
            </Box>
          }
        />
        <Tab
          icon={<BusinessIcon sx={{ fontSize: 16, mr: 0.5 }} />}
          iconPosition="start"
          label={
            <Box display="flex" alignItems="center" gap={0.5}>
              {t('notifications.business', 'Business')}
              {businessUnread > 0 && (
                <Box sx={{
                  px: 0.5, py: 0.1, borderRadius: 0.5,
                  bgcolor: isMonochrome ? '#1a1a1a' : '#10B981',
                  color: '#fff', fontSize: '0.65rem', fontWeight: 600,
                  minWidth: 16, textAlign: 'center',
                }}>
                  {businessUnread}
                </Box>
              )}
            </Box>
          }
        />
        </Tabs>

        {/* 操作按钮 */}
        <Box display="flex" gap={0.5}>
          {unreadCount > 0 && (
            <IconButton size="small" onClick={handleMarkAllAsRead} sx={{ color: THEME_COLOR }}>
              <DoneAllIcon sx={{ fontSize: 18 }} />
            </IconButton>
          )}
          <IconButton size="small" onClick={handleRefresh} disabled={refreshing} sx={{ color: '#999' }}>
            {refreshing ? <CircularProgress size={16} /> : <RefreshIcon sx={{ fontSize: 18 }} />}
          </IconButton>
        </Box>
      </Box>

      {/* 通知列表 - 按日期分组 */}
      {filteredNotifications.length === 0 ? (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <InfoIcon sx={{ fontSize: 40, color: isMonochrome ? '#ccc' : '#ddd', mb: 1 }} />
          <Typography color="text.secondary" sx={{ fontSize: '0.85rem' }}>
            {t('notifications.noNotifications', 'No notifications')}
          </Typography>
        </Box>
      ) : (
        <Box>
          {dateGroups.map(group => {
            const groupNotifications = groupedNotifications[group];
            if (groupNotifications.length === 0) return null;

            const isCollapsed = collapsedGroups.has(group);
            const groupUnread = groupNotifications.filter(n => !n.isRead).length;

            return (
              <Box key={group} sx={{ mb: 2 }}>
                {/* 分组标题 */}
                <Box
                  onClick={() => toggleGroupCollapse(group)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    py: 1,
                    px: 0.5,
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                    userSelect: 'none',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
                    borderRadius: 1,
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#999', textTransform: 'uppercase' }}>
                      {getGroupLabel(group)}
                    </Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: '#bbb' }}>
                      ({groupNotifications.length})
                    </Typography>
                    {groupUnread > 0 && (
                      <Box sx={{
                        px: 0.5, py: 0.1, borderRadius: 0.5,
                        bgcolor: isMonochrome ? '#1a1a1a' : '#EF4444',
                        color: '#fff', fontSize: '0.6rem', fontWeight: 600,
                      }}>
                        {groupUnread} {t('notifications.unread', 'unread')}
                      </Box>
                    )}
                  </Box>
                  {isCollapsed ? (
                    <ExpandMoreIcon sx={{ fontSize: 18, color: '#bbb' }} />
                  ) : (
                    <ExpandLessIcon sx={{ fontSize: 18, color: '#bbb' }} />
                  )}
                </Box>

                {/* 分组内容 */}
                <Collapse in={!isCollapsed}>
                  <Box sx={{ bgcolor: '#fff', borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)' }}>
                    {groupNotifications.map((notification, index) => {
                      const localizedText = getLocalizedText(notification);
                      const levelColor = getLevelColor(notification.level);
                      const isSystem = isSystemNotification(notification);
                      const isExpanded = expandedIds.has(notification.id);

                      return (
                        <Box
                          key={notification.id}
                          onClick={() => toggleExpand(notification.id)}
                          sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 1.5,
                            px: 2,
                            py: 1.5,
                            borderBottom: index < groupNotifications.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                            bgcolor: notification.isRead ? 'transparent' : alpha(levelColor, 0.03),
                            WebkitTapHighlightColor: 'transparent',
                            cursor: 'pointer',
                            '&:hover': { bgcolor: alpha(levelColor, 0.05) },
                          }}
                        >
                          {/* 图标 */}
                          <Box
                            sx={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: alpha(levelColor, 0.1),
                              flexShrink: 0,
                              mt: 0.25,
                            }}
                          >
                            {getLevelIcon(notification.level)}
                          </Box>

                          {/* 内容 */}
                          <Box flex={1} minWidth={0}>
                            <Box display="flex" alignItems="center" gap={0.5} mb={0.25}>
                              {isSystem && (
                                <Box
                                  sx={{
                                    px: 0.5,
                                    py: 0.1,
                                    borderRadius: 0.5,
                                    bgcolor: isMonochrome ? '#f0f0f0' : alpha('#6366F1', 0.1),
                                    color: isMonochrome ? '#666' : '#6366F1',
                                    fontSize: '0.55rem',
                                    fontWeight: 600,
                                  }}
                                >
                                  {t('notifications.system', 'System')}
                                </Box>
                              )}
                              <Typography sx={{ fontSize: '0.7rem', color: '#aaa' }}>
                                {formatUtcToMerchantTime(notification.createdAt, 'HH:mm')}
                              </Typography>
                            </Box>
                            <Typography
                              sx={{
                                fontSize: '0.8rem',
                                fontWeight: notification.isRead ? 400 : 600,
                                color: '#1a1a1a',
                                mb: 0.5,
                              }}
                            >
                              {localizedText.title}
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: '0.75rem',
                                color: '#888',
                                lineHeight: 1.5,
                                whiteSpace: isExpanded ? 'pre-wrap' : 'normal',
                                ...(!isExpanded && {
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }),
                              }}
                            >
                              {localizedText.content}
                            </Typography>
                            {!isExpanded && localizedText.content.length > 80 && (
                              <Typography sx={{ fontSize: '0.7rem', color: THEME_COLOR, mt: 0.5 }}>
                                {t('common.viewMore', 'View more')}
                              </Typography>
                            )}
                          </Box>

                          {/* 标记已读按钮 */}
                          {!notification.isRead && (
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.id);
                              }}
                              sx={{
                                color: '#ccc',
                                p: 0.5,
                                flexShrink: 0,
                                WebkitTapHighlightColor: 'transparent',
                                '&:hover': { color: THEME_COLOR },
                              }}
                            >
                              <MarkReadIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                </Collapse>
              </Box>
            );
          })}
        </Box>
      )}

      {/* 加载更多 */}
      {hasMore && filteredNotifications.length > 0 && (
        <Box
          onClick={handleLoadMore}
          sx={{
            mt: 2,
            py: 1.5,
            textAlign: 'center',
            cursor: 'pointer',
            color: '#666',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.5,
            WebkitTapHighlightColor: 'transparent',
            '&:hover': { color: THEME_COLOR },
          }}
        >
          {refreshing ? (
            <CircularProgress size={14} sx={{ color: THEME_COLOR }} />
          ) : (
            <ExpandMoreIcon sx={{ fontSize: 18 }} />
          )}
          {t('common.loadMore', 'Load More')}
        </Box>
      )}
    </Box>
  );
};

export default NotificationCenter;
