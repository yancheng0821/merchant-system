import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { usePermission } from '../../hooks/usePermission';
import CertificateManagement from './components/CertificateManagement';
import FixedCostManagement from './components/FixedCostManagement';
import MaterialPurchaseManagement from './components/MaterialPurchaseManagement';

const CostManagement: React.FC = () => {
  const { t } = useTranslation();
  const { hasPermission } = usePermission();
  const [tabValue, setTabValue] = useState(0);

  // 定义所有tabs及其对应的权限
  const allTabsConfig = [
    {
      key: 'certificates',
      label: t('costs.tabs.certificates'),
      permission: 'costs:view_certificates' as const,
      showCondition: true,
    },
    {
      key: 'fixedCosts',
      label: t('costs.tabs.fixedCosts'),
      permission: 'costs:view_fixed_costs' as const,
      showCondition: true,
    },
    {
      key: 'materials',
      label: t('costs.tabs.materials'),
      permission: 'costs:view_materials' as const,
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
              variant="h5"
              component="h1"
              sx={{
                fontWeight: 600,
                color: '#DC2626',
                mb: 0.5,
              }}
            >
              {t('costs.title')}
            </Typography>
            <Typography variant="body2" sx={{ color: '#888' }}>
              {t('costs.subtitle')}
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
                color: '#DC2626',
              },
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
              backgroundColor: '#DC2626',
            },
          }}
        >
          {tabsConfig.map((tab, index) => (
            <Tab key={index} label={tab.label} />
          ))}
        </Tabs>
      </Box>

      {/* Tab 内容 */}
      {currentTabKey === 'certificates' && <CertificateManagement />}
      {currentTabKey === 'fixedCosts' && <FixedCostManagement />}
      {currentTabKey === 'materials' && <MaterialPurchaseManagement />}
    </Box>
  );
};

export default CostManagement;
