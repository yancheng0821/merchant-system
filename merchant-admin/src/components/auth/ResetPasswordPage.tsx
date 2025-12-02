import React, { useState, useEffect } from 'react';
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
  Snackbar,
  Fade,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LanguageSwitcher from '../common/LanguageSwitcher';
import { authApi, handleApiError } from '../../services/api';

const ResetPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);

  // 实时验证状态
  const [validationErrors, setValidationErrors] = useState({
    password: '',
    confirmPassword: '',
  });

  // 跟踪字段是否已被用户触摸过
  const [touchedFields, setTouchedFields] = useState({
    password: false,
    confirmPassword: false,
  });

  // 验证函数
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

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError(t('auth.invalidResetToken') || 'Invalid reset token');
        setValidating(false);
        return;
      }

      try {
        const result = await authApi.validateResetToken(token);

        if (result.success && result.data) {
          setTokenValid(true);
        } else {
          setError(t('auth.tokenExpired') || 'Reset link has expired or is invalid');
        }
      } catch (err) {
        setError(t('auth.tokenValidationError') || 'Failed to validate reset token');
      } finally {
        setValidating(false);
      }
    };

    validateToken();
  }, [token, t]);

  // 处理密码变化
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setNewPassword(newValue);

    // 标记字段为已触摸
    setTouchedFields(prev => ({
      ...prev,
      password: true,
    }));

    // 实时验证密码强度
    const passwordError = validatePasswordStrength(newValue);
    const confirmPasswordError = touchedFields.confirmPassword
      ? validateConfirmPasswordMatch(newValue, confirmPassword)
      : '';
    setValidationErrors({
      password: passwordError,
      confirmPassword: confirmPasswordError,
    });
  };

  // 处理确认密码变化
  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setConfirmPassword(newValue);

    // 标记字段为已触摸
    setTouchedFields(prev => ({
      ...prev,
      confirmPassword: true,
    }));

    // 实时验证确认密码是否匹配
    const confirmPasswordError = validateConfirmPasswordMatch(newPassword, newValue);
    setValidationErrors(prev => ({
      ...prev,
      confirmPassword: confirmPasswordError,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 验证密码强度
    const passwordError = validatePasswordStrength(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    // 验证确认密码匹配
    const confirmPasswordError = validateConfirmPasswordMatch(newPassword, confirmPassword);
    if (confirmPasswordError) {
      setError(confirmPasswordError);
      return;
    }

    setLoading(true);

    try {
      const result = await authApi.resetPassword(token!, newPassword, confirmPassword);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(result.message || t('auth.resetPasswordFailed'));
      }
    } catch (err) {
      setError(t('auth.resetPasswordError') || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress sx={{ color: 'white' }} />
      </Box>
    );
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

      <Container maxWidth="sm">
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
              {t('auth.resetPassword')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('auth.resetPasswordSubtitle')}
            </Typography>
          </Box>

          {!tokenValid ? (
            <Box>
              <Alert
                severity="error"
                sx={{ mb: 3 }}
              >
                {error || t('auth.invalidResetToken')}
              </Alert>
              <Button
                fullWidth
                variant="contained"
                onClick={() => navigate('/login')}
                sx={{
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
              >
                {t('auth.backToLogin')}
              </Button>
            </Box>
          ) : success ? (
            <Box>
              <Alert
                severity="success"
                sx={{ mb: 3 }}
              >
                {t('auth.passwordResetSuccess')}
              </Alert>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                {t('auth.redirectingToLogin')}
              </Typography>
            </Box>
          ) : (
            <form onSubmit={handleSubmit}>
              <Box>
                <TextField
                  fullWidth
                  label={t('auth.newPassword')}
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={handlePasswordChange}
                  onFocus={() => setTouchedFields(prev => ({ ...prev, password: true }))}
                  margin="normal"
                  required
                  autoFocus
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          edge="end"
                        >
                          {showNewPassword ? <VisibilityOff /> : <Visibility />}
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
                {/* 只有在用户点击密码框且未全部满足时才显示密码要求 */}
                {touchedFields.password && !(
                  newPassword &&
                  newPassword.length >= 8 &&
                  /[A-Z]/.test(newPassword) &&
                  /[a-z]/.test(newPassword) &&
                  /[0-9]/.test(newPassword) &&
                  /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
                ) && (
                  <Fade in={true}>
                    <Box sx={{ mt: 0.5, mb: 1, px: 1 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 500 }}>
                        {t('auth.passwordRequirements')}:
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        {/* 至少8位 */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                          {newPassword.length >= 8 ? (
                            <CheckCircleIcon sx={{ fontSize: '0.85rem', color: 'success.main' }} />
                          ) : (
                            <CancelIcon sx={{ fontSize: '0.85rem', color: 'text.disabled' }} />
                          )}
                          <Typography
                            variant="caption"
                            sx={{
                              color: newPassword.length >= 8 ? 'success.main' : 'text.secondary',
                              fontSize: '0.7rem'
                            }}
                          >
                            {t('auth.passwordMinLength')}
                          </Typography>
                        </Box>
                        {/* 大写字母 */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                          {/[A-Z]/.test(newPassword) ? (
                            <CheckCircleIcon sx={{ fontSize: '0.85rem', color: 'success.main' }} />
                          ) : (
                            <CancelIcon sx={{ fontSize: '0.85rem', color: 'text.disabled' }} />
                          )}
                          <Typography
                            variant="caption"
                            sx={{
                              color: /[A-Z]/.test(newPassword) ? 'success.main' : 'text.secondary',
                              fontSize: '0.7rem'
                            }}
                          >
                            {t('auth.passwordNeedsUpperCase')}
                          </Typography>
                        </Box>
                        {/* 小写字母 */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                          {/[a-z]/.test(newPassword) ? (
                            <CheckCircleIcon sx={{ fontSize: '0.85rem', color: 'success.main' }} />
                          ) : (
                            <CancelIcon sx={{ fontSize: '0.85rem', color: 'text.disabled' }} />
                          )}
                          <Typography
                            variant="caption"
                            sx={{
                              color: /[a-z]/.test(newPassword) ? 'success.main' : 'text.secondary',
                              fontSize: '0.7rem'
                            }}
                          >
                            {t('auth.passwordNeedsLowerCase')}
                          </Typography>
                        </Box>
                        {/* 数字 */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                          {/[0-9]/.test(newPassword) ? (
                            <CheckCircleIcon sx={{ fontSize: '0.85rem', color: 'success.main' }} />
                          ) : (
                            <CancelIcon sx={{ fontSize: '0.85rem', color: 'text.disabled' }} />
                          )}
                          <Typography
                            variant="caption"
                            sx={{
                              color: /[0-9]/.test(newPassword) ? 'success.main' : 'text.secondary',
                              fontSize: '0.7rem'
                            }}
                          >
                            {t('auth.passwordNeedsNumber')}
                          </Typography>
                        </Box>
                        {/* 特殊字符 */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                          {/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? (
                            <CheckCircleIcon sx={{ fontSize: '0.85rem', color: 'success.main' }} />
                          ) : (
                            <CancelIcon sx={{ fontSize: '0.85rem', color: 'text.disabled' }} />
                          )}
                          <Typography
                            variant="caption"
                            sx={{
                              color: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? 'success.main' : 'text.secondary',
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

              <TextField
                fullWidth
                label={t('auth.confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                margin="normal"
                required
                error={touchedFields.confirmPassword && !!validationErrors.confirmPassword}
                helperText={touchedFields.confirmPassword ? validationErrors.confirmPassword : ''}
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
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  t('auth.resetPasswordButton')
                )}
              </Button>

              <Button
                fullWidth
                variant="text"
                onClick={() => navigate('/login')}
                sx={{ borderRadius: 2 }}
              >
                {t('auth.backToLogin')}
              </Button>
            </form>
          )}

          {/* Snackbar for error messages */}
          <Snackbar
            open={!!error && !tokenValid}
            autoHideDuration={6000}
            onClose={() => setError(null)}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            sx={isMobile ? { top: 70 } : undefined}
          >
            <Alert
              onClose={() => setError(null)}
              severity="error"
              sx={{
                width: '100%',
                borderRadius: isMobile ? 1.5 : 2,
                fontSize: isMobile ? '0.8rem' : undefined,
                py: isMobile ? 0.5 : undefined,
                '& .MuiAlert-icon': isMobile ? { fontSize: 18 } : undefined,
              }}
            >
              {error}
            </Alert>
          </Snackbar>
        </Paper>
      </Container>
    </Box>
  );
};

export default ResetPasswordPage;
