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
  Fade,
  Slide,
  Grid,
} from '@mui/material';
import {
  Email as EmailIcon,
  ArrowBack as ArrowBackIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../common/LanguageSwitcher';
import HelpTooltip from '../common/HelpTooltip';
import { authApi, handleApiError } from '../../services/api';

interface ForgotPasswordPageProps {
  onBack: () => void;
}

const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onBack }) => {
  const { t } = useTranslation();
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
              {/* VA Logo */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  sx={{
                    fontSize: '6rem',
                    fontWeight: 800,
                    fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    letterSpacing: '-0.04em',
                    lineHeight: 1,
                    color: '#ffffff',
                    textShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  }}
                >
                  VA
                </Typography>
                <Box
                  sx={{
                    width: '120px',
                    height: '4px',
                    background: '#ffffff',
                    borderRadius: '2px',
                    margin: '0 auto',
                    mt: 1,
                  }}
                />
              </Box>
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
              {t('auth.forgotPassword')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
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
                sx={{ borderRadius: 2 }}
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
                label={t('auth.email')}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                  t('auth.sendResetLink')
                )}
              </Button>

              <Button
                fullWidth
                variant="text"
                onClick={onBack}
                startIcon={<ArrowBackIcon />}
                sx={{ borderRadius: 2 }}
              >
                {t('auth.backToLogin')}
              </Button>
            </form>
          )}

          {/* Snackbar for error messages */}
          <Snackbar
            open={!!error}
            autoHideDuration={6000}
            onClose={() => setError(null)}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert
              onClose={() => setError(null)}
              severity="error"
              sx={{ width: '100%' }}
            >
              {error}
            </Alert>
          </Snackbar>
            </Paper>
          </Slide>
        </Box>
      </Container>
    </Box>
  );
};

export default ForgotPasswordPage;
