import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  alpha,
  Tooltip,
  InputAdornment,
  Paper,
  Grid,
  useMediaQuery,
  useTheme as useMuiTheme,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AdminPanelSettings as RoleIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  Security as SecurityIcon,
  Description as DescriptionIcon,
  Code as CodeIcon,
  TrendingUp as LevelIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { roleApi, Role } from '../../services/permissionApi';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import { useTheme } from '../../contexts/ThemeContext';

const RoleManagement: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const { themeMode } = useTheme();
  const muiTheme = useMuiTheme();

  // 移动端检测
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  // 根据主题模式动态设置主题色
  const isMonochrome = themeMode === 'monochrome';
  const THEME_COLOR = isMonochrome ? '#1a1a1a' : '#6366F1';
  const THEME_COLOR_DARK = isMonochrome ? '#333' : '#4F46E5';
  const SECONDARY_COLOR = isMonochrome ? '#1a1a1a' : '#8B5CF6';
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    roleName: '',
    roleCode: '',
    displayName: '',
    description: '',
    level: 50,
  });
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuRole, setMenuRole] = useState<Role | null>(null);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await roleApi.getAllRoles(user?.tenantId);
      if (response.success && response.data) {
        setRoles(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err: any) {
      showSnackbar(err.message || t('rbac.loadError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    if (!hasPermission('rbac:create_role')) {
      showSnackbar(t('common.noPermission'), 'error');
      return;
    }
    setEditingRole(null);
    setFormData({
      roleName: '',
      roleCode: '',
      displayName: '',
      description: '',
      level: 50,
    });
    setDialogOpen(true);
  };

  const handleEdit = (role: Role) => {
    if (!hasPermission('rbac:update_role')) {
      showSnackbar(t('common.noPermission'), 'error');
      return;
    }
    setEditingRole(role);
    setFormData({
      roleName: role.roleName,
      roleCode: role.roleCode,
      displayName: role.displayName || '',
      description: role.description || '',
      level: role.level || 50,
    });
    setDialogOpen(true);
  };

  const handleDelete = (role: Role) => {
    if (!hasPermission('rbac:delete_role')) {
      showSnackbar(t('common.noPermission'), 'error');
      return;
    }
    setDeletingRole(role);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingRole) return;

    try {
      await roleApi.deleteRole(deletingRole.id);
      showSnackbar(t('rbac.roleDeletedSuccess'), 'success');
      setDeleteDialogOpen(false);
      setDeletingRole(null);
      loadRoles();
    } catch (err: any) {
      showSnackbar(err.message || t('rbac.saveError'), 'error');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const roleData = {
        roleName: formData.roleName,
        roleCode: formData.roleCode,
        displayName: formData.displayName,
        description: formData.description,
        level: formData.level,
        tenantId: user?.tenantId,
        isSystem: false,
        status: 'ACTIVE' as const,
      };

      if (editingRole) {
        await roleApi.updateRole(editingRole.id, roleData);
        showSnackbar(t('rbac.roleUpdatedSuccess'), 'success');
      } else {
        await roleApi.createRole(roleData);
        showSnackbar(t('rbac.roleCreatedSuccess'), 'success');
      }

      setDialogOpen(false);
      loadRoles();
    } catch (err: any) {
      showSnackbar(err.message || t('rbac.saveError'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const translateRoleName = (roleName: string): string => {
    const translationKey = `rbac.roleNames.${roleName}`;
    const translated = t(translationKey);
    return translated === translationKey ? roleName : translated;
  };

  // 过滤角色
  const filteredRoles = roles.filter(
    role =>
      role.roleName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.roleCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      {/* 简约搜索和创建区域 */}
      <Card
        sx={{
          borderRadius: isMobile ? 2 : 2.5,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.06)',
          mb: isMobile ? 2 : 3,
        }}
      >
        <CardContent sx={{ py: isMobile ? 1.5 : 2, px: isMobile ? 1.5 : 2.5 }}>
          <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} gap={isMobile ? 1.5 : 2} alignItems={isMobile ? 'stretch' : 'center'}>
            <TextField
              fullWidth
              size="small"
              placeholder={t('rbac.searchRoles')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#999', fontSize: isMobile ? 18 : 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                  fontSize: isMobile ? '0.8rem' : '0.875rem',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(0,0,0,0.12)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: THEME_COLOR,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: THEME_COLOR,
                  },
                },
              }}
            />
            {hasPermission('rbac:create_role') && (
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon sx={{ fontSize: isMobile ? 16 : 18 }} />}
                onClick={handleCreate}
                fullWidth={isMobile}
                sx={{
                  borderRadius: 1.5,
                  textTransform: 'none',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  px: 2.5,
                  py: 0.75,
                  fontSize: isMobile ? '0.8rem' : '0.875rem',
                  bgcolor: THEME_COLOR,
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: THEME_COLOR_DARK,
                    boxShadow: 'none',
                  },
                }}
              >
                {t('rbac.createRole')}
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* 角色列表 */}
      {isMobile ? (
        /* 移动端卡片视图 */
        <Box>
          {loading ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress size={24} sx={{ color: THEME_COLOR }} />
            </Box>
          ) : filteredRoles.length === 0 ? (
            <Box display="flex" flexDirection="column" alignItems="center" py={6}>
              <RoleIcon sx={{ fontSize: 40, color: '#ccc', mb: 2 }} />
              <Typography sx={{ color: '#888', fontSize: '0.8rem' }}>
                {searchTerm ? t('rbac.noSearchResults') : t('rbac.noRoles')}
              </Typography>
            </Box>
          ) : (
            filteredRoles.map((role) => (
              <Card
                key={role.id}
                sx={{
                  borderRadius: 2,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  border: '1px solid rgba(0,0,0,0.06)',
                  mb: 1.5,
                  bgcolor: '#fff',
                }}
              >
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Box flex={1} mr={1}>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#1a1a1a', mb: 0.5 }}>
                        {translateRoleName(role.roleName)}
                      </Typography>
                      <Box display="flex" gap={0.5} flexWrap="wrap">
                        <Chip
                          label={role.roleCode}
                          size="small"
                          sx={{
                            backgroundColor: alpha(THEME_COLOR, 0.1),
                            color: THEME_COLOR,
                            fontWeight: 500,
                            fontSize: '0.65rem',
                            height: 20,
                          }}
                        />
                        {role.isSystem ? (
                          <Chip
                            label={t('rbac.systemRole')}
                            size="small"
                            sx={{
                              backgroundColor: alpha(SECONDARY_COLOR, 0.1),
                              color: SECONDARY_COLOR,
                              fontWeight: 500,
                              fontSize: '0.65rem',
                              height: 20,
                            }}
                          />
                        ) : (
                          <Chip
                            label={t('rbac.customRole')}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.65rem', height: 20, borderColor: '#ddd', color: '#666' }}
                          />
                        )}
                        {role.status === 'ACTIVE' ? (
                          <Chip
                            label={t('rbac.active')}
                            size="small"
                            sx={{
                              backgroundColor: alpha('#10B981', 0.1),
                              color: '#10B981',
                              fontWeight: 500,
                              fontSize: '0.65rem',
                              height: 20,
                            }}
                          />
                        ) : (
                          <Chip
                            label={t('rbac.inactive')}
                            size="small"
                            sx={{
                              backgroundColor: alpha('#EF4444', 0.1),
                              color: '#EF4444',
                              fontWeight: 500,
                              fontSize: '0.65rem',
                              height: 20,
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        setMenuAnchorEl(e.currentTarget);
                        setMenuRole(role);
                      }}
                      sx={{ color: '#888', p: 0.5 }}
                    >
                      <MoreVertIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>
                  {role.displayName && (
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                      <Typography sx={{ fontSize: '0.7rem', color: '#888' }}>
                        {t('rbac.displayName')}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#666' }}>
                        {role.displayName}
                      </Typography>
                    </Box>
                  )}
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography sx={{ fontSize: '0.7rem', color: '#888' }}>
                      {t('rbac.level')}
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: '#666' }}>
                      {role.level}
                    </Typography>
                  </Box>
                  {role.description && (
                    <Box mt={0.5}>
                      <Typography sx={{ fontSize: '0.7rem', color: '#888', lineHeight: 1.4 }}>
                        {role.description}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </Box>
      ) : (
        /* 桌面端表格视图 */
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
            ) : filteredRoles.length === 0 ? (
              <Box display="flex" flexDirection="column" alignItems="center" py={6}>
                <RoleIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                <Typography sx={{ color: '#888', fontSize: '0.875rem' }}>
                  {searchTerm ? t('rbac.noSearchResults') : t('rbac.noRoles')}
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#fafafa' }}>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#666', py: 1.5 }}>
                        {t('rbac.roleName')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#666', py: 1.5 }}>
                        {t('rbac.roleCode')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#666', py: 1.5 }}>
                        {t('rbac.displayName')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#666', py: 1.5 }}>
                        {t('rbac.description')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#666', py: 1.5 }}>
                        {t('rbac.level')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#666', py: 1.5 }}>
                        {t('rbac.isSystem')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#666', py: 1.5 }}>
                        {t('rbac.status')}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#666', py: 1.5 }}>
                        {t('rbac.actions')}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRoles.map((role) => (
                      <TableRow
                        key={role.id}
                        hover
                        sx={{
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
                          '& td': { py: 1.5, fontSize: '0.875rem' }
                        }}
                      >
                        <TableCell>
                          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#1a1a1a' }}>
                            {translateRoleName(role.roleName)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={role.roleCode}
                            size="small"
                            sx={{
                              backgroundColor: alpha(THEME_COLOR, 0.1),
                              color: THEME_COLOR,
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              height: 22,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: '0.875rem', color: '#666' }}>
                            {role.displayName || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            sx={{
                              fontSize: '0.875rem',
                              color: '#888',
                              maxWidth: 300,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {role.description || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={role.level}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.75rem', height: 22, borderColor: '#ddd' }}
                          />
                        </TableCell>
                        <TableCell>
                          {role.isSystem ? (
                            <Chip
                              label={t('rbac.systemRole')}
                              size="small"
                              sx={{
                                backgroundColor: alpha(SECONDARY_COLOR, 0.1),
                                color: SECONDARY_COLOR,
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                height: 22,
                              }}
                            />
                          ) : (
                            <Chip
                              label={t('rbac.customRole')}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.75rem', height: 22, borderColor: '#ddd', color: '#666' }}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {role.status === 'ACTIVE' ? (
                            <Chip
                              label={t('rbac.active')}
                              size="small"
                              sx={{
                                backgroundColor: alpha('#10B981', 0.1),
                                color: '#10B981',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                height: 22,
                              }}
                            />
                          ) : (
                            <Chip
                              label={t('rbac.inactive')}
                              size="small"
                              sx={{
                                backgroundColor: alpha('#EF4444', 0.1),
                                color: '#EF4444',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                height: 22,
                              }}
                            />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Box display="flex" justifyContent="flex-end" gap={0.5}>
                            {hasPermission('rbac:update_role') && (
                              <Tooltip title={t('common.update')}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleEdit(role)}
                                  sx={{
                                    color: THEME_COLOR,
                                    '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
                                  }}
                                >
                                  <EditIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            )}
                            {hasPermission('rbac:delete_role') && !role.isSystem && (
                              <Tooltip title={t('common.delete')}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDelete(role)}
                                  sx={{
                                    color: '#EF4444',
                                    '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
                                  }}
                                >
                                  <DeleteIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* 移动端操作菜单 */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={() => setMenuAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 140,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid rgba(0,0,0,0.06)',
          }
        }}
      >
        {hasPermission('rbac:update_role') && (
          <MenuItem
            onClick={() => {
              if (menuRole) handleEdit(menuRole);
              setMenuAnchorEl(null);
            }}
            sx={{ py: 1, px: 1.5, fontSize: '0.875rem' }}
          >
            <EditIcon sx={{ mr: 1, fontSize: 16, color: THEME_COLOR }} />
            {t('common.update')}
          </MenuItem>
        )}
        {hasPermission('rbac:delete_role') && menuRole && !menuRole.isSystem && (
          <MenuItem
            onClick={() => {
              if (menuRole) handleDelete(menuRole);
              setMenuAnchorEl(null);
            }}
            sx={{ py: 1, px: 1.5, fontSize: '0.875rem' }}
          >
            <DeleteIcon sx={{ mr: 1, fontSize: 16, color: '#EF4444' }} />
            {t('common.delete')}
          </MenuItem>
        )}
      </Menu>

      {/* 创建/编辑对话框 - 简约风格 */}
      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 2.5,
            boxShadow: isMobile ? 'none' : '0 4px 20px rgba(0,0,0,0.1)',
          },
        }}
      >
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1.5}>
              <SecurityIcon sx={{ color: THEME_COLOR, fontSize: 20 }} />
              <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#1a1a1a' }}>
                {editingRole ? t('rbac.editRole') : t('rbac.createRole')}
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
              sx={{ color: '#999' }}
            >
              <CloseIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>
        </Box>

        <DialogContent sx={{ px: isMobile ? 2 : 3, py: 2.5 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={isMobile ? 12 : 6}>
              <TextField
                fullWidth
                size="small"
                label={t('rbac.roleName')}
                value={formData.roleName}
                onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#d0d0d0' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#bbb' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: THEME_COLOR, borderWidth: '1px' },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={isMobile ? 12 : 6}>
              <TextField
                fullWidth
                size="small"
                label={t('rbac.roleCode')}
                value={formData.roleCode}
                onChange={(e) => setFormData({ ...formData, roleCode: e.target.value })}
                required
                disabled={!!editingRole}
                helperText={t('rbac.roleCodeHelper')}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#d0d0d0' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: editingRole ? undefined : '#bbb' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: THEME_COLOR, borderWidth: '1px' },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={isMobile ? 12 : 6}>
              <TextField
                fullWidth
                size="small"
                label={t('rbac.displayName')}
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#d0d0d0' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#bbb' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: THEME_COLOR, borderWidth: '1px' },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={isMobile ? 12 : 6}>
              <TextField
                fullWidth
                size="small"
                label={t('rbac.level')}
                type="number"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 0 })}
                helperText={t('rbac.levelHelper')}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#d0d0d0' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#bbb' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: THEME_COLOR, borderWidth: '1px' },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label={t('rbac.description')}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#d0d0d0' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#bbb' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: THEME_COLOR, borderWidth: '1px' },
                  },
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <Button
            size="small"
            onClick={() => setDialogOpen(false)}
            disabled={saving}
            sx={{
              textTransform: 'none',
              color: '#666',
              fontSize: '0.875rem',
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            size="small"
            onClick={handleSave}
            variant="contained"
            disabled={saving || !formData.roleName || !formData.roleCode}
            sx={{
              borderRadius: 1.5,
              px: 2.5,
              py: 0.75,
              fontSize: '0.875rem',
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
            {saving ? (
              <CircularProgress size={16} sx={{ color: 'white' }} />
            ) : (
              editingRole ? t('common.update') : t('common.create')
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 删除确认对话框 - 简约风格 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2.5,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            mx: isMobile ? 2 : 0,
          },
        }}
      >
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#EF4444' }}>
            {t('common.confirm')}
          </Typography>
        </Box>
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Typography sx={{ fontSize: '0.875rem', color: '#666' }}>
            {t('rbac.confirmDeleteRole', { name: deletingRole?.roleName })}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <Button
            size="small"
            onClick={() => setDeleteDialogOpen(false)}
            sx={{
              textTransform: 'none',
              color: '#666',
              fontSize: '0.875rem',
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            size="small"
            onClick={confirmDelete}
            variant="contained"
            sx={{
              borderRadius: 1.5,
              px: 2.5,
              py: 0.75,
              fontSize: '0.875rem',
              fontWeight: 500,
              bgcolor: '#EF4444',
              boxShadow: 'none',
              textTransform: 'none',
              '&:hover': {
                bgcolor: '#DC2626',
                boxShadow: 'none',
              },
            }}
          >
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 通知 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ top: isMobile ? 16 : 24 }}
      >
        <Alert
          severity={snackbar.severity}
          sx={{
            width: isMobile ? 'auto' : '100%',
            minWidth: isMobile ? 200 : 280,
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontSize: isMobile ? '0.75rem' : '0.875rem',
            py: isMobile ? 0.5 : 1,
            '& .MuiAlert-icon': {
              fontSize: isMobile ? 18 : 22,
            },
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RoleManagement;
