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
  FormControlLabel,
  Checkbox,
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
  Public,
  LocationCity as CityIcon,
  Payment as PaymentIcon,
  Group as GroupIcon,
  MeetingRoom as RoomIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxBlankIcon,
  Receipt as ReceiptIcon,
  LocalPostOffice as PostCodeIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTax } from '../../contexts/TaxContext';
import { useSession } from '../../contexts/SessionContext';
import { usePermission } from '../../hooks/usePermission';
import { merchantConfigApi } from '../../services/api';
import StripeConnectTab from './StripeConnectTab';
import BillingTab from './BillingTab';
import { COUNTRIES, getProvincesByCountry } from '../../data/countries';

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
  country: string;
  province: string;
  city: string;
  postCode: string;
  timezone: string;
}

interface TaxSettings {
  gstRate: number;
  pstRate: number;
}

interface SystemSettings {
  sessionTimeout: number;
}

interface SettingsProps {
  initialTab?: string | null;
}

const Settings: React.FC<SettingsProps> = ({ initialTab: propInitialTab }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { refreshTaxSettings } = useTax();
  const { updateSessionTimeout } = useSession();
  const { hasPermission } = usePermission();
  const location = useLocation();

  // 权限过滤后的tabs配置
  const allTabsConfig = [
    {
      key: 'basic',
      label: t('settings.tabs.basic'),
      icon: <BusinessIcon />,
      color: '#6366F1',
      permission: 'settings:update_merchant' as const,
    },
    {
      key: 'tax',
      label: t('settings.tabs.tax'),
      icon: <TaxIcon />,
      color: '#F59E0B',
      permission: 'settings:update_tax' as const,
    },
    {
      key: 'system',
      label: t('settings.tabs.system'),
      icon: <TuneIcon />,
      color: '#8B5CF6',
      permission: 'settings:update_system' as const,
    },
    {
      key: 'billing',
      label: t('settings.tabs.billing'),
      icon: <ReceiptIcon />,
      color: '#10B981',
      permission: 'billing:view' as const,
    },
    // {
    //   key: 'payment',
    //   label: t('settings.tabs.payment'),
    //   icon: <PaymentIcon />,
    //   color: '#10B981',
    //   permission: 'settings:manage_stripe' as const,
    // },
  ];

  const tabsConfig = allTabsConfig.filter(tab => hasPermission(tab.permission));

  // 初始化selectedTab - 在useState初始化时就读取localStorage，避免闪烁
  const [selectedTab, setSelectedTab] = useState(() => {
    // 如果从prop传入了tab（如Stripe回调）
    if (propInitialTab === 'payment' || propInitialTab === 'stripe') {
      const filteredTabs = allTabsConfig.filter(tab => hasPermission(tab.permission));
      const paymentTabIndex = filteredTabs.findIndex(tab => tab.key === 'payment');
      return paymentTabIndex >= 0 ? paymentTabIndex : 0;
    }

    // 检查localStorage中保存的tab
    const savedTabKey = localStorage.getItem('settingsSelectedTab');
    if (savedTabKey) {
      const filteredTabs = allTabsConfig.filter(tab => hasPermission(tab.permission));
      const savedTabIndex = filteredTabs.findIndex(tab => tab.key === savedTabKey);
      if (savedTabIndex >= 0) {
        return savedTabIndex;
      }
    }

    // 兼容旧的settingsTab key (payment专用)
    const settingsTab = localStorage.getItem('settingsTab');
    if (settingsTab === 'payment' || settingsTab === 'stripe') {
      const filteredTabs = allTabsConfig.filter(tab => hasPermission(tab.permission));
      const paymentTabIndex = filteredTabs.findIndex(tab => tab.key === 'payment');
      if (paymentTabIndex >= 0) {
        localStorage.removeItem('settingsTab');
        return paymentTabIndex;
      }
    }

    return 0;
  });

  // 主题色
  const primaryColor = '#6366F1';

  // 统一的输入框样式
  const inputFieldStyles = {
    '& .MuiOutlinedInput-root': {
      '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: primaryColor,
      },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: primaryColor,
      },
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: primaryColor,
    },
  };
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [merchantInfo, setMerchantInfo] = useState<MerchantInfo>({
    merchantName: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    address: '',
    country: '',
    province: '',
    city: '',
    postCode: '',
    timezone: 'Asia/Shanghai'
  });

  const [taxSettings, setTaxSettings] = useState<TaxSettings>({
    gstRate: 13,
    pstRate: 0
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    sessionTimeout: 30
  });

  // 资源类型配置
  const [resourceTypes, setResourceTypes] = useState<string[]>(['STAFF']);

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
    // 保存选中的tab到localStorage
    const tabKey = tabsConfig[newValue]?.key;
    if (tabKey) {
      localStorage.setItem('settingsSelectedTab', tabKey);
    }
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
            country: merchantResponse.country || '',
            province: merchantResponse.province || '',
            city: merchantResponse.city || '',
            postCode: merchantResponse.postCode || '',
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

          // 解析资源类型配置
          const resourceTypesConfig = configResponse.find((config: any) => config.configKey === 'resource_types');
          if (resourceTypesConfig && resourceTypesConfig.configValue) {
            try {
              const types = JSON.parse(resourceTypesConfig.configValue);
              if (Array.isArray(types)) {
                setResourceTypes(types);
              }
            } catch (e) {
              console.error('Failed to parse resource types:', e);
              setResourceTypes(['STAFF']);
            }
          } else {
            setResourceTypes(['STAFF']);
          }
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

    // 检查商户名称是否必填
    if (!merchantInfo.merchantName || !merchantInfo.merchantName.trim()) {
      setNotification({
        open: true,
        message: t('settings.errors.merchantNameRequired'),
        severity: 'error'
      });
      return;
    }

    // 检查国家和省份是否必填
    if (!merchantInfo.country || !merchantInfo.country.trim()) {
      setNotification({
        open: true,
        message: t('settings.errors.countryRequired'),
        severity: 'error'
      });
      return;
    }

    if (!merchantInfo.province || !merchantInfo.province.trim()) {
      setNotification({
        open: true,
        message: t('settings.errors.provinceRequired'),
        severity: 'error'
      });
      return;
    }

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

      // 更新 localStorage 中的 timezone
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        userData.timezone = merchantInfo.timezone;
        localStorage.setItem('user', JSON.stringify(userData));
      }

      // 保存税务设置
      await merchantConfigApi.updateConfig(user.tenantId, 'gst_rate', finalGstRate.toString(), 'GST/HST税率');
      await merchantConfigApi.updateConfig(user.tenantId, 'pst_rate', finalPstRate.toString(), 'PST税率');

      // 保存系统设置
      await merchantConfigApi.updateConfig(user.tenantId, 'session_timeout', systemSettings.sessionTimeout.toString(), '会话超时时间(分钟)');

      // 保存资源类型配置
      await merchantConfigApi.updateConfig(user.tenantId, 'resource_types', JSON.stringify(resourceTypes), '资源类型配置');

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

  // 获取当前选中tab的key
  const currentTabKey = tabsConfig[selectedTab]?.key;

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
        {currentTabKey === 'basic' && (
        <Fade in={currentTabKey === 'basic'} timeout={300}>
          <Box sx={{ p: 3 }}>
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
                          required
                          sx={{
                            ...inputFieldStyles,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: primaryColor,
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: primaryColor,
                              },
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
                            ...inputFieldStyles,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: primaryColor,
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: primaryColor,
                              },
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth sx={inputFieldStyles} required>
                          <InputLabel required>{t('settings.country')}</InputLabel>
                          <Select
                            value={merchantInfo.country}
                            onChange={(e) => {
                              const newCountry = e.target.value;
                              handleMerchantInfoChange('country', newCountry);
                              // 清空省份，因为国家变了
                              if (newCountry !== merchantInfo.country) {
                                handleMerchantInfoChange('province', '');
                              }
                            }}
                            label={t('settings.country')}
                            required
                            startAdornment={
                              <InputAdornment position="start">
                                <Public sx={{ color: 'text.secondary', fontSize: 20, ml: 1 }} />
                              </InputAdornment>
                            }
                            sx={{
                              borderRadius: 2,
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: primaryColor,
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: primaryColor,
                              },
                            }}
                          >
                            {COUNTRIES.map((country) => (
                              <MenuItem key={country.value} value={country.value}>
                                {i18n.language.startsWith('zh') ? country.labelZh : country.labelEn}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        {merchantInfo.country && getProvincesByCountry(merchantInfo.country).length === 0 ? (
                          // 如果选择的国家没有预定义的省份列表（如"Other"），显示自由输入框
                          <TextField
                            fullWidth
                            label={t('settings.province')}
                            variant="outlined"
                            value={merchantInfo.province}
                            onChange={(e) => handleMerchantInfoChange('province', e.target.value)}
                            placeholder={t('auth.merchantRegisterPage.merchantInfo.provinceFreeFill')}
                            required
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <ProvinceIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                </InputAdornment>
                              ),
                            }}
                            sx={{
                              ...inputFieldStyles,
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: primaryColor,
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                  borderColor: primaryColor,
                                },
                              },
                            }}
                          />
                        ) : (
                          // 如果有预定义的省份列表，显示下拉框
                          <FormControl fullWidth sx={inputFieldStyles} required>
                            <InputLabel required>{t('settings.province')}</InputLabel>
                            <Select
                              value={merchantInfo.province}
                              onChange={(e) => handleMerchantInfoChange('province', e.target.value)}
                              label={t('settings.province')}
                              disabled={!merchantInfo.country}
                              required
                              startAdornment={
                                <InputAdornment position="start">
                                  <ProvinceIcon sx={{ color: 'text.secondary', fontSize: 20, ml: 1 }} />
                                </InputAdornment>
                              }
                              sx={{
                                borderRadius: 2,
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: primaryColor,
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                  borderColor: primaryColor,
                                },
                              }}
                            >
                              {!merchantInfo.country ? (
                                <MenuItem value="">{t('settings.selectCountryFirst')}</MenuItem>
                              ) : (
                                getProvincesByCountry(merchantInfo.country).map((province) => (
                                  <MenuItem key={province.value} value={province.value}>
                                    {i18n.language.startsWith('zh') ? province.labelZh : province.labelEn}
                                  </MenuItem>
                                ))
                              )}
                            </Select>
                          </FormControl>
                        )}
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
                            ...inputFieldStyles,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: primaryColor,
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: primaryColor,
                              },
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label={t('settings.postCode')}
                          variant="outlined"
                          value={merchantInfo.postCode}
                          onChange={(e) => handleMerchantInfoChange('postCode', e.target.value)}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <PostCodeIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            ...inputFieldStyles,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: primaryColor,
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: primaryColor,
                              },
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
                            ...inputFieldStyles,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: primaryColor,
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: primaryColor,
                              },
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
                            ...inputFieldStyles,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: primaryColor,
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: primaryColor,
                              },
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
                            ...inputFieldStyles,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: primaryColor,
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: primaryColor,
                              },
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
                        {t('settings.businessOperations')}
                      </Typography>
                    </Box>

                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'text.secondary' }}>
                            {t('settings.resourceTypes.title')}
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'block', mb: 2, color: 'text.secondary' }}>
                            {t('settings.resourceTypes.description')}
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={resourceTypes.includes('STAFF')}
                                  disabled
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setResourceTypes(prev => [...prev.filter(t => t !== 'STAFF'), 'STAFF']);
                                    } else {
                                      // 至少要有一个资源类型
                                      if (resourceTypes.length > 1) {
                                        setResourceTypes(prev => prev.filter(t => t !== 'STAFF'));
                                      }
                                    }
                                  }}
                                  icon={<CheckBoxBlankIcon />}
                                  checkedIcon={<CheckBoxIcon />}
                                  sx={{
                                    color: '#10B981',
                                    '&.Mui-checked': {
                                      color: '#10B981',
                                    },
                                  }}
                                />
                              }
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <GroupIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                  <Typography variant="body2">{t('settings.resourceTypes.staff')}</Typography>
                                </Box>
                              }
                            />
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={resourceTypes.includes('ROOM')}
                                  disabled
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setResourceTypes(prev => [...prev.filter(t => t !== 'ROOM'), 'ROOM']);
                                    } else {
                                      // 至少要有一个资源类型
                                      if (resourceTypes.length > 1) {
                                        setResourceTypes(prev => prev.filter(t => t !== 'ROOM'));
                                      }
                                    }
                                  }}
                                  icon={<CheckBoxBlankIcon />}
                                  checkedIcon={<CheckBoxIcon />}
                                  sx={{
                                    color: '#10B981',
                                    '&.Mui-checked': {
                                      color: '#10B981',
                                    },
                                  }}
                                />
                              }
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <RoomIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                  <Typography variant="body2">{t('settings.resourceTypes.room')}</Typography>
                                </Box>
                              }
                            />
                          </Box>
                          {resourceTypes.length === 0 && (
                            <Typography variant="caption" sx={{ color: 'error.main', mt: 1, display: 'block' }}>
                              {t('settings.resourceTypes.atLeastOne')}
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                      
                      {/* 预留空间给营业时间配置 */}
                      <Grid item xs={12}>
                        <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2, mt: 1 }}>
                          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                            {t('settings.moreSettingsComingSoon')}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
          </Box>
        </Fade>
        )}

        {/* 税务设置 */}
        {currentTabKey === 'tax' && (
        <Fade in={currentTabKey === 'tax'} timeout={300}>
          <Box sx={{ p: 3 }}>
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
                          ...inputFieldStyles,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: primaryColor,
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: primaryColor,
                            },
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
                          ...inputFieldStyles,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: primaryColor,
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: primaryColor,
                            },
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          </Box>
        </Fade>
        )}

        {/* 系统设置 */}
        {currentTabKey === 'system' && (
        <Fade in={currentTabKey === 'system'} timeout={300}>
          <Box sx={{ p: 3 }}>
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
                      {t('settings.systemPrefs')}
                    </Typography>
                  </Box>

                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <FormControl fullWidth sx={inputFieldStyles}>
                        <InputLabel>{t('settings.timezone')}</InputLabel>
                        <Select
                          value={merchantInfo.timezone}
                          onChange={(e) => handleMerchantInfoChange('timezone', e.target.value)}
                          label={t('settings.timezone')}
                          sx={{
                            borderRadius: 2,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: primaryColor,
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: primaryColor,
                            },
                          }}
                        >
                          {/* 加拿大时区（从东到西） */}
                          <MenuItem value="America/St_Johns">{t('settings.timezones.america_st_johns')}</MenuItem>
                          <MenuItem value="America/Halifax">{t('settings.timezones.america_halifax')}</MenuItem>
                          <MenuItem value="America/Toronto">{t('settings.timezones.america_toronto')}</MenuItem>
                          <MenuItem value="America/Winnipeg">{t('settings.timezones.america_winnipeg')}</MenuItem>
                          <MenuItem value="America/Edmonton">{t('settings.timezones.america_edmonton')}</MenuItem>
                          <MenuItem value="America/Vancouver">{t('settings.timezones.america_vancouver')}</MenuItem>

                          {/* 美国主要时区 */}
                          <MenuItem value="America/New_York">{t('settings.timezones.america_new_york')}</MenuItem>
                          <MenuItem value="America/Chicago">{t('settings.timezones.america_chicago')}</MenuItem>
                          <MenuItem value="America/Denver">{t('settings.timezones.america_denver')}</MenuItem>
                          <MenuItem value="America/Los_Angeles">{t('settings.timezones.america_los_angeles')}</MenuItem>
                          <MenuItem value="America/Phoenix">{t('settings.timezones.america_phoenix')}</MenuItem>
                          <MenuItem value="America/Anchorage">{t('settings.timezones.america_anchorage')}</MenuItem>
                          <MenuItem value="Pacific/Honolulu">{t('settings.timezones.pacific_honolulu')}</MenuItem>

                          {/* 欧洲主要时区 */}
                          <MenuItem value="Europe/London">{t('settings.timezones.europe_london')}</MenuItem>
                          <MenuItem value="Europe/Paris">{t('settings.timezones.europe_paris')}</MenuItem>
                          <MenuItem value="Europe/Berlin">{t('settings.timezones.europe_berlin')}</MenuItem>
                          <MenuItem value="Europe/Rome">{t('settings.timezones.europe_rome')}</MenuItem>
                          <MenuItem value="Europe/Madrid">{t('settings.timezones.europe_madrid')}</MenuItem>
                          <MenuItem value="Europe/Amsterdam">{t('settings.timezones.europe_amsterdam')}</MenuItem>
                          <MenuItem value="Europe/Moscow">{t('settings.timezones.europe_moscow')}</MenuItem>

                          {/* 亚洲主要时区 */}
                          <MenuItem value="Asia/Dubai">{t('settings.timezones.asia_dubai')}</MenuItem>
                          <MenuItem value="Asia/Karachi">{t('settings.timezones.asia_karachi')}</MenuItem>
                          <MenuItem value="Asia/Kolkata">{t('settings.timezones.asia_kolkata')}</MenuItem>
                          <MenuItem value="Asia/Dhaka">{t('settings.timezones.asia_dhaka')}</MenuItem>
                          <MenuItem value="Asia/Bangkok">{t('settings.timezones.asia_bangkok')}</MenuItem>
                          <MenuItem value="Asia/Singapore">{t('settings.timezones.asia_singapore')}</MenuItem>
                          <MenuItem value="Asia/Hong_Kong">{t('settings.timezones.asia_hong_kong')}</MenuItem>
                          <MenuItem value="Asia/Shanghai">{t('settings.timezones.asia_shanghai')}</MenuItem>
                          <MenuItem value="Asia/Tokyo">{t('settings.timezones.asia_tokyo')}</MenuItem>
                          <MenuItem value="Asia/Seoul">{t('settings.timezones.asia_seoul')}</MenuItem>

                          {/* 澳大利亚和太平洋时区 */}
                          <MenuItem value="Australia/Sydney">{t('settings.timezones.australia_sydney')}</MenuItem>
                          <MenuItem value="Australia/Melbourne">{t('settings.timezones.australia_melbourne')}</MenuItem>
                          <MenuItem value="Australia/Brisbane">{t('settings.timezones.australia_brisbane')}</MenuItem>
                          <MenuItem value="Australia/Perth">{t('settings.timezones.australia_perth')}</MenuItem>
                          <MenuItem value="Pacific/Auckland">{t('settings.timezones.pacific_auckland')}</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

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
                          ...inputFieldStyles,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: primaryColor,
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: primaryColor,
                            },
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          </Box>
        </Fade>
        )}

        {/* Billing Tab */}
        {currentTabKey === 'billing' && (
        <Fade in={currentTabKey === 'billing'} timeout={300}>
          <Box sx={{ p: 3 }}>
            <BillingTab />
          </Box>
        </Fade>
        )}

        {/* Payment Settings - Stripe Connect */}
        {/* {currentTabKey === 'payment' && (
        <Fade in={currentTabKey === 'payment'} timeout={300}>
          <Box sx={{ p: 3 }}>
            <StripeConnectTab />
          </Box>
        </Fade>
        )} */}
      </Card>

      {/* 保存按钮 - 仅在非支付设置页和非账单页显示 */}
      {currentTabKey !== 'payment' && currentTabKey !== 'billing' && (
      <Box mt={4} display="flex" justifyContent="flex-end">
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          onClick={handleSaveSettings}
          disabled={saving}
          sx={{
            px: 3,
            py: 1,
            textTransform: 'none',
            fontWeight: 500,
            borderRadius: 2,
            backgroundColor: '#6366f1',
            '&:hover': {
              backgroundColor: '#4f46e5',
            },
            '&:disabled': {
              backgroundColor: '#e5e7eb',
              color: '#9ca3af',
            },
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
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{
            width: '100%',
            borderRadius: 2,
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings; 