import React, { useState } from 'react';
import {
  Typography,
  Box,
  Grid,
  Tabs,
  Tab,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Avatar,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Card,
  CardContent,
  alpha,
} from '@mui/material';
import {
  Business as BusinessIcon,
  People as PeopleIcon,
  Receipt as TaxIcon,
  Notifications as NotificationIcon,
  Tune as TuneIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Save as SaveIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState(0);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleSaveSettings = () => {
    alert(t('settings.settingsSaved'));
  };

  const tabsConfig = [
      { label: t('settings.tabs.basic'), icon: <BusinessIcon />, color: '#6366F1' },
  { label: t('settings.tabs.staff'), icon: <PeopleIcon />, color: '#10B981' },
  { label: t('settings.tabs.tax'), icon: <TaxIcon />, color: '#F59E0B' },
  { label: t('settings.tabs.notifications'), icon: <NotificationIcon />, color: '#EC4899' },
  { label: t('settings.tabs.system'), icon: <TuneIcon />, color: '#8B5CF6' },
  ];

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
                background: 'linear-gradient(45deg, #4F46E5, #6366F1)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
              }}
            >
              {t('settings.title')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('settings.subtitle')}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* 现代化选项卡容器 */}
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }}
      >
        {/* 美化的标签栏 */}
        <Box sx={{ 
          borderBottom: 1, 
          borderColor: 'divider', 
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.02), rgba(139, 92, 246, 0.02))',
        }}>
          <Tabs 
            value={selectedTab} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                minWidth: 120,
                fontWeight: 500,
                textTransform: 'none',
                fontSize: '0.9rem',
                py: 2,
                px: 3,
                mx: 1,
                borderRadius: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: alpha('#6366F1', 0.08),
                  transform: 'translateY(-1px)',
                },
                '&.Mui-selected': {
                  fontWeight: 600,
                  backgroundColor: alpha('#6366F1', 0.1),
                  color: '#6366F1',
                },
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: 2,
                background: 'linear-gradient(90deg, #6366F1, #8B5CF6)',
              },
            }}
          >
            {tabsConfig.map((tab, index) => (
              <Tab 
                key={index}
                icon={React.cloneElement(tab.icon, { 
                  sx: { 
                    fontSize: 20,
                    color: selectedTab === index ? tab.color : 'text.secondary',
                    transition: 'color 0.3s ease',
                  } 
                })}
                iconPosition="start"
                label={tab.label}
              />
            ))}
          </Tabs>
        </Box>

        {/* 基础设置 */}
        <TabPanel value={selectedTab} index={0}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: alpha('#6366F1', 0.1),
                  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center" mb={3}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        mr: 2,
                      }}
                    >
                      <BusinessIcon sx={{ fontSize: 20 }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {t('settings.merchantInfo')}
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label={t('settings.merchantName')}
                        variant="outlined"
                        defaultValue="Beautiful Life Hair Salon"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label={t('settings.merchantAddress')}
                        variant="outlined"
                        defaultValue="123 Chaoyang District, Beijing"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LocationIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label={t('settings.contactPhone')}
                        variant="outlined"
                        defaultValue="010-12345678"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PhoneIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label={t('settings.businessHours')}
                        variant="outlined"
                        defaultValue="09:00-21:00"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: alpha('#10B981', 0.1),
                  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center" mb={3}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #10B981, #059669)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        mr: 2,
                      }}
                    >
                      <TuneIcon sx={{ fontSize: 20 }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {t('settings.systemPrefs')}
                    </Typography>
                  </Box>

                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>{t('settings.defaultLanguage')}</InputLabel>
                        <Select
                          defaultValue="zh-CN"
                          label={t('settings.defaultLanguage')}
                          sx={{
                            borderRadius: 2,
                          }}
                        >
                          <MenuItem value="zh-CN">{t('settings.chinese')}</MenuItem>
                          <MenuItem value="en-US">English</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>{t('settings.timezone')}</InputLabel>
                        <Select
                          defaultValue="Asia/Shanghai"
                          label={t('settings.timezone')}
                          sx={{
                            borderRadius: 2,
                          }}
                        >
                          <MenuItem value="Asia/Shanghai">{t('settings.timezones.beijing')}</MenuItem>
                          <MenuItem value="America/New_York">{t('settings.timezones.newYork')}</MenuItem>
                          <MenuItem value="Europe/London">{t('settings.timezones.london')}</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          backgroundColor: alpha('#10B981', 0.02),
                        }}
                      >
                        <FormControlLabel
                          control={<Switch defaultChecked color="success" />}
                          label={t('settings.autoBackup')}
                          sx={{ mb: 1 }}
                        />
                        <FormControlLabel
                          control={<Switch defaultChecked color="success" />}
                          label={t('settings.systemNotifications')}
                          sx={{ mb: 1 }}
                        />
                        <FormControlLabel
                          control={<Switch color="success" />}
                          label={t('settings.dataAnalytics')}
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* 员工管理 */}
        <TabPanel value={selectedTab} index={1}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {t('settings.staffList')}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{
                borderRadius: 2,
                background: 'linear-gradient(135deg, #10B981, #059669)',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #059669, #047857)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              {t('settings.addStaff')}
            </Button>
          </Box>

          <Card
            sx={{
              borderRadius: 2,
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            }}
          >
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('settings.tableHeaders.staff')}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('settings.tableHeaders.position')}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('settings.tableHeaders.contact')}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('settings.tableHeaders.status')}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('settings.tableHeaders.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[
                    { name: 'Master Li', role: 'Chief Hair Stylist', phone: '138-0000-0001', status: t('settings.staffStatus.active') },
                    { name: 'Miss Wang', role: 'Beautician', phone: '139-0000-0002', status: t('settings.staffStatus.active') },
                    { name: 'Mr. Zhang', role: 'Hair Washer', phone: '137-0000-0003', status: t('settings.staffStatus.vacation') },
                  ].map((staff, index) => (
                    <TableRow 
                      key={index}
                      sx={{
                        '&:hover': {
                          backgroundColor: alpha('#10B981', 0.04),
                        },
                      }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: '#10B981',
                            }}
                          >
                            {staff.name.charAt(0)}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {staff.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{staff.role}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{staff.phone}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={staff.status}
                          size="small"
                          sx={{
                            backgroundColor: staff.status === t('settings.staffStatus.active') ? alpha('#10B981', 0.1) : alpha('#F59E0B', 0.1),
                            color: staff.status === t('settings.staffStatus.active') ? '#10B981' : '#F59E0B',
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" sx={{ mr: 1 }}>
                          <EditIcon sx={{ fontSize: 16, color: '#6366F1' }} />
                        </IconButton>
                        <IconButton size="small">
                          <DeleteIcon sx={{ fontSize: 16, color: '#EF4444' }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </TabPanel>

        {/* 税务设置 */}
        <TabPanel value={selectedTab} index={2}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: alpha('#F59E0B', 0.1),
                  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center" mb={3}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        mr: 2,
                      }}
                    >
                      <TaxIcon sx={{ fontSize: 20 }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {t('settings.taxSettings')}
                    </Typography>
                  </Box>

                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label={t('settings.gstRate')}
                        variant="outlined"
                        defaultValue="13"
                        type="number"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label={t('settings.pstRate')}
                        variant="outlined"
                        defaultValue="0"
                        type="number"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          backgroundColor: alpha('#F59E0B', 0.05),
                          border: '1px solid',
                          borderColor: alpha('#F59E0B', 0.2),
                        }}
                      >
                        <FormControlLabel
                          control={<Switch defaultChecked sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#F59E0B' } }} />}
                          label={t('settings.autoCalculateTax')}
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* 通知设置 */}
        <TabPanel value={selectedTab} index={3}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: alpha('#EC4899', 0.1),
                  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center" mb={3}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #EC4899, #DB2777)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        mr: 2,
                      }}
                    >
                      <NotificationIcon sx={{ fontSize: 20 }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {t('settings.notificationPreferences')}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: alpha('#EC4899', 0.02),
                      border: '1px solid',
                      borderColor: alpha('#EC4899', 0.1),
                    }}
                  >
                    <FormControlLabel
                      control={<Switch defaultChecked sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#EC4899' } }} />}
                      label={
                        <Box display="flex" alignItems="center" gap={1}>
                          <EmailIcon sx={{ fontSize: 16, color: '#EC4899' }} />
                          <Typography>{t('settings.emailNotifications')}</Typography>
                        </Box>
                      }
                      sx={{ mb: 2, display: 'block' }}
                    />
                    <FormControlLabel
                      control={<Switch sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#EC4899' } }} />}
                      label={
                        <Box display="flex" alignItems="center" gap={1}>
                          <SmsIcon sx={{ fontSize: 16, color: '#EC4899' }} />
                          <Typography>{t('settings.smsNotifications')}</Typography>
                        </Box>
                      }
                      sx={{ mb: 2, display: 'block' }}
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#EC4899' } }} />}
                      label={t('settings.newAppointmentReminder')}
                      sx={{ display: 'block' }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* 系统设置 */}
        <TabPanel value={selectedTab} index={4}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: alpha('#8B5CF6', 0.1),
                  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center" mb={3}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        mr: 2,
                      }}
                    >
                      <TuneIcon sx={{ fontSize: 20 }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {t('settings.advancedSettings')}
                    </Typography>
                  </Box>

                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>{t('settings.backupFrequency')}</InputLabel>
                        <Select
                          defaultValue="daily"
                          label={t('settings.backupFrequency')}
                          sx={{ borderRadius: 2 }}
                        >
                          <MenuItem value="hourly">{t('settings.backupOptions.hourly')}</MenuItem>
                          <MenuItem value="daily">{t('settings.backupOptions.daily')}</MenuItem>
                          <MenuItem value="weekly">{t('settings.backupOptions.weekly')}</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label={t('settings.sessionTimeout')}
                        variant="outlined"
                        defaultValue="30"
                        type="number"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          backgroundColor: alpha('#8B5CF6', 0.05),
                          border: '1px solid',
                          borderColor: alpha('#8B5CF6', 0.2),
                        }}
                      >
                        <FormControlLabel
                          control={<Switch defaultChecked sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#8B5CF6' } }} />}
                          label={t('settings.debugMode')}
                          sx={{ mb: 1 }}
                        />
                        <FormControlLabel
                          control={<Switch sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#8B5CF6' } }} />}
                          label={t('settings.usageStatistics')}
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      {/* 现代化保存按钮 */}
      <Box mt={4} display="flex" justifyContent="flex-end">
        <Button
          variant="contained"
          size="large"
          startIcon={<SaveIcon />}
          onClick={handleSaveSettings}
          sx={{
            borderRadius: 3,
            px: 4,
            py: 1.5,
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)',
            fontSize: '1rem',
            fontWeight: 600,
            '&:hover': {
              background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 30px rgba(99, 102, 241, 0.4)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          {t('settings.saveSettings')}
        </Button>
      </Box>
    </Box>
  );
};

export default Settings; 