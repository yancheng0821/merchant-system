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
  InputAdornment,
  Snackbar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../common/LanguageSwitcher';
import HelpTooltip from '../common/HelpTooltip';
import { authApi } from '../../services/api';

interface ForgotPasswordPageProps {
  onBack: () => void;
}

const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [tenantCode, setTenantCode] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!tenantCode.trim()) {
      setError(t('auth.tenantCodeRequired') || '租户代码不能为空');
      return;
    }

    if (!email.trim()) {
      setError(t('auth.emailRequired') || 'Email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t('auth.emailInvalid') || 'Invalid email format');
      return;
    }

    setLoading(true);

    try {
      const result = await authApi.forgotPassword(email, tenantCode);

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.message || t('auth.forgotPasswordFailed'));
      }
    } catch (err) {
      setError(t('auth.forgotPasswordError') || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  // 输入框通用样式
  const textFieldSx = {
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
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: '#fafafa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 1.5, sm: 2 },
        py: { xs: 4, sm: 2 },
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

      <Container maxWidth="xs" sx={{ px: { xs: 1, sm: 2 } }}>
        <Box>
          {/* 顶部Logo区域 */}
          <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 4, md: 5 } }}>
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
            <Box textAlign="center" mb={{ xs: 2.5, sm: 3, md: 4 }}>
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
                {t('auth.forgotPassword')}
              </Typography>
              <Typography sx={{ color: '#888', fontSize: '0.8rem' }}>
                {t('auth.forgotPasswordSubtitle')}
              </Typography>
            </Box>

            {success ? (
              <Box>
                <Alert severity="success" sx={{ mb: 3 }}>
                  {t('auth.resetEmailSent')}
                </Alert>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={onBack}
                  startIcon={<ArrowBackIcon />}
                  sx={{
                    borderRadius: 2,
                    color: '#666',
                    borderColor: '#d0d0d0',
                    '&:hover': {
                      borderColor: '#bbb',
                      bgcolor: 'rgba(0,0,0,0.02)',
                    },
                  }}
                >
                  {t('auth.backToLogin')}
                </Button>
              </Box>
            ) : (
              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label={t('auth.tenantCode')}
                  value={tenantCode}
                  onChange={(e) => setTenantCode(e.target.value)}
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
                  sx={textFieldSx}
                />
                <TextField
                  fullWidth
                  label={t('auth.email')}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  margin="normal"
                  required
                  sx={textFieldSx}
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
                  {loading ? <CircularProgress size={20} color="inherit" /> : t('auth.sendResetLink')}
                </Button>

                <Box textAlign="center">
                  <Button
                    variant="text"
                    onClick={onBack}
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
                    {t('auth.backToLogin')}
                  </Button>
                </Box>
              </form>
            )}
          </Paper>

          {/* 版权信息 */}
          <Box sx={{ mt: { xs: 3, sm: 4 }, textAlign: 'center' }}>
            <Typography sx={{ color: '#999', fontSize: '0.7rem', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
              © {new Date().getFullYear()}
              <Box component="img" src="/s-logo.png" alt="Swiftmind" sx={{ width: 14, height: 14, objectFit: 'contain', opacity: 0.7 }} />
              Swiftmind
            </Typography>
          </Box>
        </Box>
      </Container>

      {/* Snackbar for error messages */}
      <Snackbar
        open={!!error}
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
    </Box>
  );
};

export default ForgotPasswordPage;
