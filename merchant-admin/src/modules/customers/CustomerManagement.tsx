import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  useMediaQuery,
  useTheme as useMuiTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { usePermission } from '../../hooks/usePermission';
import { useTheme } from '../../contexts/ThemeContext';
import Customers from './Customers';
import MembershipTiers from './MembershipTiers';

const CustomerManagement: React.FC = () => {
  const { t } = useTranslation();
  const { hasPermission } = usePermission();
  const { themeMode } = useTheme();
  const muiTheme = useMuiTheme();
  const [tabValue, setTabValue] = useState(0);

  // 移动端检测
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  // 根据主题模式动态设置主题色
  const isMonochrome = themeMode === 'monochrome';
  const THEME_COLOR = isMonochrome ? '#1a1a1a' : '#EC4899';

  // 定义所有tabs及其对应的权限
  const allTabsConfig = [
    {
      key: 'customers',
      label: t('nav.customerList'),
      permission: 'customers:view' as const,
      showCondition: true,
    },
    {
      key: 'tiers',
      label: t('nav.membershipTiers'),
      permission: 'membership_tiers:view' as const,
      showCondition: true,
    },
  ];

  // 根据权限和显示条件过滤tabs
  const tabsConfig = allTabsConfig.filter(tab => {
    if (!tab.showCondition) return false;
    if (tab.permission === null) return true;
    return hasPermission(tab.permission);
  });

  // 获取当前选中tab的key
  const currentTabKey = tabsConfig[tabValue]?.key;

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ overflowX: 'hidden', width: '100%' }}>
      {/* 页面标题 */}
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
              }}
            >
              {t('customers.title')}
            </Typography>
            {!isMobile && (
              <Typography variant="body2" sx={{ color: '#888' }}>
                {t('customers.subtitle')}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Tab 导航 */}
      <Box mb={isMobile ? 2 : 3}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant={isMobile ? 'fullWidth' : 'standard'}
          sx={{
            borderBottom: '2px solid',
            borderColor: 'divider',
            '& .MuiTab-root': {
              fontWeight: 500,
              fontSize: isMobile ? '0.8rem' : '0.9rem',
              textTransform: 'none',
              minHeight: isMobile ? 44 : 56,
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
          {tabsConfig.map((tab, index) => (
            <Tab key={index} label={tab.label} />
          ))}
        </Tabs>
      </Box>

      {/* Tab 内容 */}
      {currentTabKey === 'customers' && <Customers />}
      {currentTabKey === 'tiers' && <MembershipTiers />}
    </Box>
  );
};

export default CustomerManagement;
