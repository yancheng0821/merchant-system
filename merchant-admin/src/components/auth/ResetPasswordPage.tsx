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
} from '@mui/material';
import {
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LanguageSwitcher from '../common/LanguageSwitcher';

const ResetPasswordPage: React.FC = () => {
  const { t } = useTranslation();
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

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError(t('auth.invalidResetToken') || 'Invalid reset token');
        setValidating(false);
        return;
      }

      try {
        const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
        const response = await fetch(
          `${API_BASE_URL}/api/auth/validate-reset-token?token=${token}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const result = await response.json();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword) {
      setError(t('auth.passwordRequired') || 'Password is required');
      return;
    }

    if (newPassword.length < 6) {
      setError(t('auth.passwordTooShort') || 'Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordMismatch') || 'Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword,
          confirmPassword,
        }),
      });

      const result = await response.json();

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
              <TextField
                fullWidth
                label={t('auth.newPassword')}
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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

              <TextField
                fullWidth
                label={t('auth.confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
      </Container>
    </Box>
  );
};

export default ResetPasswordPage;
