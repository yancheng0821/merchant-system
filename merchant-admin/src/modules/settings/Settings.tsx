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
  useMediaQuery,
  useTheme as useMuiTheme,
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
  Palette as PaletteIcon,
  ColorLens as ColorfulIcon,
  Contrast as MonochromeIcon,
  AccessTime as AccessTimeIcon,
  ContentCopy as CopyIcon,
  InfoOutlined,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format, parse } from 'date-fns';
import zhCNLocale from 'date-fns/locale/zh-CN';
import enUSLocale from 'date-fns/locale/en-US';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { useAuth } from '../../contexts/AuthContext';
import { useTax } from '../../contexts/TaxContext';
import { useSession } from '../../contexts/SessionContext';
import { usePermission } from '../../hooks/usePermission';
import { useTheme, ThemeMode } from '../../contexts/ThemeContext';
import { merchantConfigApi } from '../../services/api';
import StripeConnectTab from './StripeConnectTab';
import BillingTab from './BillingTab';
import OnlineBookingTab from './OnlineBookingTab';
import { COUNTRIES, getProvincesByCountry } from '../../data/countries';
import { CalendarMonth as OnlineBookingIcon } from '@mui/icons-material';

// 时间字符串转Date对象 (如 "09:00" -> Date)
const timeStringToDate = (timeStr: string): Date | null => {
  if (!timeStr) return null;
  try {
    return parse(timeStr, 'HH:mm', new Date());
  } catch {
    return null;
  }
};

// Date对象转时间字符串 (如 Date -> "09:00")
const dateToTimeString = (date: Date | null): string => {
  if (!date) return '';
  return format(date, 'HH:mm');
};

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

interface DaySchedule {
  start: string;
  end: string;
  closed: boolean;
}

interface BusinessHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

interface SettingsProps {
  initialTab?: string | null;
}

const Settings: React.FC<SettingsProps> = ({ initialTab: propInitialTab }) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'zh-CN' ? zhCNLocale : enUSLocale;
  const { user } = useAuth();
  const { refreshTaxSettings } = useTax();
  const { updateSessionTimeout } = useSession();
  const { hasPermission } = usePermission();
  const { themeMode, setThemeMode } = useTheme();
  const location = useLocation();
  const muiTheme = useMuiTheme();

  // 移动端检测
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

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
      key: 'operations',
      label: t('settings.tabs.operations'),
      icon: <TuneIcon />,
      color: '#F59E0B',
      permission: 'settings:update_operations' as const,
    },
    {
      key: 'system',
      label: t('settings.tabs.system'),
      icon: <PaletteIcon />,
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
    {
      key: 'onlineBooking',
      label: t('settings.tabs.onlineBooking'),
      icon: <OnlineBookingIcon />,
      color: '#3B82F6',
      permissions: ['settings:view_online_booking', 'settings:update_online_booking'] as const,
    },
    // {
    //   key: 'payment',
    //   label: t('settings.tabs.payment'),
    //   icon: <PaymentIcon />,
    //   color: '#10B981',
    //   permission: 'settings:manage_stripe' as const,
    // },
  ];

  const tabsConfig = allTabsConfig.filter(tab => {
    // 如果有 permissions 数组（多个权限），必须全部满足
    if ('permissions' in tab && tab.permissions) {
      return tab.permissions.every(p => hasPermission(p));
    }
    // 如果只有单个 permission
    if ('permission' in tab && tab.permission) {
      return hasPermission(tab.permission);
    }
    return true;
  });

  // 检查 tab 是否有权限的辅助函数
  const hasTabPermission = (tab: typeof allTabsConfig[0]) => {
    if ('permissions' in tab && tab.permissions) {
      return tab.permissions.every(p => hasPermission(p));
    }
    if ('permission' in tab && tab.permission) {
      return hasPermission(tab.permission);
    }
    return true;
  };

  // 初始化selectedTab - 在useState初始化时就读取localStorage，避免闪烁
  const [selectedTab, setSelectedTab] = useState(() => {
    // 优先检查URL参数（例如从UnpaidInvoiceAlert跳转过来）
    const searchParams = new URLSearchParams(location.search);
    const urlTab = searchParams.get('tab');
    if (urlTab) {
      const filteredTabs = allTabsConfig.filter(hasTabPermission);
      const urlTabIndex = filteredTabs.findIndex(tab => tab.key === urlTab);
      if (urlTabIndex >= 0) {
        return urlTabIndex;
      }
    }

    // 如果从prop传入了tab（如Stripe回调）
    if (propInitialTab === 'payment' || propInitialTab === 'stripe') {
      const filteredTabs = allTabsConfig.filter(hasTabPermission);
      const paymentTabIndex = filteredTabs.findIndex(tab => tab.key === 'payment');
      return paymentTabIndex >= 0 ? paymentTabIndex : 0;
    }

    // 检查localStorage中保存的tab
    const savedTabKey = localStorage.getItem('settingsSelectedTab');
    if (savedTabKey) {
      const filteredTabs = allTabsConfig.filter(hasTabPermission);
      const savedTabIndex = filteredTabs.findIndex(tab => tab.key === savedTabKey);
      if (savedTabIndex >= 0) {
        return savedTabIndex;
      }
    }

    // 兼容旧的settingsTab key (payment专用)
    const settingsTab = localStorage.getItem('settingsTab');
    if (settingsTab === 'payment' || settingsTab === 'stripe') {
      const filteredTabs = allTabsConfig.filter(hasTabPermission);
      const paymentTabIndex = filteredTabs.findIndex(tab => tab.key === 'payment');
      if (paymentTabIndex >= 0) {
        localStorage.removeItem('settingsTab');
        return paymentTabIndex;
      }
    }

    return 0;
  });

  // 主题色
  const primaryColor = '#1a1a1a';

  // 统一的输入框样式
  const inputFieldStyles = {
    '& .MuiOutlinedInput-root': {
      bgcolor: '#fff',
      '& fieldset': { borderColor: '#d0d0d0' },
      '&:hover fieldset': { borderColor: '#bbb' },
      '&.Mui-focused fieldset': { borderColor: '#1a1a1a', borderWidth: '1px' },
    },
    '& .MuiInputLabel-root': {
      color: '#999',
      '&.Mui-focused': { color: '#1a1a1a' },
    },
    '& .MuiInputLabel-asterisk': { display: 'none' },
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

  // 营业时间配置
  const defaultBusinessHours: BusinessHours = {
    monday: { start: '09:00', end: '18:00', closed: false },
    tuesday: { start: '09:00', end: '18:00', closed: false },
    wednesday: { start: '09:00', end: '18:00', closed: false },
    thursday: { start: '09:00', end: '18:00', closed: false },
    friday: { start: '09:00', end: '18:00', closed: false },
    saturday: { start: '10:00', end: '17:00', closed: false },
    sunday: { start: '10:00', end: '17:00', closed: true },
  };
  const [businessHours, setBusinessHours] = useState<BusinessHours>(defaultBusinessHours);
  const [isDefaultBusinessHours, setIsDefaultBusinessHours] = useState(true); // 是否使用默认营业时间

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

          // 解析营业时间配置
          const businessHoursConfig = configResponse.find((config: any) => config.configKey === 'business_hours');
          if (businessHoursConfig && businessHoursConfig.configValue) {
            try {
              const hours = JSON.parse(businessHoursConfig.configValue);
              if (hours && typeof hours === 'object') {
                setBusinessHours(hours);
                setIsDefaultBusinessHours(false); // 已从服务器加载配置
              }
            } catch (e) {
              console.error('Failed to parse business hours:', e);
            }
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

      // 保存营业时间配置
      await merchantConfigApi.updateConfig(user.tenantId, 'business_hours', JSON.stringify(businessHours), '营业时间配置');
      setIsDefaultBusinessHours(false); // 保存成功后服务器有配置了，隐藏提示

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
      {/* 页面标题 */}
      <Box mb={isMobile ? 2 : 4}>
        <Typography
          variant={isMobile ? 'h6' : 'h5'}
          component="h1"
          sx={{
            fontWeight: 500,
            color: '#1a1a1a',
            mb: 0.5,
            fontSize: isMobile ? '1.1rem' : undefined,
          }}
        >
          {t('settings.title')}
        </Typography>
        {!isMobile && (
          <Typography sx={{ color: '#888', fontSize: '0.85rem' }}>
            {t('settings.subtitle')}
          </Typography>
        )}
      </Box>

      {/* 选项卡容器 */}
      <Card
        sx={{
          borderRadius: isMobile ? 2 : 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          border: '1px solid rgba(0,0,0,0.06)',
          overflow: 'hidden',
          minHeight: isMobile ? 'auto' : '600px',
        }}
      >
        {/* 标签栏 */}
        <Box sx={{
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          bgcolor: '#fafafa',
        }}>
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              '& .MuiTab-root': {
                minWidth: isMobile ? 'auto' : 100,
                fontWeight: 400,
                textTransform: 'none',
                fontSize: isMobile ? '0.75rem' : '0.85rem',
                py: isMobile ? 1 : 1.5,
                px: isMobile ? 1.5 : 2,
                color: '#666',
                '&:hover': {
                  color: '#1a1a1a',
                },
                '&.Mui-selected': {
                  fontWeight: 500,
                  color: '#1a1a1a',
                },
              },
              '& .MuiTabs-indicator': {
                height: 2,
                backgroundColor: '#1a1a1a',
              },
            }}
          >
            {tabsConfig.map((tab, index) => (
              <Tab
                key={index}
                icon={React.cloneElement(tab.icon, {
                  sx: {
                    fontSize: isMobile ? 16 : 18,
                    color: selectedTab === index ? '#1a1a1a' : '#999',
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
          <Box sx={{ p: isMobile ? 2 : 3 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={isMobile ? '200px' : '400px'}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={isMobile ? 2 : 4}>
              <Grid item xs={12} md={6}>
                <Card
                  sx={{
                    borderRadius: 2,
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: 'none',
                  }}
                >
                  <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                    <Box display="flex" alignItems="center" mb={isMobile ? 2 : 3}>
                      <Box
                        sx={{
                          width: isMobile ? 32 : 36,
                          height: isMobile ? 32 : 36,
                          borderRadius: 2,
                          bgcolor: '#f5f5f5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 1.5,
                        }}
                      >
                        <BusinessIcon sx={{ fontSize: isMobile ? 16 : 18, color: '#666' }} />
                      </Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 500, color: '#1a1a1a', fontSize: isMobile ? '0.9rem' : undefined }}>
                        {t('settings.merchantInfo')}
                      </Typography>
                    </Box>

                    <Grid container spacing={isMobile ? 2 : 3}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label={t('settings.merchantName')}
                          variant="outlined"
                          size={isMobile ? 'small' : 'medium'}
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
                          size={isMobile ? 'small' : 'medium'}
                          value={merchantInfo.address}
                          onChange={(e) => handleMerchantInfoChange('address', e.target.value)}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <LocationIcon sx={{ color: 'text.secondary', fontSize: isMobile ? 18 : 20 }} />
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
                        <FormControl fullWidth sx={inputFieldStyles} required size={isMobile ? 'small' : 'medium'}>
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
                                <Public sx={{ color: 'text.secondary', fontSize: isMobile ? 18 : 20, ml: 1 }} />
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
                            size={isMobile ? 'small' : 'medium'}
                            value={merchantInfo.province}
                            onChange={(e) => handleMerchantInfoChange('province', e.target.value)}
                            placeholder={t('auth.merchantRegisterPage.merchantInfo.provinceFreeFill')}
                            required
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <ProvinceIcon sx={{ color: 'text.secondary', fontSize: isMobile ? 18 : 20 }} />
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
                          <FormControl fullWidth sx={inputFieldStyles} required size={isMobile ? 'small' : 'medium'}>
                            <InputLabel required>{t('settings.province')}</InputLabel>
                            <Select
                              value={merchantInfo.province}
                              onChange={(e) => handleMerchantInfoChange('province', e.target.value)}
                              label={t('settings.province')}
                              disabled={!merchantInfo.country}
                              required
                              startAdornment={
                                <InputAdornment position="start">
                                  <ProvinceIcon sx={{ color: 'text.secondary', fontSize: isMobile ? 18 : 20, ml: 1 }} />
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
                          size={isMobile ? 'small' : 'medium'}
                          value={merchantInfo.city}
                          onChange={(e) => handleMerchantInfoChange('city', e.target.value)}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <CityIcon sx={{ color: 'text.secondary', fontSize: isMobile ? 18 : 20 }} />
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
                          size={isMobile ? 'small' : 'medium'}
                          value={merchantInfo.postCode}
                          onChange={(e) => handleMerchantInfoChange('postCode', e.target.value)}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <PostCodeIcon sx={{ color: 'text.secondary', fontSize: isMobile ? 18 : 20 }} />
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
                          size={isMobile ? 'small' : 'medium'}
                          value={merchantInfo.contactPhone}
                          onChange={(e) => handleMerchantInfoChange('contactPhone', e.target.value)}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <PhoneIcon sx={{ color: 'text.secondary', fontSize: isMobile ? 18 : 20 }} />
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
                          size={isMobile ? 'small' : 'medium'}
                          value={merchantInfo.contactPerson}
                          onChange={(e) => handleMerchantInfoChange('contactPerson', e.target.value)}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <PersonIcon sx={{ color: 'text.secondary', fontSize: isMobile ? 18 : 20 }} />
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
                          size={isMobile ? 'small' : 'medium'}
                          value={merchantInfo.contactEmail}
                          onChange={(e) => handleMerchantInfoChange('contactEmail', e.target.value)}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <EmailIcon sx={{ color: 'text.secondary', fontSize: isMobile ? 18 : 20 }} />
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
          )}
          </Box>
        </Fade>
        )}

        {/* 业务运营设置 (Operations) */}
        {currentTabKey === 'operations' && (
        <Fade in={currentTabKey === 'operations'} timeout={300}>
          <Box sx={{ p: isMobile ? 2 : 3 }}>
          <Grid container spacing={isMobile ? 2 : 4}>
            {/* 左侧：营业时间 */}
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  borderRadius: 2,
                  border: '1px solid rgba(0,0,0,0.06)',
                  boxShadow: 'none',
                }}
              >
                <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                  <Box display="flex" alignItems="center" mb={isMobile ? 2 : 3}>
                    <Box
                      sx={{
                        width: isMobile ? 32 : 36,
                        height: isMobile ? 32 : 36,
                        borderRadius: 2,
                        bgcolor: '#f5f5f5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 1.5,
                      }}
                    >
                      <AccessTimeIcon sx={{ fontSize: isMobile ? 16 : 18, color: '#666' }} />
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 500, color: '#1a1a1a', fontSize: isMobile ? '0.9rem' : undefined }}>
                      {t('settings.businessHoursSection.title')}
                    </Typography>
                  </Box>
                  {!isMobile && (
                    <Typography variant="caption" sx={{ display: 'block', mb: 2, color: 'text.secondary' }}>
                      {t('settings.businessHoursSection.description')}
                    </Typography>
                  )}

                  {/* 默认数据提示 */}
                  {isDefaultBusinessHours && (
                    <Box
                      sx={{
                        mb: 2,
                        p: 1.5,
                        borderRadius: 1.5,
                        bgcolor: '#f5f5f5',
                        border: '1px solid #e0e0e0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <InfoOutlined sx={{ fontSize: 16, color: '#666' }} />
                      <Typography sx={{ fontSize: '0.8rem', color: '#666' }}>
                        {t('settings.businessHoursSection.defaultDataHint')}
                      </Typography>
                    </Box>
                  )}

                  {/* 复制到所有工作日按钮 */}
                  <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      size="small"
                      startIcon={<CopyIcon sx={{ fontSize: 14 }} />}
                      onClick={() => {
                        const mondaySchedule = businessHours.monday;
                        setBusinessHours(prev => ({
                          ...prev,
                          tuesday: { ...mondaySchedule },
                          wednesday: { ...mondaySchedule },
                          thursday: { ...mondaySchedule },
                          friday: { ...mondaySchedule },
                        }));
                      }}
                      sx={{
                        textTransform: 'none',
                        fontSize: '0.75rem',
                        color: '#666',
                        '&:hover': { bgcolor: '#f5f5f5' },
                      }}
                    >
                      {t('settings.businessHoursSection.copyToAll')}
                    </Button>
                  </Box>

                  {/* 营业时间列表 */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 1 : 1.5 }}>
                    {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const).map((day) => (
                      <Box
                        key={day}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: isMobile ? 1 : 2,
                          p: isMobile ? 1 : 1.5,
                          borderRadius: 1.5,
                          bgcolor: businessHours[day].closed ? '#fafafa' : '#fff',
                          border: '1px solid',
                          borderColor: businessHours[day].closed ? '#f0f0f0' : '#e0e0e0',
                          transition: 'all 0.2s ease',
                          flexWrap: isMobile ? 'wrap' : 'nowrap',
                        }}
                      >
                        {/* 星期名称 */}
                        <Typography
                          sx={{
                            width: isMobile ? 40 : 60,
                            fontWeight: 500,
                            fontSize: isMobile ? '0.75rem' : '0.85rem',
                            color: businessHours[day].closed ? '#999' : '#333',
                          }}
                        >
                          {t(`settings.businessHoursSection.days.${day}`)}
                        </Typography>

                        {/* 开/休按钮 */}
                        <Box
                          onClick={() => {
                            setBusinessHours(prev => ({
                              ...prev,
                              [day]: { ...prev[day], closed: !prev[day].closed },
                            }));
                          }}
                          sx={{
                            px: isMobile ? 1 : 1.5,
                            py: 0.5,
                            borderRadius: 1,
                            fontSize: isMobile ? '0.7rem' : '0.75rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            bgcolor: businessHours[day].closed ? '#f5f5f5' : '#e8f5e9',
                            color: businessHours[day].closed ? '#999' : '#2e7d32',
                            border: '1px solid',
                            borderColor: businessHours[day].closed ? '#e0e0e0' : '#c8e6c9',
                            '&:hover': {
                              bgcolor: businessHours[day].closed ? '#eee' : '#c8e6c9',
                            },
                          }}
                        >
                          {businessHours[day].closed
                            ? t('settings.businessHoursSection.closed')
                            : t('settings.businessHoursSection.open')}
                        </Box>

                        {/* 时间选择器 */}
                        {!businessHours[day].closed && (
                          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={locale}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1, mt: isMobile ? 0.5 : 0, width: isMobile ? '100%' : 'auto' }}>
                              <TimePicker
                                value={timeStringToDate(businessHours[day].start)}
                                onChange={(newValue) => {
                                  setBusinessHours(prev => ({
                                    ...prev,
                                    [day]: { ...prev[day], start: dateToTimeString(newValue) },
                                  }));
                                }}
                                minutesStep={15}
                                ampm={false}
                                slotProps={{
                                  textField: {
                                    size: 'small',
                                    sx: {
                                      width: isMobile ? 80 : 95,
                                      '& .MuiOutlinedInput-root': {
                                        borderRadius: 1,
                                        bgcolor: '#fafafa',
                                        height: isMobile ? 28 : 32,
                                        '& fieldset': { borderColor: 'rgba(0,0,0,0.1)' },
                                        '&:hover fieldset': { borderColor: 'rgba(0,0,0,0.2)' },
                                        '&.Mui-focused fieldset': { borderColor: '#1a1a1a', borderWidth: '1px' },
                                        '&.Mui-focused': { bgcolor: '#fff' },
                                      },
                                      '& .MuiOutlinedInput-input': {
                                        py: 0.5,
                                        px: isMobile ? 0.5 : 1,
                                        fontSize: isMobile ? '0.7rem' : '0.8rem',
                                      },
                                    },
                                  },
                                  openPickerIcon: {
                                    sx: { fontSize: isMobile ? 14 : 16 },
                                  },
                                  popper: {
                                    sx: {
                                      '& .MuiPaper-root': {
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                      },
                                      '& .MuiPickersLayout-root': {
                                        minWidth: 'auto',
                                      },
                                      '& .MuiPickersLayout-contentWrapper': {
                                        minWidth: 'auto',
                                      },
                                      '& .MuiMultiSectionDigitalClock-root': {
                                        minWidth: 'auto',
                                      },
                                      '& .MuiMultiSectionDigitalClockSection-root': {
                                        width: 52,
                                        minWidth: 52,
                                      },
                                      '& .MuiMultiSectionDigitalClockSection-item': {
                                        fontSize: '0.75rem',
                                        minHeight: 28,
                                        px: 1,
                                      },
                                    },
                                  },
                                }}
                              />
                              <Typography sx={{ color: '#999', fontSize: isMobile ? '0.7rem' : '0.8rem' }}>-</Typography>
                              <TimePicker
                                value={timeStringToDate(businessHours[day].end)}
                                onChange={(newValue) => {
                                  setBusinessHours(prev => ({
                                    ...prev,
                                    [day]: { ...prev[day], end: dateToTimeString(newValue) },
                                  }));
                                }}
                                minutesStep={15}
                                ampm={false}
                                slotProps={{
                                  textField: {
                                    size: 'small',
                                    sx: {
                                      width: isMobile ? 80 : 95,
                                      '& .MuiOutlinedInput-root': {
                                        borderRadius: 1,
                                        bgcolor: '#fafafa',
                                        height: isMobile ? 28 : 32,
                                        '& fieldset': { borderColor: 'rgba(0,0,0,0.1)' },
                                        '&:hover fieldset': { borderColor: 'rgba(0,0,0,0.2)' },
                                        '&.Mui-focused fieldset': { borderColor: '#1a1a1a', borderWidth: '1px' },
                                        '&.Mui-focused': { bgcolor: '#fff' },
                                      },
                                      '& .MuiOutlinedInput-input': {
                                        py: 0.5,
                                        px: isMobile ? 0.5 : 1,
                                        fontSize: isMobile ? '0.7rem' : '0.8rem',
                                      },
                                    },
                                  },
                                  openPickerIcon: {
                                    sx: { fontSize: isMobile ? 14 : 16 },
                                  },
                                  popper: {
                                    sx: {
                                      '& .MuiPaper-root': {
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                      },
                                      '& .MuiPickersLayout-root': {
                                        minWidth: 'auto',
                                      },
                                      '& .MuiPickersLayout-contentWrapper': {
                                        minWidth: 'auto',
                                      },
                                      '& .MuiMultiSectionDigitalClock-root': {
                                        minWidth: 'auto',
                                      },
                                      '& .MuiMultiSectionDigitalClockSection-root': {
                                        width: 52,
                                        minWidth: 52,
                                      },
                                      '& .MuiMultiSectionDigitalClockSection-item': {
                                        fontSize: '0.75rem',
                                        minHeight: 28,
                                        px: 1,
                                      },
                                    },
                                  },
                                }}
                              />
                            </Box>
                          </LocalizationProvider>
                        )}

                        {/* 休息日占位 */}
                        {businessHours[day].closed && (
                          <Box sx={{ flex: 1 }}>
                            <Typography sx={{ color: '#bbb', fontSize: '0.8rem', fontStyle: 'italic' }}>
                              {t('settings.businessHoursSection.closed')}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* 右侧：资源类型 + 税务设置 */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 2 : 3 }}>
                {/* 资源类型 */}
                <Card
                  sx={{
                    borderRadius: 2,
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: 'none',
                  }}
                >
                  <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                    <Box display="flex" alignItems="center" mb={isMobile ? 2 : 3}>
                      <Box
                        sx={{
                          width: isMobile ? 32 : 36,
                          height: isMobile ? 32 : 36,
                          borderRadius: 2,
                          bgcolor: '#f5f5f5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 1.5,
                        }}
                      >
                        <GroupIcon sx={{ fontSize: isMobile ? 16 : 18, color: '#666' }} />
                      </Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 500, color: '#1a1a1a', fontSize: isMobile ? '0.9rem' : undefined }}>
                        {t('settings.resourceTypes.title')}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={resourceTypes.includes('STAFF')}
                            disabled
                            icon={<CheckBoxBlankIcon />}
                            checkedIcon={<CheckBoxIcon />}
                            sx={{
                              color: '#bbb',
                              '&.Mui-checked': {
                                color: '#1a1a1a',
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
                            icon={<CheckBoxBlankIcon />}
                            checkedIcon={<CheckBoxIcon />}
                            sx={{
                              color: '#bbb',
                              '&.Mui-checked': {
                                color: '#1a1a1a',
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
                  </CardContent>
                </Card>

                {/* 税务设置 */}
                <Card
                  sx={{
                    borderRadius: 2,
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: 'none',
                  }}
                >
                  <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                    <Box display="flex" alignItems="center" mb={isMobile ? 2 : 3}>
                      <Box
                        sx={{
                          width: isMobile ? 32 : 36,
                          height: isMobile ? 32 : 36,
                          borderRadius: 2,
                          bgcolor: '#f5f5f5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 1.5,
                        }}
                      >
                        <TaxIcon sx={{ fontSize: isMobile ? 16 : 18, color: '#666' }} />
                      </Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 500, color: '#1a1a1a', fontSize: isMobile ? '0.9rem' : undefined }}>
                        {t('settings.taxSettings')}
                      </Typography>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label={t('settings.gstRate')}
                          variant="outlined"
                          size="small"
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
                          size="small"
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
              </Box>
            </Grid>
          </Grid>
          </Box>
        </Fade>
        )}

        {/* 系统设置 */}
        {currentTabKey === 'system' && (
        <Fade in={currentTabKey === 'system'} timeout={300}>
          <Box sx={{ p: isMobile ? 2 : 3 }}>
          <Grid container spacing={isMobile ? 2 : 4}>
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  borderRadius: 2,
                  border: '1px solid rgba(0,0,0,0.06)',
                  boxShadow: 'none',
                }}
              >
                <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                  <Box display="flex" alignItems="center" mb={isMobile ? 2 : 3}>
                    <Box
                      sx={{
                        width: isMobile ? 32 : 36,
                        height: isMobile ? 32 : 36,
                        borderRadius: 2,
                        bgcolor: '#f5f5f5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 1.5,
                      }}
                    >
                      <TuneIcon sx={{ fontSize: isMobile ? 16 : 18, color: '#666' }} />
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 500, color: '#1a1a1a', fontSize: isMobile ? '0.9rem' : undefined }}>
                      {t('settings.systemPrefs')}
                    </Typography>
                  </Box>

                  <Grid container spacing={isMobile ? 2 : 3}>
                    <Grid item xs={12}>
                      <FormControl fullWidth sx={inputFieldStyles} size={isMobile ? 'small' : 'medium'}>
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
                        size={isMobile ? 'small' : 'medium'}
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

            {/* Theme Toggle Card */}
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  borderRadius: 2,
                  border: '1px solid rgba(0,0,0,0.06)',
                  boxShadow: 'none',
                }}
              >
                <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                  <Box display="flex" alignItems="center" mb={isMobile ? 2 : 3}>
                    <Box
                      sx={{
                        width: isMobile ? 32 : 36,
                        height: isMobile ? 32 : 36,
                        borderRadius: 2,
                        bgcolor: '#f5f5f5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 1.5,
                      }}
                    >
                      <PaletteIcon sx={{ fontSize: isMobile ? 16 : 18, color: '#666' }} />
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 500, color: '#1a1a1a', fontSize: isMobile ? '0.9rem' : undefined }}>
                      {t('settings.themeStyle', 'Theme Style')}
                    </Typography>
                  </Box>

                  <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} gap={isMobile ? 1.5 : 2}>
                    {/* Colorful Modern Option */}
                    <Box
                      onClick={() => setThemeMode('colorful')}
                      sx={{
                        flex: 1,
                        p: 2,
                        borderRadius: 2,
                        border: themeMode === 'colorful' ? '2px solid #8B5CF6' : '1px solid #e0e0e0',
                        bgcolor: themeMode === 'colorful' ? alpha('#8B5CF6', 0.05) : '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: themeMode === 'colorful' ? '#8B5CF6' : '#bbb',
                          bgcolor: themeMode === 'colorful' ? alpha('#8B5CF6', 0.08) : '#fafafa',
                        },
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
                        <ColorfulIcon sx={{ fontSize: 20, color: '#8B5CF6' }} />
                        <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#1a1a1a' }}>
                          {t('settings.themeColorful', 'Colorful Modern')}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: '0.75rem', color: '#666', lineHeight: 1.5 }}>
                        {t('settings.themeColorfulDesc', 'Vibrant colors for each module, modern and lively interface')}
                      </Typography>
                      {/* Color Preview */}
                      <Box display="flex" gap={0.5} mt={1.5}>
                        {['#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#F97316'].map((color) => (
                          <Box
                            key={color}
                            sx={{
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              bgcolor: color,
                            }}
                          />
                        ))}
                      </Box>
                    </Box>

                    {/* Monochrome Professional Option */}
                    <Box
                      onClick={() => setThemeMode('monochrome')}
                      sx={{
                        flex: 1,
                        p: 2,
                        borderRadius: 2,
                        border: themeMode === 'monochrome' ? '2px solid #1a1a1a' : '1px solid #e0e0e0',
                        bgcolor: themeMode === 'monochrome' ? alpha('#1a1a1a', 0.03) : '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: themeMode === 'monochrome' ? '#1a1a1a' : '#bbb',
                          bgcolor: themeMode === 'monochrome' ? alpha('#1a1a1a', 0.05) : '#fafafa',
                        },
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
                        <MonochromeIcon sx={{ fontSize: 20, color: '#1a1a1a' }} />
                        <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#1a1a1a' }}>
                          {t('settings.themeMonochrome', 'Monochrome Professional')}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: '0.75rem', color: '#666', lineHeight: 1.5 }}>
                        {t('settings.themeMonochromeDesc', 'Clean black and white design, minimalist and professional')}
                      </Typography>
                      {/* Color Preview */}
                      <Box display="flex" gap={0.5} mt={1.5}>
                        {['#1a1a1a', '#333', '#666', '#999', '#ccc'].map((color) => (
                          <Box
                            key={color}
                            sx={{
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              bgcolor: color,
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  </Box>
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
          <Box sx={{ p: isMobile ? 2 : 3 }}>
            <BillingTab />
          </Box>
        </Fade>
        )}

        {/* Online Booking Tab */}
        {currentTabKey === 'onlineBooking' && (
        <Fade in={currentTabKey === 'onlineBooking'} timeout={300}>
          <Box sx={{ p: isMobile ? 2 : 3 }}>
            <OnlineBookingTab />
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

      {/* 保存按钮 - 仅在非支付设置页、非账单页、非在线预约页显示 */}
      {currentTabKey !== 'payment' && currentTabKey !== 'billing' && currentTabKey !== 'onlineBooking' && (
      <Box mt={isMobile ? 2 : 4} display="flex" justifyContent="flex-end">
        <Button
          variant="contained"
          fullWidth={isMobile}
          startIcon={saving ? <CircularProgress size={isMobile ? 16 : 18} color="inherit" /> : <SaveIcon sx={{ fontSize: isMobile ? 18 : 20 }} />}
          onClick={handleSaveSettings}
          disabled={saving}
          sx={{
            px: isMobile ? 2 : 3,
            py: isMobile ? 1.25 : 1,
            textTransform: 'none',
            fontWeight: 500,
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            borderRadius: 2,
            bgcolor: '#1a1a1a',
            boxShadow: 'none',
            '&:hover': {
              bgcolor: '#333',
              boxShadow: 'none',
            },
            '&:disabled': {
              bgcolor: '#e5e5e5',
              color: '#999',
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
        sx={{ top: isMobile ? 16 : 24 }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{
            width: isMobile ? 'auto' : '100%',
            minWidth: isMobile ? 200 : 280,
            borderRadius: 2,
            fontSize: isMobile ? '0.75rem' : '0.875rem',
            py: isMobile ? 0.5 : 1,
            '& .MuiAlert-icon': {
              fontSize: isMobile ? 18 : 22,
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