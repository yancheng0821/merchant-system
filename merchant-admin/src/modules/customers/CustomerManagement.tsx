import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { usePermission } from '../../hooks/usePermission';
import Customers from './Customers';
import MembershipTiers from './MembershipTiers';

const CustomerManagement: React.FC = () => {
  const { t } = useTranslation();
  const { hasPermission } = usePermission();
  const [tabValue, setTabValue] = useState(0);

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
    <Box>
      {/* 现代化页面标题 */}
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(45deg, #DB2777, #EC4899)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
              }}
            >
              {t('customers.title')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('customers.subtitle')}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Tab 导航 */}
      <Box mb={3}>
        <Tabs
          value={tabValue}
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
                color: '#EC4899',
              },
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
              backgroundColor: '#EC4899',
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
