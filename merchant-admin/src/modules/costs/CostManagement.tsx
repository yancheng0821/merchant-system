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
import { useFeature } from '../../contexts/FeatureContext';
import { UpgradePrompt } from '../../components/common/UpgradePrompt';
import CertificateManagement from './components/CertificateManagement';
import FixedCostManagement from './components/FixedCostManagement';
import MaterialPurchaseManagement from './components/MaterialPurchaseManagement';

const CostManagement: React.FC = () => {
  const { t } = useTranslation();
  const { hasPermission } = usePermission();
  const { themeMode } = useTheme();
  const { hasModule } = useFeature();
  const muiTheme = useMuiTheme();
  const [tabValue, setTabValue] = useState(0);

  // 检查是否有成本管理模块访问权限
  const isCostsLocked = !hasModule('costs');

  // 移动端检测
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  // 如果成本管理模块被锁定，显示升级提示
  if (isCostsLocked) {
    return (
      <Box sx={{ maxWidth: 500, mx: 'auto', mt: 4 }}>
        <UpgradePrompt
          feature="costs"
          featureNameKey="upgrade.features.costs"
          requiredPlan="ELITE"
          variant="card"
        />
      </Box>
    );
  }

  // 根据主题模式动态设置主题色
  const isMonochrome = themeMode === 'monochrome';
  const THEME_COLOR = isMonochrome ? '#1a1a1a' : '#DC2626';

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
              {t('costs.title')}
            </Typography>
            {!isMobile && (
              <Typography variant="body2" sx={{ color: '#888' }}>
                {t('costs.subtitle')}
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
      {currentTabKey === 'certificates' && <CertificateManagement />}
      {currentTabKey === 'fixedCosts' && <FixedCostManagement />}
      {currentTabKey === 'materials' && <MaterialPurchaseManagement />}
    </Box>
  );
};

export default CostManagement;
