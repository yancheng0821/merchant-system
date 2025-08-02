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
  Schedule as ScheduleIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckCircleIcon,
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

const MerchantRegisterPage: React.FC = () => {
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [invitationCode, setInvitationCode] = useState<string>('');
  const [tenantCode, setTenantCode] = useState<string>('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [copiedInvitationCode, setCopiedInvitationCode] = useState(false);
  const [copiedTenantCode, setCopiedTenantCode] = useState(false);
  
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
    timezone: 'America/Toronto',
    resourceTypes: [],
  });

  const steps = [
    t('auth.merchantRegisterPage.steps.adminInfo'),
    t('auth.merchantRegisterPage.steps.merchantInfo'),
    t('auth.merchantRegisterPage.steps.businessConfig')
  ];

  const businessCategories = [
    { value: 'beauty', label: t('auth.merchantRegisterPage.businessCategories.beauty') },
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
    { value: 'America/Toronto', label: t('auth.merchantRegisterPage.timezones.america_toronto') },
    { value: 'America/Vancouver', label: t('auth.merchantRegisterPage.timezones.america_vancouver') },
    { value: 'America/Edmonton', label: t('auth.merchantRegisterPage.timezones.america_edmonton') },
    { value: 'America/Winnipeg', label: t('auth.merchantRegisterPage.timezones.america_winnipeg') }
  ];

  const canadianProvinces = [
    { value: 'AB', label: t('auth.merchantRegisterPage.provinces.AB') },
    { value: 'BC', label: t('auth.merchantRegisterPage.provinces.BC') },
    { value: 'MB', label: t('auth.merchantRegisterPage.provinces.MB') },
    { value: 'NB', label: t('auth.merchantRegisterPage.provinces.NB') },
    { value: 'NL', label: t('auth.merchantRegisterPage.provinces.NL') },
    { value: 'NS', label: t('auth.merchantRegisterPage.provinces.NS') },
    { value: 'ON', label: t('auth.merchantRegisterPage.provinces.ON') },
    { value: 'PE', label: t('auth.merchantRegisterPage.provinces.PE') },
    { value: 'QC', label: t('auth.merchantRegisterPage.provinces.QC') },
    { value: 'SK', label: t('auth.merchantRegisterPage.provinces.SK') },
    { value: 'NT', label: t('auth.merchantRegisterPage.provinces.NT') },
    { value: 'NU', label: t('auth.merchantRegisterPage.provinces.NU') },
    { value: 'YT', label: t('auth.merchantRegisterPage.provinces.YT') }
  ];

  const handleInputChange = (field: keyof MerchantRegisterData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const handleResourceTypeChange = (event: any) => {
    const value = event.target.value as string[];
    setFormData(prev => ({
      ...prev,
      resourceTypes: value
    }));
  };

  // 验证邮箱格式
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 验证手机号格式（简单验证）
  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^\d{10,15}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
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
        if (!validateEmail(formData.email)) {
          setError(t('auth.merchantRegisterPage.validation.emailInvalid'));
          return false;
        }
        if (!formData.realName.trim()) {
          setError(t('auth.merchantRegisterPage.validation.realNameRequired'));
          return false;
        }
        if (formData.phone && !validatePhone(formData.phone)) {
          setError(t('auth.merchantRegisterPage.validation.phoneInvalid'));
          return false;
        }
        if (!formData.password) {
          setError(t('auth.merchantRegisterPage.validation.passwordRequired'));
          return false;
        }
        if (formData.password.length < 6) {
          setError(t('auth.merchantRegisterPage.validation.passwordMinLength'));
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
        if (!validatePhone(formData.contactPhone)) {
          setError(t('auth.merchantRegisterPage.validation.contactPhoneInvalid'));
          return false;
        }
        if (formData.contactEmail && !validateEmail(formData.contactEmail)) {
          setError(t('auth.merchantRegisterPage.validation.contactEmailInvalid'));
          return false;
        }
        break;
        
      case 2: // 业务配置
        if (formData.resourceTypes.length === 0) {
          setError(t('auth.merchantRegisterPage.validation.resourceTypesRequired'));
          return false;
        }
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
      
      console.log('完整响应:', response);
      
      if (response.success && response.data) {
        console.log('商户注册响应数据:', response.data);
        console.log('邀请码:', response.data.invitationCode);
        console.log('租户代码:', response.data.tenantCode);
        console.log('所有字段:', Object.keys(response.data));
        
        const invCode = response.data.invitationCode || '';
        const tenCode = response.data.tenantCode || '';
        
        console.log('设置的邀请码:', invCode);
        console.log('设置的租户代码:', tenCode);
        
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
    // 通过 window.location 跳转到登录页面，因为这是一个独立的页面
    window.location.href = '/';
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
              <Box sx={{ mt: 2, mb: 1 }}>
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
              <TextField
                fullWidth
                label={t('auth.merchantRegisterPage.adminInfo.password')}
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange('password')}
                required
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
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('auth.merchantRegisterPage.adminInfo.confirmPassword')}
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#667eea' }} />
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
              <TextField
                fullWidth
                label={t('auth.merchantRegisterPage.merchantInfo.contactEmail')}
                type="email"
                value={formData.contactEmail}
                onChange={handleInputChange('contactEmail')}
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
              <FormControl fullWidth required sx={selectSx}>
                <InputLabel>{t('auth.merchantRegisterPage.businessConfig.resourceTypes')}</InputLabel>
                <Select
                  multiple
                  value={formData.resourceTypes}
                  onChange={handleResourceTypeChange}
                  label={t('auth.merchantRegisterPage.businessConfig.resourceTypes')}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const option = resourceTypeOptions.find(opt => opt.value === value);
                        return (
                          <Chip 
                            key={value} 
                            label={option?.label} 
                            size="small"
                            sx={{
                              backgroundColor: alpha('#667eea', 0.1),
                              color: '#667eea',
                              fontWeight: 500,
                            }}
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {resourceTypeOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                {t('auth.merchantRegisterPage.businessConfig.resourceTypesHelp')}
              </Typography>
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
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
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
                <BusinessIcon sx={{ fontSize: 40, mb: 1.5, color: '#667eea' }} />
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
                      onClick={() => window.location.href = '/'}
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
                          px: 4,
                          py: 1.5,
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: '1rem',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                          },
                          '&:disabled': {
                            background: alpha('#667eea', 0.3),
                          }
                        }}
                      >
                        {loading ? t('auth.merchantRegisterPage.registering') : t('auth.merchantRegisterPage.finish')}
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        onClick={handleNext}
                        sx={{
                          px: 4,
                          py: 1.5,
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: '1rem',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                          },
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
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
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
              size="medium"
              color={copiedTenantCode ? 'success' : 'primary'}
              disabled={copiedTenantCode || !tenantCode}
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
              size="medium"
              color={copiedInvitationCode ? 'success' : 'primary'}
              disabled={copiedInvitationCode || !invitationCode}
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
                background: (copiedInvitationCode && copiedTenantCode)
                  ? 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
                  : alpha('#667eea', 0.3),
              },
              '&:disabled': {
                background: alpha('#667eea', 0.3),
                color: 'rgba(255, 255, 255, 0.5)',
              }
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