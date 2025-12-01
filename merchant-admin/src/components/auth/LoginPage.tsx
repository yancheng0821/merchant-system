import React, { useState } from 'react';
import { flushSync } from 'react-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Grid,
  Snackbar,
  Chip,
  alpha,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  EventAvailable as EventIcon,
  AllInclusive as InfiniteIcon,
  Notifications as NotificationIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import MerchantRegisterPage from './MerchantRegisterPage';
import ForgotPasswordPage from './ForgotPasswordPage';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../common/LanguageSwitcher';
import HelpTooltip from '../common/HelpTooltip';
import CountryCodeSelector from '../common/CountryCodeSelector';
import { authApi } from '../../services/api';
import TermsOfServiceCheckbox from './TermsOfServiceCheckbox';


interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  realName: string;
  phone: string;
  phoneCountryCode: string;
  invitationCode: string;
  acceptedTerms: boolean;
}

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const { login, register, loading, error, clearError, setError } = useAuth();

  // 从 sessionStorage 恢复 pageMode，避免刷新后丢失状态
  const getInitialPageMode = (): 'login' | 'register' | 'merchantRegister' | 'forgotPassword' | '2fa' => {
    const savedMode = sessionStorage.getItem('authPageMode');
    if (savedMode && ['login', 'register', 'merchantRegister', 'forgotPassword', '2fa'].includes(savedMode)) {
      return savedMode as 'login' | 'register' | 'merchantRegister' | 'forgotPassword' | '2fa';
    }
    return 'login';
  };

  const [pageMode, setPageMode] = useState<'login' | 'register' | 'merchantRegister' | 'forgotPassword' | '2fa'>(getInitialPageMode());
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState<string>('');
  const [displayedError, setDisplayedError] = useState<string>('');
  const [displayedSuccess, setDisplayedSuccess] = useState<string>('');
  const [twoFactorData, setTwoFactorData] = useState<{
    userId: number;
    phone: string;
    tenantId: number;
    verificationId?: string;
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [sending2FA, setSending2FA] = useState(false);

  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
    tenantCode: ''
  });

  // 初始化空的注册表单数据
  const [registerData, setRegisterData] = useState<RegisterData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    realName: '',
    phone: '',
    phoneCountryCode: '+1-CA',
    invitationCode: '',
    acceptedTerms: false
  });

  // 实时验证状态
  const [validationErrors, setValidationErrors] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  // 跟踪字段是否已被用户触摸过
  const [touchedFields, setTouchedFields] = useState({
    email: false,
    phone: false,
    password: false,
    confirmPassword: false,
  });

  // 移除这个会立即清除错误信息的useEffect
  // useEffect(() => {
  //   if (error) {
  //     clearError();
  //   }
  // }, [isLogin, error, clearError]);

  // 保存 pageMode 到 sessionStorage，避免刷新后丢失
  React.useEffect(() => {
    sessionStorage.setItem('authPageMode', pageMode);
  }, [pageMode]);

  // 当 twoFactorData 被设置时，自动切换到 2FA 模式（备用机制）
  React.useEffect(() => {
    if (twoFactorData && twoFactorData.verificationId && pageMode !== '2fa') {
      setPageMode('2fa');
    }
  }, [twoFactorData, pageMode]);

  // 同步 error 到 displayedError（用于 Snackbar 显示）
  React.useEffect(() => {
    if (error) {
      setDisplayedError(error);
    }
  }, [error]);

  // 同步 success 到 displayedSuccess（用于 Snackbar 显示）
  React.useEffect(() => {
    if (success) {
      setDisplayedSuccess(success);
    }
  }, [success]);

  // 错误消息自动消失（3秒后）
  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // 成功消息自动消失（3秒后）
  React.useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
        // 成功后清除 sessionStorage，因为即将跳转
        sessionStorage.removeItem('authPageMode');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);


  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLoginData({
      ...loginData,
      [e.target.name]: newValue
    });
    // 只在用户开始输入时清除错误，而不是每次输入都清除
    if (error && newValue.length === 1) {
      clearError();
    }
  };

  // 验证函数
  const validateEmailFormat = (email: string): string => {
    if (!email) return '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return t('auth.emailInvalid') || 'Invalid email format';
    }
    return '';
  };

  const validatePhoneFormat = (phone: string): string => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 6 || cleaned.length > 15) {
      return t('auth.phoneInvalid') || 'Phone number must be 6-15 digits';
    }
    return '';
  };

  const validatePasswordStrength = (password: string): string => {
    if (!password) return '';

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;

    if (!isLongEnough) {
      return t('auth.passwordMinLength') || 'Password must be at least 8 characters';
    }
    if (!hasUpperCase) {
      return t('auth.passwordNeedsUpperCase') || 'Password must contain at least one uppercase letter';
    }
    if (!hasLowerCase) {
      return t('auth.passwordNeedsLowerCase') || 'Password must contain at least one lowercase letter';
    }
    if (!hasNumber) {
      return t('auth.passwordNeedsNumber') || 'Password must contain at least one number';
    }
    if (!hasSpecialChar) {
      return t('auth.passwordNeedsSpecialChar') || 'Password must contain at least one special character';
    }
    return '';
  };

  const validateConfirmPasswordMatch = (password: string, confirmPassword: string): string => {
    if (!confirmPassword) return '';
    if (password !== confirmPassword) {
      return t('auth.passwordMismatch') || 'Passwords do not match';
    }
    return '';
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const fieldName = e.target.name;

    const updatedData = {
      ...registerData,
      [fieldName]: newValue
    };
    setRegisterData(updatedData);

    // 标记字段为已触摸
    const validationFields = ['email', 'phone', 'password', 'confirmPassword'];
    if (validationFields.includes(fieldName)) {
      setTouchedFields(prev => ({
        ...prev,
        [fieldName]: true,
      }));
    }

    // 实时验证
    if (fieldName === 'email') {
      const emailError = validateEmailFormat(newValue);
      setValidationErrors(prev => ({
        ...prev,
        email: emailError,
      }));
    } else if (fieldName === 'phone') {
      const phoneError = validatePhoneFormat(newValue);
      setValidationErrors(prev => ({
        ...prev,
        phone: phoneError,
      }));
    } else if (fieldName === 'password') {
      const passwordError = validatePasswordStrength(newValue);
      const confirmPasswordError = touchedFields.confirmPassword
        ? validateConfirmPasswordMatch(newValue, updatedData.confirmPassword)
        : '';
      setValidationErrors(prev => ({
        ...prev,
        password: passwordError,
        confirmPassword: confirmPasswordError,
      }));
    } else if (fieldName === 'confirmPassword') {
      const confirmPasswordError = validateConfirmPasswordMatch(updatedData.password, newValue);
      setValidationErrors(prev => ({
        ...prev,
        confirmPassword: confirmPasswordError,
      }));
    }

    // 只在用户开始输入时清除错误，而不是每次输入都清除
    if (error && newValue.length === 1) {
      clearError();
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 清除之前的错误和成功信息
    clearError();
    setSuccess('');

    // 表单验证
    if (!loginData.username.trim()) {
      setError(t('auth.usernameRequired') || '用户名不能为空');
      return;
    }

    if (!loginData.tenantCode.trim()) {
      setError(t('auth.tenantCodeRequired') || '租户代码不能为空');
      return;
    }

    if (!loginData.password.trim()) {
      setError(t('auth.passwordRequired') || '密码不能为空');
      return;
    }

    const result = await login(loginData.username, loginData.password, loginData.tenantCode);

    // 检查是否需要2FA验证
    if (typeof result === 'object' && result.need2FA) {
      // 自动发送2FA验证码
      await send2FACode(result.userId, result.phone, result.tenantId);
    } else if (result === true) {
      setSuccess(t('auth.loginSuccess') || '登录成功');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 清除之前的错误和成功信息
    clearError();
    setSuccess('');

    // 表单验证
    if (!registerData.username.trim()) {
      setError(t('auth.usernameRequired') || '用户名不能为空');
      return;
    }

    if (!registerData.email.trim()) {
      setError(t('auth.emailRequired') || '邮箱不能为空');
      return;
    }

    if (!validateEmail(registerData.email)) {
      setError(t('auth.emailInvalid') || '邮箱格式不正确');
      return;
    }

    if (!registerData.realName.trim()) {
      setError(t('auth.realNameRequired') || '真实姓名不能为空');
      return;
    }

    if (!registerData.phone.trim()) {
      setError(t('auth.phoneRequired') || '手机号不能为空');
      return;
    }

    // 验证手机号格式
    const phoneError = validatePhoneFormat(registerData.phone);
    if (phoneError) {
      setError(phoneError);
      return;
    }

    if (!registerData.invitationCode.trim()) {
      setError(t('auth.invitationCodeRequired') || '邀请码不能为空');
      return;
    }

    if (!registerData.password) {
      setError(t('auth.passwordRequired') || '密码不能为空');
      return;
    }

    if (registerData.password.length < 6) {
      setError(t('auth.passwordTooShort') || '密码长度至少6位');
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setError(t('auth.passwordMismatch') || '两次输入的密码不一致');
      return;
    }

    if (!registerData.acceptedTerms) {
      setError(t('auth.termsRequired') || '您必须同意服务条款');
      return;
    }

    // 合并电话号码和国家代码
    const getDialCode = (dialCode: string) => dialCode.replace(/-[A-Z]{2}$/, '');
    const fullPhoneNumber = registerData.phone ?
      getDialCode(registerData.phoneCountryCode) + registerData.phone : '';

    const success = await register({
      username: registerData.username,
      email: registerData.email,
      password: registerData.password,
      realName: registerData.realName,
      phone: fullPhoneNumber,
      invitationCode: registerData.invitationCode
    });

    if (success) {
      setSuccess(t('auth.registerSuccess') || '注册成功');
      // 注册成功后，AuthContext 会自动设置 user 状态
      // App.tsx 会检测到 user 存在并自动显示主应用界面
      // 不需要手动跳转，避免额外的页面刷新
    }
  };


  // 发送2FA验证码
  const send2FACode = async (userId: number, phone: string, tenantId: number) => {
    setSending2FA(true);
    clearError();

    try {
      const result = await authApi.send2FACode(userId, tenantId);

      if (result.success && result.data?.success) {
        // 使用 flushSync 强制同步更新所有状态
        flushSync(() => {
          setTwoFactorData({
            userId,
            phone,
            tenantId,
            verificationId: result.data.verificationId,
          });
          setSuccess(t('auth.verificationCodeSent') || '验证码已发送');
          setSending2FA(false);
        });

        // 在单独的 flushSync 中切换页面模式，确保前面的状态都已更新
        flushSync(() => {
          setPageMode('2fa');
        });
      } else {
        setError(result.data?.message || result.message || t('auth.sendCodeFailed'));
        setSending2FA(false);
      }
    } catch (err) {
      setError(t('auth.sendCodeError') || '发送验证码失败');
      setSending2FA(false);
    }
  };

  // 验证2FA验证码
  const verify2FACode = async () => {
    if (!twoFactorData || !verificationCode) {
      setError(t('auth.codeRequired') || '请输入验证码');
      return;
    }

    clearError();

    try {
      const result = await authApi.verify2FACode(
        twoFactorData.userId,
        verificationCode,
        twoFactorData.verificationId || '', // Provide default empty string if undefined
        twoFactorData.tenantId
      );

      if (result.success && result.data) {
        // 保存 token 和 refreshToken
        localStorage.setItem('token', result.data.token);
        localStorage.setItem('refreshToken', result.data.refreshToken);

        // 构建用户对象并保存到 localStorage
        // LoginResponse 的用户信息直接在 data 中，不是嵌套的
        const user = {
          id: result.data.userId,
          username: result.data.username,
          realName: result.data.realName,
          email: result.data.email,
          avatar: result.data.avatar,
          tenantId: result.data.tenantId,
          tenantName: result.data.tenantName,
          roles: result.data.roles || [],
          permissions: result.data.permissions || [],
          lastLoginTime: result.data.lastLoginTime,
        };
        localStorage.setItem('user', JSON.stringify(user));

        setSuccess(t('auth.loginSuccess') || '登录成功');

        // 延迟刷新，让用户看到成功消息
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 500);
      } else {
        // 优化错误消息显示
        let errorMessage = result.message || t('auth.verificationFailed');

        // 如果有剩余尝试次数，显示更友好的提示
        // remainingAttempts might be in the data field or as part of the response
        const remainingAttempts = (result as any).remainingAttempts || result.data?.remainingAttempts;
        if (remainingAttempts !== undefined && remainingAttempts > 0) {
          errorMessage = result.message || `${t('auth.incorrectCode')} ${t('auth.attemptsRemaining')}: ${remainingAttempts}`;
        } else if (remainingAttempts === 0) {
          errorMessage = result.message || t('auth.maxAttemptsExceeded');
        }

        setError(errorMessage);
      }
    } catch (err: any) {
      console.error('2FA verification error:', err);

      // 尝试从错误对象中提取有用的信息
      let errorMessage = t('auth.verificationError') || '验证失败';

      if (err.message) {
        // 直接使用错误消息，因为后端已经返回了格式化好的错误消息
        errorMessage = err.message;
      }

      setError(errorMessage);
    }
  };

  // 如果是商户注册模式，直接返回商户注册页面
  if (pageMode === 'merchantRegister') {
    return <MerchantRegisterPage onBack={() => setPageMode('login')} />;
  }

  // 如果是忘记密码模式，直接返回忘记密码页面
  if (pageMode === 'forgotPassword') {
    return <ForgotPasswordPage onBack={() => setPageMode('login')} />;
  }

  // 系统优势列表
  const features = [
    {
      icon: <InfiniteIcon sx={{ fontSize: 24 }} />,
      title: t('auth.features.simplePricing'),
      description: t('auth.features.simplePricingDesc'),
    },
    {
      icon: <EventIcon sx={{ fontSize: 24 }} />,
      title: t('auth.features.unlimitedAppointments'),
      description: t('auth.features.unlimitedAppointmentsDesc'),
    },
    {
      icon: <NotificationIcon sx={{ fontSize: 24 }} />,
      title: t('auth.features.unlimitedNotifications'),
      description: t('auth.features.unlimitedNotificationsDesc'),
    },
    {
      icon: <AnalyticsIcon sx={{ fontSize: 24 }} />,
      title: t('auth.features.smartOperations'),
      description: t('auth.features.smartOperationsDesc'),
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 24 }} />,
      title: t('auth.features.fastSetup'),
      description: t('auth.features.fastSetupDesc'),
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 24 }} />,
      title: t('auth.features.secureReliable'),
      description: t('auth.features.secureReliableDesc'),
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: '#fafafa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 1.5, sm: 2 },
        position: 'relative',
      }}
    >
      {/* 语言切换器 - 固定在右上角 */}
      <Box
        sx={{
          position: 'absolute',
          top: { xs: 12, sm: 32 },
          right: { xs: 12, sm: 32 },
          zIndex: 1000,
        }}
      >
        <LanguageSwitcher variant="login" size="small" />
      </Box>

      <Container maxWidth="lg" className="auth-container" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
        <Grid container spacing={{ xs: 0, sm: 4, md: 6 }} alignItems="center" justifyContent="center" className="auth-grid">
          {/* 左侧 - 系统优势介绍 */}
          <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Box sx={{ pr: 4 }}>
              {/* Logo 和标语 */}
              <Typography
                sx={{
                  fontSize: '2.5rem',
                  fontWeight: 600,
                  fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  letterSpacing: '-0.03em',
                  color: '#1a1a1a',
                  mb: 1,
                }}
              >
                VA Merchant
              </Typography>
              <Typography
                sx={{
                  fontSize: '1.1rem',
                  color: '#666',
                  mb: 4,
                  lineHeight: 1.6,
                }}
              >
                {t('auth.heroSubtitle')}
              </Typography>

              {/* 优势列表 */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {features.map((feature, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 2,
                    }}
                  >
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2,
                        bgcolor: alpha('#1a1a1a', 0.05),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#1a1a1a',
                        flexShrink: 0,
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Box>
                      <Typography
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.95rem',
                          color: '#1a1a1a',
                          mb: 0.25,
                        }}
                      >
                        {feature.title}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '0.85rem',
                          color: '#888',
                          lineHeight: 1.5,
                        }}
                      >
                        {feature.description}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Grid>

          {/* 右侧 - 登录表单 */}
          <Grid item xs={12} md={5}>
            <Box>
              {/* 移动端 Logo */}
              <Box
                sx={{
                  textAlign: 'center',
                  mb: 3,
                  display: { xs: 'block', md: 'none' },
                }}
              >
                <Typography
                  sx={{
                    fontSize: '1.75rem',
                    fontWeight: 500,
                    fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    letterSpacing: '-0.025em',
                    color: '#1a1a1a',
                    mb: 0.5,
                  }}
                >
                  VA Merchant
                </Typography>
                <Typography sx={{ color: '#888', fontSize: '0.8rem', fontWeight: 400, letterSpacing: '0.02em' }}>
                  {t('auth.brandSubtitle')}
                </Typography>
              </Box>

              {/* 表单区域 */}
              <Paper
                elevation={0}
                sx={{
                  borderRadius: { xs: 2, sm: 3 },
                  p: { xs: 2, sm: 3, md: 4 },
                  background: '#fff',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                }}
              >
              <Box textAlign="center" mb={4}>
                <Typography
                  variant="h5"
                  component="h1"
                  sx={{
                    fontWeight: 500,
                    color: '#1a1a1a',
                    mb: 0.75,
                    fontSize: '1.35rem',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {pageMode === 'login'
                    ? t('auth.login')
                    : pageMode === '2fa'
                    ? t('auth.twoFactorAuth') || '二次验证'
                    : t('auth.register')}
                </Typography>
                <Typography sx={{ color: '#888', fontSize: '0.8rem' }}>
                  {pageMode === 'login'
                    ? t('auth.loginSubtitle')
                    : pageMode === '2fa'
                    ? t('auth.enterVerificationCode') || '请输入发送到您手机的验证码'
                    : t('auth.registerSubtitle')}
                </Typography>
              </Box>

{pageMode === 'login' ? (
                /* 登录表单 */
                <form onSubmit={handleLoginSubmit}>
                  <TextField
                    fullWidth
                    label={t('auth.tenantCode')}
                    name="tenantCode"
                    value={loginData.tenantCode}
                    onChange={handleLoginChange}
                    margin="normal"
                    required
                    autoFocus
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <HelpTooltip
                            title={`${t('auth.tenantCodeHelp')} ${t('auth.tenantCodeTip')}`}
                            placement="top"
                            size="small"
                            color="default"
                            variant="info"
                            showIcon={false}
                            compact={true}
                          />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
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
                    }}
                  />
                  <TextField
                    fullWidth
                    label={t('auth.username')}
                    name="username"
                    value={loginData.username}
                    onChange={handleLoginChange}
                    margin="normal"
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
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
                    }}
                  />
                  <TextField
                    fullWidth
                    label={t('auth.password')}
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={loginData.password}
                    onChange={handleLoginChange}
                    margin="normal"
                    required
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            sx={{ color: '#bbb' }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
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
                    }}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loading}
                    sx={{
                      mt: 4,
                      mb: 1.5,
                      py: 1.5,
                      textTransform: 'none',
                      fontWeight: 500,
                      fontSize: '0.9rem',
                      borderRadius: 2,
                      bgcolor: '#1a1a1a',
                      color: '#fff',
                      boxShadow: 'none',
                      '&:hover': {
                        bgcolor: '#333',
                        boxShadow: 'none',
                      },
                    }}
                  >
                    {loading ? <CircularProgress size={20} color="inherit" /> : t('auth.loginButton')}
                  </Button>

                  {/* 忘记密码链接 */}
                  <Box textAlign="center">
                    <Button
                      variant="text"
                      onClick={() => setPageMode('forgotPassword')}
                      sx={{
                        textTransform: 'none',
                        color: '#999',
                        fontSize: '0.8rem',
                        fontWeight: 400,
                        '&:hover': {
                          backgroundColor: 'transparent',
                          color: '#666',
                        },
                      }}
                    >
                      {t('auth.forgotPassword')}
                    </Button>
                  </Box>
                </form>
              ) : pageMode === '2fa' ? (
                /* 2FA验证码输入界面 */
                <Box>
                  <Typography sx={{ color: '#888', fontSize: '0.8rem', textAlign: 'center', mb: 3 }}>
                    {t('auth.verificationCodeSentTo', { phone: twoFactorData?.phone })}
                  </Typography>
                  <TextField
                    fullWidth
                    label={t('auth.verificationCode')}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    margin="normal"
                    required
                    autoFocus
                    inputProps={{ maxLength: 6 }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
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
                    }}
                  />

                  <Button
                    fullWidth
                    variant="contained"
                    onClick={verify2FACode}
                    disabled={loading || !verificationCode}
                    sx={{
                      mt: 4,
                      mb: 1.5,
                      py: 1.5,
                      textTransform: 'none',
                      fontWeight: 500,
                      fontSize: '0.9rem',
                      borderRadius: 2,
                      bgcolor: '#1a1a1a',
                      color: '#fff',
                      boxShadow: 'none',
                      '&:hover': {
                        bgcolor: '#333',
                        boxShadow: 'none',
                      },
                    }}
                  >
                    {loading ? <CircularProgress size={20} color="inherit" /> : t('auth.verify')}
                  </Button>

                  <Button
                    fullWidth
                    variant="text"
                    onClick={() => {
                      setPageMode('login');
                      setTwoFactorData(null);
                      setVerificationCode('');
                      clearError();
                      setSuccess('');
                    }}
                    sx={{
                      borderRadius: 2,
                      color: '#999',
                      fontSize: '0.8rem',
                      fontWeight: 400,
                      '&:hover': {
                        backgroundColor: 'transparent',
                        color: '#666',
                      },
                    }}
                  >
                    {t('auth.backToLogin')}
                  </Button>
                </Box>
              ) : (
                /* 注册表单 */
                <form onSubmit={handleRegisterSubmit} noValidate>
                  <TextField
                    fullWidth
                    label={t('auth.username')}
                    name="username"
                    value={registerData.username}
                    onChange={handleRegisterChange}
                    margin="normal"
                    required
                    autoFocus
                    helperText={t('auth.usernameHelp')}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
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
                      '& .MuiFormHelperText-root': {
                        color: '#999',
                        fontSize: '0.7rem',
                      },
                    }}
                  />
                  <TextField
                    fullWidth
                    label={t('auth.realName')}
                    name="realName"
                    value={registerData.realName}
                    onChange={handleRegisterChange}
                    margin="normal"
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
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
                    }}
                  />
                  <TextField
                    fullWidth
                    label={t('auth.email')}
                    name="email"
                    type="email"
                    value={registerData.email}
                    onChange={handleRegisterChange}
                    margin="normal"
                    required
                    error={touchedFields.email && !!validationErrors.email}
                    helperText={touchedFields.email ? validationErrors.email : ''}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
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
                    }}
                  />
                  <Box sx={{ mt: 2, mb: 1 }}>
                    <Grid container spacing={1}>
                      <Grid item xs={5}>
                        <CountryCodeSelector
                          value={registerData.phoneCountryCode}
                          onChange={(code) => setRegisterData((prev) => ({ ...prev, phoneCountryCode: code }))}
                          label={t('common.countryCode')}
                          size="medium"
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={7}>
                        <TextField
                          fullWidth
                          label={t('auth.phoneNumber')}
                          name="phone"
                          value={registerData.phone}
                          onChange={handleRegisterChange}
                          required
                          error={touchedFields.phone && !!validationErrors.phone}
                          helperText={touchedFields.phone ? validationErrors.phone : ''}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
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
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                  <TextField
                    fullWidth
                    label={t('auth.invitationCode')}
                    name="invitationCode"
                    value={registerData.invitationCode}
                    onChange={handleRegisterChange}
                    margin="normal"
                    required
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <HelpTooltip
                            title={t('auth.invitationCodeHelp')}
                            placement="top"
                            size="small"
                            color="default"
                            variant="info"
                            showIcon={false}
                            compact={true}
                          />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
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
                    }}
                  />
                  <Box>
                    <TextField
                      fullWidth
                      label={t('auth.password')}
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={registerData.password}
                      onChange={handleRegisterChange}
                      onFocus={() => setTouchedFields(prev => ({ ...prev, password: true }))}
                      margin="normal"
                      required
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                              sx={{ color: '#bbb' }}
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
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
                      }}
                    />
                    {/* 只有在用户点击密码框且未全部满足时才显示密码要求 */}
                    {touchedFields.password && !(
                      registerData.password &&
                      registerData.password.length >= 8 &&
                      /[A-Z]/.test(registerData.password) &&
                      /[a-z]/.test(registerData.password) &&
                      /[0-9]/.test(registerData.password) &&
                      /[!@#$%^&*(),.?":{}|<>]/.test(registerData.password)
                    ) && (
                        <Box sx={{ mt: 0.5, mb: 1, px: 1 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 500 }}>
                            {t('auth.passwordRequirements')}:
                          </Typography>
                          <Box sx={{ mt: 0.5 }}>
                            {/* 至少8位 */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                              {registerData.password.length >= 8 ? (
                                <CheckCircleIcon sx={{ fontSize: '0.85rem', color: 'success.main' }} />
                              ) : (
                                <CancelIcon sx={{ fontSize: '0.85rem', color: 'text.disabled' }} />
                              )}
                              <Typography
                                variant="caption"
                                sx={{
                                  color: registerData.password.length >= 8 ? 'success.main' : 'text.secondary',
                                  fontSize: '0.7rem'
                                }}
                              >
                                {t('auth.passwordMinLength')}
                              </Typography>
                            </Box>
                            {/* 大写字母 */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                              {/[A-Z]/.test(registerData.password) ? (
                                <CheckCircleIcon sx={{ fontSize: '0.85rem', color: 'success.main' }} />
                              ) : (
                                <CancelIcon sx={{ fontSize: '0.85rem', color: 'text.disabled' }} />
                              )}
                              <Typography
                                variant="caption"
                                sx={{
                                  color: /[A-Z]/.test(registerData.password) ? 'success.main' : 'text.secondary',
                                  fontSize: '0.7rem'
                                }}
                              >
                                {t('auth.passwordNeedsUpperCase')}
                              </Typography>
                            </Box>
                            {/* 小写字母 */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                              {/[a-z]/.test(registerData.password) ? (
                                <CheckCircleIcon sx={{ fontSize: '0.85rem', color: 'success.main' }} />
                              ) : (
                                <CancelIcon sx={{ fontSize: '0.85rem', color: 'text.disabled' }} />
                              )}
                              <Typography
                                variant="caption"
                                sx={{
                                  color: /[a-z]/.test(registerData.password) ? 'success.main' : 'text.secondary',
                                  fontSize: '0.7rem'
                                }}
                              >
                                {t('auth.passwordNeedsLowerCase')}
                              </Typography>
                            </Box>
                            {/* 数字 */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                              {/[0-9]/.test(registerData.password) ? (
                                <CheckCircleIcon sx={{ fontSize: '0.85rem', color: 'success.main' }} />
                              ) : (
                                <CancelIcon sx={{ fontSize: '0.85rem', color: 'text.disabled' }} />
                              )}
                              <Typography
                                variant="caption"
                                sx={{
                                  color: /[0-9]/.test(registerData.password) ? 'success.main' : 'text.secondary',
                                  fontSize: '0.7rem'
                                }}
                              >
                                {t('auth.passwordNeedsNumber')}
                              </Typography>
                            </Box>
                            {/* 特殊字符 */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                              {/[!@#$%^&*(),.?":{}|<>]/.test(registerData.password) ? (
                                <CheckCircleIcon sx={{ fontSize: '0.85rem', color: 'success.main' }} />
                              ) : (
                                <CancelIcon sx={{ fontSize: '0.85rem', color: 'text.disabled' }} />
                              )}
                              <Typography
                                variant="caption"
                                sx={{
                                  color: /[!@#$%^&*(),.?":{}|<>]/.test(registerData.password) ? 'success.main' : 'text.secondary',
                                  fontSize: '0.7rem'
                                }}
                              >
                                {t('auth.passwordNeedsSpecialChar')}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                    )}
                  </Box>
                  <TextField
                    fullWidth
                    label={t('auth.confirmPassword')}
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={registerData.confirmPassword}
                    onChange={handleRegisterChange}
                    margin="normal"
                    required
                    error={touchedFields.confirmPassword && !!validationErrors.confirmPassword}
                    helperText={touchedFields.confirmPassword ? validationErrors.confirmPassword : ''}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                            sx={{ color: '#bbb' }}
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
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
                    }}
                  />

                  <Box sx={{ mt: 3 }}>
                    <TermsOfServiceCheckbox
                      checked={registerData.acceptedTerms}
                      onChange={(checked) => setRegisterData(prev => ({ ...prev, acceptedTerms: checked }))}
                      error={!!error && !registerData.acceptedTerms}
                    />
                  </Box>

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loading}
                    sx={{
                      mt: 4,
                      mb: 1.5,
                      py: 1.5,
                      textTransform: 'none',
                      fontWeight: 500,
                      fontSize: '0.9rem',
                      borderRadius: 2,
                      bgcolor: '#1a1a1a',
                      color: '#fff',
                      boxShadow: 'none',
                      '&:hover': {
                        bgcolor: '#333',
                        boxShadow: 'none',
                      },
                    }}
                  >
                    {loading ? <CircularProgress size={20} color="inherit" /> : t('auth.registerButton')}
                  </Button>
                </form>
              )}

              {/* 切换登录/注册 */}
              <Box sx={{ pt: 3, borderTop: '1px solid rgba(0,0,0,0.05)', mt: 3 }}>
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  alignItems: 'center'
                }}>
                  {/* 员工账户注册链接 */}
                  <Typography sx={{ fontSize: '0.8rem', color: '#999' }}>
                    {pageMode === 'login' ? t('auth.dontHaveAccount') : t('auth.alreadyHaveAccount')}{' '}
                    <Button
                      variant="text"
                      onClick={() => {
                        const newMode = pageMode === 'login' ? 'register' : 'login';
                        setPageMode(newMode);
                        setSuccess('');
                      }}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 500,
                        color: '#1a1a1a',
                        p: 0,
                        minWidth: 'auto',
                        fontSize: '0.8rem',
                        verticalAlign: 'baseline',
                        '&:hover': {
                          backgroundColor: 'transparent',
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      {pageMode === 'login' ? t('auth.switchToRegister') : t('auth.switchToLogin')}
                    </Button>
                  </Typography>

                  {/* 商户注册链接 - 简约风格 */}
                  {pageMode === 'login' && (
                    <Typography sx={{ textAlign: 'center', fontSize: '0.8rem', color: '#999', pt: 1 }}>
                      {t('auth.noMerchantAccount')}{' '}
                      <Button
                        variant="text"
                        onClick={() => {
                          setPageMode('merchantRegister');
                          setSuccess('');
                        }}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 500,
                          color: '#1a1a1a',
                          p: 0,
                          minWidth: 'auto',
                          fontSize: '0.8rem',
                          verticalAlign: 'baseline',
                          '&:hover': {
                            backgroundColor: 'transparent',
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        {t('auth.merchantRegisterFreeTrial')}
                      </Button>
                      <Box
                        component="span"
                        sx={{
                          fontSize: '0.7rem',
                          color: '#10B981',
                          fontWeight: 500,
                          ml: 0.5,
                        }}
                      >
                        {t('auth.freeTrialBadge')}
                      </Box>
                    </Typography>
                  )}
                </Box>
              </Box>


              </Paper>
            </Box>
          </Grid>
        </Grid>

        {/* 页面底部版权信息 */}
        <Box sx={{ mt: { xs: 3, sm: 4, md: 6 }, textAlign: 'center' }}>
          <Typography sx={{ color: '#999', fontSize: '0.7rem', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
            © {new Date().getFullYear()}
            <Box component="img" src="/s-logo.png" alt="Swiftmind" sx={{ width: 14, height: 14, objectFit: 'contain', opacity: 0.7 }} />
            Swiftmind
          </Typography>
        </Box>
      </Container>

      {/* Snackbar for error messages */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={clearError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={clearError}
          severity="error"
          sx={{ width: '100%' }}
        >
          {displayedError}
        </Alert>
      </Snackbar>

      {/* Snackbar for success messages */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSuccess('')}
          severity="success"
          sx={{ width: '100%' }}
        >
          {displayedSuccess}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LoginPage; 