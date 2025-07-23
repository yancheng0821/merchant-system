import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Paper,
  Typography
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import NotificationTemplateManagement from './NotificationTemplateManagement';
import NotificationLogManagement from './NotificationLogManagement';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`notification-tabpanel-${index}`}
      aria-labelledby={`notification-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const NotificationManagement: React.FC = () => {
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState(0);

  // 紫色主题色
  const themeColor = '#A855F7';

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
                background: 'linear-gradient(45deg, #A855F7, #8B5CF6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
              }}
            >
              {t('notifications.title')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('nav.notifications')}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Paper 
        sx={{ 
          mb: 3,
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
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
          <Tab label={t('notifications.templateManagement')} />
          <Tab label={t('notifications.notificationLogs')} />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        <NotificationTemplateManagement />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <NotificationLogManagement />
      </TabPanel>
    </Box>
  );
};

export default NotificationManagement;