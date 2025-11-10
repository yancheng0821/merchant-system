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
      {/* 现代化搜索区域 - 匹配Customers模块风格 */}
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          mb: 3,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <TextField
            fullWidth
            placeholder={t('rbac.searchPlaceholder')}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#6366F1',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#6366F1',
                },
              },
            }}
          />
        </CardContent>
      </Card>

      {/* 现代化表格 - 匹配Customers模块风格 */}
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <CircularProgress />
            </Box>
          ) : filteredUsers.length === 0 ? (
            <Box display="flex" flexDirection="column" alignItems="center" py={8}>
              <SecurityIcon sx={{ fontSize: 64, color: '#CBD5E1', mb: 2 }} />
              <Typography color="text.secondary">
                {t('rbac.noUsers')}
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: 2 }}>
                      {t('rbac.username')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {t('rbac.email')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {t('rbac.phone')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {t('rbac.status')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {t('rbac.currentRoles')}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {t('rbac.actions')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.map(user => (
                    <TableRow
                      key={user.id}
                      sx={{
                        '&:hover': {
                          backgroundColor: alpha('#6366F1', 0.04),
                        },
                        transition: 'background-color 0.2s ease',
                      }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Avatar
                            src={getFullImageUrl(user.avatarUrl)}
                            alt={user.username}
                            sx={{
                              width: 40,
                              height: 40,
                              bgcolor: user.avatarUrl ? 'transparent' : '#6366F1',
                              fontSize: '1rem',
                              fontWeight: 600,
                            }}
                          >
                            {!user.avatarUrl && user.username?.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {user.username}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {user.id}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {user.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
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
                                  backgroundColor: alpha('#8B5CF6', 0.1),
                                  color: '#8B5CF6',
                                  fontWeight: 500,
                                }}
                              />
                            ))
                          ) : (
                            <Typography variant="caption" color="text.secondary">
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
                            '&:hover': {
                              backgroundColor: alpha('#6366F1', 0.1),
                            },
                          }}
                        >
                          <MoreVertIcon fontSize="small" />
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

      {/* 操作菜单 */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={() => setMenuAnchorEl(null)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            border: '1px solid rgba(0,0,0,0.08)',
            mt: 1,
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
              '&:hover': { backgroundColor: alpha('#6366F1', 0.08) },
              '&.Mui-disabled': {
                opacity: 0.5,
              }
            }}
          >
            <EditIcon sx={{ mr: 1, fontSize: 18, color: selectedUser && isCurrentUser(selectedUser.id) ? '#9CA3AF' : '#6366F1' }} />
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
              '&:hover': {
                backgroundColor: selectedUser?.status === 'ACTIVE'
                  ? alpha('#EF4444', 0.08)
                  : alpha('#10B981', 0.08)
              },
              '&.Mui-disabled': {
                opacity: 0.5,
              }
            }}
          >
            {selectedUser?.status === 'ACTIVE' ? (
              <>
                <BlockIcon sx={{ mr: 1, fontSize: 18, color: selectedUser && isCurrentUser(selectedUser.id) ? '#9CA3AF' : '#EF4444' }} />
                {t('rbac.deactivateUser')}
              </>
            ) : (
              <>
                <CheckCircleIcon sx={{ mr: 1, fontSize: 18, color: selectedUser && isCurrentUser(selectedUser.id) ? '#9CA3AF' : '#10B981' }} />
                {t('rbac.activateUser')}
              </>
            )}
          </MenuItem>
        )}
      </Menu>

      {/* 分配角色对话框 */}
      <Dialog
        open={openAssignDialog}
        onClose={() => setOpenAssignDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <SecurityIcon sx={{ color: '#6366F1' }} />
            <Typography variant="h6" fontWeight={600}>
              {t('rbac.assignRole')}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {roles.map(role => (
              <FormControlLabel
                key={role.id}
                control={
                  <Checkbox
                    checked={selectedRoleIds.includes(role.id)}
                    onChange={() => handleToggleRole(role.id)}
                    sx={{
                      color: '#6366F1',
                      '&.Mui-checked': {
                        color: '#6366F1',
                      },
                    }}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      {translateRoleName(role.roleName)}
                    </Typography>
                    {role.isSystem && (
                      <Chip
                        label={t('rbac.systemRole')}
                        size="small"
                        sx={{ mt: 0.5, height: 20, fontSize: '0.6875rem' }}
                      />
                    )}
                  </Box>
                }
                sx={{ width: '100%', mb: 1.5 }}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setOpenAssignDialog(false)}
            disabled={assignLoading}
            sx={{
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: alpha('#9CA3AF', 0.1),
              },
            }}
          >
            {t('rbac.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveRoles}
            disabled={assignLoading}
            sx={{
              backgroundColor: '#6366F1',
              '&:hover': {
                backgroundColor: '#4F46E5',
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
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserRoleManagement;
