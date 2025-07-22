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
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const { login, register, loginWithGoogle, loading, error, clearError, setError } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState<string>('');

  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });

  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    realName: '',
    phone: ''
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

    if (!loginData.password.trim()) {
      setError(t('auth.passwordRequired') || '密码不能为空');
      return;
    }

    const success = await login(loginData.username, loginData.password);
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

    const success = await register({
      username: registerData.username,
      email: registerData.email,
      password: registerData.password,
      realName: registerData.realName,
      phone: registerData.phone
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

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
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
                Merchant System
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.8, mb: 3 }}>
                Professional Business Management Platform
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.7 }}>
                Streamline your business operations with our comprehensive management solution
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
                  {isLogin ? t('auth.login') : t('auth.register')}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {isLogin ? t('auth.loginSubtitle') : t('auth.registerSubtitle')}
                </Typography>
              </Box>

              {/* Google登录按钮 */}
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

              {isLogin ? (
                /* 登录表单 */
                <form onSubmit={handleLoginSubmit}>
                  <TextField
                    fullWidth
                    label={t('auth.username')}
                    name="username"
                    value={loginData.username}
                    onChange={handleLoginChange}
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
                  <TextField
                    fullWidth
                    label={t('auth.phoneNumber')}
                    name="phone"
                    value={registerData.phone}
                    onChange={handleRegisterChange}
                    margin="normal"
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
              <Box textAlign="center" mt={2}>
                <Typography variant="body2" color="text.secondary">
                  {isLogin ? t('auth.dontHaveAccount') : t('auth.alreadyHaveAccount')}{' '}
                  <Button
                    variant="text"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setSuccess('');
                    }}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      color: '#667eea',
                      '&:hover': {
                        backgroundColor: alpha('#667eea', 0.04),
                      },
                    }}
                  >
                    {isLogin ? t('auth.switchToRegister') : t('auth.switchToLogin')}
                  </Button>
                </Typography>
              </Box>
            </Paper>
          </Slide>
        </Box>
      </Container>
    </Box>
  );
};

export default LoginPage; 