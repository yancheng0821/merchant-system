import React, { useState, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Chip,
  Alert,
  IconButton,
  CircularProgress,
  alpha,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  CameraAlt as CameraIcon,
  Person as PersonIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import LockResetIcon from '@mui/icons-material/LockReset';
import InputAdornment from '@mui/material/InputAdornment';
import LockIcon from '@mui/icons-material/Lock';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { userApi } from '../../services/api';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { useNavigate } from 'react-router-dom';

// API基础配置
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8081';

const UserProfile: React.FC = () => {
  const { t } = useTranslation();
  const { user, updateUserInfo, uploadAvatar, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    email: user?.email || '',
    realName: user?.realName || '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 修改密码弹窗相关状态
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // 新增密码可见性状态
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleOpenPasswordDialog = () => {
    setPasswordDialogOpen(true);
    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordError(null);
  };
  const handleClosePasswordDialog = () => {
    setPasswordDialogOpen(false);
    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordError(null);
  };
  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };
  const handleChangePassword = async () => {
    setPasswordError(null);
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError(t('auth.passwordRequired'));
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError(t('auth.passwordTooShort'));
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError(t('auth.passwordNotMatch'));
      return;
    }
    if (passwordForm.oldPassword === passwordForm.newPassword) {
      setPasswordError(t('auth.passwordNoRepeat'));
      return;
    }
    setPasswordLoading(true);
    try {
      const resp = await userApi.changePassword(passwordForm);
      if (resp.success) {
        setPasswordDialogOpen(false);
        setMessage({ type: 'success', text: t('auth.passwordChanged') });
        setTimeout(() => {
          logout();
          navigate('/login');
        }, 1200);
      } else {
        setPasswordError(t(resp.message) || t('auth.updateFailed'));
      }
    } catch (e: any) {
      setPasswordError(t(e.message) || t('auth.updateFailed'));
    } finally {
      setPasswordLoading(false);
    }
  };

  // 处理头像URL，将相对路径转换为完整URL
  const getAvatarUrl = (avatarPath?: string) => {
    if (!avatarPath) return undefined;
    if (avatarPath.startsWith('http')) return avatarPath;
    return `${API_BASE_URL}${avatarPath}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleEdit = () => {
    setEditing(true);
    setMessage(null);
  };

  const handleCancel = () => {
    setEditing(false);
    setFormData({
      email: user?.email || '',
      realName: user?.realName || '',
    });
    setMessage(null);
  };

  const handleSave = async () => {
    try {
      if (!user || !user.id) {
        setMessage({ type: 'error', text: t('auth.userNotFound') });
        return;
      }
      
      // 确保userId是数字类型，而不是undefined或null
      const updateData = {
        email: formData.email,
        realName: formData.realName,
        userId: Number(user.id) // 确保userId是数字类型
      };
      
      console.log('Updating user profile with data:', updateData);
      const success = await updateUserInfo(updateData);
      
      if (success) {
        setEditing(false);
        setMessage({ type: 'success', text: t('auth.profileUpdated') });
      } else {
        setFormData({
          email: user?.email || '',
          realName: user?.realName || '',
        });
        setMessage({ type: 'error', text: t('auth.updateFailed') });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setFormData({
        email: user?.email || '',
        realName: user?.realName || '',
      });
      setMessage({ type: 'error', text: t('auth.updateFailed') });
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: t('auth.invalidFileType') });
      return;
    }

    // 验证文件大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: t('auth.fileTooLarge') });
      return;
    }

    setAvatarUploading(true);
    try {
      await uploadAvatar(file);
      setMessage({ type: 'success', text: t('auth.avatarUpdated') });
    } catch (error) {
      setMessage({ type: 'error', text: t('auth.avatarUploadFailed') });
    } finally {
      setAvatarUploading(false);
    }
  };

  const getRoleChips = (roles?: string[]) => {
    if (!roles || roles.length === 0) {
      return (
        <Chip
          label={t('auth.merchantAdmin')}
          sx={{
            backgroundColor: alpha('#6366F1', 0.1),
            color: '#6366F1',
            fontWeight: 600,
            fontSize: '0.75rem',
          }}
        />
      );
    }

    return roles.map((role, index) => {
      const roleConfig = {
        'ROLE_SYSTEM_ADMIN': { color: '#EF4444', bg: alpha('#EF4444', 0.1), label: t('auth.systemAdmin') },
        'ROLE_MERCHANT_ADMIN': { color: '#6366F1', bg: alpha('#6366F1', 0.1), label: t('auth.merchantAdmin') },
        'ROLE_STAFF': { color: '#10B981', bg: alpha('#10B981', 0.1), label: 'Staff' },
        'ROLE_USER': { color: '#6B7280', bg: alpha('#6B7280', 0.1), label: 'User' },
      };
      
      const config = roleConfig[role as keyof typeof roleConfig] || roleConfig['ROLE_MERCHANT_ADMIN'];
      
      return (
        <Chip
          key={index}
          label={config.label}
          sx={{
            backgroundColor: config.bg,
            color: config.color,
            fontWeight: 600,
            fontSize: '0.75rem',
            mr: 1,
            mb: 1,
          }}
        />
      );
    });
  };

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Alert severity="error">{t('auth.userNotFound')}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      {/* 现代化页面标题 */}
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography 
              variant="h5" 
              component="h1" 
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(45deg, #4F46E5, #6366F1)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
                fontSize: 26
              }}
            >
              {t('auth.userProfile')}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: 15 }}>
              {t('auth.userProfileSubtitle')}
            </Typography>
          </Box>
          {/* 修改密码按钮右对齐，缩小尺寸，渐变前深后浅 */}
          <Button
            variant="contained"
            color="primary"
            size="medium"
            startIcon={<LockResetIcon sx={{ fontSize: 18 }} />}
            sx={{
              borderRadius: 4,
              fontWeight: 700,
              fontSize: 15,
              background: 'linear-gradient(90deg, #4F46E5 0%, #A5B4FC 100%)',
              boxShadow: '0 2px 8px rgba(99,102,241,0.10)',
              textTransform: 'none',
              letterSpacing: 0.5,
              px: 3,
              py: 1,
              transition: 'all 0.2s',
              '&:hover': {
                background: 'linear-gradient(90deg, #6366F1 0%, #A5B4FC 100%)',
                boxShadow: '0 4px 16px rgba(99,102,241,0.15)',
                transform: 'translateY(-1px) scale(1.02)',
              },
              alignSelf: 'flex-start',
            }}
            onClick={handleOpenPasswordDialog}
          >
            {t('auth.changePassword')}
          </Button>
        </Box>
      </Box>

      {message && (
        <Alert 
          severity={message.type} 
          onClose={() => setMessage(null)}
          sx={{ 
            mb: 3,
            borderRadius: 2,
            '& .MuiAlert-message': {
              fontWeight: 500,
            }
          }}
        >
          {message.text}
        </Alert>
      )}

      {/* 主要内容卡片 */}
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid',
          borderColor: alpha('#6366F1', 0.1),
        }}
      >
        <CardContent sx={{ p: 0 }}>
          {/* 头像和基本信息部分 */}
          <Paper
            elevation={0}
            sx={{
              p: 4,
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.08))',
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
            }}
          >
            <Box display="flex" alignItems="center" gap={3}>
              <Box position="relative">
                <Avatar
                  src={getAvatarUrl(user.avatar)}
                  sx={{
                    width: 80,
                    height: 80,
                    border: '3px solid white',
                    boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
                  }}
                >
                  <PersonIcon sx={{ fontSize: 40 }} />
                </Avatar>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarUpload}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                
                <IconButton
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  sx={{
                    position: 'absolute',
                    bottom: -5,
                    right: -5,
                    bgcolor: '#6366F1',
                    color: 'white',
                    width: 32,
                    height: 32,
                    '&:hover': {
                      bgcolor: '#4F46E5',
                    },
                    '&:disabled': {
                      bgcolor: '#9CA3AF',
                    },
                  }}
                >
                  {avatarUploading ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <CameraIcon sx={{ fontSize: 16 }} />
                  )}
                </IconButton>
              </Box>

              <Box flex={1}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                  {user.realName || user.username}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {user.email}
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {getRoleChips(user.roles)}
                </Box>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  {t('auth.memberSince')}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {user.lastLoginTime ? new Date(user.lastLoginTime).toLocaleDateString() : 'N/A'}
                </Typography>
              </Box>
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              {t('auth.avatarUploadTip')}
            </Typography>
          </Paper>

          {/* 详细信息部分 */}
          <Box sx={{ p: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {t('auth.basicInfo')}
              </Typography>
              
              {!editing ? (
                <Button
                  startIcon={<EditIcon />}
                  onClick={handleEdit}
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    borderColor: '#6366F1',
                    color: '#6366F1',
                    '&:hover': {
                      borderColor: '#4F46E5',
                      backgroundColor: alpha('#6366F1', 0.04),
                    },
                  }}
                >
                  {t('auth.editProfile')}
                </Button>
              ) : (
                <Box display="flex" gap={1}>
                  <Button
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    variant="contained"
                    disabled={loading}
                    sx={{
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #4F46E5, #3730A3)',
                      },
                    }}
                  >
                    {loading ? <CircularProgress size={20} /> : t('auth.saveChanges')}
                  </Button>
                  <Button
                    startIcon={<CancelIcon />}
                    onClick={handleCancel}
                    variant="outlined"
                    sx={{
                      borderRadius: 2,
                      borderColor: '#9CA3AF',
                      color: '#6B7280',
                      '&:hover': {
                        borderColor: '#6B7280',
                        backgroundColor: alpha('#6B7280', 0.04),
                      },
                    }}
                  >
                    {t('auth.cancel')}
                  </Button>
                </Box>
              )}
            </Box>

            <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3}>
              <TextField
                fullWidth
                label={t('auth.username')}
                value={user.username}
                disabled
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
                value={editing ? formData.email : user.email}
                onChange={handleChange}
                disabled={!editing}
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
                value={editing ? formData.realName : (user.realName || '')}
                onChange={handleChange}
                disabled={!editing}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
              
              <TextField
                fullWidth
                label={t('auth.userId')}
                value={user?.id ? user.id.toString() : ''}
                disabled
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* 租户信息 */}
            {user.tenantName && (
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  {t('auth.tenantInfo')}
                </Typography>
                <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3}>
                  <TextField
                    fullWidth
                    label={t('auth.tenantName')}
                    value={user?.tenantName || ''}
                    disabled
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                  <TextField
                    fullWidth
                    label={t('auth.tenantId')}
                    value={user?.tenantId ? user.tenantId.toString() : ''}
                    disabled
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Box>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* 修改密码弹窗 */}
      <Dialog open={passwordDialogOpen} onClose={handleClosePasswordDialog}
        maxWidth={false}
        fullWidth={false}
        PaperProps={{
          sx: {
            minWidth: 460,
            maxWidth: 480,
            width: 460,
            borderRadius: 4,
            boxShadow: '0 8px 32px rgba(99,102,241,0.18)',
            border: 'none',
            p: 0,
            background: 'linear-gradient(135deg, #F3F4F6 60%, #EEF2FF 100%)',
            position: 'relative',
            overflow: 'visible',
          }
        }}
      >
        {/* 顶部渐变条 */}
        <Box sx={{ height: 6, width: '100%', borderTopLeftRadius: 16, borderTopRightRadius: 16, background: 'linear-gradient(90deg, #4F46E5 0%, #A5B4FC 100%)', position: 'absolute', top: 0, left: 0 }} />
        <DialogTitle sx={{ fontWeight: 600, color: '#4F46E5', pt: 3, pb: 1, fontSize: 19, letterSpacing: 0.5, textAlign: 'center' }}>{t('auth.changePassword')}</DialogTitle>
        <DialogContent sx={{ pt: 1, px: 4, pb: 0 }}>
          <TextField
            margin="normal"
            label={t('auth.oldPassword')}
            name="oldPassword"
            type="password"
            fullWidth
            value={passwordForm.oldPassword}
            onChange={handlePasswordInputChange}
            autoComplete="current-password"
            sx={{ mb: 2, borderRadius: 2, background: '#F3F4F6' }}
            InputProps={{
              style: { borderRadius: 8, fontSize: 15, background: '#F3F4F6', height: 40 },
              startAdornment: <InputAdornment position="start"><VpnKeyIcon color="primary" /></InputAdornment>,
            }}
            InputLabelProps={{ style: { fontWeight: 500, fontSize: 15 } }}
          />
          <TextField
            margin="normal"
            label={t('auth.newPassword')}
            name="newPassword"
            type={showNewPassword ? 'text' : 'password'}
            fullWidth
            value={passwordForm.newPassword}
            onChange={handlePasswordInputChange}
            autoComplete="new-password"
            sx={{ mb: 2, borderRadius: 2, background: '#F3F4F6' }}
            InputProps={{
              style: { borderRadius: 8, fontSize: 15, background: '#F3F4F6', height: 40 },
              startAdornment: <InputAdornment position="start"><LockIcon color="primary" /></InputAdornment>,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowNewPassword((v) => !v)} edge="end" tabIndex={-1}>
                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            InputLabelProps={{ style: { fontWeight: 500, fontSize: 15 } }}
          />
          <TextField
            margin="normal"
            label={t('auth.confirmPassword')}
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            fullWidth
            value={passwordForm.confirmPassword}
            onChange={handlePasswordInputChange}
            autoComplete="new-password"
            sx={{ mb: 1, borderRadius: 2, background: '#F3F4F6' }}
            InputProps={{
              style: { borderRadius: 8, fontSize: 15, background: '#F3F4F6', height: 40 },
              startAdornment: <InputAdornment position="start"><LockIcon color="primary" /></InputAdornment>,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowConfirmPassword((v) => !v)} edge="end" tabIndex={-1}>
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            InputLabelProps={{ style: { fontWeight: 500, fontSize: 15 } }}
          />
          {passwordError && <Alert severity="error" sx={{ mt: 2, borderRadius: 2, fontWeight: 500, fontSize: 14 }}>{passwordError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 3, pt: 1, justifyContent: 'center' }}>
          <Button onClick={handleClosePasswordDialog} disabled={passwordLoading} variant="outlined" sx={{ borderRadius: 4, minWidth: 90, fontWeight: 600, fontSize: 13, height: 38, borderWidth: 1.5, borderColor: '#6366F1', color: '#4F46E5', background: '#F3F4F6', transition: 'all 0.2s', '&:hover': { borderColor: '#4F46E5', background: '#EEF2FF' } }}>{t('common.cancel')}</Button>
          <Button onClick={handleChangePassword} color="primary" variant="contained" disabled={passwordLoading} sx={{ borderRadius: 4, minWidth: 90, fontWeight: 700, fontSize: 13, height: 38, ml: 2, background: 'linear-gradient(90deg, #4F46E5 0%, #A5B4FC 100%)', boxShadow: '0 2px 8px rgba(99,102,241,0.10)', transition: 'all 0.2s', '&:hover': { background: 'linear-gradient(90deg, #6366F1 0%, #A5B4FC 100%)', boxShadow: '0 4px 16px rgba(99,102,241,0.15)', transform: 'scale(1.03)' } }}>
            {passwordLoading ? <CircularProgress size={20} /> : t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserProfile; 