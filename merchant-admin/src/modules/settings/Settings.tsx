import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Typography,
  Box,
  Grid,
  Tabs,
  Tab,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Card,
  CardContent,
  alpha,
  CircularProgress,
  Alert,
  Snackbar,
  Fade,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Receipt as TaxIcon,
  Tune as TuneIcon,
  Save as SaveIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Public as ProvinceIcon,
  LocationCity as CityIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTax } from '../../contexts/TaxContext';
import { useSession } from '../../contexts/SessionContext';
import { merchantConfigApi } from '../../services/api';
import StripeConnectTab from './StripeConnectTab';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && (
        <Fade in={value === index} timeout={300}>
          <Box sx={{ p: 3 }}>{children}</Box>
        </Fade>
      )}
    </div>
  );
};

interface MerchantInfo {
  id?: number;
  tenantId?: number;
  merchantName: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  province: string;
  city: string;
  timezone: string;
}

interface TaxSettings {
  gstRate: number;
  pstRate: number;
}

interface SystemSettings {
  sessionTimeout: number;
}

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { refreshTaxSettings } = useTax();
  const { updateSessionTimeout } = useSession();
  const location = useLocation();
  
  // 初始化时立即读取 localStorage，避免闪烁
  const initialTab = (() => {
    const settingsTab = localStorage.getItem('settingsTab');
    if (settingsTab === 'payment' || settingsTab === 'stripe') {
      return 3; // 支付设置是第4个tab (index 3)
    }
    return 0;
  })();
  
  const [selectedTab, setSelectedTab] = useState(initialTab);
  
  // 组件挂载后清理 localStorage
  useEffect(() => {
    const settingsTab = localStorage.getItem('settingsTab');
    if (settingsTab === 'payment' || settingsTab === 'stripe') {
      localStorage.removeItem('settingsTab');
    }
  }, []);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [merchantInfo, setMerchantInfo] = useState<MerchantInfo>({
    merchantName: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    address: '',
    province: '',
    city: '',
    timezone: 'Asia/Shanghai'
  });

  const [taxSettings, setTaxSettings] = useState<TaxSettings>({
    gstRate: 13,
    pstRate: 0
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    sessionTimeout: 30
  });

  // 输入框显示值状态（用于处理空值显示）
  const [sessionTimeoutDisplay, setSessionTimeoutDisplay] = useState<string>('');
  const [gstRateDisplay, setGstRateDisplay] = useState<string>('');
  const [pstRateDisplay, setPstRateDisplay] = useState<string>('');

  // 输入验证状态
  const [taxErrors, setTaxErrors] = useState<{
    gstRate?: string;
    pstRate?: string;
  }>({});

  const [sessionError, setSessionError] = useState<string>('');

  // 提示信息状态
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  // 获取商户配置信息
  useEffect(() => {
    const fetchSettings = async () => {
      if (!user?.tenantId) return;

      setLoading(true);
      try {
        // 获取商户基础信息
        const merchantResponse = await merchantConfigApi.getMerchantBasicInfo(user.tenantId);
        if (merchantResponse) {
          setMerchantInfo({
            id: merchantResponse.id,
            tenantId: merchantResponse.tenantId,
            merchantName: merchantResponse.merchantName || '',
            contactPerson: merchantResponse.contactPerson || '',
            contactPhone: merchantResponse.contactPhone || '',
            contactEmail: merchantResponse.contactEmail || '',
            address: merchantResponse.address || '',
            province: merchantResponse.province || '',
            city: merchantResponse.city || '',
            timezone: merchantResponse.timezone || 'Asia/Shanghai'
          });
        }

        // 获取所有配置项
        const configResponse = await merchantConfigApi.getAllConfigs(user.tenantId);
        if (configResponse && Array.isArray(configResponse)) {
          // 解析税务设置
          const gstConfig = configResponse.find((config: any) => config.configKey === 'gst_rate');
          const pstConfig = configResponse.find((config: any) => config.configKey === 'pst_rate');

          const gstRateValue = gstConfig ? parseFloat(gstConfig.configValue) : 13;
          const pstRateValue = pstConfig ? parseFloat(pstConfig.configValue) : 0;

          setTaxSettings({
            gstRate: gstRateValue,
            pstRate: pstRateValue
          });

          setGstRateDisplay(gstRateValue.toString());
          setPstRateDisplay(pstRateValue.toString());

          // 解析系统设置
          const sessionConfig = configResponse.find((config: any) => config.configKey === 'session_timeout');
          const sessionTimeoutValue = sessionConfig ? parseInt(sessionConfig.configValue) : 30;
          setSystemSettings({
            sessionTimeout: sessionTimeoutValue
          });
          setSessionTimeoutDisplay(sessionTimeoutValue.toString());
        }
      } catch (error) {
        console.error('获取设置信息失败:', error);
        setNotification({
          open: true,
          message: t('settings.errors.loadFailed'),
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user?.tenantId]);


  const handleMerchantInfoChange = (field: keyof MerchantInfo, value: string) => {
    setMerchantInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTaxSettingsChange = (field: keyof TaxSettings, value: string) => {
    // 更新显示值
    if (field === 'gstRate') {
      setGstRateDisplay(value);
    } else if (field === 'pstRate') {
      setPstRateDisplay(value);
    }

    // 清除之前的错误
    setTaxErrors(prev => ({
      ...prev,
      [field]: undefined
    }));

    // 如果输入为空，不更新实际值，但允许显示为空
    if (value === '') {
      return;
    }

    const numValue = parseFloat(value);

    // 验证是否为有效数字
    if (isNaN(numValue)) {
      setTaxErrors(prev => ({
        ...prev,
        [field]: t('settings.errors.invalidNumber')
      }));
      return;
    }

    // 验证范围
    if (numValue < 0 || numValue > 20) {
      setTaxErrors(prev => ({
        ...prev,
        [field]: t('settings.errors.taxRateRange')
      }));
      return;
    }

    // 更新实际值
    setTaxSettings(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const handleSystemSettingsChange = (field: keyof SystemSettings, value: string) => {
    // 更新显示值
    setSessionTimeoutDisplay(value);

    // 清除之前的错误
    setSessionError('');

    // 如果输入为空，不更新实际值，但允许显示为空
    if (value === '') {
      return;
    }

    const numValue = parseInt(value);

    // 验证是否为有效数字
    if (isNaN(numValue)) {
      setSessionError(t('settings.errors.invalidNumber'));
      return;
    }

    // 验证范围
    if (numValue < 5 || numValue > 480) {
      setSessionError(t('settings.errors.sessionTimeoutRange'));
      return;
    }

    // 更新实际值
    setSystemSettings(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const handleSaveSettings = async () => {
    if (!user?.tenantId) return;

    // 检查是否有验证错误
    if (Object.values(taxErrors).some(error => error) || sessionError) {
      setNotification({
        open: true,
        message: t('settings.errors.validationFailed'),
        severity: 'error'
      });
      return;
    }

    // 检查会话超时是否为有效值
    if (sessionTimeoutDisplay === '' || systemSettings.sessionTimeout < 5 || systemSettings.sessionTimeout > 480) {
      setNotification({
        open: true,
        message: t('settings.errors.sessionTimeoutRequired'),
        severity: 'error'
      });
      return;
    }

    // 检查税率是否为有效值（如果显示为空，使用0）
    const finalGstRate = gstRateDisplay === '' ? 0 : taxSettings.gstRate;
    const finalPstRate = pstRateDisplay === '' ? 0 : taxSettings.pstRate;

    setSaving(true);
    try {
      // 保存商户基础信息
      await merchantConfigApi.updateMerchantBasicInfo(user.tenantId, merchantInfo);

      // 保存税务设置
      await merchantConfigApi.updateConfig(user.tenantId, 'gst_rate', finalGstRate.toString(), 'GST/HST税率');
      await merchantConfigApi.updateConfig(user.tenantId, 'pst_rate', finalPstRate.toString(), 'PST税率');

      // 保存系统设置
      await merchantConfigApi.updateConfig(user.tenantId, 'session_timeout', systemSettings.sessionTimeout.toString(), '会话超时时间(分钟)');

      // 刷新Context中的设置
      await refreshTaxSettings();
      updateSessionTimeout(systemSettings.sessionTimeout);

      setNotification({
        open: true,
        message: t('settings.settingsSaved'),
        severity: 'success'
      });
    } catch (error) {
      console.error('保存设置失败:', error);
      setNotification({
        open: true,
        message: t('settings.saveFailed'),
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const tabsConfig = [
    { label: t('settings.tabs.basic'), icon: <BusinessIcon />, color: '#6366F1' },
    { label: t('settings.tabs.tax'), icon: <TaxIcon />, color: '#F59E0B' },
    { label: t('settings.tabs.system'), icon: <TuneIcon />, color: '#8B5CF6' },
    { label: t('settings.tabs.payment'), icon: <PaymentIcon />, color: '#10B981' },
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
          minHeight: '600px', // 设置最小高度避免内容跳动
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
                transition: 'background-color 0.3s ease, color 0.3s ease',
                '&:hover': {
                  backgroundColor: alpha('#6366F1', 0.08),
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
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <CircularProgress />
            </Box>
          ) : (
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
                          value={merchantInfo.merchantName}
                          onChange={(e) => handleMerchantInfoChange('merchantName', e.target.value)}
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
                          value={merchantInfo.address}
                          onChange={(e) => handleMerchantInfoChange('address', e.target.value)}
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
                        <FormControl fullWidth>
                          <InputLabel>{t('settings.province')}</InputLabel>
                          <Select
                            value={merchantInfo.province}
                            onChange={(e) => handleMerchantInfoChange('province', e.target.value)}
                            label={t('settings.province')}
                            startAdornment={
                              <InputAdornment position="start">
                                <ProvinceIcon sx={{ color: 'text.secondary', fontSize: 20, ml: 1 }} />
                              </InputAdornment>
                            }
                            sx={{
                              borderRadius: 2,
                            }}
                          >
                            <MenuItem value="Alberta">{t('settings.provinces.Alberta')}</MenuItem>
                            <MenuItem value="British Columbia">{t('settings.provinces.British Columbia')}</MenuItem>
                            <MenuItem value="Manitoba">{t('settings.provinces.Manitoba')}</MenuItem>
                            <MenuItem value="New Brunswick">{t('settings.provinces.New Brunswick')}</MenuItem>
                            <MenuItem value="Newfoundland and Labrador">{t('settings.provinces.Newfoundland and Labrador')}</MenuItem>
                            <MenuItem value="Northwest Territories">{t('settings.provinces.Northwest Territories')}</MenuItem>
                            <MenuItem value="Nova Scotia">{t('settings.provinces.Nova Scotia')}</MenuItem>
                            <MenuItem value="Nunavut">{t('settings.provinces.Nunavut')}</MenuItem>
                            <MenuItem value="Ontario">{t('settings.provinces.Ontario')}</MenuItem>
                            <MenuItem value="Prince Edward Island">{t('settings.provinces.Prince Edward Island')}</MenuItem>
                            <MenuItem value="Quebec">{t('settings.provinces.Quebec')}</MenuItem>
                            <MenuItem value="Saskatchewan">{t('settings.provinces.Saskatchewan')}</MenuItem>
                            <MenuItem value="Yukon">{t('settings.provinces.Yukon')}</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label={t('settings.city')}
                          variant="outlined"
                          value={merchantInfo.city}
                          onChange={(e) => handleMerchantInfoChange('city', e.target.value)}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <CityIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
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
                          value={merchantInfo.contactPhone}
                          onChange={(e) => handleMerchantInfoChange('contactPhone', e.target.value)}
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
                          label={t('settings.contactPerson')}
                          variant="outlined"
                          value={merchantInfo.contactPerson}
                          onChange={(e) => handleMerchantInfoChange('contactPerson', e.target.value)}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <PersonIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
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
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label={t('settings.contactEmail')}
                          variant="outlined"
                          value={merchantInfo.contactEmail}
                          onChange={(e) => handleMerchantInfoChange('contactEmail', e.target.value)}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <EmailIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
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
                          <InputLabel>{t('settings.timezone')}</InputLabel>
                          <Select
                            value={merchantInfo.timezone}
                            onChange={(e) => handleMerchantInfoChange('timezone', e.target.value)}
                            label={t('settings.timezone')}
                            sx={{
                              borderRadius: 2,
                            }}
                          >
                            <MenuItem value="Asia/Shanghai">{t('settings.timezones.beijing')}</MenuItem>
                            <MenuItem value="America/New_York">{t('settings.timezones.newYork')}</MenuItem>
                            <MenuItem value="America/Vancouver">{t('settings.timezones.vancouver')}</MenuItem>
                            <MenuItem value="America/Toronto">{t('settings.timezones.toronto')}</MenuItem>
                            <MenuItem value="Europe/London">{t('settings.timezones.london')}</MenuItem>
                            <MenuItem value="Asia/Tokyo">{t('settings.timezones.tokyo')}</MenuItem>
                            <MenuItem value="Australia/Sydney">{t('settings.timezones.sydney')}</MenuItem>
                            <MenuItem value="Europe/Paris">{t('settings.timezones.paris')}</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        {/* 税务设置 */}
        <TabPanel value={selectedTab} index={1}>
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
                        value={gstRateDisplay}
                        onChange={(e) => handleTaxSettingsChange('gstRate', e.target.value)}
                        error={!!taxErrors.gstRate}
                        helperText={taxErrors.gstRate || t('settings.taxRateHelp')}
                        inputProps={{
                          min: 0,
                          max: 20,
                          step: 0.1,
                          inputMode: 'decimal'
                        }}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <Typography variant="body2" color="text.secondary">
                                %
                              </Typography>
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
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label={t('settings.pstRate')}
                        variant="outlined"
                        value={pstRateDisplay}
                        onChange={(e) => handleTaxSettingsChange('pstRate', e.target.value)}
                        error={!!taxErrors.pstRate}
                        helperText={taxErrors.pstRate || t('settings.taxRateHelp')}
                        inputProps={{
                          min: 0,
                          max: 20,
                          step: 0.1,
                          inputMode: 'decimal'
                        }}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <Typography variant="body2" color="text.secondary">
                                %
                              </Typography>
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
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>



        {/* 系统设置 */}
        <TabPanel value={selectedTab} index={2}>
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
                      <TextField
                        fullWidth
                        label={t('settings.sessionTimeout')}
                        variant="outlined"
                        value={sessionTimeoutDisplay}
                        onChange={(e) => handleSystemSettingsChange('sessionTimeout', e.target.value)}
                        error={!!sessionError}
                        helperText={sessionError || t('settings.sessionTimeoutHelp')}
                        inputProps={{
                          min: 5,
                          max: 480,
                          step: 1,
                          inputMode: 'numeric'
                        }}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <Typography variant="body2" color="text.secondary">
                                {t('settings.minutes')}
                              </Typography>
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
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Payment Settings - Stripe Connect */}
        <TabPanel value={selectedTab} index={3}>
          <StripeConnectTab />
        </TabPanel>
      </Card>

      {/* 现代化保存按钮 - 仅在非支付设置页显示 */}
      {selectedTab !== 3 && (
      <Box mt={4} display="flex" justifyContent="flex-end">
        <Button
          variant="contained"
          size="large"
          startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          onClick={handleSaveSettings}
          disabled={saving}
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
            '&:disabled': {
              background: 'linear-gradient(135deg, #9CA3AF, #6B7280)',
              transform: 'none',
              boxShadow: 'none',
            },
            transition: 'all 0.3s ease',
          }}
        >
          {saving ? t('settings.saving') : t('settings.saveSettings')}
        </Button>
      </Box>
      )}

      {/* 美化的通知提示 */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant="filled"
          sx={{
            borderRadius: 2,
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            '& .MuiAlert-icon': {
              fontSize: '1.2rem',
            },
            '& .MuiAlert-message': {
              fontSize: '0.9rem',
              fontWeight: 500,
            },
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings; 