import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Divider,
  InputAdornment,
  IconButton,
  alpha,
  Fade,
  Slide,
  Grid,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Business as BusinessIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import GoogleLoginButton from './GoogleLoginButton';
import MerchantRegisterPage from './MerchantRegisterPage';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../common/LanguageSwitcher';
import HelpTooltip from '../common/HelpTooltip';
import CountryCodeSelector from '../common/CountryCodeSelector';


const LoginPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { login, register, loginWithGoogle, loading, error, clearError, setError } = useAuth();
  const [pageMode, setPageMode] = useState<'login' | 'register' | 'merchantRegister'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState<string>('');

  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
    tenantCode: ''
  });

  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    realName: '',
    phone: '',
    phoneCountryCode: '+1-CA',
    invitationCode: ''
  });

  // 移除这个会立即清除错误信息的useEffect
  // useEffect(() => {
  //   if (error) {
  //     clearError();
  //   }
  // }, [isLogin, error, clearError]);

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

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setRegisterData({
      ...registerData,
      [e.target.name]: newValue
    });
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

    const success = await login(loginData.username, loginData.password, loginData.tenantCode);
    if (success) {
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
    }
  };

  const handleGoogleSuccess = async (idToken: string) => {
    try {
      const success = await loginWithGoogle(idToken);
      if (success) {
        setSuccess(t('auth.googleLoginSuccess') || 'Google登录成功');
      }
    } catch (error) {
      console.error('Google login callback error:', error);
      setError('Google login failed');
    }
  };

  const handleGoogleError = (error: string) => {
    console.error('Google login error:', error);
    setError('Google login failed');
  };

  // 如果是商户注册模式，直接返回商户注册页面
  if (pageMode === 'merchantRegister') {
    return <MerchantRegisterPage onBack={() => setPageMode('login')} />;
  }

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
      <Container maxWidth="md">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 4,
            alignItems: 'center',
          }}
        >
          {/* 左侧品牌区域 */}
          <Fade in timeout={1000}>
            <Box
              sx={{
                textAlign: 'center',
                color: 'white',
                display: { xs: 'none', md: 'block' },
              }}
            >
              <BusinessIcon sx={{ fontSize: 80, mb: 2, opacity: 0.9 }} />
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
                {t('auth.brandTitle')}
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.8, mb: 3 }}>
                {t('auth.brandSubtitle')}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.7 }}>
                {t('auth.brandDescription')}
              </Typography>
            </Box>
          </Fade>

          {/* 右侧表单区域 */}
          <Slide direction="left" in timeout={800}>
            <Paper
              elevation={24}
              sx={{
                borderRadius: 4,
                p: 4,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <Box textAlign="center" mb={4}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
                  {pageMode === 'login' ? t('auth.login') : t('auth.register')}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {pageMode === 'login' ? t('auth.loginSubtitle') : t('auth.registerSubtitle')}
                </Typography>
              </Box>

              {/* Google登录按钮 - 已隐藏 */}
              {false && (
                <>
                  <Box sx={{
                    mb: 3,
                    minHeight: '48px', // 固定最小高度，防止布局变化
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <GoogleLoginButton
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      disabled={loading}
                      variant="themed" // 使用主题化样式
                    />
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Divider sx={{ flex: 1 }} />
                    <Typography variant="body2" sx={{ px: 2, color: 'text.secondary' }}>
                      {t('auth.orDivider')}
                    </Typography>
                    <Divider sx={{ flex: 1 }} />
                  </Box>
                </>
              )}

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
                      startAdornment: (
                        <InputAdornment position="start">
                          <BusinessIcon sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <HelpTooltip
                            title={`${t('auth.tenantCodeHelp')} ${t('auth.tenantCodeTip')}`}
                            placement="top"
                            size="small"
                            color="primary"
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
                      },
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
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
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
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />

                  {error && (
                    <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                      {error}
                    </Alert>
                  )}

                  {success && (
                    <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}>
                      {success}
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loading}
                    sx={{
                      mt: 3,
                      mb: 2,
                      py: 1.5,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                      },
                    }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : t('auth.loginButton')}
                  </Button>
                </form>
              ) : (
                /* 注册表单 */
                <form onSubmit={handleRegisterSubmit}>
                  <TextField
                    fullWidth
                    label={t('auth.username')}
                    name="username"
                    value={registerData.username}
                    onChange={handleRegisterChange}
                    margin="normal"
                    required
                    autoFocus
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
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
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
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
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                  <Box sx={{ mt: 2, mb: 1 }}>
                    <Grid container spacing={1}>
                      <Grid item xs={5}>
                        <CountryCodeSelector
                          value={registerData.phoneCountryCode}
                          onChange={(code) => setRegisterData(prev => ({ ...prev, phoneCountryCode: code }))}
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
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <PhoneIcon sx={{ color: 'text.secondary' }} />
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
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <HelpTooltip
                            title={t('auth.invitationCodeHelp')}
                            placement="top"
                            size="small"
                            color="primary"
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
                      },
                    }}
                  />
                  <TextField
                    fullWidth
                    label={t('auth.password')}
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={registerData.password}
                    onChange={handleRegisterChange}
                    margin="normal"
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                  <TextField
                    fullWidth
                    label={t('auth.confirmPassword')}
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={registerData.confirmPassword}
                    onChange={handleRegisterChange}
                    margin="normal"
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />

                  {error && (
                    <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                      {error}
                    </Alert>
                  )}

                  {success && (
                    <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}>
                      {success}
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loading}
                    sx={{
                      mt: 3,
                      mb: 2,
                      py: 1.5,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                      },
                    }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : t('auth.registerButton')}
                  </Button>
                </form>
              )}

              {/* 切换登录/注册 */}
              <Box textAlign="center" mt={3}>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 2,
                  alignItems: 'center'
                }}>
                  {/* 员工账户注册链接 */}
                  <Box sx={{ 
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto',
                    alignItems: 'start', 
                    gap: 1,
                    padding: '8px 16px',
                    borderRadius: '8px',
                    minWidth: '320px'
                  }}>
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'right' }}>
                      {pageMode === 'login' ? t('auth.dontHaveAccount') : t('auth.alreadyHaveAccount')}
                    </Typography>
                    <Button
                      variant="text"
                      onClick={() => {
                        setPageMode(pageMode === 'login' ? 'register' : 'login');
                        setSuccess('');
                      }}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 500,
                        color: '#667eea',
                        p: 0,
                        minWidth: 'auto',
                        fontSize: '0.875rem',
                        lineHeight: 'inherit',
                        justifySelf: 'start',
                        '&:hover': {
                          backgroundColor: 'transparent',
                          color: '#5a67d8',
                        },
                      }}
                    >
                      {pageMode === 'login' ? t('auth.switchToRegister') : t('auth.switchToLogin')}
                    </Button>
                    {pageMode !== 'register' && (
                      <HelpTooltip
                        title={pageMode === 'login' ? t('auth.employeeAccountHelp') : t('auth.employeeAccountRegisterHelp')}
                        placement="top"
                        size="small"
                        color="primary"
                        variant="info"
                        showIcon={false}
                        compact={true}
                      />
                    )}
                  </Box>

                  {/* 商户注册链接 */}
                  {pageMode === 'login' && (
                    <Box sx={{ 
                      display: 'grid',
                      gridTemplateColumns: '1fr auto auto',
                      alignItems: 'start', 
                      gap: 1,
                      padding: '8px 16px',
                      borderRadius: '8px',
                      minWidth: '320px',
                      ml: -3
                    }}>
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'right' }}>
                        {t('auth.noMerchantAccount')}
                      </Typography>
                      <Button
                        variant="text"
                        onClick={() => {
                          setPageMode('merchantRegister');
                          setSuccess('');
                        }}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 500,
                          color: '#764ba2',
                          p: 0,
                          minWidth: 'auto',
                          fontSize: '0.875rem',
                          lineHeight: 'inherit',
                          justifySelf: 'start',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          '&:hover': {
                            backgroundColor: 'transparent',
                            color: '#6b46c1',
                          },
                        }}
                      >
                        {i18n.language === 'zh-CN' ? (
                          <>
                            <span>商户</span>
                            <span>注册</span>
                          </>
                        ) : (
                          <>
                            <span>Merchant</span>
                            <span>Registration</span>
                          </>
                        )}
                      </Button>
                      <HelpTooltip
                        title={t('auth.merchantAccountHelp')}
                        placement="top"
                        size="small"
                        color="secondary"
                        variant="info"
                        showIcon={false}
                        compact={true}
                      />
                    </Box>
                  )}
                </Box>
              </Box>


            </Paper>
          </Slide>
        </Box>
      </Container>
    </Box>
  );
};

export default LoginPage; 