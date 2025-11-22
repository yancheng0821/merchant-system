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
  IconButton,
  CircularProgress,
  alpha,
  Divider,
  Fade,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  CameraAlt as CameraIcon,
  Person as PersonIcon,
  Visibility,
  VisibilityOff,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIconMUI,
} from '@mui/icons-material';
import LockResetIcon from '@mui/icons-material/LockReset';
import InputAdornment from '@mui/material/InputAdornment';
import LockIcon from '@mui/icons-material/Lock';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { userApi, getFullImageUrl } from '../../services/api';
import { formatUtcToMerchantTime } from '../../utils/timezoneUtils';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { usePermission } from '../../hooks/usePermission';
import InfoIcon from '@mui/icons-material/Info';

const UserProfile: React.FC = () => {
  const { t } = useTranslation();
  const { user, updateUserInfo, uploadAvatar, loading, logout, error: authError } = useAuth();
  const navigate = useNavigate();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const { userPermissions, isSuperAdmin } = usePermission();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    realName: user?.realName || '',
    phone: user?.phone || '',
  });
  const [emailError, setEmailError] = useState<string>('');
  const [usernameError, setUsernameError] = useState<string>('');
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
  const [passwordTouchedFields, setPasswordTouchedFields] = useState({
    newPassword: false,
    confirmPassword: false,
  });

  // 新增密码可见性状态
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleOpenPasswordDialog = () => {
    setPasswordDialogOpen(true);
    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordError(null);
    setPasswordTouchedFields({ newPassword: false, confirmPassword: false });
  };
  const handleClosePasswordDialog = () => {
    setPasswordDialogOpen(false);
    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordError(null);
    setPasswordTouchedFields({ newPassword: false, confirmPassword: false });
  };
  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm({ ...passwordForm, [name]: value });
    setPasswordError(null);

    // 标记字段为已触摸
    if (name === 'confirmPassword') {
      setPasswordTouchedFields(prev => ({
        ...prev,
        confirmPassword: true,
      }));
    }
  };
  const handleChangePassword = async () => {
    setPasswordError(null);

    // 标记所有字段为已触摸
    setPasswordTouchedFields({
      newPassword: true,
      confirmPassword: true,
    });

    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError(t('auth.passwordRequired'));
      return;
    }

    // 验证新密码要求
    if (passwordForm.newPassword.length < 8 ||
        !/[A-Z]/.test(passwordForm.newPassword) ||
        !/[a-z]/.test(passwordForm.newPassword) ||
        !/[0-9]/.test(passwordForm.newPassword) ||
        !/[!@#$%^&*(),.?":{}|<>]/.test(passwordForm.newPassword)) {
      setPasswordError(t('auth.passwordRequirementsNotMet'));
      return;
    }

    // 验证两次密码是否一致
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError(t('auth.passwordMismatch'));
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
        enqueueSnackbar(t('auth.passwordChanged'), {
          variant: 'success',
          autoHideDuration: 3000,
          anchorOrigin: { vertical: 'top', horizontal: 'center' },
          content: (key, message) => (
            <Alert
              severity="success"
              onClose={() => closeSnackbar(key)}
              sx={{
                width: '100%',
                minWidth: '400px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              {message}
            </Alert>
          ),
        });
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


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // 实时验证用户名格式
    if (name === 'username') {
      if (!value) {
        setUsernameError(t('auth.usernameRequired'));
      } else if (value.length < 3 || value.length > 50) {
        setUsernameError(t('auth.usernameLengthError'));
      } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
        setUsernameError(t('auth.usernameFormatError'));
      } else {
        setUsernameError('');
      }
    }

    // 实时验证邮箱格式
    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        setEmailError(t('auth.invalidEmailFormat'));
      } else {
        setEmailError('');
      }
    }
  };

  const handleEdit = () => {
    setEditing(true);
    setEmailError('');
    setUsernameError('');
  };

  const handleCancel = () => {
    setEditing(false);
    setEmailError('');
    setUsernameError('');
    setFormData({
      username: user?.username || '',
      email: user?.email || '',
      realName: user?.realName || '',
      phone: user?.phone || '',
    });
  };

  const handleSave = async () => {
    try {
      if (!user || !user.id) {
        enqueueSnackbar(t('auth.userNotFound'), {
          variant: 'error',
          autoHideDuration: 3000,
          anchorOrigin: { vertical: 'top', horizontal: 'center' },
          content: (key, message) => (
            <Alert
              severity="error"
              onClose={() => closeSnackbar(key)}
              sx={{
                width: '100%',
                minWidth: '400px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              {message}
            </Alert>
          ),
        });
        return;
      }

      // 验证用户名格式
      if (!formData.username) {
        setUsernameError(t('auth.usernameRequired'));
        return;
      }
      if (formData.username.length < 3 || formData.username.length > 50) {
        setUsernameError(t('auth.usernameLengthError'));
        return;
      }
      if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        setUsernameError(t('auth.usernameFormatError'));
        return;
      }

      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (formData.email && !emailRegex.test(formData.email)) {
        setEmailError(t('auth.invalidEmailFormat'));
        return;
      }

      // 确保userId是数字类型，而不是undefined或null
      const updateData = {
        username: formData.username,
        email: formData.email,
        realName: formData.realName,
        phone: formData.phone,
        userId: Number(user.id) // 确保userId是数字类型
      };

      const success = await updateUserInfo(updateData);

      if (success) {
        setEditing(false);
        enqueueSnackbar(t('auth.profileUpdated'), {
          variant: 'success',
          autoHideDuration: 3000,
          anchorOrigin: { vertical: 'top', horizontal: 'center' },
          content: (key, message) => (
            <Alert
              severity="success"
              onClose={() => closeSnackbar(key)}
              sx={{
                width: '100%',
                minWidth: '400px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              {message}
            </Alert>
          ),
        });
      } else {
        setFormData({
          username: user?.username || '',
          email: user?.email || '',
          realName: user?.realName || '',
          phone: user?.phone || '',
        });
        // Use the actual error message from AuthContext, or fallback to generic message
        const errorMessage = authError || t('auth.updateFailed');
        enqueueSnackbar(errorMessage, {
          variant: 'error',
          autoHideDuration: 3000,
          anchorOrigin: { vertical: 'top', horizontal: 'center' },
          content: (key, message) => (
            <Alert
              severity="error"
              onClose={() => closeSnackbar(key)}
              sx={{
                width: '100%',
                minWidth: '400px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              {message}
            </Alert>
          ),
        });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setFormData({
        username: user?.username || '',
        email: user?.email || '',
        realName: user?.realName || '',
        phone: user?.phone || '',
      });
      // Use the actual error message from AuthContext, or fallback to generic message
      const errorMessage = authError || t('auth.updateFailed');
      enqueueSnackbar(errorMessage, {
        variant: 'error',
        autoHideDuration: 3000,
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        content: (key, message) => (
          <Alert
            severity="error"
            onClose={() => closeSnackbar(key)}
            sx={{
              width: '100%',
              minWidth: '400px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            {message}
          </Alert>
        ),
      });
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      enqueueSnackbar(t('auth.invalidFileType'), {
        variant: 'error',
        autoHideDuration: 3000,
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        content: (key, message) => (
          <Alert
            severity="error"
            onClose={() => closeSnackbar(key)}
            sx={{
              width: '100%',
              minWidth: '400px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            {message}
          </Alert>
        ),
      });
      return;
    }

    // 验证文件大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
      enqueueSnackbar(t('auth.fileTooLarge'), {
        variant: 'error',
        autoHideDuration: 3000,
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        content: (key, message) => (
          <Alert
            severity="error"
            onClose={() => closeSnackbar(key)}
            sx={{
              width: '100%',
              minWidth: '400px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            {message}
          </Alert>
        ),
      });
      return;
    }

    setAvatarUploading(true);
    try {
      await uploadAvatar(file);
      enqueueSnackbar(t('auth.avatarUpdated'), {
        variant: 'success',
        autoHideDuration: 3000,
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        content: (key, message) => (
          <Alert
            severity="success"
            onClose={() => closeSnackbar(key)}
            sx={{
              width: '100%',
              minWidth: '400px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            {message}
          </Alert>
        ),
      });
    } catch (error) {
      enqueueSnackbar(t('auth.avatarUploadFailed'), {
        variant: 'error',
        autoHideDuration: 3000,
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        content: (key, message) => (
          <Alert
            severity="error"
            onClose={() => closeSnackbar(key)}
            sx={{
              width: '100%',
              minWidth: '400px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            {message}
          </Alert>
        ),
      });
    } finally {
      setAvatarUploading(false);
    }
  };

  const getRoleChips = (roles?: string[]) => {
    // 尝试从 permissions.roles 获取角色信息
    let displayRoles: Array<{ code: string; name: string }> = [];

    if (user?.permissions && typeof user.permissions === 'object' && 'roles' in user.permissions) {
      const permissionRoles = (user.permissions as any).roles || [];
      displayRoles = permissionRoles.map((r: any) => ({
        code: r.roleCode,
        name: r.displayName
      }));
    } else if (roles && roles.length > 0) {
      // 如果有简单的角色字符串数组，使用它
      displayRoles = roles.map(role => ({
        code: role,
        name: role
      }));
    }

    if (displayRoles.length === 0) {
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

    return displayRoles.map((role, index) => {
      const roleConfig: Record<string, { color: string; bg: string; label: string }> = {
        'SUPER_ADMIN': { color: '#EF4444', bg: alpha('#EF4444', 0.1), label: t('auth.superAdmin') },
        'SYSTEM_ADMIN': { color: '#EF4444', bg: alpha('#EF4444', 0.1), label: t('auth.systemAdmin') },
        'MANAGER': { color: '#6366F1', bg: alpha('#6366F1', 0.1), label: t('auth.manager') },
        'ACCOUNTANT': { color: '#F59E0B', bg: alpha('#F59E0B', 0.1), label: t('auth.accountant') },
        'RECEPTIONIST': { color: '#8B5CF6', bg: alpha('#8B5CF6', 0.1), label: t('auth.receptionist') },
        'STAFF': { color: '#10B981', bg: alpha('#10B981', 0.1), label: t('auth.staff') },
      };

      // 使用 displayName 如果有，否则使用配置的 label，最后使用 code
      const config = roleConfig[role.code];
      const label = role.name !== role.code ? role.name : (config?.label || role.code);
      const color = config?.color || '#6366F1';
      const bg = config?.bg || alpha('#6366F1', 0.1);

      return (
        <Chip
          key={index}
          label={label}
          sx={{
            backgroundColor: bg,
            color: color,
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
          {/* 修改密码按钮 */}
          <Button
            variant="contained"
            size="medium"
            startIcon={<LockResetIcon />}
            sx={{
              px: 3,
              py: 1,
              textTransform: 'none',
              fontWeight: 500,
              borderRadius: 2,
              backgroundColor: '#6366f1',
              '&:hover': {
                backgroundColor: '#4f46e5',
              },
            }}
            onClick={handleOpenPasswordDialog}
          >
            {t('auth.changePassword')}
          </Button>
        </Box>
      </Box>

      {/* 无权限提示 */}
      {!isSuperAdmin() && userPermissions.permissionCodes.length === 0 && (
        <Alert
          severity="warning"
          sx={{
            mb: 3,
            borderRadius: 2,
            backgroundColor: alpha('#6366F1', 0.08),
            border: 'none',
            '& .MuiAlert-message': {
              width: '100%',
            },
            '& .MuiAlert-icon': {
              color: '#F59E0B',
            },
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5, color: '#1e293b' }}>
            {t('auth.noPermissionTitle', '您暂时还没有系统权限')}
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            {t('auth.noPermissionMessage', '您的账户已成功注册，但尚未分配任何系统权限。请联系您的店长或管理员为您分配相应的使用权限，以便访问系统功能。')}
          </Typography>
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
                  src={getFullImageUrl(user.avatar)}
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
                  {user.createdAt ? formatUtcToMerchantTime(user.createdAt, 'MMM dd, yyyy') : 'N/A'}
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
                  size="small"
                  sx={{
                    textTransform: 'none',
                    color: '#6366f1',
                    borderRadius: 1.5,
                    px: 2,
                    py: 0.75,
                    '&:hover': {
                      backgroundColor: 'rgba(99, 102, 241, 0.08)',
                    },
                  }}
                >
                  {t('auth.editProfile')}
                </Button>
              ) : (
                <Box display="flex" gap={1}>
                  <Button
                    startIcon={loading ? <CircularProgress size={16} sx={{ color: '#10b981' }} /> : <CheckCircleIcon />}
                    onClick={handleSave}
                    disabled={loading}
                    variant="outlined"
                    size="small"
                    sx={{
                      textTransform: 'none',
                      color: '#10b981',
                      borderColor: '#10b981',
                      borderRadius: 1.5,
                      px: 2,
                      py: 0.75,
                      '&:hover': {
                        backgroundColor: 'rgba(16, 185, 129, 0.08)',
                        borderColor: '#10b981',
                      },
                      '&:disabled': {
                        borderColor: '#e5e7eb',
                        color: '#9ca3af',
                      },
                    }}
                  >
                    {t('auth.saveChanges')}
                  </Button>
                  <Button
                    startIcon={<CancelIcon />}
                    onClick={handleCancel}
                    size="small"
                    sx={{
                      textTransform: 'none',
                      color: '#6b7280',
                      borderRadius: 1.5,
                      px: 2,
                      py: 0.75,
                      '&:hover': {
                        backgroundColor: 'rgba(107, 114, 128, 0.08)',
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
                name="username"
                value={editing ? formData.username : user.username}
                onChange={handleChange}
                disabled={!editing}
                error={editing && !!usernameError}
                helperText={editing && usernameError}
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
                error={editing && !!emailError}
                helperText={editing && emailError}
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
                label={t('auth.phone')}
                name="phone"
                value={editing ? formData.phone : (user.phone || '')}
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
          </Box>
        </CardContent>
      </Card>

      {/* 修改密码弹窗 */}
      <Dialog
        open={passwordDialogOpen}
        onClose={handleClosePasswordDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#6366F1' }}>
              {t('auth.changePassword')}
            </Typography>
            <IconButton onClick={handleClosePasswordDialog}>
              <CancelIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 3 }}>
            <TextField
              label={t('auth.oldPassword')}
              name="oldPassword"
              type="password"
              fullWidth
              value={passwordForm.oldPassword}
              onChange={handlePasswordInputChange}
              autoComplete="current-password"
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&.Mui-focused fieldset': {
                    borderColor: '#6366F1',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#6366F1',
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <VpnKeyIcon sx={{ color: '#6366F1' }} />
                  </InputAdornment>
                ),
              }}
            />

            <Box>
              <TextField
                label={t('auth.newPassword')}
                name="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                fullWidth
                value={passwordForm.newPassword}
                onChange={handlePasswordInputChange}
                onFocus={() => setPasswordTouchedFields(prev => ({ ...prev, newPassword: true }))}
                autoComplete="new-password"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&.Mui-focused fieldset': {
                      borderColor: '#6366F1',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#6366F1',
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#6366F1' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowNewPassword((v) => !v)}
                        edge="end"
                        tabIndex={-1}
                      >
                        {showNewPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              {/* 密码要求提示 - 只在用户聚焦密码框且未全部满足时显示 */}
              {passwordTouchedFields.newPassword && !(
                passwordForm.newPassword &&
                passwordForm.newPassword.length >= 8 &&
                /[A-Z]/.test(passwordForm.newPassword) &&
                /[a-z]/.test(passwordForm.newPassword) &&
                /[0-9]/.test(passwordForm.newPassword) &&
                /[!@#$%^&*(),.?":{}|<>]/.test(passwordForm.newPassword)
              ) && (
                <Fade in={true}>
                  <Box sx={{ mt: 0.5, mb: 1, px: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 500 }}>
                      {t('auth.passwordRequirements')}:
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      {/* 至少8位 */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                        {passwordForm.newPassword.length >= 8 ? (
                          <CheckCircleIcon sx={{ fontSize: '0.85rem', color: 'success.main' }} />
                        ) : (
                          <CancelIconMUI sx={{ fontSize: '0.85rem', color: 'text.disabled' }} />
                        )}
                        <Typography
                          variant="caption"
                          sx={{
                            color: passwordForm.newPassword.length >= 8 ? 'success.main' : 'text.secondary',
                            fontSize: '0.7rem'
                          }}
                        >
                          {t('auth.passwordMinLength')}
                        </Typography>
                      </Box>
                      {/* 大写字母 */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                        {/[A-Z]/.test(passwordForm.newPassword) ? (
                          <CheckCircleIcon sx={{ fontSize: '0.85rem', color: 'success.main' }} />
                        ) : (
                          <CancelIconMUI sx={{ fontSize: '0.85rem', color: 'text.disabled' }} />
                        )}
                        <Typography
                          variant="caption"
                          sx={{
                            color: /[A-Z]/.test(passwordForm.newPassword) ? 'success.main' : 'text.secondary',
                            fontSize: '0.7rem'
                          }}
                        >
                          {t('auth.passwordNeedsUpperCase')}
                        </Typography>
                      </Box>
                      {/* 小写字母 */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                        {/[a-z]/.test(passwordForm.newPassword) ? (
                          <CheckCircleIcon sx={{ fontSize: '0.85rem', color: 'success.main' }} />
                        ) : (
                          <CancelIconMUI sx={{ fontSize: '0.85rem', color: 'text.disabled' }} />
                        )}
                        <Typography
                          variant="caption"
                          sx={{
                            color: /[a-z]/.test(passwordForm.newPassword) ? 'success.main' : 'text.secondary',
                            fontSize: '0.7rem'
                          }}
                        >
                          {t('auth.passwordNeedsLowerCase')}
                        </Typography>
                      </Box>
                      {/* 数字 */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                        {/[0-9]/.test(passwordForm.newPassword) ? (
                          <CheckCircleIcon sx={{ fontSize: '0.85rem', color: 'success.main' }} />
                        ) : (
                          <CancelIconMUI sx={{ fontSize: '0.85rem', color: 'text.disabled' }} />
                        )}
                        <Typography
                          variant="caption"
                          sx={{
                            color: /[0-9]/.test(passwordForm.newPassword) ? 'success.main' : 'text.secondary',
                            fontSize: '0.7rem'
                          }}
                        >
                          {t('auth.passwordNeedsNumber')}
                        </Typography>
                      </Box>
                      {/* 特殊字符 */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                        {/[!@#$%^&*(),.?":{}|<>]/.test(passwordForm.newPassword) ? (
                          <CheckCircleIcon sx={{ fontSize: '0.85rem', color: 'success.main' }} />
                        ) : (
                          <CancelIconMUI sx={{ fontSize: '0.85rem', color: 'text.disabled' }} />
                        )}
                        <Typography
                          variant="caption"
                          sx={{
                            color: /[!@#$%^&*(),.?":{}|<>]/.test(passwordForm.newPassword) ? 'success.main' : 'text.secondary',
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
              label={t('auth.confirmPassword')}
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              fullWidth
              value={passwordForm.confirmPassword}
              onChange={handlePasswordInputChange}
              onFocus={() => setPasswordTouchedFields(prev => ({ ...prev, confirmPassword: true }))}
              autoComplete="new-password"
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&.Mui-focused fieldset': {
                    borderColor: '#6366F1',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#6366F1',
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: '#6366F1' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      edge="end"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {passwordError && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {passwordError}
              </Alert>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={handleClosePasswordDialog}
            disabled={passwordLoading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleChangePassword}
            disabled={passwordLoading}
            variant="contained"
          >
            {passwordLoading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserProfile; 