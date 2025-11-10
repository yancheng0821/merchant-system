import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  InputAdornment,
  IconButton,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Container,
  Fade,
  Slide,
  LinearProgress,
  alpha,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Business as BusinessIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Lock as LockIcon,
  LocationOn as LocationIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  ContentCopy as CopyIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import LanguageSwitcher from '../common/LanguageSwitcher';
import CountryCodeSelector from '../common/CountryCodeSelector';

interface MerchantRegisterData {
  // 管理员信息
  username: string;
  password: string;
  confirmPassword: string;
  realName: string;
  email: string;
  phone: string;
  phoneCountryCode: string;
  
  // 商户信息
  merchantName: string;
  businessCategory: string;
  businessLicense: string;
  contactPerson: string;
  contactPhone: string;
  contactPhoneCountryCode: string;
  contactEmail: string;
  address: string;
  province: string;
  city: string;
  postCode: string;
  timezone: string;
  
  // 资源类型
  resourceTypes: string[];
}

interface MerchantRegisterPageProps {
  onBack?: () => void;
}

const MerchantRegisterPage: React.FC<MerchantRegisterPageProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // 通用的输入框样式
  const textFieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      '&:hover fieldset': {
        borderColor: '#667eea',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#667eea',
      },
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: '#667eea',
    },
  };

  // 通用的 Select 样式
  const selectSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      '&:hover fieldset': {
        borderColor: '#667eea',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#667eea',
      },
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: '#667eea',
    },
  };
  
  const [activeStep, setActiveStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [invitationCode, setInvitationCode] = useState<string>('');
  const [tenantCode, setTenantCode] = useState<string>('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [copiedInvitationCode, setCopiedInvitationCode] = useState(false);
  const [copiedTenantCode, setCopiedTenantCode] = useState(false);

  // 实时验证状态
  const [validationErrors, setValidationErrors] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    contactEmail: '',
    contactPhone: '',
  });

  // 跟踪字段是否已被用户触摸过
  const [touchedFields, setTouchedFields] = useState({
    email: false,
    phone: false,
    password: false,
    confirmPassword: false,
    contactEmail: false,
    contactPhone: false,
  });

  // 根据用户当前时区检测并选择最合适的时区
  const detectUserTimezone = (): string => {
    try {
      // 获取用户浏览器时区
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // 定义支持的时区列表
      const supportedTimezones = [
        'America/St_Johns', 'America/Halifax', 'America/Toronto',
        'America/Winnipeg', 'America/Edmonton', 'America/Vancouver',
        'America/New_York', 'America/Chicago', 'America/Denver',
        'America/Los_Angeles', 'America/Phoenix', 'America/Anchorage',
        'Pacific/Honolulu', 'Europe/London', 'Europe/Paris',
        'Europe/Berlin', 'Europe/Rome', 'Europe/Madrid',
        'Europe/Amsterdam', 'Europe/Moscow', 'Asia/Dubai',
        'Asia/Karachi', 'Asia/Kolkata', 'Asia/Dhaka',
        'Asia/Bangkok', 'Asia/Singapore', 'Asia/Hong_Kong',
        'Asia/Shanghai', 'Asia/Tokyo', 'Asia/Seoul',
        'Australia/Sydney', 'Australia/Melbourne', 'Australia/Brisbane',
        'Australia/Perth', 'Pacific/Auckland'
      ];

      // 检查用户时区是否在我们的列表中
      if (supportedTimezones.includes(userTimezone)) {
        return userTimezone;
      }

      // 如果不在列表中，尝试匹配相似的时区
      const timezoneMap: { [key: string]: string } = {
        // 加拿大东部时区
        'America/Montreal': 'America/Toronto',
        'America/Nipigon': 'America/Toronto',
        'America/Thunder_Bay': 'America/Toronto',
        'America/Iqaluit': 'America/Toronto',
        'America/Pangnirtung': 'America/Toronto',

        // 加拿大中部时区
        'America/Regina': 'America/Winnipeg',
        'America/Rainy_River': 'America/Winnipeg',
        'America/Rankin_Inlet': 'America/Winnipeg',

        // 加拿大山地时区
        'America/Cambridge_Bay': 'America/Edmonton',
        'America/Yellowknife': 'America/Edmonton',
        'America/Inuvik': 'America/Edmonton',

        // 加拿大太平洋时区
        'America/Dawson': 'America/Vancouver',
        'America/Whitehorse': 'America/Vancouver',

        // 美国东部时区
        'America/Detroit': 'America/New_York',
        'America/Kentucky/Louisville': 'America/New_York',
        'America/Kentucky/Monticello': 'America/New_York',
        'America/Indiana/Indianapolis': 'America/New_York',
        'America/Indiana/Vincennes': 'America/New_York',
        'America/Indiana/Winamac': 'America/New_York',
        'America/Indiana/Marengo': 'America/New_York',
        'America/Indiana/Petersburg': 'America/New_York',
        'America/Indiana/Vevay': 'America/New_York',

        // 美国太平洋时区
        'America/Tijuana': 'America/Los_Angeles',

        // 欧洲时区
        'Europe/Dublin': 'Europe/London',
        'Europe/Belfast': 'Europe/London',
        'Europe/Berlin': 'Europe/Paris',
        'Europe/Brussels': 'Europe/Paris',
        'Europe/Amsterdam': 'Europe/Paris',
        'Europe/Rome': 'Europe/Paris',
        'Europe/Madrid': 'Europe/Paris',

        // 中国其他城市
        'Asia/Chongqing': 'Asia/Shanghai',
        'Asia/Harbin': 'Asia/Shanghai',
        'Asia/Hong_Kong': 'Asia/Shanghai',
        'Asia/Macau': 'Asia/Shanghai',
      };

      if (timezoneMap[userTimezone]) {
        const mappedTimezone = timezoneMap[userTimezone];
        console.log('📍 时区映射:', userTimezone, '->', mappedTimezone);
        return mappedTimezone;
      }

      // 如果无法匹配，返回默认时区（伦敦）
      console.log('⚠️ 未找到匹配时区，使用默认值: Europe/London');
      return 'Europe/London';
    } catch (error) {
      console.error('❌ 时区检测失败:', error);
      return 'Europe/London';
    }
  };

  const [formData, setFormData] = useState<MerchantRegisterData>({
    username: '',
    password: '',
    confirmPassword: '',
    realName: '',
    email: '',
    phone: '',
    phoneCountryCode: '+1-CA',
    merchantName: '',
    businessCategory: '',
    businessLicense: '',
    contactPerson: '',
    contactPhone: '',
    contactPhoneCountryCode: '+1-CA',
    contactEmail: '',
    address: '',
    province: '',
    city: '',
    postCode: '',
    timezone: detectUserTimezone(), // 自动检测用户时区
    resourceTypes: ['STAFF'],
  });

  const steps = [
    t('auth.merchantRegisterPage.steps.adminInfo'),
    t('auth.merchantRegisterPage.steps.merchantInfo'),
    t('auth.merchantRegisterPage.steps.businessConfig')
  ];

  const businessCategories = [
    { value: 'beauty', label: t('auth.merchantRegisterPage.businessCategories.beauty') },
    { value: 'spa', label: t('auth.merchantRegisterPage.businessCategories.spa') },
    { value: 'fitness', label: t('auth.merchantRegisterPage.businessCategories.fitness') },
    { value: 'medical', label: t('auth.merchantRegisterPage.businessCategories.medical') },
    { value: 'education', label: t('auth.merchantRegisterPage.businessCategories.education') },
    { value: 'restaurant', label: t('auth.merchantRegisterPage.businessCategories.restaurant') },
    { value: 'automotive', label: t('auth.merchantRegisterPage.businessCategories.automotive') },
    { value: 'other', label: t('auth.merchantRegisterPage.businessCategories.other') }
  ];

  const resourceTypeOptions = [
    { value: 'STAFF', label: t('auth.merchantRegisterPage.resourceTypes.staff') },
    { value: 'ROOM', label: t('auth.merchantRegisterPage.resourceTypes.room') }
  ];

  const timezones = [
    // 加拿大时区（从东到西）
    { value: 'America/St_Johns', label: t('auth.merchantRegisterPage.timezones.america_st_johns') },
    { value: 'America/Halifax', label: t('auth.merchantRegisterPage.timezones.america_halifax') },
    { value: 'America/Toronto', label: t('auth.merchantRegisterPage.timezones.america_toronto') },
    { value: 'America/Winnipeg', label: t('auth.merchantRegisterPage.timezones.america_winnipeg') },
    { value: 'America/Edmonton', label: t('auth.merchantRegisterPage.timezones.america_edmonton') },
    { value: 'America/Vancouver', label: t('auth.merchantRegisterPage.timezones.america_vancouver') },

    // 美国主要时区
    { value: 'America/New_York', label: t('auth.merchantRegisterPage.timezones.america_new_york') },
    { value: 'America/Chicago', label: t('auth.merchantRegisterPage.timezones.america_chicago') },
    { value: 'America/Denver', label: t('auth.merchantRegisterPage.timezones.america_denver') },
    { value: 'America/Los_Angeles', label: t('auth.merchantRegisterPage.timezones.america_los_angeles') },
    { value: 'America/Phoenix', label: t('auth.merchantRegisterPage.timezones.america_phoenix') },
    { value: 'America/Anchorage', label: t('auth.merchantRegisterPage.timezones.america_anchorage') },
    { value: 'Pacific/Honolulu', label: t('auth.merchantRegisterPage.timezones.pacific_honolulu') },

    // 欧洲主要时区
    { value: 'Europe/London', label: t('auth.merchantRegisterPage.timezones.europe_london') },
    { value: 'Europe/Paris', label: t('auth.merchantRegisterPage.timezones.europe_paris') },
    { value: 'Europe/Berlin', label: t('auth.merchantRegisterPage.timezones.europe_berlin') },
    { value: 'Europe/Rome', label: t('auth.merchantRegisterPage.timezones.europe_rome') },
    { value: 'Europe/Madrid', label: t('auth.merchantRegisterPage.timezones.europe_madrid') },
    { value: 'Europe/Amsterdam', label: t('auth.merchantRegisterPage.timezones.europe_amsterdam') },
    { value: 'Europe/Moscow', label: t('auth.merchantRegisterPage.timezones.europe_moscow') },

    // 亚洲主要时区
    { value: 'Asia/Dubai', label: t('auth.merchantRegisterPage.timezones.asia_dubai') },
    { value: 'Asia/Karachi', label: t('auth.merchantRegisterPage.timezones.asia_karachi') },
    { value: 'Asia/Kolkata', label: t('auth.merchantRegisterPage.timezones.asia_kolkata') },
    { value: 'Asia/Dhaka', label: t('auth.merchantRegisterPage.timezones.asia_dhaka') },
    { value: 'Asia/Bangkok', label: t('auth.merchantRegisterPage.timezones.asia_bangkok') },
    { value: 'Asia/Singapore', label: t('auth.merchantRegisterPage.timezones.asia_singapore') },
    { value: 'Asia/Hong_Kong', label: t('auth.merchantRegisterPage.timezones.asia_hong_kong') },
    { value: 'Asia/Shanghai', label: t('auth.merchantRegisterPage.timezones.asia_shanghai') },
    { value: 'Asia/Tokyo', label: t('auth.merchantRegisterPage.timezones.asia_tokyo') },
    { value: 'Asia/Seoul', label: t('auth.merchantRegisterPage.timezones.asia_seoul') },

    // 澳大利亚和太平洋时区
    { value: 'Australia/Sydney', label: t('auth.merchantRegisterPage.timezones.australia_sydney') },
    { value: 'Australia/Melbourne', label: t('auth.merchantRegisterPage.timezones.australia_melbourne') },
    { value: 'Australia/Brisbane', label: t('auth.merchantRegisterPage.timezones.australia_brisbane') },
    { value: 'Australia/Perth', label: t('auth.merchantRegisterPage.timezones.australia_perth') },
    { value: 'Pacific/Auckland', label: t('auth.merchantRegisterPage.timezones.pacific_auckland') }
  ];

  const canadianProvinces = [
    { value: 'Alberta', label: t('auth.merchantRegisterPage.provinces.Alberta') },
    { value: 'British Columbia', label: t('auth.merchantRegisterPage.provinces.British Columbia') },
    { value: 'Manitoba', label: t('auth.merchantRegisterPage.provinces.Manitoba') },
    { value: 'New Brunswick', label: t('auth.merchantRegisterPage.provinces.New Brunswick') },
    { value: 'Newfoundland and Labrador', label: t('auth.merchantRegisterPage.provinces.Newfoundland and Labrador') },
    { value: 'Nova Scotia', label: t('auth.merchantRegisterPage.provinces.Nova Scotia') },
    { value: 'Ontario', label: t('auth.merchantRegisterPage.provinces.Ontario') },
    { value: 'Prince Edward Island', label: t('auth.merchantRegisterPage.provinces.Prince Edward Island') },
    { value: 'Quebec', label: t('auth.merchantRegisterPage.provinces.Quebec') },
    { value: 'Saskatchewan', label: t('auth.merchantRegisterPage.provinces.Saskatchewan') },
    { value: 'Northwest Territories', label: t('auth.merchantRegisterPage.provinces.Northwest Territories') },
    { value: 'Nunavut', label: t('auth.merchantRegisterPage.provinces.Nunavut') },
    { value: 'Yukon', label: t('auth.merchantRegisterPage.provinces.Yukon') }
  ];

  // 验证邮箱格式
  const validateEmail = (email: string, showError: boolean = true): string => {
    if (!email || !showError) return '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return t('auth.merchantRegisterPage.validation.emailInvalid');
    }
    return '';
  };

  // 验证手机号格式（支持多国格式）
  const validatePhone = (phone: string, showError: boolean = true): string => {
    if (!phone || !showError) return '';
    // 移除所有非数字字符
    const cleaned = phone.replace(/\D/g, '');
    // 手机号应该在6-15位之间（满足大部分国家）
    if (cleaned.length < 6 || cleaned.length > 15) {
      return t('auth.merchantRegisterPage.validation.phoneInvalid');
    }
    return '';
  };

  // 验证密码强度
  const validatePassword = (password: string, showError: boolean = true): string => {
    if (!password || !showError) return '';

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;

    if (!isLongEnough) {
      return t('auth.merchantRegisterPage.validation.passwordMinLength');
    }
    if (!hasUpperCase) {
      return t('auth.merchantRegisterPage.validation.passwordNeedsUpperCase');
    }
    if (!hasLowerCase) {
      return t('auth.merchantRegisterPage.validation.passwordNeedsLowerCase');
    }
    if (!hasNumber) {
      return t('auth.merchantRegisterPage.validation.passwordNeedsNumber');
    }
    if (!hasSpecialChar) {
      return t('auth.merchantRegisterPage.validation.passwordNeedsSpecialChar');
    }
    return '';
  };

  // 验证确认密码
  const validateConfirmPassword = (password: string, confirmPassword: string, showError: boolean = true): string => {
    if (!confirmPassword || !showError) return '';
    if (password !== confirmPassword) {
      return t('auth.merchantRegisterPage.validation.passwordMismatch');
    }
    return '';
  };

  const handleInputChange = (field: keyof MerchantRegisterData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const value = event.target.value;

    const updatedFormData = { ...formData, [field]: value };
    setFormData(updatedFormData);
    setError(null);

    // 标记字段为已触摸
    const validationFields = ['email', 'phone', 'password', 'confirmPassword', 'contactEmail', 'contactPhone'];
    if (validationFields.includes(field)) {
      setTouchedFields(prev => ({
        ...prev,
        [field]: true,
      }));
    }

    // 实时验证
    if (field === 'email') {
      const emailError = validateEmail(value);
      setValidationErrors(prev => ({
        ...prev,
        email: emailError,
      }));
    } else if (field === 'phone') {
      const phoneError = validatePhone(value);
      setValidationErrors(prev => ({
        ...prev,
        phone: phoneError,
      }));
    } else if (field === 'password') {
      const passwordError = validatePassword(value);
      const confirmPasswordError = touchedFields.confirmPassword
        ? validateConfirmPassword(value, updatedFormData.confirmPassword)
        : '';
      setValidationErrors(prev => ({
        ...prev,
        password: passwordError,
        confirmPassword: confirmPasswordError,
      }));
    } else if (field === 'confirmPassword') {
      const confirmPasswordError = validateConfirmPassword(updatedFormData.password, value);
      setValidationErrors(prev => ({
        ...prev,
        confirmPassword: confirmPasswordError,
      }));
    } else if (field === 'contactEmail') {
      const contactEmailError = validateEmail(value);
      setValidationErrors(prev => ({
        ...prev,
        contactEmail: contactEmailError,
      }));
    } else if (field === 'contactPhone') {
      const contactPhoneError = validatePhone(value);
      setValidationErrors(prev => ({
        ...prev,
        contactPhone: contactPhoneError,
      }));
    }
  };

  const handleResourceTypeChange = (event: any) => {
    const value = event.target.value as string[];
    setFormData(prev => ({
      ...prev,
      resourceTypes: value
    }));
  };

  // 验证用户名格式
  const validateUsername = (username: string): boolean => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // 管理员信息
        if (!formData.username.trim()) {
          setError(t('auth.merchantRegisterPage.validation.usernameRequired'));
          return false;
        }
        if (!validateUsername(formData.username)) {
          setError(t('auth.merchantRegisterPage.validation.usernameInvalid'));
          return false;
        }
        if (!formData.email.trim()) {
          setError(t('auth.merchantRegisterPage.validation.emailRequired'));
          return false;
        }
        const emailError = validateEmail(formData.email);
        if (emailError) {
          setError(emailError);
          return false;
        }
        if (!formData.realName.trim()) {
          setError(t('auth.merchantRegisterPage.validation.realNameRequired'));
          return false;
        }
        if (!formData.phone.trim()) {
          setError(t('auth.merchantRegisterPage.validation.phoneRequired') || 'Phone number is required');
          return false;
        }
        const phoneError = validatePhone(formData.phone);
        if (phoneError) {
          setError(phoneError);
          return false;
        }
        if (!formData.password) {
          setError(t('auth.merchantRegisterPage.validation.passwordRequired'));
          return false;
        }
        const passwordError = validatePassword(formData.password);
        if (passwordError) {
          setError(passwordError);
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError(t('auth.merchantRegisterPage.validation.passwordMismatch'));
          return false;
        }
        break;

      case 1: // 商户信息
        if (!formData.merchantName.trim()) {
          setError(t('auth.merchantRegisterPage.validation.merchantNameRequired'));
          return false;
        }
        if (!formData.businessCategory) {
          setError(t('auth.merchantRegisterPage.validation.businessCategoryRequired'));
          return false;
        }
        if (!formData.contactPerson.trim()) {
          setError(t('auth.merchantRegisterPage.validation.contactPersonRequired'));
          return false;
        }
        if (!formData.contactPhone.trim()) {
          setError(t('auth.merchantRegisterPage.validation.contactPhoneRequired'));
          return false;
        }
        const contactPhoneError = validatePhone(formData.contactPhone);
        if (contactPhoneError) {
          setError(contactPhoneError);
          return false;
        }
        if (formData.contactEmail) {
          const contactEmailError = validateEmail(formData.contactEmail);
          if (contactEmailError) {
            setError(contactEmailError);
            return false;
          }
        }
        break;

      case 2: // 业务配置
        // 资源类型已默认设置为 STAFF，无需验证
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 准备提交数据，合并电话号码和国家代码
      const getDialCode = (dialCode: string) => dialCode.replace(/-[A-Z]{2}$/, '');
      
      const submitData = {
        ...formData,
        phone: getDialCode(formData.phoneCountryCode) + formData.phone,
        contactPhone: getDialCode(formData.contactPhoneCountryCode) + formData.contactPhone,
      };

      const { authApi } = await import('../../services/api');
      const response = await authApi.merchantRegister(submitData);
      
      
      if (response.success && response.data) {

        const invCode = response.data.invitationCode || '';
        const tenCode = response.data.tenantCode || '';
              
        setInvitationCode(invCode);
        setTenantCode(tenCode);
        setShowSuccessDialog(true);
      } else {
        setError(response.message || t('auth.merchantRegisterPage.validation.registrationFailed'));
      }
      
    } catch (error: any) {
      setError(error.message || t('auth.merchantRegisterPage.validation.registrationFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyInvitationCode = async (event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // 如果已经复制过了，不要重复执行
    if (copiedInvitationCode || !invitationCode) return;
    
    try {
      await navigator.clipboard.writeText(invitationCode);
      setCopiedInvitationCode(true);
    } catch (error) {
      console.error('Failed to copy invitation code:', error);
      // 如果剪贴板API失败，尝试使用传统方法
      try {
        const textArea = document.createElement('textarea');
        textArea.value = invitationCode;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopiedInvitationCode(true);
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
      }
    }
  };

  const handleCopyTenantCode = async (event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // 如果已经复制过了，不要重复执行
    if (copiedTenantCode || !tenantCode) return;
    
    try {
      await navigator.clipboard.writeText(tenantCode);
      setCopiedTenantCode(true);
    } catch (error) {
      console.error('Failed to copy tenant code:', error);
      // 如果剪贴板API失败，尝试使用传统方法
      try {
        const textArea = document.createElement('textarea');
        textArea.value = tenantCode;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopiedTenantCode(true);
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
      }
    }
  };

  const handleGoToLogin = () => {
    setShowSuccessDialog(false);
    // 使用 onBack 回调返回登录页面
    if (onBack) {
      onBack();
    } else {
      // 如果没有 onBack 回调，则刷新页面回到登录界面
      window.location.href = '/';
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('auth.merchantRegisterPage.adminInfo.username')}
                value={formData.username}
                onChange={handleInputChange('username')}
                required
                helperText={t('auth.usernameHelp')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: '#667eea' }} />
                    </InputAdornment>
                  ),
                }}
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('auth.merchantRegisterPage.adminInfo.realName')}
                value={formData.realName}
                onChange={handleInputChange('realName')}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: '#667eea' }} />
                    </InputAdornment>
                  ),
                }}
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('auth.merchantRegisterPage.adminInfo.email')}
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                required
                error={touchedFields.email && !!validationErrors.email}
                helperText={touchedFields.email && validationErrors.email ? validationErrors.email : '\u00A0'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: '#667eea' }} />
                    </InputAdornment>
                  ),
                }}
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Grid container spacing={1}>
                <Grid item xs={5}>
                  <CountryCodeSelector
                    value={formData.phoneCountryCode}
                    onChange={(code) => setFormData(prev => ({ ...prev, phoneCountryCode: code }))}
                    label={t('common.countryCode')}
                    size="medium"
                    fullWidth
                  />
                </Grid>
                <Grid item xs={7}>
                  <TextField
                    fullWidth
                    label={t('auth.merchantRegisterPage.adminInfo.phone')}
                    value={formData.phone}
                    onChange={handleInputChange('phone')}
                    required
                    error={touchedFields.phone && !!validationErrors.phone}
                    helperText={touchedFields.phone && validationErrors.phone ? validationErrors.phone : '\u00A0'}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon sx={{ color: '#667eea' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={textFieldSx}
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box>
                <TextField
                  fullWidth
                  label={t('auth.merchantRegisterPage.adminInfo.password')}
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  onFocus={() => setTouchedFields(prev => ({ ...prev, password: true }))}
                  required
                  error={touchedFields.password && !!validationErrors.password}
                  helperText={touchedFields.password && validationErrors.password ? validationErrors.password : '\u00A0'}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: '#667eea' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          sx={{ color: '#667eea' }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={textFieldSx}
                />
                {/* 密码要求提示框 - 使用固定高度避免布局跳动 */}
                <Box sx={{
                  minHeight: touchedFields.password && !(
                    formData.password &&
                    formData.password.length >= 8 &&
                    /[A-Z]/.test(formData.password) &&
                    /[a-z]/.test(formData.password) &&
                    /[0-9]/.test(formData.password) &&
                    /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
                  ) ? '140px' : '0px',
                  transition: 'min-height 0.3s ease-in-out',
                  overflow: 'hidden'
                }}>
                  {touchedFields.password && !(
                    formData.password &&
                    formData.password.length >= 8 &&
                    /[A-Z]/.test(formData.password) &&
                    /[a-z]/.test(formData.password) &&
                    /[0-9]/.test(formData.password) &&
                    /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
                  ) && (
                    <Fade in={true}>
                      <Box sx={{ mt: 0.5, mb: 1, px: 1 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 500 }}>
                          {t('auth.passwordRequirements')}:
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          {/* 至少8位 */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                            {formData.password.length >= 8 ? (
                              <CheckCircleIcon sx={{ fontSize: '0.85rem', color: 'success.main' }} />
                            ) : (
                              <CancelIcon sx={{ fontSize: '0.85rem', color: 'text.disabled' }} />
                            )}
                            <Typography
                              variant="caption"
                              sx={{
                                color: formData.password.length >= 8 ? 'success.main' : 'text.secondary',
                                fontSize: '0.7rem'
                              }}
                            >
                              {t('auth.passwordMinLength')}
                            </Typography>
                          </Box>
                          {/* 大写字母 */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                            {/[A-Z]/.test(formData.password) ? (
                              <CheckCircleIcon sx={{ fontSize: '0.85rem', color: 'success.main' }} />
                            ) : (
                              <CancelIcon sx={{ fontSize: '0.85rem', color: 'text.disabled' }} />
                            )}
                            <Typography
                              variant="caption"
                              sx={{
                                color: /[A-Z]/.test(formData.password) ? 'success.main' : 'text.secondary',
                                fontSize: '0.7rem'
                              }}
                            >
                              {t('auth.passwordNeedsUpperCase')}
                            </Typography>
                          </Box>
                          {/* 小写字母 */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                            {/[a-z]/.test(formData.password) ? (
                              <CheckCircleIcon sx={{ fontSize: '0.85rem', color: 'success.main' }} />
                            ) : (
                              <CancelIcon sx={{ fontSize: '0.85rem', color: 'text.disabled' }} />
                            )}
                            <Typography
                              variant="caption"
                              sx={{
                                color: /[a-z]/.test(formData.password) ? 'success.main' : 'text.secondary',
                                fontSize: '0.7rem'
                              }}
                            >
                              {t('auth.passwordNeedsLowerCase')}
                            </Typography>
                          </Box>
                          {/* 数字 */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                            {/[0-9]/.test(formData.password) ? (
                              <CheckCircleIcon sx={{ fontSize: '0.85rem', color: 'success.main' }} />
                            ) : (
                              <CancelIcon sx={{ fontSize: '0.85rem', color: 'text.disabled' }} />
                            )}
                            <Typography
                              variant="caption"
                              sx={{
                                color: /[0-9]/.test(formData.password) ? 'success.main' : 'text.secondary',
                                fontSize: '0.7rem'
                              }}
                            >
                              {t('auth.passwordNeedsNumber')}
                            </Typography>
                          </Box>
                          {/* 特殊字符 */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                            {/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? (
                              <CheckCircleIcon sx={{ fontSize: '0.85rem', color: 'success.main' }} />
                            ) : (
                              <CancelIcon sx={{ fontSize: '0.85rem', color: 'text.disabled' }} />
                            )}
                            <Typography
                              variant="caption"
                              sx={{
                                color: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'success.main' : 'text.secondary',
                                fontSize: '0.7rem'
                              }}
                            >
                              {t('auth.passwordNeedsSpecialChar')}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Fade>
                  )}
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('auth.merchantRegisterPage.adminInfo.confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                required
                error={touchedFields.confirmPassword && !!validationErrors.confirmPassword}
                helperText={touchedFields.confirmPassword && validationErrors.confirmPassword ? validationErrors.confirmPassword : '\u00A0'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#667eea' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                        sx={{ color: '#667eea' }}
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={textFieldSx}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('auth.merchantRegisterPage.merchantInfo.merchantName')}
                value={formData.merchantName}
                onChange={handleInputChange('merchantName')}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon sx={{ color: '#667eea' }} />
                    </InputAdornment>
                  ),
                }}
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required sx={selectSx}>
                <InputLabel>{t('auth.merchantRegisterPage.merchantInfo.businessCategory')}</InputLabel>
                <Select
                  value={formData.businessCategory}
                  onChange={handleInputChange('businessCategory')}
                  label={t('auth.merchantRegisterPage.merchantInfo.businessCategory')}
                >
                  {businessCategories.map((category) => (
                    <MenuItem key={category.value} value={category.value}>
                      {category.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('auth.merchantRegisterPage.merchantInfo.businessLicense')}
                value={formData.businessLicense}
                onChange={handleInputChange('businessLicense')}
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('auth.merchantRegisterPage.merchantInfo.contactPerson')}
                value={formData.contactPerson}
                onChange={handleInputChange('contactPerson')}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: '#667eea' }} />
                    </InputAdornment>
                  ),
                }}
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ mt: 2, mb: 1 }}>
                <Grid container spacing={1}>
                  <Grid item xs={5}>
                    <CountryCodeSelector
                      value={formData.contactPhoneCountryCode}
                      onChange={(code) => setFormData(prev => ({ ...prev, contactPhoneCountryCode: code }))}
                      label={t('common.countryCode')}
                      size="medium"
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={7}>
                    <TextField
                      fullWidth
                      label={t('auth.merchantRegisterPage.merchantInfo.contactPhone')}
                      value={formData.contactPhone}
                      onChange={handleInputChange('contactPhone')}
                      required
                      error={touchedFields.contactPhone && !!validationErrors.contactPhone}
                      helperText={touchedFields.contactPhone && validationErrors.contactPhone ? validationErrors.contactPhone : '\u00A0'}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon sx={{ color: '#667eea' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={textFieldSx}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ mt: 2, mb: 1 }}>
                <TextField
                  fullWidth
                  label={t('auth.merchantRegisterPage.merchantInfo.contactEmail')}
                  type="email"
                  value={formData.contactEmail}
                  onChange={handleInputChange('contactEmail')}
                  error={touchedFields.contactEmail && !!validationErrors.contactEmail}
                  helperText={touchedFields.contactEmail && validationErrors.contactEmail ? validationErrors.contactEmail : '\u00A0'}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon sx={{ color: '#667eea' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={textFieldSx}
                />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('auth.merchantRegisterPage.merchantInfo.address')}
                value={formData.address}
                onChange={handleInputChange('address')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationIcon sx={{ color: '#667eea' }} />
                    </InputAdornment>
                  ),
                }}
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth sx={selectSx}>
                <InputLabel>{t('auth.merchantRegisterPage.merchantInfo.province')}</InputLabel>
                <Select
                  value={formData.province}
                  onChange={handleInputChange('province')}
                  label={t('auth.merchantRegisterPage.merchantInfo.province')}
                >
                  {canadianProvinces.map((province) => (
                    <MenuItem key={province.value} value={province.value}>
                      {province.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label={t('auth.merchantRegisterPage.merchantInfo.city')}
                value={formData.city}
                onChange={handleInputChange('city')}
                sx={textFieldSx}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label={t('auth.merchantRegisterPage.merchantInfo.postCode')}
                value={formData.postCode}
                onChange={handleInputChange('postCode')}
                sx={textFieldSx}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required sx={selectSx}>
                <InputLabel>{t('auth.merchantRegisterPage.merchantInfo.timezone')}</InputLabel>
                <Select
                  value={formData.timezone}
                  onChange={handleInputChange('timezone')}
                  label={t('auth.merchantRegisterPage.merchantInfo.timezone')}
                  startAdornment={
                    <InputAdornment position="start">
                      <ScheduleIcon sx={{ color: '#667eea' }} />
                    </InputAdornment>
                  }
                >
                  {timezones.map((tz) => (
                    <MenuItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{
                p: 3,
                borderRadius: 2,
                border: '1px solid',
                borderColor: alpha('#667eea', 0.2),
                background: alpha('#667eea', 0.03)
              }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
                  {t('auth.merchantRegisterPage.businessConfig.resourceTypes')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Chip
                    label={t('auth.merchantRegisterPage.resourceTypes.staff')}
                    size="medium"
                    sx={{
                      backgroundColor: alpha('#667eea', 0.15),
                      color: '#667eea',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      px: 1,
                    }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  {t('auth.merchantRegisterPage.businessConfig.resourceTypesInfo')}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  // 成功对话框
  const SuccessDialog = () => (
    <Dialog 
      open={showSuccessDialog} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pt: 4, pb: 2 }}>
        <Box sx={{ mb: 2 }}>
          <CheckCircleIcon
            sx={{
              fontSize: 64,
              color: 'success.main',
              filter: 'drop-shadow(0 4px 8px rgba(76, 175, 80, 0.3))'
            }}
          />
        </Box>
        <Typography variant="h4" component="div" sx={{ fontWeight: 700, color: 'success.main' }}>
          {t('auth.merchantRegisterPage.success.title')}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ textAlign: 'center', px: 4, py: 2 }}>
        <Alert 
          severity="success" 
          sx={{ 
            mb: 3,
            borderRadius: 2,
            '& .MuiAlert-icon': {
              fontSize: '1.5rem',
            }
          }}
        >
          {t('auth.merchantRegisterPage.success.message')}
        </Alert>
        
        {/* 租户代码 */}
        <Box sx={{ 
          p: 3, 
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          borderRadius: 3, 
          mb: 2,
          border: '2px dashed #0ea5e9',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
            {t('auth.merchantRegisterPage.success.tenantCodeLabel')}
          </Typography>
          <Typography
            variant="h5"
            sx={{
              fontFamily: 'monospace',
              fontWeight: 700,
              color: '#0ea5e9',
              letterSpacing: 2,
              mb: 2,
              position: 'relative',
              zIndex: 1,
            }}
          >
            {tenantCode}
          </Typography>
          <Button
            startIcon={<CopyIcon />}
            onClick={handleCopyTenantCode}
            variant={copiedTenantCode ? "contained" : "outlined"}
            size="medium"
            color={copiedTenantCode ? 'success' : 'primary'}
            disabled={copiedTenantCode}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              position: 'relative',
              zIndex: 1,
              transition: 'all 0.2s ease-in-out',
              ...(copiedTenantCode ? {
                backgroundColor: 'success.main',
                color: 'white',
                '&:disabled': {
                  backgroundColor: 'success.main',
                  color: 'white',
                  opacity: 1,
                }
              } : {
                borderColor: '#0ea5e9',
                color: '#0ea5e9',
                '&:hover': {
                  borderColor: '#0284c7',
                  backgroundColor: alpha('#0ea5e9', 0.04),
                }
              })
            }}
          >
            {copiedTenantCode ? t('common.copied') : t('auth.merchantRegisterPage.success.copyTenantCode')}
          </Button>
        </Box>

        {/* 邀请码 */}
        <Box sx={{
          p: 3,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          borderRadius: 3,
          mb: 3,
          border: '2px dashed #667eea',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
            {t('auth.merchantRegisterPage.success.invitationCodeLabel')}
          </Typography>
          <Typography
            variant="h5"
            sx={{
              fontFamily: 'monospace',
              fontWeight: 700,
              color: '#667eea',
              letterSpacing: 2,
              mb: 2,
              position: 'relative',
              zIndex: 1,
            }}
          >
            {invitationCode}
          </Typography>
          <Button
            startIcon={<CopyIcon />}
            onClick={handleCopyInvitationCode}
            variant={copiedInvitationCode ? "contained" : "outlined"}
            size="medium"
            color={copiedInvitationCode ? 'success' : 'primary'}
            disabled={copiedInvitationCode}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              position: 'relative',
              zIndex: 1,
              transition: 'all 0.2s ease-in-out',
              ...(copiedInvitationCode ? {
                backgroundColor: 'success.main',
                color: 'white',
                '&:disabled': {
                  backgroundColor: 'success.main',
                  color: 'white',
                  opacity: 1,
                }
              } : {
                borderColor: '#667eea',
                color: '#667eea',
                '&:hover': {
                  borderColor: '#5a6fd8',
                  backgroundColor: alpha('#667eea', 0.04),
                }
              })
            }}
          >
            {copiedInvitationCode ? t('common.copied') : t('auth.merchantRegisterPage.success.copyInvitationCode')}
          </Button>
        </Box>

        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
          {t('auth.merchantRegisterPage.success.confirmCopiedMessage')}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', p: 4, pt: 2 }}>
        <Button
          onClick={handleGoToLogin}
          variant="contained"
          disabled={!copiedInvitationCode || !copiedTenantCode}
          size="large"
          sx={{
            px: 4,
            py: 1.5,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '1.1rem',
            background: (copiedInvitationCode && copiedTenantCode)
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : alpha('#667eea', 0.3),
            '&:hover': {
              background: copiedInvitationCode
                ? 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
                : alpha('#667eea', 0.3),
            },
            '&:disabled': {
              color: 'rgba(255, 255, 255, 0.7)',
            }
          }}
        >
          {t('auth.merchantRegisterPage.success.goToLogin')}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        position: 'relative',
      }}
    >
      {/* 语言切换器 - 固定在右上角 */}
      <Box
        sx={{
          position: 'absolute',
          top: 24,
          right: 24,
          zIndex: 1000,
        }}
      >
        <LanguageSwitcher variant="login" size="medium" />
      </Box>

      <Container maxWidth="lg">
        <Fade in timeout={1000}>
          <Card
            sx={{
              maxWidth: 900,
              width: '100%',
              mx: 'auto',
              borderRadius: 4,
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <CardContent sx={{ p: 0 }}>
              {/* 头部区域 */}
              <Box
                sx={{
                  background: 'transparent', // 使用透明背景，继承卡片背景
                  color: 'text.primary',
                  p: 3,
                  textAlign: 'center',
                  borderBottom: '1px solid rgba(0,0,0,0.08)',
                }}
              >
                {/* VA Logo */}
                <Box sx={{ mb: 2 }}>
                  <Typography
                    sx={{
                      fontSize: '3rem',
                      fontWeight: 800,
                      fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      letterSpacing: '-0.04em',
                      lineHeight: 1,
                      background: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      MozBackgroundClip: 'text',
                      MozTextFillColor: 'transparent',
                      display: 'inline-block',
                    }}
                  >
                    VA
                  </Typography>
                  <Box
                    sx={{
                      width: '60px',
                      height: '3px',
                      background: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)',
                      borderRadius: '1.5px',
                      margin: '0 auto',
                      mt: 0.5,
                    }}
                  />
                </Box>
                <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
                  {t('auth.merchantRegisterPage.title')}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {t('auth.merchantRegisterPage.subtitle')}
                </Typography>
              </Box>

              <Box sx={{ p: 4 }}>
                {/* 进度指示器 */}
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('common.step')} {activeStep + 1} {t('common.of')} {steps.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {Math.round(((activeStep + 1) / steps.length) * 100)}% {t('common.complete')}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={((activeStep + 1) / steps.length) * 100}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: alpha('#667eea', 0.1),
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: 4,
                      }
                    }}
                  />
                </Box>

                {/* 步骤指示器 */}
                <Stepper
                  activeStep={activeStep}
                  sx={{
                    mb: 4,
                    '& .MuiStepLabel-root .Mui-completed': {
                      color: '#667eea',
                    },
                    '& .MuiStepLabel-root .Mui-active': {
                      color: '#764ba2',
                    },
                  }}
                >
                  {steps.map((label, index) => (
                    <Step key={label}>
                      <StepLabel
                        StepIconComponent={({ active, completed }) => (
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: completed
                                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                : active
                                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                  : alpha('#667eea', 0.1),
                              color: completed || active ? 'white' : '#667eea',
                              fontWeight: 'bold',
                              fontSize: '0.875rem',
                            }}
                          >
                            {completed ? (
                              <CheckCircleIcon sx={{ fontSize: 20 }} />
                            ) : active ? (
                              index === 0 ? <PersonIcon sx={{ fontSize: 20 }} /> :
                                index === 1 ? <BusinessIcon sx={{ fontSize: 20 }} /> :
                                  <SettingsIcon sx={{ fontSize: 20 }} />
                            ) : (
                              index + 1
                            )}
                          </Box>
                        )}
                      >
                        <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
                          {label}
                        </Typography>
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>

                {error && (
                  <Slide direction="down" in={!!error}>
                    <Alert
                      severity="error"
                      sx={{
                        mb: 3,
                        borderRadius: 2,
                        '& .MuiAlert-icon': {
                          fontSize: '1.5rem',
                        }
                      }}
                    >
                      {error}
                    </Alert>
                  </Slide>
                )}

                {/* 表单内容区域 */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    mb: 4,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: alpha('#667eea', 0.1),
                    background: alpha('#667eea', 0.02),
                  }}
                >
                  <Slide direction="left" in timeout={500} key={activeStep}>
                    <Box>
                      {renderStepContent(activeStep)}
                    </Box>
                  </Slide>
                </Paper>

                {/* 底部按钮区域 */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Button
                    disabled={activeStep === 0}
                    onClick={handleBack}
                    sx={{
                      px: 3,
                      py: 1.5,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    {t('common.previous')}
                  </Button>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button
                      variant="text"
                      onClick={onBack || (() => window.location.href = '/')}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        color: '#667eea',
                        '&:hover': {
                          backgroundColor: alpha('#667eea', 0.04),
                        },
                      }}
                    >
                      {t('auth.merchantRegisterPage.alreadyHaveAccount')}
                    </Button>

                    {activeStep === steps.length - 1 ? (
                      <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={loading}
                        sx={{
                          px: 3,
                          py: 1,
                          textTransform: 'none',
                          fontWeight: 500,
                        }}
                      >
                        {loading ? t('auth.merchantRegisterPage.registering') : t('auth.merchantRegisterPage.finish')}
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        onClick={handleNext}
                        sx={{
                          px: 3,
                          py: 1,
                          textTransform: 'none',
                          fontWeight: 500,
                        }}
                      >
                        {t('common.next')}
                      </Button>
                    )}
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Fade>
      </Container>

      {/* 成功对话框 */}
      <Dialog
        open={showSuccessDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pt: 4, pb: 2 }}>
          <Box sx={{ mb: 2 }}>
            <CheckCircleIcon
              sx={{
                fontSize: 64,
                color: 'success.main',
              }}
            />
          </Box>
          <Typography variant="h5" component="div" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {t('auth.merchantRegisterPage.success.title')}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', px: 4, py: 2 }}>
          <Alert
            severity="success"
            sx={{
              mb: 3,
              borderRadius: 2,
              '& .MuiAlert-icon': {
                fontSize: '1.5rem',
              }
            }}
          >
            {t('auth.merchantRegisterPage.success.message')}
          </Alert>

          {/* 审核提示 */}
          <Alert
            severity="warning"
            sx={{
              mb: 3,
              borderRadius: 2,
              textAlign: 'left',
              '& .MuiAlert-icon': {
                fontSize: '1.5rem',
              }
            }}
          >
            {t('auth.merchantRegisterPage.success.approvalNotice')}
          </Alert>

          {/* 租户代码 */}
          <Box sx={{
            p: 3,
            backgroundColor: '#f8fafc',
            borderRadius: 2,
            mb: 2,
            border: '1px solid #e2e8f0',
          }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
              {t('auth.merchantRegisterPage.success.tenantCodeLabel')}
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontFamily: 'monospace',
                fontWeight: 600,
                color: 'text.primary',
                mb: 2,
              }}
            >
              {tenantCode || 'Loading...'}
            </Typography>
            <Button
              startIcon={<CopyIcon />}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleCopyTenantCode();
              }}
              variant={copiedTenantCode ? "contained" : "outlined"}
              size="small"
              color={copiedTenantCode ? 'success' : 'primary'}
              disabled={copiedTenantCode || !tenantCode}
              sx={{
                textTransform: 'none',
                fontWeight: 500,
              }}
            >
              {copiedTenantCode ? t('common.copied') : t('auth.merchantRegisterPage.success.copyTenantCode')}
            </Button>
          </Box>

          {/* 邀请码 */}
          <Box sx={{
            p: 3,
            backgroundColor: '#f8fafc',
            borderRadius: 2,
            mb: 3,
            border: '1px solid #e2e8f0',
          }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
              {t('auth.merchantRegisterPage.success.invitationCodeLabel')}
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontFamily: 'monospace',
                fontWeight: 600,
                color: 'text.primary',
                mb: 2,
              }}
            >
              {invitationCode || 'Loading...'}
            </Typography>
            <Button
              startIcon={<CopyIcon />}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleCopyInvitationCode();
              }}
              variant={copiedInvitationCode ? "contained" : "outlined"}
              size="small"
              color={copiedInvitationCode ? 'success' : 'primary'}
              disabled={copiedInvitationCode || !invitationCode}
              sx={{
                textTransform: 'none',
                fontWeight: 500,
              }}
            >
              {copiedInvitationCode ? t('common.copied') : t('auth.merchantRegisterPage.success.copyInvitationCode')}
            </Button>
          </Box>

          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
            {t('auth.merchantRegisterPage.success.confirmCopiedMessage')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', p: 3 }}>
          <Button
            onClick={handleGoToLogin}
            variant="contained"
            disabled={!copiedInvitationCode || !copiedTenantCode}
            sx={{
              px: 4,
              py: 1,
              textTransform: 'none',
              fontWeight: 500,
            }}
          >
            {t('auth.merchantRegisterPage.success.goToLogin')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MerchantRegisterPage;