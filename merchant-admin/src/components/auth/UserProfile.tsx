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
  Switch,
  FormControlLabel,
  Snackbar,
  useMediaQuery,
  useTheme as useMuiTheme,
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
  DeleteForever as DeleteForeverIcon,
} from '@mui/icons-material';
import LockResetIcon from '@mui/icons-material/LockReset';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import SecurityIcon from '@mui/icons-material/Security';
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
import { usePermission } from '../../hooks/usePermission';
import InfoIcon from '@mui/icons-material/Info';

const UserProfile: React.FC = () => {
  const { t } = useTranslation();
  const { user, updateUserInfo, uploadAvatar, loading, logout, error: authError } = useAuth();
  const navigate = useNavigate();
  const { userPermissions, isSuperAdmin } = usePermission();
  const muiTheme = useMuiTheme();

  // 移动端检测
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  // 通知状态
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

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

  // 短信验证设置状态
  const [smsVerificationEnabled, setSmsVerificationEnabled] = useState(user?.smsVerificationEnabled !== false);
  const [smsVerificationLoading, setSmsVerificationLoading] = useState(false);

  // 注销账户弹窗状态
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState('');
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);
  const [showDeleteAccountPassword, setShowDeleteAccountPassword] = useState(false);

  // 处理短信验证开关变更
  const handleSmsVerificationChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.checked;
    setSmsVerificationLoading(true);

    try {
      const updateData = {
        username: user?.username || '',
        email: user?.email || '',
        realName: user?.realName || '',
        phone: user?.phone || '',
        userId: Number(user?.id),
        smsVerificationEnabled: newValue,
      };

      const success = await updateUserInfo(updateData);

      if (success) {
        setSmsVerificationEnabled(newValue);
      } else {
        // 恢复原始值
        setSmsVerificationEnabled(!newValue);
      }
    } catch (error) {
      console.error('Failed to update SMS verification setting:', error);
      // 恢复原始值
      setSmsVerificationEnabled(!newValue);
    } finally {
      setSmsVerificationLoading(false);
    }
  };

  // 注销账户相关处理
  const handleOpenDeleteAccountDialog = () => {
    setDeleteAccountDialogOpen(true);
    setDeleteAccountPassword('');
    setDeleteAccountError(null);
  };

  const handleCloseDeleteAccountDialog = () => {
    setDeleteAccountDialogOpen(false);
    setDeleteAccountPassword('');
    setDeleteAccountError(null);
    setShowDeleteAccountPassword(false);
  };

  const handleDeleteAccount = async () => {
    if (!deleteAccountPassword) {
      setDeleteAccountError(t('auth.passwordRequired'));
      return;
    }

    setDeleteAccountLoading(true);
    setDeleteAccountError(null);

    try {
      const resp = await userApi.deleteAccount(deleteAccountPassword);
      if (resp.success) {
        setDeleteAccountDialogOpen(false);
        setSnackbar({
          open: true,
          message: t('auth.accountDeleted'),
          severity: 'success',
        });
        setTimeout(() => {
          logout();
          navigate('/login');
        }, 1500);
      } else {
        setDeleteAccountError(resp.message || t('auth.deleteAccountFailed'));
      }
    } catch (e: any) {
      setDeleteAccountError(e.message || t('auth.deleteAccountFailed'));
    } finally {
      setDeleteAccountLoading(false);
    }
  };

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
        setSnackbar({
          open: true,
          message: t('auth.passwordChanged'),
          severity: 'success',
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
        setSnackbar({
          open: true,
          message: t('auth.userNotFound'),
          severity: 'error',
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
        setSnackbar({
          open: true,
          message: t('auth.profileUpdated'),
          severity: 'success',
        });
      } else {
        setFormData({
          username: user?.username || '',
          email: user?.email || '',
          realName: user?.realName || '',
          phone: user?.phone || '',
        });
        const errorMessage = authError || t('auth.updateFailed');
        setSnackbar({
          open: true,
          message: errorMessage,
          severity: 'error',
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
      const errorMessage = authError || t('auth.updateFailed');
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setSnackbar({
        open: true,
        message: t('auth.invalidFileType'),
        severity: 'error',
      });
      return;
    }

    // 验证文件大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
      setSnackbar({
        open: true,
        message: t('auth.fileTooLarge'),
        severity: 'error',
      });
      return;
    }

    setAvatarUploading(true);
    try {
      await uploadAvatar(file);
      setSnackbar({
        open: true,
        message: t('auth.avatarUpdated'),
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: t('auth.avatarUploadFailed'),
        severity: 'error',
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
            backgroundColor: '#f5f5f5',
            color: '#666',
            fontWeight: 600,
            fontSize: '0.75rem',
          }}
        />
      );
    }

    return displayRoles.map((role, index) => {
      const roleConfig: Record<string, { color: string; bg: string; label: string }> = {
        'SUPER_ADMIN': { color: '#1a1a1a', bg: '#e8e8e8', label: t('auth.superAdmin') },
        'SYSTEM_ADMIN': { color: '#1a1a1a', bg: '#e8e8e8', label: t('auth.systemAdmin') },
        'MANAGER': { color: '#333', bg: '#f0f0f0', label: t('auth.manager') },
        'ACCOUNTANT': { color: '#555', bg: '#f5f5f5', label: t('auth.accountant') },
        'RECEPTIONIST': { color: '#555', bg: '#f5f5f5', label: t('auth.receptionist') },
        'STAFF': { color: '#666', bg: '#f8f8f8', label: t('auth.staff') },
      };

      // 使用 displayName 如果有，否则使用配置的 label，最后使用 code
      const config = roleConfig[role.code];
      const label = role.name !== role.code ? role.name : (config?.label || role.code);
      const color = config?.color || '#666';
      const bg = config?.bg || '#f5f5f5';

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
    <Box sx={{ maxWidth: 800, mx: 'auto', p: isMobile ? 1.5 : 3 }}>
      {/* 页面标题 */}
      <Box mb={isMobile ? 2 : 4} display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography
            variant={isMobile ? 'h6' : 'h5'}
            component="h1"
            sx={{
              fontWeight: 500,
              color: '#1a1a1a',
              mb: 0.5,
            }}
          >
            {t('auth.userProfile')}
          </Typography>
          {!isMobile && (
            <Typography sx={{ color: '#888', fontSize: '0.85rem' }}>
              {t('auth.userProfileSubtitle')}
            </Typography>
          )}
        </Box>
      </Box>

      {/* 无权限提示 */}
      {!isSuperAdmin() && userPermissions.permissionCodes.length === 0 && (
        <Alert
          severity="warning"
          sx={{
            mb: 3,
            borderRadius: 2,
            backgroundColor: '#f5f5f5',
            border: '1px solid rgba(0,0,0,0.06)',
            '& .MuiAlert-message': {
              width: '100%',
            },
            '& .MuiAlert-icon': {
              color: '#888',
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
          borderRadius: isMobile ? 2 : 3,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          border: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <CardContent sx={{ p: 0 }}>
          {/* 头像和基本信息部分 */}
          <Paper
            elevation={0}
            sx={{
              p: isMobile ? 2 : 4,
              background: '#fafafa',
              borderTopLeftRadius: isMobile ? 8 : 12,
              borderTopRightRadius: isMobile ? 8 : 12,
            }}
          >
            <Box display="flex" alignItems={isMobile ? 'flex-start' : 'center'} flexDirection={isMobile ? 'column' : 'row'} gap={isMobile ? 2 : 3}>
              {/* 移动端：头像居中 */}
              <Box position="relative" sx={isMobile ? { mx: 'auto' } : {}}>
                <Avatar
                  src={getFullImageUrl(user.avatar)}
                  sx={{
                    width: isMobile ? 72 : 80,
                    height: isMobile ? 72 : 80,
                    border: '3px solid white',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                  }}
                >
                  <PersonIcon sx={{ fontSize: isMobile ? 36 : 40 }} />
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
                    bgcolor: '#1a1a1a',
                    color: 'white',
                    width: isMobile ? 28 : 32,
                    height: isMobile ? 28 : 32,
                    '&:hover': {
                      bgcolor: '#333',
                    },
                    '&:disabled': {
                      bgcolor: '#9CA3AF',
                    },
                  }}
                >
                  {avatarUploading ? (
                    <CircularProgress size={isMobile ? 14 : 16} color="inherit" />
                  ) : (
                    <CameraIcon sx={{ fontSize: isMobile ? 14 : 16 }} />
                  )}
                </IconButton>
              </Box>

              {/* 移动端：用户信息居中 */}
              <Box flex={1} sx={isMobile ? { textAlign: 'center', width: '100%' } : {}}>
                <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 600, mb: 0.5 }}>
                  {user.realName || user.username}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
                  {user.email}
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={0.5} sx={isMobile ? { justifyContent: 'center' } : {}}>
                  {getRoleChips(user.roles)}
                </Box>
              </Box>

              {/* 移动端：注册日期显示在下方 */}
              <Box sx={isMobile ? { width: '100%', textAlign: 'center', pt: 1, borderTop: '1px solid rgba(0,0,0,0.06)' } : {}}>
                <Typography variant="caption" color="text.secondary" display="block">
                  {t('auth.memberSince')}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
                  {user.createdAt ? formatUtcToMerchantTime(user.createdAt, 'MMM dd, yyyy') : 'N/A'}
                </Typography>
              </Box>
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', fontSize: isMobile ? '0.65rem' : '0.75rem', textAlign: isMobile ? 'center' : 'left' }}>
              {t('auth.avatarUploadTip')}
            </Typography>
          </Paper>

          {/* 详细信息部分 */}
          <Box sx={{ p: isMobile ? 2 : 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems={isMobile ? 'flex-start' : 'center'} flexDirection={isMobile ? 'column' : 'row'} gap={isMobile ? 1.5 : 0} mb={isMobile ? 2 : 3}>
              <Typography variant={isMobile ? 'subtitle1' : 'h6'} sx={{ fontWeight: 600 }}>
                {t('auth.basicInfo')}
              </Typography>

              {!editing ? (
                <Button
                  startIcon={<EditIcon sx={{ fontSize: isMobile ? 16 : 18 }} />}
                  onClick={handleEdit}
                  size="small"
                  fullWidth={isMobile}
                  sx={{
                    textTransform: 'none',
                    color: '#666',
                    borderRadius: 1.5,
                    px: 2,
                    py: 0.75,
                    fontSize: isMobile ? '0.8rem' : '0.875rem',
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.04)',
                    },
                  }}
                >
                  {t('auth.editProfile')}
                </Button>
              ) : (
                <Box display="flex" gap={1} sx={isMobile ? { width: '100%' } : {}}>
                  <Button
                    startIcon={loading ? <CircularProgress size={14} sx={{ color: '#1a1a1a' }} /> : <CheckCircleIcon sx={{ fontSize: 16 }} />}
                    onClick={handleSave}
                    disabled={loading}
                    variant="outlined"
                    size="small"
                    sx={{
                      textTransform: 'none',
                      color: '#1a1a1a',
                      borderColor: '#1a1a1a',
                      borderRadius: 1.5,
                      px: isMobile ? 1.5 : 2,
                      py: 0.75,
                      fontSize: isMobile ? '0.75rem' : '0.875rem',
                      flex: isMobile ? 1 : 'none',
                      '&:hover': {
                        backgroundColor: 'rgba(0,0,0,0.04)',
                        borderColor: '#1a1a1a',
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
                    startIcon={<CancelIcon sx={{ fontSize: 16 }} />}
                    onClick={handleCancel}
                    size="small"
                    sx={{
                      textTransform: 'none',
                      color: '#888',
                      borderRadius: 1.5,
                      px: isMobile ? 1.5 : 2,
                      py: 0.75,
                      fontSize: isMobile ? '0.75rem' : '0.875rem',
                      flex: isMobile ? 1 : 'none',
                      '&:hover': {
                        backgroundColor: 'rgba(0,0,0,0.04)',
                      },
                    }}
                  >
                    {t('auth.cancel')}
                  </Button>
                </Box>
              )}
            </Box>

            <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={isMobile ? 1.5 : 3}>
              <TextField
                fullWidth
                size={isMobile ? 'small' : 'medium'}
                label={t('auth.username')}
                name="username"
                value={editing ? formData.username : user.username}
                onChange={handleChange}
                disabled={!editing}
                error={editing && !!usernameError}
                helperText={editing && usernameError}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: isMobile ? 1.5 : 2,
                    bgcolor: '#fff',
                    fontSize: isMobile ? '0.875rem' : undefined,
                    '& fieldset': { borderColor: '#d0d0d0' },
                    '&:hover fieldset': { borderColor: '#bbb' },
                    '&.Mui-focused fieldset': { borderColor: '#1a1a1a', borderWidth: '1px' },
                    '&.Mui-disabled': { bgcolor: '#fafafa' },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#999',
                    fontSize: isMobile ? '0.875rem' : undefined,
                    '&.Mui-focused': { color: '#1a1a1a' },
                  },
                }}
              />

              <TextField
                fullWidth
                size={isMobile ? 'small' : 'medium'}
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
                    borderRadius: isMobile ? 1.5 : 2,
                    bgcolor: '#fff',
                    fontSize: isMobile ? '0.875rem' : undefined,
                    '& fieldset': { borderColor: '#d0d0d0' },
                    '&:hover fieldset': { borderColor: '#bbb' },
                    '&.Mui-focused fieldset': { borderColor: '#1a1a1a', borderWidth: '1px' },
                    '&.Mui-disabled': { bgcolor: '#fafafa' },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#999',
                    fontSize: isMobile ? '0.875rem' : undefined,
                    '&.Mui-focused': { color: '#1a1a1a' },
                  },
                }}
              />

              <TextField
                fullWidth
                size={isMobile ? 'small' : 'medium'}
                label={t('auth.realName')}
                name="realName"
                value={editing ? formData.realName : (user.realName || '')}
                onChange={handleChange}
                disabled={!editing}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: isMobile ? 1.5 : 2,
                    bgcolor: '#fff',
                    fontSize: isMobile ? '0.875rem' : undefined,
                    '& fieldset': { borderColor: '#d0d0d0' },
                    '&:hover fieldset': { borderColor: '#bbb' },
                    '&.Mui-focused fieldset': { borderColor: '#1a1a1a', borderWidth: '1px' },
                    '&.Mui-disabled': { bgcolor: '#fafafa' },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#999',
                    fontSize: isMobile ? '0.875rem' : undefined,
                    '&.Mui-focused': { color: '#1a1a1a' },
                  },
                }}
              />

              <TextField
                fullWidth
                size={isMobile ? 'small' : 'medium'}
                label={t('auth.phone')}
                name="phone"
                value={editing ? formData.phone : (user.phone || '')}
                onChange={handleChange}
                disabled={!editing}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: isMobile ? 1.5 : 2,
                    bgcolor: '#fff',
                    fontSize: isMobile ? '0.875rem' : undefined,
                    '& fieldset': { borderColor: '#d0d0d0' },
                    '&:hover fieldset': { borderColor: '#bbb' },
                    '&.Mui-focused fieldset': { borderColor: '#1a1a1a', borderWidth: '1px' },
                    '&.Mui-disabled': { bgcolor: '#fafafa' },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#999',
                    fontSize: isMobile ? '0.875rem' : undefined,
                    '&.Mui-focused': { color: '#1a1a1a' },
                  },
                }}
              />

              <TextField
                fullWidth
                size={isMobile ? 'small' : 'medium'}
                label={t('auth.userId')}
                value={user?.id ? user.id.toString() : ''}
                disabled
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: isMobile ? 1.5 : 2,
                    bgcolor: '#fafafa',
                    fontSize: isMobile ? '0.875rem' : undefined,
                    '& fieldset': { borderColor: '#d0d0d0' },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#999',
                    fontSize: isMobile ? '0.875rem' : undefined,
                  },
                }}
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* 安全设置卡片 - 简洁列表样式 */}
      <Card
        sx={{
          mt: isMobile ? 2 : 3,
          borderRadius: isMobile ? 2 : 3,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          border: '1px solid rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}
      >
        {/* 标题 */}
        <Box sx={{ px: isMobile ? 2 : 3, pt: isMobile ? 2 : 2.5, pb: 1 }}>
          <Typography variant={isMobile ? 'subtitle1' : 'h6'} sx={{ fontWeight: 600, color: '#1a1a1a' }}>
            {t('auth.securitySettings')}
          </Typography>
        </Box>

        {/* 短信验证 */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: isMobile ? 2 : 3,
            py: isMobile ? 1.5 : 2,
            borderBottom: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <Box sx={{ flex: 1, mr: 2 }}>
            <Typography sx={{ fontWeight: 500, color: '#1a1a1a', fontSize: isMobile ? '0.875rem' : '0.9rem' }}>
              {t('auth.smsVerification')}
            </Typography>
            <Typography sx={{ color: '#888', fontSize: isMobile ? '0.7rem' : '0.75rem', mt: 0.25 }}>
              {!user?.phone ? t('auth.phoneRequiredForSms') : t('auth.smsVerificationDescription')}
            </Typography>
          </Box>
          {smsVerificationLoading ? (
            <CircularProgress size={20} sx={{ color: '#1a1a1a' }} />
          ) : (
            <Switch
              checked={smsVerificationEnabled}
              onChange={handleSmsVerificationChange}
              disabled={!user?.phone}
              size="small"
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': { color: '#1a1a1a' },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#1a1a1a' },
              }}
            />
          )}
        </Box>

        {/* 修改密码 */}
        <Box
          onClick={handleOpenPasswordDialog}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: isMobile ? 2 : 3,
            py: isMobile ? 1.5 : 2,
            borderBottom: '1px solid rgba(0,0,0,0.06)',
            cursor: 'pointer',
            transition: 'background-color 0.15s',
            WebkitTapHighlightColor: 'transparent',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
            '&:active': { bgcolor: 'rgba(0,0,0,0.04)' },
          }}
        >
          <Typography sx={{ fontWeight: 500, color: '#1a1a1a', fontSize: isMobile ? '0.875rem' : '0.9rem' }}>
            {t('auth.changePassword')}
          </Typography>
          <Typography sx={{ color: '#ccc', fontSize: '1.1rem' }}>›</Typography>
        </Box>

        {/* 注销账户 */}
        <Box
          onClick={handleOpenDeleteAccountDialog}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: isMobile ? 2 : 3,
            py: isMobile ? 1.5 : 2,
            cursor: 'pointer',
            transition: 'background-color 0.15s',
            WebkitTapHighlightColor: 'transparent',
            '&:hover': { bgcolor: 'rgba(239,68,68,0.04)' },
            '&:active': { bgcolor: 'rgba(239,68,68,0.08)' },
          }}
        >
          <Typography sx={{ fontWeight: 500, color: '#ef4444', fontSize: isMobile ? '0.875rem' : '0.9rem' }}>
            {t('auth.deleteAccount')}
          </Typography>
          <Typography sx={{ color: '#fca5a5', fontSize: '1.1rem' }}>›</Typography>
        </Box>
      </Card>

      {/* 退出按钮 - 仅移动端显示在底部 */}
      {isMobile && (
        <Box sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            size="medium"
            fullWidth
            startIcon={<ExitToAppIcon sx={{ fontSize: 18 }} />}
            sx={{
              py: 1.25,
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.875rem',
              borderRadius: 2,
              borderColor: '#e0e0e0',
              color: '#666',
              '&:hover': {
                borderColor: '#ccc',
                bgcolor: 'rgba(0,0,0,0.02)',
              },
            }}
            onClick={logout}
          >
            {t('auth.logout')}
          </Button>
        </Box>
      )}

      {/* 修改密码弹窗 */}
      <Dialog
        open={passwordDialogOpen}
        onClose={handleClosePasswordDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 2 : 3,
            maxHeight: isMobile ? 'calc(100vh - 32px)' : '90vh',
            m: isMobile ? 2 : 'auto',
          }
        }}
      >
        <DialogTitle sx={{ py: isMobile ? 1.5 : 2, px: isMobile ? 2 : 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant={isMobile ? 'subtitle1' : 'h6'} sx={{ fontWeight: 600, color: '#1a1a1a' }}>
              {t('auth.changePassword')}
            </Typography>
            <IconButton onClick={handleClosePasswordDialog} sx={{ color: '#888' }} size={isMobile ? 'small' : 'medium'}>
              <CancelIcon fontSize={isMobile ? 'small' : 'medium'} />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ px: isMobile ? 2 : 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 2 : 2.5, mt: isMobile ? 2 : 3 }}>
            <TextField
              label={t('auth.oldPassword')}
              name="oldPassword"
              type="password"
              fullWidth
              size={isMobile ? 'small' : 'medium'}
              value={passwordForm.oldPassword}
              onChange={handlePasswordInputChange}
              autoComplete="current-password"
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: isMobile ? 1.5 : 2,
                  bgcolor: '#fff',
                  fontSize: isMobile ? '0.875rem' : undefined,
                  '& fieldset': { borderColor: '#d0d0d0' },
                  '&:hover fieldset': { borderColor: '#bbb' },
                  '&.Mui-focused fieldset': { borderColor: '#1a1a1a', borderWidth: '1px' },
                },
                '& .MuiInputLabel-root': {
                  color: '#999',
                  fontSize: isMobile ? '0.875rem' : undefined,
                  '&.Mui-focused': { color: '#1a1a1a' },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <VpnKeyIcon sx={{ color: '#bbb', fontSize: isMobile ? 20 : 24 }} />
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
                size={isMobile ? 'small' : 'medium'}
                value={passwordForm.newPassword}
                onChange={handlePasswordInputChange}
                onFocus={() => setPasswordTouchedFields(prev => ({ ...prev, newPassword: true }))}
                autoComplete="new-password"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: isMobile ? 1.5 : 2,
                    bgcolor: '#fff',
                    fontSize: isMobile ? '0.875rem' : undefined,
                    '& fieldset': { borderColor: '#d0d0d0' },
                    '&:hover fieldset': { borderColor: '#bbb' },
                    '&.Mui-focused fieldset': { borderColor: '#1a1a1a', borderWidth: '1px' },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#999',
                    fontSize: isMobile ? '0.875rem' : undefined,
                    '&.Mui-focused': { color: '#1a1a1a' },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#bbb', fontSize: isMobile ? 20 : 24 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowNewPassword((v) => !v)}
                        edge="end"
                        tabIndex={-1}
                        size={isMobile ? 'small' : 'medium'}
                        sx={{ color: '#888' }}
                      >
                        {showNewPassword ? <VisibilityOff fontSize={isMobile ? 'small' : 'medium'} /> : <Visibility fontSize={isMobile ? 'small' : 'medium'} />}
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
              size={isMobile ? 'small' : 'medium'}
              value={passwordForm.confirmPassword}
              onChange={handlePasswordInputChange}
              onFocus={() => setPasswordTouchedFields(prev => ({ ...prev, confirmPassword: true }))}
              autoComplete="new-password"
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: isMobile ? 1.5 : 2,
                  bgcolor: '#fff',
                  fontSize: isMobile ? '0.875rem' : undefined,
                  '& fieldset': { borderColor: '#d0d0d0' },
                  '&:hover fieldset': { borderColor: '#bbb' },
                  '&.Mui-focused fieldset': { borderColor: '#1a1a1a', borderWidth: '1px' },
                },
                '& .MuiInputLabel-root': {
                  color: '#999',
                  fontSize: isMobile ? '0.875rem' : undefined,
                  '&.Mui-focused': { color: '#1a1a1a' },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: '#bbb', fontSize: isMobile ? 20 : 24 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      edge="end"
                      tabIndex={-1}
                      size={isMobile ? 'small' : 'medium'}
                      sx={{ color: '#888' }}
                    >
                      {showConfirmPassword ? <VisibilityOff fontSize={isMobile ? 'small' : 'medium'} /> : <Visibility fontSize={isMobile ? 'small' : 'medium'} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {passwordError && (
              <Alert severity="error" sx={{ borderRadius: isMobile ? 1.5 : 2, fontSize: isMobile ? '0.8rem' : undefined }}>
                {passwordError}
              </Alert>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: isMobile ? 2 : 2.5, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 1 : 0 }}>
          {isMobile ? (
            <>
              <Button
                onClick={handleChangePassword}
                disabled={passwordLoading}
                variant="contained"
                fullWidth
                sx={{
                  bgcolor: '#1a1a1a',
                  color: '#fff',
                  borderRadius: 1.5,
                  textTransform: 'none',
                  py: 1.25,
                  fontSize: '0.875rem',
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: '#333',
                    boxShadow: 'none',
                  },
                  '&:disabled': {
                    bgcolor: '#ccc',
                  },
                }}
              >
                {passwordLoading ? <CircularProgress size={18} sx={{ color: 'white' }} /> : t('common.confirm')}
              </Button>
              <Button
                onClick={handleClosePasswordDialog}
                disabled={passwordLoading}
                fullWidth
                sx={{
                  color: '#666',
                  borderRadius: 1.5,
                  textTransform: 'none',
                  py: 1,
                  fontSize: '0.875rem',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.04)',
                  },
                }}
              >
                {t('common.cancel')}
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleClosePasswordDialog}
                disabled={passwordLoading}
                sx={{
                  color: '#666',
                  borderColor: '#d0d0d0',
                  borderRadius: 2,
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.04)',
                  },
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleChangePassword}
                disabled={passwordLoading}
                variant="contained"
                sx={{
                  bgcolor: '#1a1a1a',
                  color: '#fff',
                  borderRadius: 2,
                  textTransform: 'none',
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: '#333',
                    boxShadow: 'none',
                  },
                  '&:disabled': {
                    bgcolor: '#ccc',
                  },
                }}
              >
                {passwordLoading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : t('common.confirm')}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* 注销账户弹窗 */}
      <Dialog
        open={deleteAccountDialogOpen}
        onClose={handleCloseDeleteAccountDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 2 : 3,
            m: isMobile ? 2 : 'auto',
          }
        }}
      >
        <DialogTitle sx={{ py: isMobile ? 1.5 : 2, px: isMobile ? 2 : 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant={isMobile ? 'subtitle1' : 'h6'} sx={{ fontWeight: 600, color: '#ef4444' }}>
              {t('auth.deleteAccount')}
            </Typography>
            <IconButton onClick={handleCloseDeleteAccountDialog} sx={{ color: '#888' }} size={isMobile ? 'small' : 'medium'}>
              <CancelIcon fontSize={isMobile ? 'small' : 'medium'} />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ px: isMobile ? 2 : 3 }}>
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 1.5, fontSize: isMobile ? '0.8rem' : undefined }}>
            {t('auth.deleteAccountWarning')}
          </Alert>

          <Typography variant="body2" sx={{ color: '#666', mb: 2, fontSize: isMobile ? '0.8rem' : undefined }}>
            {t('auth.deleteAccountConfirmText')}
          </Typography>

          <TextField
            label={t('auth.password')}
            type={showDeleteAccountPassword ? 'text' : 'password'}
            fullWidth
            size={isMobile ? 'small' : 'medium'}
            value={deleteAccountPassword}
            onChange={(e) => setDeleteAccountPassword(e.target.value)}
            autoComplete="current-password"
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: isMobile ? 1.5 : 2,
                bgcolor: '#fff',
                fontSize: isMobile ? '0.875rem' : undefined,
                '& fieldset': { borderColor: '#d0d0d0' },
                '&:hover fieldset': { borderColor: '#bbb' },
                '&.Mui-focused fieldset': { borderColor: '#ef4444', borderWidth: '1px' },
              },
              '& .MuiInputLabel-root': {
                color: '#999',
                fontSize: isMobile ? '0.875rem' : undefined,
                '&.Mui-focused': { color: '#ef4444' },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon sx={{ color: '#bbb', fontSize: isMobile ? 20 : 24 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowDeleteAccountPassword(!showDeleteAccountPassword)}
                    edge="end"
                    tabIndex={-1}
                    size={isMobile ? 'small' : 'medium'}
                    sx={{ color: '#888' }}
                  >
                    {showDeleteAccountPassword ? <VisibilityOff fontSize={isMobile ? 'small' : 'medium'} /> : <Visibility fontSize={isMobile ? 'small' : 'medium'} />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {deleteAccountError && (
            <Alert severity="error" sx={{ mt: 2, borderRadius: isMobile ? 1.5 : 2, fontSize: isMobile ? '0.8rem' : undefined }}>
              {deleteAccountError}
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ p: isMobile ? 2 : 2.5, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 1 : 0 }}>
          {isMobile ? (
            <>
              <Button
                onClick={handleDeleteAccount}
                disabled={deleteAccountLoading}
                variant="contained"
                fullWidth
                sx={{
                  bgcolor: '#ef4444',
                  color: '#fff',
                  borderRadius: 1.5,
                  textTransform: 'none',
                  py: 1.25,
                  fontSize: '0.875rem',
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: '#dc2626',
                    boxShadow: 'none',
                  },
                  '&:disabled': {
                    bgcolor: '#fca5a5',
                  },
                }}
              >
                {deleteAccountLoading ? <CircularProgress size={18} sx={{ color: 'white' }} /> : t('auth.confirmDeleteAccount')}
              </Button>
              <Button
                onClick={handleCloseDeleteAccountDialog}
                disabled={deleteAccountLoading}
                fullWidth
                sx={{
                  color: '#666',
                  borderRadius: 1.5,
                  textTransform: 'none',
                  py: 1,
                  fontSize: '0.875rem',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.04)',
                  },
                }}
              >
                {t('common.cancel')}
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleCloseDeleteAccountDialog}
                disabled={deleteAccountLoading}
                sx={{
                  color: '#666',
                  borderRadius: 2,
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.04)',
                  },
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleDeleteAccount}
                disabled={deleteAccountLoading}
                variant="contained"
                sx={{
                  bgcolor: '#ef4444',
                  color: '#fff',
                  borderRadius: 2,
                  textTransform: 'none',
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: '#dc2626',
                    boxShadow: 'none',
                  },
                  '&:disabled': {
                    bgcolor: '#fca5a5',
                  },
                }}
              >
                {deleteAccountLoading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : t('auth.confirmDeleteAccount')}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* 通知组件 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={isMobile ? { top: 70 } : undefined}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{
            borderRadius: isMobile ? 1.5 : 2,
            fontSize: isMobile ? '0.8rem' : undefined,
            py: isMobile ? 0.5 : undefined,
            '& .MuiAlert-icon': isMobile ? { fontSize: 18 } : undefined,
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserProfile; 