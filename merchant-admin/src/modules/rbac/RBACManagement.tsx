import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab } from '@mui/material';
import {
  People as PeopleIcon,
  Security as SecurityIcon,
  Assignment as AuditIcon,
  AdminPanelSettings as RoleIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import UserRoleManagement from './UserRoleManagement';
import RoleManagement from './RoleManagement';
import RolePermissionManagement from './RolePermissionManagement';
import AuditLogs from './AuditLogs';
import { usePermission } from '../../hooks/usePermission';

type TabType = 'users' | 'roles' | 'permissions' | 'audit';

const RBACManagement: React.FC = () => {
  const { t } = useTranslation();
  const { isSuperAdmin, hasPermission } = usePermission();

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
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(45deg, #6366F1, #8B5CF6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
              }}
            >
              {t('rbac.title')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('rbac.subtitle')}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Tab 导航 */}
      <Box mb={3}>
        <Tabs
          value={visibleTabs.indexOf(activeTab)}
          onChange={handleTabChange}
          sx={{
            borderBottom: '2px solid',
            borderColor: 'divider',
            '& .MuiTab-root': {
              fontWeight: 500,
              fontSize: '0.9rem',
              textTransform: 'none',
              minHeight: 56,
              '&.Mui-selected': {
                fontWeight: 600,
                color: '#6366F1',
              },
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
              backgroundColor: '#6366F1',
            },
          }}
        >
          {/* 用户管理 Tab */}
          {hasPermission('users:view') && (
            <Tab
              icon={<PeopleIcon />}
              iconPosition="start"
              label={t('rbac.userManagement')}
            />
          )}
          {/* 角色管理 Tab */}
          {hasPermission('rbac:view_roles') && (
            <Tab
              icon={<RoleIcon />}
              iconPosition="start"
              label={t('rbac.roleManagement')}
            />
          )}
          {/* 只有超级管理员才能看到权限管理 Tab */}
          {isSuperAdmin() && (
            <Tab
              icon={<SecurityIcon />}
              iconPosition="start"
              label={t('rbac.rolePermissionManagement')}
            />
          )}
          {/* 店长和超管都能查看审计日志 */}
          {hasPermission('audit:view') && (
            <Tab
              icon={<AuditIcon />}
              iconPosition="start"
              label={t('rbac.auditLogs')}
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
