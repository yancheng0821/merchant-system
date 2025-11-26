import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Paper,
  Typography,
  Fade
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { usePermission } from '../../hooks/usePermission';
import { useAuth } from '../../contexts/AuthContext';
import NotificationTemplateManagement from './NotificationTemplateManagement';
import NotificationLogManagement from './NotificationLogManagement';
import SystemNotificationManagement from './SystemNotificationManagement';

const NotificationManagement: React.FC = () => {
  const { t } = useTranslation();
  const { hasPermission } = usePermission();
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);

  // 橙色主题色
  const themeColor = '#F97316';

  // 检查是否是超级管理员
  const isSuperAdmin = React.useMemo(() => {
    if (user?.username === 'super_admin') return true;

    // 检查 roles 字段（可能是字符串数组或对象数组）
    if (user?.roles && Array.isArray(user.roles)) {
      // 字符串数组格式
      if (user.roles.includes('SUPER_ADMIN')) return true;
      // 对象数组格式
      if (user.roles.some((role: any) =>
        typeof role === 'object' && (role.code === 'SUPER_ADMIN' || role.roleCode === 'SUPER_ADMIN')
      )) return true;
    }

    // 检查 permissions 对象中的 roles
    if (user?.permissions && typeof user.permissions === 'object' && 'roles' in user.permissions) {
      const perms = user.permissions as any;
      if (perms.isSuperAdmin) return true;
      if (perms.roles?.some((role: any) => role.roleCode === 'SUPER_ADMIN')) return true;
    }

    return false;
  }, [user]);

  // 定义所有tabs及其对应的权限
  const allTabsConfig = [
    {
      key: 'templates',
      label: t('notifications.templateManagement'),
      permission: 'notifications:manage_template' as const,
      showCondition: true,
    },
    {
      key: 'logs',
      label: t('notifications.notificationLogs'),
      permission: 'notifications:view_logs' as const,
      showCondition: true,
    },
    {
      key: 'system',
      label: t('notifications.systemNotifications'),
      permission: null,
      showCondition: isSuperAdmin,
    },
  ];

  // 根据权限和显示条件过滤tabs
  const tabsConfig = allTabsConfig.filter(tab => {
    if (!tab.showCondition) return false;
    if (tab.permission === null) return true; // 系统通知只需要 showCondition
    return hasPermission(tab.permission);
  });

  // 获取当前选中tab的key
  const currentTabKey = tabsConfig[tabValue]?.key;

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      {/* 现代化页面标题 */}
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography
              variant="h5"
              component="h1"
              sx={{
                fontWeight: 600,
                color: '#F97316',
                mb: 0.5,
              }}
            >
              {t('notifications.title')}
            </Typography>
            <Typography variant="body2" sx={{ color: '#888' }}>
              {t('nav.notifications')}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Paper
        sx={{
          mb: 3,
          borderRadius: 2.5,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}
      >
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            backgroundColor: '#f8fafc',
            '& .MuiTab-root': {
              color: 'text.secondary',
              fontWeight: 500,
              py: 2,
              '&.Mui-selected': {
                color: themeColor,
                fontWeight: 600,
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: themeColor,
              height: 3,
            }
          }}
        >
          {tabsConfig.map((tab, index) => (
            <Tab key={index} label={tab.label} />
          ))}
        </Tabs>
      </Paper>

      {/* Template Management */}
      {currentTabKey === 'templates' && (
        <Fade in={currentTabKey === 'templates'} timeout={300}>
          <Box>
            <NotificationTemplateManagement />
          </Box>
        </Fade>
      )}

      {/* Notification Logs */}
      {currentTabKey === 'logs' && (
        <Fade in={currentTabKey === 'logs'} timeout={300}>
          <Box>
            <NotificationLogManagement />
          </Box>
        </Fade>
      )}

      {/* System Notifications */}
      {currentTabKey === 'system' && (
        <Fade in={currentTabKey === 'system'} timeout={300}>
          <Box>
            <SystemNotificationManagement />
          </Box>
        </Fade>
      )}
    </Box>
  );
};

export default NotificationManagement;