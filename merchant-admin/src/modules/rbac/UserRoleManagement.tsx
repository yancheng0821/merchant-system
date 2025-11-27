import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Card,
  CardContent,
  InputAdornment,
  Avatar,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Snackbar,
  alpha,
  Paper,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { roleApi, userApi, Role } from '../../services/permissionApi';
import { getFullImageUrl } from '../../services/api';
import { usePermission } from '../../hooks/usePermission';
import { useTheme } from '../../contexts/ThemeContext';

interface User {
  id: number;
  username: string;
  email: string;
  phone?: string;
  displayName?: string;
  status: string;
  avatarUrl?: string;
  roles?: Role[];
}

const UserRoleManagement: React.FC = () => {
  const { t } = useTranslation();
  const { hasPermission } = usePermission();
  const { themeMode } = useTheme();

  // 根据主题模式动态设置主题色
  const isMonochrome = themeMode === 'monochrome';
  const THEME_COLOR = isMonochrome ? '#1a1a1a' : '#6366F1';
  const THEME_COLOR_DARK = isMonochrome ? '#333' : '#4F46E5';
  const ROLE_CHIP_COLOR = isMonochrome ? '#1a1a1a' : '#8B5CF6';

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  // 分配角色对话框
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

  // 获取当前登录用户ID
  const getCurrentUserId = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id;
  };

  // 检查是否是当前用户自己
  const isCurrentUser = (userId: number) => {
    return userId === getCurrentUserId();
  };

  useEffect(() => {
    loadUsers();
    // 不在初始化时加载角色列表，只在需要时（打开分配对话框）才加载
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userApi.getAllUsers();
      const data = response.data || response;
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      showSnackbar(err?.message || t('rbac.loadError'), 'error');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    // 只在需要分配角色时才加载角色列表
    if (!hasPermission('users:assign_roles')) {
      showSnackbar(t('rbac.noAssignRolePermission'), 'error');
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const tenantId = Number(user.tenantId || 1);
      // 使用新的 getAssignableRoles API，只需要 users:assign_roles 权限
      const response = await roleApi.getAssignableRoles(tenantId);
      const data = response.data || response;
      // getAssignableRoles 已经在后端过滤掉了 SUPER_ADMIN 和 SYSTEM_ADMIN
      const roles = Array.isArray(data) ? data : [];
      setRoles(roles);
    } catch (err: any) {
      showSnackbar(err?.message || t('rbac.loadError'), 'error');
      setRoles([]);
    }
  };

  const handleOpenAssignDialog = async (user: User) => {
    setSelectedUser(user);
    // 从用户对象中获取已有的角色ID
    const currentRoleIds = user.roles?.map(role => role.id) || [];
    setSelectedRoleIds(currentRoleIds);
    setOpenAssignDialog(true);

    // 打开对话框时加载角色列表
    if (roles.length === 0) {
      await loadRoles();
    }
  };

  const handleToggleRole = (roleId: number) => {
    setSelectedRoleIds(prev =>
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleSaveRoles = async () => {
    if (!selectedUser) return;

    try {
      setAssignLoading(true);
      await userApi.assignRolesToUser(selectedUser.id, selectedRoleIds);

      showSnackbar(t('rbac.assignRoleSuccess'), 'success');
      setOpenAssignDialog(false);
      loadUsers();
    } catch (err: any) {
      showSnackbar(err?.message || t('rbac.assignRoleError'), 'error');
    } finally {
      setAssignLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleToggleUserStatus = async () => {
    if (!selectedUser) return;

    // 立即关闭菜单，避免MUI警告
    setMenuAnchorEl(null);

    try {
      setLoading(true);
      const newStatus = selectedUser.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

      await userApi.updateUserStatus(selectedUser.id, newStatus);

      showSnackbar(
        newStatus === 'ACTIVE'
          ? t('rbac.userActivated')
          : t('rbac.userDeactivated'),
        'success'
      );

      loadUsers();
    } catch (err: any) {
      showSnackbar(err?.message || t('rbac.updateStatusError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    user =>
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm)
  );

  // 翻译角色名称
  const translateRoleName = (roleName: string): string => {
    // 尝试使用i18n翻译，如果没有找到则返回原名称
    const translationKey = `rbac.roleNames.${roleName}`;
    const translated = t(translationKey);
    // 如果翻译结果等于key本身，说明没有找到翻译，返回原名称
    return translated === translationKey ? roleName : translated;
  };

  const getStatusChip = (status: string) => {
    const config = status === 'ACTIVE'
      ? { color: '#10B981', bg: alpha('#10B981', 0.1), label: t('rbac.active') }
      : { color: '#EF4444', bg: alpha('#EF4444', 0.1), label: t('rbac.inactive') };

    return (
      <Chip
        label={config.label}
        sx={{
          backgroundColor: config.bg,
          color: config.color,
          fontWeight: 600,
          fontSize: '0.75rem',
          height: 24,
          '& .MuiChip-label': {
            px: 2,
          },
        }}
      />
    );
  };

  return (
    <Box>
      {/* 简约搜索区域 */}
      <Card
        sx={{
          borderRadius: 2.5,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.06)',
          mb: 3,
        }}
      >
        <CardContent sx={{ py: 2, px: 2.5 }}>
          <TextField
            fullWidth
            size="small"
            placeholder={t('rbac.searchPlaceholder')}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#999', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1.5,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#d0d0d0' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#bbb' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: THEME_COLOR, borderWidth: '1px' },
              },
            }}
          />
        </CardContent>
      </Card>

      {/* 简约表格卡片 */}
      <Card
        sx={{
          borderRadius: 2.5,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.06)',
          bgcolor: '#fff',
        }}
      >
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
              <CircularProgress sx={{ color: THEME_COLOR }} />
            </Box>
          ) : filteredUsers.length === 0 ? (
            <Box display="flex" flexDirection="column" alignItems="center" py={6}>
              <SecurityIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
              <Typography sx={{ color: '#888', fontSize: '0.875rem' }}>
                {t('rbac.noUsers')}
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#fafafa' }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#666', py: 1.5 }}>
                      {t('rbac.username')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#666', py: 1.5 }}>
                      {t('rbac.email')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#666', py: 1.5 }}>
                      {t('rbac.phone')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#666', py: 1.5 }}>
                      {t('rbac.status')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#666', py: 1.5 }}>
                      {t('rbac.currentRoles')}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#666', py: 1.5 }}>
                      {t('rbac.actions')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.map(user => (
                    <TableRow
                      key={user.id}
                      hover
                      sx={{
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
                        '& td': { py: 1.5, fontSize: '0.8125rem' }
                      }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Avatar
                            src={getFullImageUrl(user.avatarUrl)}
                            alt={user.username}
                            sx={{
                              width: 36,
                              height: 36,
                              bgcolor: user.avatarUrl ? 'transparent' : THEME_COLOR,
                              fontSize: '0.875rem',
                              fontWeight: 600,
                            }}
                          >
                            {!user.avatarUrl && user.username?.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#1a1a1a' }}>
                              {user.username}
                            </Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: '#888' }}>
                              ID: {user.id}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.8125rem', color: '#666' }}>
                          {user.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.8125rem', color: '#666' }}>
                          {user.phone || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>{getStatusChip(user.status)}</TableCell>
                      <TableCell>
                        <Box display="flex" gap={0.5} flexWrap="wrap">
                          {user.roles && user.roles.length > 0 ? (
                            user.roles.map(role => (
                              <Chip
                                key={role.id}
                                label={translateRoleName(role.roleName)}
                                size="small"
                                sx={{
                                  backgroundColor: alpha(ROLE_CHIP_COLOR, 0.1),
                                  color: ROLE_CHIP_COLOR,
                                  fontWeight: 500,
                                  fontSize: '0.75rem',
                                }}
                              />
                            ))
                          ) : (
                            <Typography sx={{ fontSize: '0.8125rem', color: '#888' }}>
                              -
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            setMenuAnchorEl(e.currentTarget);
                            setSelectedUser(user);
                          }}
                          sx={{
                            color: '#999',
                            '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
                          }}
                        >
                          <MoreVertIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* 操作菜单 - 简约风格 */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={() => setMenuAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 160,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid rgba(0,0,0,0.06)',
          }
        }}
      >
        {/* 分配角色 - 需要 users:assign_roles 权限，且不能对自己操作 */}
        {hasPermission('users:assign_roles') && (
          <MenuItem
            onClick={() => {
              if (selectedUser && isCurrentUser(selectedUser.id)) {
                showSnackbar(t('rbac.cannotModifySelf'), 'error');
                setMenuAnchorEl(null);
                return;
              }
              handleOpenAssignDialog(selectedUser!);
              setMenuAnchorEl(null);
            }}
            disabled={selectedUser ? isCurrentUser(selectedUser.id) : false}
            sx={{
              py: 1,
              px: 1.5,
              fontSize: '0.8125rem',
              '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
              '&.Mui-disabled': { opacity: 0.5 }
            }}
          >
            <EditIcon sx={{ mr: 1, fontSize: 16, color: selectedUser && isCurrentUser(selectedUser.id) ? '#9CA3AF' : THEME_COLOR }} />
            {t('rbac.assignRole')}
          </MenuItem>
        )}
        {/* 修改用户状态 - 需要 users:update_status 权限，且不能对自己操作 */}
        {hasPermission('users:update_status') && (
          <MenuItem
            onClick={() => {
              if (selectedUser && isCurrentUser(selectedUser.id)) {
                showSnackbar(t('rbac.cannotModifySelf'), 'error');
                setMenuAnchorEl(null);
                return;
              }
              handleToggleUserStatus();
            }}
            disabled={selectedUser ? isCurrentUser(selectedUser.id) : false}
            sx={{
              py: 1,
              px: 1.5,
              fontSize: '0.8125rem',
              '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
              '&.Mui-disabled': { opacity: 0.5 }
            }}
          >
            {selectedUser?.status === 'ACTIVE' ? (
              <>
                <BlockIcon sx={{ mr: 1, fontSize: 16, color: selectedUser && isCurrentUser(selectedUser.id) ? '#9CA3AF' : '#EF4444' }} />
                {t('rbac.deactivateUser')}
              </>
            ) : (
              <>
                <CheckCircleIcon sx={{ mr: 1, fontSize: 16, color: selectedUser && isCurrentUser(selectedUser.id) ? '#9CA3AF' : '#10B981' }} />
                {t('rbac.activateUser')}
              </>
            )}
          </MenuItem>
        )}
      </Menu>

      {/* 分配角色对话框 - 简约风格 */}
      <Dialog
        open={openAssignDialog}
        onClose={() => setOpenAssignDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2.5,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }
        }}
      >
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <SecurityIcon sx={{ color: THEME_COLOR, fontSize: 20 }} />
            <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#1a1a1a' }}>
              {t('rbac.assignRole')}
            </Typography>
          </Box>
        </Box>
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Box>
            {roles.map(role => (
              <FormControlLabel
                key={role.id}
                control={
                  <Checkbox
                    checked={selectedRoleIds.includes(role.id)}
                    onChange={() => handleToggleRole(role.id)}
                    sx={{
                      color: '#ccc',
                      '&.Mui-checked': { color: THEME_COLOR },
                    }}
                  />
                }
                label={
                  <Box>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#1a1a1a' }}>
                      {translateRoleName(role.roleName)}
                    </Typography>
                    {role.isSystem && (
                      <Chip
                        label={t('rbac.systemRole')}
                        size="small"
                        sx={{ mt: 0.5, height: 18, fontSize: '0.6875rem', bgcolor: '#f0f0f0', color: '#666' }}
                      />
                    )}
                  </Box>
                }
                sx={{ width: '100%', mb: 1.5 }}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <Button
            size="small"
            onClick={() => setOpenAssignDialog(false)}
            disabled={assignLoading}
            sx={{
              textTransform: 'none',
              color: '#666',
              fontSize: '0.8125rem',
            }}
          >
            {t('rbac.cancel')}
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={handleSaveRoles}
            disabled={assignLoading}
            sx={{
              borderRadius: 1.5,
              px: 2.5,
              py: 0.75,
              fontSize: '0.8125rem',
              fontWeight: 500,
              bgcolor: THEME_COLOR,
              boxShadow: 'none',
              textTransform: 'none',
              '&:hover': {
                bgcolor: THEME_COLOR_DARK,
                boxShadow: 'none',
              },
            }}
          >
            {assignLoading ? t('rbac.saving') : t('rbac.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 通知 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          sx={{
            width: '100%',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserRoleManagement;
