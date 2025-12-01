import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Fade,
  useMediaQuery,
  useTheme as useMuiTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { usePermission } from '../../hooks/usePermission';
import { useTheme } from '../../contexts/ThemeContext';
import CustomerReminders from './CustomerReminders';
import ReminderHistory from './ReminderHistory';

const MarketingManagement: React.FC = () => {
  const { t } = useTranslation();
  const { hasPermission } = usePermission();
  const { themeMode } = useTheme();
  const muiTheme = useMuiTheme();
  const [tabValue, setTabValue] = useState(0);

  // 移动端检测
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  // 根据主题模式动态设置主题色
  const isMonochrome = themeMode === 'monochrome';
  const THEME_COLOR = isMonochrome ? '#1a1a1a' : '#059669';

  // 定义所有tabs及其对应的权限
  const allTabsConfig = [
    {
      key: 'rules',
      label: t('marketing.tabs.rules'),
      permission: 'marketing:view_rules' as const,
      showCondition: true,
    },
    {
      key: 'history',
      label: t('marketing.tabs.history'),
      permission: 'marketing:view_logs' as const,
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
    <Box>
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
                fontSize: isMobile ? '1.1rem' : undefined,
              }}
            >
              {t('marketing.title')}
            </Typography>
            {!isMobile && (
              <Typography variant="body2" sx={{ color: '#888' }}>
                {t('marketing.subtitle')}
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
              py: isMobile ? 1 : 1.5,
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
      {currentTabKey === 'rules' && (
        <Fade in={currentTabKey === 'rules'} timeout={300}>
          <Box>
            <CustomerReminders />
          </Box>
        </Fade>
      )}
      {currentTabKey === 'history' && (
        <Fade in={currentTabKey === 'history'} timeout={300}>
          <Box>
            <ReminderHistory />
          </Box>
        </Fade>
      )}
    </Box>
  );
};

export default MarketingManagement;
