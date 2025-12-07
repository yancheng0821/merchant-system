import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab, useMediaQuery, useTheme as useMuiTheme } from '@mui/material';
import {
  People as PeopleIcon,
  Security as SecurityIcon,
  Assignment as AuditIcon,
  AdminPanelSettings as RoleIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import UserRoleManagement from './UserRoleManagement';
import RoleManagement from './RoleManagement';
import RolePermissionManagement from './RolePermissionManagement';
import AuditLogs from './AuditLogs';
import { usePermission } from '../../hooks/usePermission';
import { useTheme } from '../../contexts/ThemeContext';
import { useFeature } from '../../contexts/FeatureContext';

type TabType = 'users' | 'roles' | 'permissions' | 'audit';

const RBACManagement: React.FC = () => {
  const { t } = useTranslation();
  const { isSuperAdmin, hasPermission } = usePermission();
  const { themeMode } = useTheme();
  const { hasFeature } = useFeature();
  const muiTheme = useMuiTheme();

  // 移动端检测
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  // 检查审计日志功能是否锁定
  const isAuditLogLocked = !hasFeature('auditLog');

  // 根据主题模式动态设置主题色
  const isMonochrome = themeMode === 'monochrome';
  const THEME_COLOR = isMonochrome ? '#1a1a1a' : '#6366F1';

  // 计算可见的 tabs
  const visibleTabs: TabType[] = [];
  if (hasPermission('users:view')) visibleTabs.push('users');
  if (hasPermission('rbac:view_roles')) visibleTabs.push('roles');
  if (isSuperAdmin()) visibleTabs.push('permissions');
  if (hasPermission('audit:view')) visibleTabs.push('audit');

  // 设置默认活动标签为第一个可见的标签
  const [activeTab, setActiveTab] = useState<TabType>(visibleTabs[0] || 'users');

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(visibleTabs[newValue]);
  };

  return (
    <Box>
      {/* 现代化页面标题 - 匹配其他模块风格 */}
      <Box mb={isMobile ? 2 : 4}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography
              variant={isMobile ? 'h6' : 'h5'}
              component="h1"
              sx={{
                fontWeight: 600,
                color: THEME_COLOR,
                mb: 0.5,
                fontSize: isMobile ? '1.1rem' : undefined,
              }}
            >
              {t('rbac.title')}
            </Typography>
            {!isMobile && (
              <Typography variant="body2" sx={{ color: '#888' }}>
                {t('rbac.subtitle')}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Tab 导航 */}
      <Box mb={isMobile ? 2 : 3}>
        <Tabs
          value={visibleTabs.indexOf(activeTab)}
          onChange={handleTabChange}
          variant={isMobile ? 'scrollable' : 'standard'}
          scrollButtons={isMobile ? 'auto' : false}
          allowScrollButtonsMobile
          sx={{
            borderBottom: '2px solid',
            borderColor: 'divider',
            '& .MuiTab-root': {
              fontWeight: 500,
              fontSize: isMobile ? '0.8rem' : '0.9rem',
              textTransform: 'none',
              minHeight: isMobile ? 44 : 56,
              minWidth: isMobile ? 'auto' : undefined,
              px: isMobile ? 1.5 : 2,
              '&.Mui-selected': {
                fontWeight: 600,
                color: THEME_COLOR,
              },
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
              backgroundColor: THEME_COLOR,
            },
          }}
        >
          {/* 用户管理 Tab */}
          {hasPermission('users:view') && (
            <Tab
              icon={<PeopleIcon sx={{ fontSize: isMobile ? 18 : 24 }} />}
              iconPosition="start"
              label={isMobile ? t('rbac.users') : t('rbac.userManagement')}
            />
          )}
          {/* 角色管理 Tab */}
          {hasPermission('rbac:view_roles') && (
            <Tab
              icon={<RoleIcon sx={{ fontSize: isMobile ? 18 : 24 }} />}
              iconPosition="start"
              label={isMobile ? t('rbac.roles') : t('rbac.roleManagement')}
            />
          )}
          {/* 只有超级管理员才能看到权限管理 Tab */}
          {isSuperAdmin() && (
            <Tab
              icon={<SecurityIcon sx={{ fontSize: isMobile ? 18 : 24 }} />}
              iconPosition="start"
              label={isMobile ? t('rbac.permissions') : t('rbac.rolePermissionManagement')}
            />
          )}
          {/* 店长和超管都能查看审计日志 */}
          {hasPermission('audit:view') && (
            <Tab
              icon={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AuditIcon sx={{ fontSize: isMobile ? 18 : 24, color: isAuditLogLocked ? '#bbb' : 'inherit' }} />
                  {isAuditLogLocked && <LockIcon sx={{ fontSize: 12, color: '#bbb' }} />}
                </Box>
              }
              iconPosition="start"
              label={isMobile ? t('rbac.audit') : t('rbac.auditLogs')}
              sx={isAuditLogLocked ? { color: '#999 !important' } : {}}
            />
          )}
        </Tabs>
      </Box>

      {/* Tab 内容 */}
      {activeTab === 'users' && hasPermission('users:view') && <UserRoleManagement />}
      {activeTab === 'roles' && hasPermission('rbac:view_roles') && <RoleManagement />}
      {activeTab === 'permissions' && isSuperAdmin() && <RolePermissionManagement />}
      {activeTab === 'audit' && hasPermission('audit:view') && <AuditLogs />}
    </Box>
  );
};

export default RBACManagement;
